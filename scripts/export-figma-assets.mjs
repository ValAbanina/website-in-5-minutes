#!/usr/bin/env node
// Downloads every character, picture, pattern, decor and logo as SVG, plus
// PNG references of every screen, straight from the Figma file.
// Uses FIGMA_TOKEN from .env (Figma > Settings > Security > Personal access tokens,
// scope: "File content: read-only").
//
// Usage:
//   node scripts/export-figma-assets.mjs            # SVGs + screen PNGs
//   node scripts/export-figma-assets.mjs --svg-only
//   node scripts/export-figma-assets.mjs --png-only
//
// Re-run any time the design changes in Figma.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
try { process.loadEnvFile(join(root, '.env')); } catch { /* fall through */ }
const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) { console.error('Missing FIGMA_TOKEN in .env'); process.exit(1); }

const manifest = JSON.parse(await readFile(join(root, 'data/assets-manifest.json'), 'utf8'));
const KEY = manifest.fileKey;

async function exportBatch(ids, format, scale) {
  const qs = new URLSearchParams({ ids: ids.join(','), format, ...(format === 'svg' ? { svg_outline_text: 'true', svg_include_id: 'false', svg_simplify_stroke: 'true' } : { scale: String(scale) }) });
  const res = await fetch(`https://api.figma.com/v1/images/${KEY}?${qs}`, { headers: { 'X-Figma-Token': TOKEN } });
  if (!res.ok) throw new Error(`Figma ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.err) throw new Error(json.err);
  return json.images;
}

async function run(group, format, scale, outDir) {
  const entries = Object.entries(group);
  for (let i = 0; i < entries.length; i += 15) {
    const chunk = entries.slice(i, i + 15);
    const urls = await exportBatch(chunk.map(([, id]) => id), format, scale);
    for (const [name, id] of chunk) {
      const url = urls[id];
      if (!url) { console.warn(`no export for ${name} (${id})`); continue; }
      const res = await fetch(url);
      const file = join(root, outDir, `${name}.${format}`);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      console.log(`✓ ${outDir}/${name}.${format}`);
    }
  }
}

if (!args.has('--png-only')) {
  for (const [folder, group] of Object.entries(manifest.svg)) await run(group, 'svg', 1, `assets/svg/${folder}`);
}
if (!args.has('--svg-only')) {
  for (const [folder, group] of Object.entries(manifest.png)) await run(group, 'png', 1, `design/${folder}`);
}
console.log('\nDone. SVGs are in assets/svg, screen references in design/screens.');
