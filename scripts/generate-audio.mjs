#!/usr/bin/env node
// Generates every voice line and sound effect for the game with ElevenLabs,
// once, at build time. The API key stays in .env on your computer and is
// NEVER shipped to the browser. The game only loads the MP3 files.
//
// Usage:
//   node scripts/generate-audio.mjs --dry-run          # list what would be generated
//   node scripts/generate-audio.mjs                    # generate everything that is missing
//   node scripts/generate-audio.mjs --only=voices      # or --only=sfx
//   node scripts/generate-audio.mjs --client=gerald    # one client's voice lines
//   node scripts/generate-audio.mjs --force            # regenerate even if the file exists
//
// Needs Node 20.12+ (built-in fetch and .env loading).

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true]; }));

// ---- load .env -----------------------------------------------------------
try { process.loadEnvFile(join(root, '.env')); }
catch {
  try {
    const raw = await readFile(join(root, '.env'), 'utf8');
    for (const line of raw.split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
  } catch { /* no .env */ }
}
const API = process.env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io';
const KEY = process.env.ELEVENLABS_API_KEY;
const MODEL = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const FORMAT = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';
const DRY = !!args['dry-run'];
if (!KEY && !DRY) { console.error('Missing ELEVENLABS_API_KEY in .env (or run with --dry-run).'); process.exit(1); }

const game = JSON.parse(await readFile(join(root, 'data/game-data.json'), 'utf8'));
const sfx = JSON.parse(await readFile(join(root, 'data/sound-cues.json'), 'utf8'));

// ---- build the job list --------------------------------------------------
const jobs = [];
const voiceFor = (id) => process.env[`ELEVENLABS_VOICE_${id.toUpperCase()}`];
if (args.only !== 'sfx') {
  for (const c of game.clients) {
    if (args.client && args.client !== c.id) continue;
    const add = (key, text) => jobs.push({ kind: 'voice', id: `voice.${c.id}.${key}`, voice: voiceFor(c.id), voiceEnv: `ELEVENLABS_VOICE_${c.id.toUpperCase()}`, text, file: `assets/audio/voice/${c.id}/${key}.mp3` });
    add('brief', c.brief);
    c.lines.happy.forEach((t, i) => add(`happy-${i + 1}`, t));
    c.lines.meh.forEach((t, i) => add(`meh-${i + 1}`, t));
    c.lines.meltdown.forEach((t, i) => add(`meltdown-${i + 1}`, t));
    add('times-up', c.lines.timesUp);
    add('hurry', c.lines.hurry);
    for (const [k, t] of Object.entries(c.lines.triggers)) add(k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), t);
    for (const r of game.scoring.everyonesRules) add(`rule-${r.id}`, r.comment);
  }
  if (!args.client || args.client === 'deadline') {
    game.deadline.lines.forEach((t, i) => jobs.push({ kind: 'voice', id: `voice.deadline.${i + 1}`, voice: voiceFor('deadline'), voiceEnv: 'ELEVENLABS_VOICE_DEADLINE', text: t, file: `assets/audio/voice/deadline/line-${i + 1}.mp3` }));
  }
}
if (args.only !== 'voices' && !args.client) {
  for (const s of sfx.cues) jobs.push({ kind: 'sfx', id: s.id, text: s.prompt, duration: s.duration, loop: !!s.loop, file: `assets/audio/sfx/${s.id.replace(/\./g, '-')}.mp3` });
}

// ---- run -----------------------------------------------------------------
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const manifestPath = join(root, 'assets/audio/manifest.json');
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* new */ }

let made = 0, skipped = 0, failed = 0;
for (const j of jobs) {
  const out = join(root, j.file);
  manifest[j.id] = { file: j.file, text: j.text, kind: j.kind };
  if (!args.force && await exists(out)) { skipped++; continue; }
  if (DRY) { console.log(`[dry] ${j.kind.padEnd(5)} ${j.id}  →  ${j.file}${j.kind === 'voice' && !j.voice ? `   (set ${j.voiceEnv})` : ''}`); continue; }
  if (j.kind === 'voice' && !j.voice) { console.warn(`skip ${j.id}: set ${j.voiceEnv} in .env`); failed++; continue; }
  const url = j.kind === 'voice'
    ? `${API}/v1/text-to-speech/${j.voice}?output_format=${FORMAT}`
    : `${API}/v1/sound-generation?output_format=${FORMAT}`;
  const body = j.kind === 'voice'
    ? { text: j.text, model_id: MODEL, voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true } }
    : { text: j.text, duration_seconds: Math.min(30, Math.max(0.5, j.duration || 1)), loop: j.loop, prompt_influence: 0.5 };
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, Buffer.from(await res.arrayBuffer()));
    made++; console.log(`✓ ${j.id}`);
  } catch (e) { failed++; console.error(`✗ ${j.id}: ${e.message}`); }
  await sleep(350); // be gentle with rate limits
}
if (!DRY) { await mkdir(dirname(manifestPath), { recursive: true }); await writeFile(manifestPath, JSON.stringify(manifest, null, 2)); }
console.log(`\n${DRY ? 'Would generate' : 'Generated'} ${DRY ? jobs.length - skipped : made}, skipped ${skipped} existing, ${failed} failed.`);
