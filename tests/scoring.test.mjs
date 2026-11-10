import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { score } from '../js/scoring.js';

const game = JSON.parse(readFileSync(new URL('../data/game-data.json', import.meta.url), 'utf8'));
const client = (id) => game.clients.find((c) => c.id === id);

function design(over = {}) {
  return {
    sections: [
      { type: 'nav', layout: 'simple' },
      { type: 'hero', layout: 'split' },
      { type: 'about', layout: 'image-left' },
      { type: 'features', layout: 'cards', columns: 3 },
      { type: 'pricing', columns: 3 },
      { type: 'footer', layout: 'simple' },
    ],
    palette: null,
    heading: null,
    body: 'lato',
    style: null,
    picture: null,
    heroDecor: 'none',
    pattern: 'none',
    ...over,
  };
}

function pointsOf(result, id) {
  return result.rows.find((row) => row.id === id).points;
}

const gerald = score(design({
  sections: [
    { type: 'nav', layout: 'simple' },
    { type: 'hero', layout: 'split' },
    { type: 'about', layout: 'image-left' },
    { type: 'stats', columns: 4 },
    { type: 'testimonial', layout: 'single' },
    { type: 'footer', layout: 'simple' },
  ],
  palette: 'navy-ledger',
  heading: 'libre-baskerville',
  body: 'source-serif-4',
  style: 'classic',
  picture: 'office-handshake',
  heroDecor: 'none',
  pattern: 'grid',
}), client('gerald'), game);

assert.equal(gerald.points, 11, `Gerald points ${gerald.points}`);
assert.equal(gerald.outcome.id, 'happy');
assert.equal(gerald.outcome.stamp, 'APPROVED');
assert.equal(gerald.dealBreakers.length, 0);
assert.equal(gerald.rulesBroken.length, 0);
assert.deepEqual(
  ['palette', 'headingFont', 'bodyFont', 'style', 'pictures', 'decoration', 'mustHave'].map((id) => pointsOf(gerald, id)),
  [3, 2, 1, 2, 1, 1, 1],
);

const rosa = score(design({
  palette: 'warm-bakery',
  heading: 'bricolage-grotesque',
  body: 'nunito',
  style: 'neo-brutalist',
  picture: 'fresh-bread',
  heroDecor: 'squiggle',
  pattern: 'none',
}), client('rosa'), game);

assert.equal(rosa.points, 6, `Rosa points ${rosa.points}`);
assert.equal(rosa.outcome.id, 'meh');
assert.equal(rosa.outcome.stamp, 'REVISIONS');
assert.equal(rosa.dealBreakers.length, 0);
assert.equal(rosa.rulesBroken.length, 0);
assert.equal(pointsOf(rosa, 'palette'), 3);
assert.equal(pointsOf(rosa, 'headingFont'), 0);
assert.equal(pointsOf(rosa, 'bodyFont'), 1);
assert.equal(pointsOf(rosa, 'style'), 0);
assert.equal(pointsOf(rosa, 'pictures'), 2);
assert.equal(pointsOf(rosa, 'decoration'), 0);
assert.equal(pointsOf(rosa, 'mustHave'), 0);

const kaia = score(design({
  sections: [
    { type: 'nav', layout: 'simple' },
    { type: 'hero', layout: 'centered' },
    { type: 'features', layout: 'cards', columns: 3 },
    { type: 'cta', layout: 'band' },
    { type: 'banner', layout: 'big-statement' },
    { type: 'footer', layout: 'simple' },
  ],
  palette: 'navy-ledger',
  heading: 'libre-baskerville',
  body: 'lato',
  style: 'playful',
  picture: 'neon-blobs',
  heroDecor: 'none',
  pattern: 'none',
}), client('kaia'), game);

assert.equal(kaia.points, 5, `Kaia points ${kaia.points}`);
assert.equal(kaia.outcome.id, 'meltdown');
assert.equal(kaia.outcome.stamp, 'MELTDOWN');
assert.deepEqual(kaia.dealBreakers, ['palette', 'headingFont']);
assert.equal(kaia.mood, 'dealbreaker');
assert.equal(kaia.meter, 0);
assert.equal(pointsOf(kaia, 'bodyFont'), 1);
assert.equal(pointsOf(kaia, 'style'), 1);
assert.equal(pointsOf(kaia, 'pictures'), 2);
assert.equal(pointsOf(kaia, 'mustHave'), 1);

const floored = score(design({
  sections: [],
  body: 'caveat',
  heroDecor: 'confetti',
  pattern: 'checks',
}), client('gerald'), game);
assert.equal(floored.points, 0);
assert.ok(floored.rulesBroken.includes('readable-body'));
assert.ok(floored.rulesBroken.includes('dont-overdecorate'));
assert.ok(floored.rulesBroken.includes('not-too-short'));

const repeat = score(design({
  sections: [
    { type: 'nav' },
    { type: 'hero' },
    { type: 'features' },
    { type: 'features' },
    { type: 'features' },
    { type: 'footer' },
  ],
  body: 'lato',
}), client('brenda'), game);
assert.ok(repeat.rulesBroken.includes('dont-repeat'));
assert.ok(repeat.points < 1 || repeat.penalties.some((p) => p.id === 'dont-repeat' && p.points === -1));

console.log('scoring tests passed');
console.log(`Gerald ${gerald.points}/12 ${gerald.outcome.stamp}`);
console.log(`Rosa ${rosa.points}/12 ${rosa.outcome.stamp}`);
console.log(`Kaia ${kaia.points}/12 ${kaia.outcome.stamp} (${kaia.dealBreakers.length} deal-breakers)`);
