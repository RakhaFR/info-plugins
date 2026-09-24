/**
 * TheoTown Plugin Verifier
 * 
 * Compares local database against the live forum to detect
 * deleted/hidden plugins and removes them from plugins.json.
 * 
 * Logic:
 * 1. Fetch total plugin count from forum (via Puppeteer - same Anubis bypass as scraper)
 * 2. Compare with local database count
 * 3. If local > forum, do a lightweight ID-only sweep of all pages
 *    to collect the set of valid plugin IDs currently on the forum
 * 4. Remove any local plugin whose ID is not in the forum's active set
 * 
 * Usage: node verify-plugins.js [--full-check]
 *   --full-check  Force ID sweep even if counts match (safety check)
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://forum.theotown.com/plugins/list';
const PLUGINS_PER_PAGE = 20;
const OUTPUT_DIR = path.join(__dirname, 'data');
const PLUGINS_FILE = path.join(OUTPUT_DIR, 'plugins.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 3000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function getTotalResults(html) {
  const $ = cheerio.load(html);
  const text = $('div.content p').first().text();
  const match = text.match(/([\d,.]+)\s*results/);
  return match ? parseInt(match[1].replace(/[,.]/g, '')) : 0;
}

function getTotalPages(html) {
  const $ = cheerio.load(html);
  const pageText = $('div.pagination .sr-only').text();
  const match = pageText.match(/of\s+(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Extract all plugin IDs from a page HTML
 */
function getPluginIdsFromPage(html) {
  const $ = cheerio.load(html);
  const ids = [];
  $('ul.topiclist.topics > li.row').each((_, element) => {
    const $row = $(element);
    const $dt = $row.find('dl.row-item dt');
    const $listInner = $dt.find('div.list-inner');
    const pluginIdText = $listInner.find('span.post-number').text().trim();
    const pluginId = pluginIdText.replace('#', '');
    if (pluginId) ids.push(pluginId);
  });
  return ids;
}

async function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const forceFullCheck = args.includes('--full-check');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     🔄 TheoTown Plugin Verifier v1.0                ║');
  console.log('║     Detects & removes deleted plugins              ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // 1. Load local database
  if (!fs.existsSync(PLUGINS_FILE)) {
    console.error('❌ plugins.json not found. Run the scraper first.');
    process.exit(1);
  }

  const localPlugins = JSON.parse(fs.readFileSync(PLUGINS_FILE, 'utf8'));
  const localIds = new Set(localPlugins.map(p => p.id));
  console.log(`📁 Local database: ${localPlugins.length} plugins`);

  // 2. Launch browser & bypass Anubis
  const chromePath = await findChromePath();
  if (!chromePath) {
    console.error('❌ Could not find Chrome or Edge.');
    process.exit(1);
  }
  console.log(`🌐 Using browser: ${path.basename(chromePath)}`);

  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

  console.log('🔐 Solving Anubis anti-bot challenge...');
  await page.goto(`${BASE_URL}?mode=all`, { waitUntil: 'networkidle2', timeout: 60000 });

  try {
    await page.waitForSelector('ul.topiclist.topics', { timeout: 30000 });
    console.log('✅ Challenge solved!\n');
  } catch (e) {
    const title = await page.title();
    if (title.includes('bot')) {
      console.log('⏳ Waiting more for Anubis...');
      await sleep(10000);
      await page.waitForSelector('ul.topiclist.topics', { timeout: 60000 });
      console.log('✅ Challenge solved!\n');
    }
  }

  // 3. Get forum total count
  const firstPageHtml = await page.content();
  const forumTotal = getTotalResults(firstPageHtml);
  const totalPages = getTotalPages(firstPageHtml);
  console.log(`📊 Forum reports: ${forumTotal.toLocaleString()} plugins (${totalPages} pages)`);

  const diff = localPlugins.length - forumTotal;
  console.log(`🔍 Difference: ${diff > 0 ? '+' : ''}${diff} plugins`);

  // 4. Decide whether to do ID sweep
  if (diff === 0 && !forceFullCheck) {
    console.log('\n✅ Counts match! No verification needed.');
    console.log('   (Use --full-check to force ID verification anyway)');
    await browser.close();
    return;
  }

  if (diff > 0) {
    console.log(`⚠️  Local has ${diff} MORE plugins than forum — likely deleted/hidden on forum.`);
    console.log(`🔍 Running full ID sweep across ${totalPages} pages...\n`);
  } else if (diff < 0) {
    console.log(`ℹ️  Forum has ${Math.abs(diff)} MORE plugins than local — new plugins exist.`);
    console.log(`🔍 Running full ID sweep to also detect deletions...\n`);
  }

  // 5. ID sweep — collect all valid IDs from forum
  const forumIds = new Set();
  let pageCount = 0;
  const startTime = Date.now();

  // Process first page (already loaded)
  const firstPageIds = getPluginIdsFromPage(firstPageHtml);
  firstPageIds.forEach(id => forumIds.add(id));
  pageCount = 1;

  for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
    try {
      const start = (pageNum - 1) * PLUGINS_PER_PAGE;
      const url = `${BASE_URL}?mode=all&term=&user_id=0&start=${start}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      try {
        await page.waitForSelector('ul.topiclist.topics', { timeout: 20000 });
      } catch (e) {
        await sleep(5000);
        await page.waitForSelector('ul.topiclist.topics', { timeout: 30000 });
      }

      const html = await page.content();
      const pageIds = getPluginIdsFromPage(html);
      pageIds.forEach(id => forumIds.add(id));

      const pct = ((pageNum / totalPages) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const barWidth = 25;
      const filled = Math.round((pageNum / totalPages) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

      process.stdout.write(
        `\r  [${bar}] ${pct}% | Page ${pageNum}/${totalPages} | IDs: ${forumIds.size} | ⏱️ ${elapsed}s`
      );

      if (pageNum < totalPages) {
        await sleep(getRandomDelay());
      }
    } catch (err) {
      console.error(`\n  ❌ Error on page ${pageNum}: ${err.message}`);
      console.log('  🔄 Retrying in 10s...');
      await sleep(10000);
      pageNum--;
    }
  }

  console.log('\n\n📊 ID Sweep Complete!');
  console.log(`   Forum active IDs: ${forumIds.size}`);
  console.log(`   Local IDs: ${localIds.size}`);

  // 6. Find deleted plugins (in local but not in forum)
  const deletedIds = [];
  localPlugins.forEach(p => {
    if (!forumIds.has(p.id)) {
      deletedIds.push(p);
    }
  });

  console.log(`   Deleted/hidden plugins found: ${deletedIds.length}`);

  if (deletedIds.length > 0) {
    console.log('\n🗑️  Plugins to remove:');
    deletedIds.slice(0, 20).forEach(p => {
      console.log(`   - #${p.id} ${p.name} (by ${p.author})`);
    });
    if (deletedIds.length > 20) {
      console.log(`   ... and ${deletedIds.length - 20} more`);
    }

    // 7. Remove deleted plugins from local database
    const cleanedPlugins = localPlugins.filter(p => forumIds.has(p.id));
    console.log(`\n✅ Cleaned database: ${localPlugins.length} → ${cleanedPlugins.length} plugins`);

    // 8. Rebuild metadata
    const categories = {}, ratings = {};
    let totalDownloads = 0, certified = 0;
    cleanedPlugins.forEach(p => {
      if (p.category) categories[p.category] = (categories[p.category] || 0) + 1;
      if (p.rating?.label) ratings[p.rating.label] = (ratings[p.rating.label] || 0) + 1;
      totalDownloads += p.downloads || 0;
      if (p.certified) certified++;
    });

    const metadata = {
      scrapeDate: new Date().toISOString(),
      totalPlugins: cleanedPlugins.length,
      totalPages,
      totalDownloads,
      certifiedCreators: certified,
      categoryStats: categories,
      ratingStats: ratings,
      source: BASE_URL,
      lastVerified: new Date().toISOString(),
      removedCount: deletedIds.length,
    };

    fs.writeFileSync(PLUGINS_FILE, JSON.stringify(cleanedPlugins, null, 2), 'utf8');
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');

    console.log('\n💾 Updated files:');
    console.log('   ├─ data/plugins.json');
    console.log('   └─ data/metadata.json');
  } else {
    console.log('\n✅ No deleted plugins found. Database is in sync!');
    // Still update lastVerified timestamp
    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
    metadata.lastVerified = new Date().toISOString();
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
  }

  await browser.close();

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n⏱️  Total time: ${totalTime} minutes`);
  console.log('✅ Verification complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
