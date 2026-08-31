/**
 * TheoTown Plugin Store Scraper (Browser-based)
 * 
 * Uses Puppeteer to handle Anubis anti-bot protection,
 * then scrapes all plugin pages with random delays (2-5s) to mimic human behavior.
 * 
 * Usage: node scraper.js [--pages N] [--resume]
 */

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ============================================
// Configuration
// ============================================
const BASE_URL = 'https://forum.theotown.com/plugins/list';
const PLUGINS_PER_PAGE = 20;
const MIN_DELAY_MS = 2000; // 2 seconds minimum delay
const MAX_DELAY_MS = 5000; // 5 seconds maximum delay
const OUTPUT_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'plugins.json');
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progress.json');
const METADATA_FILE = path.join(OUTPUT_DIR, 'metadata.json');

// ============================================
// Utility Functions
// ============================================

function getRandomDelay(min = MIN_DELAY_MS, max = MAX_DELAY_MS) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .trim();
}

function parseRating(text) {
  if (!text) return { score: null, label: null, count: 0 };
  
  const labelMatch = text.match(/(OVERWHELMINGLY POSITIVE|VERY POSITIVE|POSITIVE|MOSTLY POSITIVE|MIXED|MOSTLY NEGATIVE|NEGATIVE|VERY NEGATIVE|OVERWHELMINGLY NEGATIVE|NOT ENOUGH RATINGS)/i);
  const countMatch = text.match(/by\s+(\d+)\s+ratings?/i);
  
  const label = labelMatch ? labelMatch[1].toUpperCase() : null;
  const count = countMatch ? parseInt(countMatch[1]) : 0;
  
  const scoreMap = {
    'OVERWHELMINGLY POSITIVE': 5,
    'VERY POSITIVE': 4.5,
    'POSITIVE': 4,
    'MOSTLY POSITIVE': 3.5,
    'MIXED': 3,
    'MOSTLY NEGATIVE': 2.5,
    'NEGATIVE': 2,
    'VERY NEGATIVE': 1.5,
    'OVERWHELMINGLY NEGATIVE': 1,
    'NOT ENOUGH RATINGS': null
  };
  
  return {
    score: label ? (scoreMap[label] || null) : null,
    label: label,
    count: count
  };
}

function parsePlatforms($, $element) {
  const platforms = [];
  $element.find('i[title]').each((_, el) => {
    const title = $(el).attr('title');
    if (title) platforms.push(title);
  });
  return platforms;
}

function parsePrice(text) {
  if (!text) return { amount: 0, currency: 'diamonds' };
  const match = text.match(/(\d+)/);
  if (match) return { amount: parseInt(match[1]), currency: 'diamonds' };
  if (text.toLowerCase().includes('free')) return { amount: 0, currency: 'free' };
  return { amount: 0, currency: 'diamonds' };
}

function parseSize(text) {
  if (!text) return { raw: '', bytes: 0 };
  const match = text.match(/([\d,.]+)\s*(KB|MB|GB|B)/i);
  if (!match) return { raw: text.trim(), bytes: 0 };
  
  const value = parseFloat(match[1].replace(',', ''));
  const unit = match[2].toUpperCase();
  const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1048576, 'GB': 1073741824 };
  
  return {
    raw: `${match[1]}${match[2]}`,
    bytes: Math.round(value * (multipliers[unit] || 1))
  };
}

function normalizeForumDate(dateText, referenceDate = new Date()) {
  if (!dateText) return '';
  const clean = cleanText(dateText);
  const lower = clean.toLowerCase();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (lower.startsWith('today') || lower.startsWith('hari ini')) {
    const timeMatch = clean.match(/(\d{1,2}:\d{2})/);
    const timeStr = timeMatch ? timeMatch[1] : `${String(referenceDate.getHours()).padStart(2, '0')}:${String(referenceDate.getMinutes()).padStart(2, '0')}`;
    const day = referenceDate.getDate();
    const month = months[referenceDate.getMonth()];
    const year = referenceDate.getFullYear();
    return `${day} ${month} ${year}, ${timeStr}`;
  }
  
  if (lower.startsWith('yesterday') || lower.startsWith('kemarin')) {
    const timeMatch = clean.match(/(\d{1,2}:\d{2})/);
    const timeStr = timeMatch ? timeMatch[1] : '00:00';
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const day = yesterday.getDate();
    const month = months[yesterday.getMonth()];
    const year = yesterday.getFullYear();
    return `${day} ${month} ${year}, ${timeStr}`;
  }
  
  return clean;
}

function getFormattedCurrentDate(date = new Date()) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// ============================================
// HTML Parser
// ============================================

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

function parsePluginsFromPage(html, scrapeDate = new Date()) {
  const $ = cheerio.load(html);
  const plugins = [];
  
  $('ul.topiclist.topics > li.row').each((index, element) => {
    try {
      const $row = $(element);
      const $dt = $row.find('dl.row-item dt');
      const $listInner = $dt.find('div.list-inner');
      
      // Plugin ID
      const pluginIdText = $listInner.find('span.post-number').text().trim();
      const pluginId = pluginIdText.replace('#', '');
      
      // Plugin Name
      const $titleLink = $listInner.find('a.forumtitle');
      let pluginName = cleanText($titleLink.clone().children('i').remove().end().text());
      
      // Certified Plugin Quality Creator badge
      const isCertified = $titleLink.find('i.fa-heart').length > 0;
      
      // Preview Image
      const $previewImg = $dt.find('img[title="Preview"]');
      const previewImage = $previewImg.attr('src') || '';
      
      // Description
      const descriptionHtml = $listInner.find('div.alert').html() || '';
      const description = cleanText($listInner.find('div.alert').text());
      
      // Fields: Category, Price, Platforms, Size, Min Version
      let category = '', priceText = '', platforms = [], sizeText = '', minVersion = '';
      
      $listInner.find('div').each((_, div) => {
        const $div = $(div);
        const labelEl = $div.find('label').first();
        if (!labelEl.length) return;
        
        const label = labelEl.text().trim().replace(':', '');
        const value = cleanText($div.text().replace(labelEl.text(), ''));
        
        switch (label) {
          case 'Category': category = value; break;
          case 'Price': priceText = value; break;
          case 'Platforms': platforms = parsePlatforms($, $div); break;
          case 'Size': sizeText = value; break;
          case 'Min version': minVersion = value; break;
        }
      });
      
      // Author
      const $authorLink = $listInner.find('div.topic-poster a.username, div.topic-poster a.username-coloured');
      const author = cleanText($authorLink.first().text());
      const authorProfileUrl = $authorLink.first().attr('href') || '';
      const userIdMatch = authorProfileUrl.match(/user_id=(\d+)|u=(\d+)/);
      const authorId = userIdMatch ? (userIdMatch[1] || userIdMatch[2]) : '';
      
      // Date
      const posterText = $listInner.find('div.topic-poster').text();
      const dateMatch = posterText.match(/»\s*(.+?)$/m);
      const uploadDate = dateMatch ? normalizeForumDate(dateMatch[1], scrapeDate) : '';
      
      // Version
      const version = cleanText($row.find('dd.posts').text());
      
      // Downloads
      const downloadsText = cleanText($row.find('dd.views').text());
      const downloads = parseInt(downloadsText.replace(/[,.]/g, '')) || 0;
      
      // Rating
      const ratingText = cleanText($row.find('dd.lastpost').text());
      const rating = parseRating(ratingText);
      
      const price = parsePrice(priceText);
      const size = parseSize(sizeText);
      
      // Build plugin URL
      let pluginUrl = $titleLink.attr('href') || '';
      if (pluginUrl && !pluginUrl.startsWith('http')) {
        pluginUrl = `https://forum.theotown.com/plugins/${pluginUrl}`;
      }
      
      if (pluginId) {
        plugins.push({
          id: pluginId,
          name: pluginName,
          url: pluginUrl,
          certified: isCertified,
          previewImage,
          description,
          descriptionHtml: descriptionHtml.trim(),
          category,
          price,
          platforms,
          size,
          minVersion,
          author,
          authorId,
          uploadDate,
          version,
          downloads,
          rating,
        });
      }
    } catch (err) {
      console.error(`  ⚠️  Error parsing row ${index}:`, err.message);
    }
  });
  
  return plugins;
}

// ============================================
// Puppeteer Browser Scraper
// ============================================

async function findChromePath() {
  const possiblePaths = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    // Linux / Mac / CI
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
  const shouldResume = args.includes('--resume');
  const isUpdateMode = args.includes('--update') || args.includes('--quick');
  const pagesArgIndex = args.indexOf('--pages');
  const maxPages = pagesArgIndex !== -1 ? parseInt(args[pagesArgIndex + 1]) : (isUpdateMode ? 3 : null);
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     🏙️  TheoTown Plugin Store Scraper v2.2          ║');
  console.log('║     (Human-like random delay: 2s - 5s)             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
  
  // Ensure output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Load existing plugins if in update mode
  let existingPlugins = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingPlugins = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {}
  }

  // Load progress
  let progress = { lastPage: 0, totalPages: 0, plugins: isUpdateMode ? existingPlugins : [] };
  if (shouldResume && fs.existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`📂 Resuming from page ${progress.lastPage + 1}...`);
      console.log(`   Already scraped: ${progress.plugins.length} plugins\n`);
    } catch (e) {
      console.log('⚠️  Could not load progress, starting fresh.\n');
    }
  }
  
  // Find Chrome/Edge
  const chromePath = await findChromePath();
  if (!chromePath) {
    console.error('❌ Could not find Chrome or Edge. Please install Google Chrome.');
    process.exit(1);
  }
  console.log(`🌐 Using browser: ${path.basename(chromePath)}`);
  
  // Launch browser
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
  
  // Navigate to the first page and wait for Anubis challenge
  console.log('🔐 Solving Anubis anti-bot challenge...');
  await page.goto(`${BASE_URL}?mode=all`, { waitUntil: 'networkidle2', timeout: 60000 });
  
  // Wait for content
  try {
    await page.waitForSelector('ul.topiclist.topics', { timeout: 30000 });
    console.log('✅ Challenge solved! Page loaded.\n');
  } catch (e) {
    const title = await page.title();
    if (title.includes('bot')) {
      console.log('⏳ Anubis challenge taking longer... waiting more.');
      await sleep(10000);
      await page.waitForSelector('ul.topiclist.topics', { timeout: 60000 });
      console.log('✅ Challenge solved!\n');
    }
  }
  
  // Get first page HTML
  const firstPageHtml = await page.content();
  const totalResults = getTotalResults(firstPageHtml);
  const totalPages = getTotalPages(firstPageHtml);
  const pagesToScrape = maxPages ? Math.min(maxPages, totalPages) : totalPages;
  
  console.log(`📊 Total plugins: ${totalResults.toLocaleString()}`);
  console.log(`📄 Total pages: ${totalPages}`);
  console.log(`🎯 Pages to scrape: ${pagesToScrape}`);
  const avgDelaySec = (MIN_DELAY_MS + MAX_DELAY_MS) / 2000;
  console.log(`⏱️  Estimated time (~${avgDelaySec}s/page): ~${Math.ceil((pagesToScrape - progress.lastPage) * avgDelaySec / 60)} minutes\n`);
  
  // Scrape pages
  const startTime = Date.now();
  let allPlugins = progress.plugins || [];
  
  // Calculate start page based on actual plugins scraped
  const calculatedLastPage = Math.floor(allPlugins.length / PLUGINS_PER_PAGE);
  const startPage = shouldResume && allPlugins.length > 0 ? calculatedLastPage + 1 : 1;
  let errCount = 0;
  
  console.log(`📂 Resuming from page ${startPage}... (Already scraped ${allPlugins.length} plugins)`);
  
  for (let pageNum = startPage; pageNum <= pagesToScrape; pageNum++) {
    try {
      let html;
      
      if (pageNum === 1 && startPage === 1) {
        html = firstPageHtml;
      } else {
        const start = (pageNum - 1) * PLUGINS_PER_PAGE;
        const url = `${BASE_URL}?mode=all&term=&user_id=0&start=${start}`;
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        try {
          await page.waitForSelector('ul.topiclist.topics', { timeout: 20000 });
        } catch (e) {
          console.log(`\n  🔄 Waiting for page elements on page ${pageNum}...`);
          await sleep(5000);
          await page.waitForSelector('ul.topiclist.topics', { timeout: 30000 });
        }
        
        html = await page.content();
      }
      
      const plugins = parsePluginsFromPage(html, new Date());
      
      // Upsert: Update existing plugins with fresh stats/date or insert new ones at top
      plugins.forEach(p => {
        const existingIdx = allPlugins.findIndex(existing => existing.id === p.id);
        if (existingIdx !== -1) {
          const existing = allPlugins[existingIdx];
          const oldVer = parseInt(existing.version) || 1;
          const newVer = parseInt(p.version) || 1;
          
          if (newVer > oldVer) {
            // Version updated! Stamp with current fetch date so it appears in today's schedule
            p.uploadDate = getFormattedCurrentDate(new Date());
            allPlugins[existingIdx] = p;
          } else {
            // Stats update (downloads, rating, etc.): keep existing date
            if (existing.uploadDate) {
              p.uploadDate = existing.uploadDate;
            }
            allPlugins[existingIdx] = p;
          }
        } else {
          // Brand new plugin! Stamp with current fetch date
          p.uploadDate = getFormattedCurrentDate(new Date());
          allPlugins.unshift(p);
        }
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const remainingPages = pagesToScrape - pageNum;
      const remainingSec = (remainingPages * avgDelaySec).toFixed(0);
      const pct = ((pageNum / pagesToScrape) * 100).toFixed(1);
      
      const barWidth = 25;
      const filled = Math.round((pageNum / pagesToScrape) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
      
      const currentDelay = pageNum < pagesToScrape ? getRandomDelay() : 0;
      
      process.stdout.write(
        `\r  [${bar}] ${pct}% | Page ${pageNum}/${pagesToScrape} | ` +
        `Added: ${plugins.length} | Total: ${allPlugins.length} | ` +
        `⏱️ ${elapsed}s (Next delay: ${(currentDelay/1000).toFixed(1)}s)`
      );
      
      // Save progress and update files live on every page
      const currentMeta = buildMetadata(allPlugins, pagesToScrape);
      saveResults(allPlugins, currentMeta);
      saveProgress({ lastPage: pageNum, totalPages: pagesToScrape, plugins: allPlugins });
      
      // Random Human-like delay before requesting next page
      if (pageNum < pagesToScrape) {
        await sleep(currentDelay);
      }
      
      errCount = 0;
    } catch (err) {
      errCount++;
      console.error(`\n  ❌ Error on page ${pageNum}: ${err.message}`);
      
      if (errCount >= 5) {
        console.error('\n  ⛔ Too many errors. Saving progress...');
        saveProgress({ lastPage: Math.max(0, pageNum - 1), totalPages: pagesToScrape, plugins: allPlugins });
        break;
      }
      
      const retryDelay = errCount * 5000;
      console.log(`  🔄 Retrying in ${retryDelay/1000}s... (${errCount}/5)`);
      await sleep(retryDelay);
      pageNum--;
    }
  }
  
  console.log('\n');
  
  // Close browser
  await browser.close();
  
  // Generate stats
  const categories = {}, ratings = {};
  let totalDownloads = 0, certified = 0;
  
  allPlugins.forEach(p => {
    if (p.category) categories[p.category] = (categories[p.category] || 0) + 1;
    if (p.rating?.label) ratings[p.rating.label] = (ratings[p.rating.label] || 0) + 1;
    totalDownloads += p.downloads || 0;
    if (p.certified) certified++;
  });
  
  const metadata = {
    scrapeDate: new Date().toISOString(),
    totalPlugins: allPlugins.length,
    totalPages: pagesToScrape,
    totalDownloads,
    certifiedCreators: certified,
    categoryStats: categories,
    ratingStats: ratings,
    source: BASE_URL,
  };
  
  saveResults(allPlugins, metadata);
  saveProgress({ lastPage: pagesToScrape, totalPages: pagesToScrape, plugins: allPlugins });
  
  // Print summary
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                  📊 Scraping Complete!                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  🔌 Total plugins scraped: ${String(allPlugins.length).padStart(5)}                       ║`);
  console.log(`║  📥 Total downloads:  ${String(totalDownloads.toLocaleString()).padStart(10)}                       ║`);
  console.log(`║  ⭐ Certified creators: ${String(certified).padStart(5)}                           ║`);
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  📁 Output Files:                                       ║');
  console.log('║  ├─ data/plugins.json                                   ║');
  console.log('║  ├─ data/metadata.json                                  ║');
  console.log('║  └─ data/progress.json                                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  📂 Categories:                                         ║');
  
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`║    ${cat.padEnd(25)} ${String(count).padStart(5)} plugins               ║`);
    });
  
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  ⭐ Ratings:                                            ║');
  
  Object.entries(ratings)
    .sort((a, b) => b[1] - a[1])
    .forEach(([label, count]) => {
      console.log(`║    ${label.padEnd(30)} ${String(count).padStart(5)} plugins          ║`);
    });
  
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n⏱️  Total time: ${totalTime} minutes`);
  console.log('✅ Done!\n');
}

function buildMetadata(plugins, pagesToScrape) {
  const categories = {}, ratings = {};
  let totalDownloads = 0, certified = 0;
  
  plugins.forEach(p => {
    if (p.category) categories[p.category] = (categories[p.category] || 0) + 1;
    if (p.rating?.label) ratings[p.rating.label] = (ratings[p.rating.label] || 0) + 1;
    totalDownloads += p.downloads || 0;
    if (p.certified) certified++;
  });
  
  return {
    scrapeDate: new Date().toISOString(),
    totalPlugins: plugins.length,
    totalPages: pagesToScrape,
    totalDownloads,
    certifiedCreators: certified,
    categoryStats: categories,
    ratingStats: ratings,
    source: BASE_URL,
  };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress), 'utf8');
}

function saveResults(plugins, metadata) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(plugins, null, 2), 'utf8');
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
