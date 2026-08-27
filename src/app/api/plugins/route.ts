import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pluginsPath = join(process.cwd(), 'data', 'plugins.json');
    const metaPath = join(process.cwd(), 'data', 'metadata.json');
    const plugins = JSON.parse(readFileSync(pluginsPath, 'utf-8'));
    const metadata = JSON.parse(readFileSync(metaPath, 'utf-8'));
    return NextResponse.json({ plugins, metadata });
  } catch {
    return NextResponse.json({ plugins: [], metadata: {} }, { status: 200 });
  }
}
