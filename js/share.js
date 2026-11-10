import { esc, firstName, formatClock } from './dom.js';
import { characterSVG } from './characters.js';

export async function drawShareCard({ game, client, result, elapsed, canvas }) {
  const [size] = game.share.size;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const bg = client.color || '#8FB8E8';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  roundRect(ctx, 64, 64, size - 128, size - 128, 36, '#ffffff', '#000000');
  ctx.fillStyle = '#000000';
  ctx.font = '700 36px Roboto, sans-serif';
  ctx.fillText('Website in 5 minutes', 110, 150);
  ctx.fillStyle = '#D72885';
  ctx.font = '800 28px Roboto Condensed, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('DESIGN', size - 120, 130);
  ctx.fillStyle = '#000000';
  ctx.fillText('FORMATION', size - 120, 164);
  ctx.textAlign = 'left';

  roundRect(ctx, 110, 200, size - 220, 460, 28, bg, '#000000');

  const mood = result.outcome?.id || 'meh';
  const who = firstName(client);
  const verb = game.share.outcomeVerbs[mood] || mood;
  const headline = game.share.headline
    .replace('{client}', who)
    .replace('{outcomeVerb}', verb)
    .replace('{time}', formatClock(elapsed));

  ctx.fillStyle = '#111111';
  ctx.font = '800 54px Roboto Condensed, sans-serif';
  wrapText(ctx, headline, 110, 760, size - 220, 62);

  ctx.fillStyle = '#414141';
  ctx.font = '400 32px Roboto, sans-serif';
  ctx.fillText(game.share.subs[mood] || '', 110, 960);
  ctx.textAlign = 'right';
  ctx.fillText(game.share.footer, size - 120, 960);
  ctx.textAlign = 'left';

  const portrait = await loadPortrait(client.id, mood);
  if (portrait) {
    const ratio = (portrait.naturalWidth || 240) / (portrait.naturalHeight || 280);
    const w = 300;
    const h = w / ratio;
    ctx.drawImage(portrait, size / 2 - w / 2, 240, w, h);
  }
  else {
    ctx.fillStyle = '#111111';
    ctx.font = '800 120px Roboto Condensed, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(who.slice(0, 1), size / 2, 470);
    ctx.textAlign = 'left';
  }
  paintStamp(ctx, size, result);
}

function paintStamp(ctx, size, result) {
  const stamp = result.outcome?.stamp || '';
  ctx.save();
  ctx.translate(size - 340, 250);
  ctx.rotate(-0.14);
  ctx.strokeStyle = result.outcome?.stampColor || '#007A7A';
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, 280, 110);
  ctx.fillStyle = result.outcome?.stampColor || '#007A7A';
  ctx.font = '800 48px Roboto Condensed, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(stamp, 140, 72);
  ctx.restore();

  roundRect(ctx, size - 420, 560, 220, 64, 32, '#111111');
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 28px Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Score ${result.points}/${result.max}`, size - 310, 602);
  ctx.textAlign = 'left';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('missing'));
    img.src = src;
  });
}

async function loadPortrait(id, mood) {
  try {
    return await loadImage(`assets/svg/characters/${id}-${mood}.svg`);
  } catch { /* drawn stand-in until the asset export */ }
  const url = URL.createObjectURL(new Blob([characterSVG(id, mood)], { type: 'image/svg+xml' }));
  try {
    return await loadImage(url);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 8; ctx.stroke(); }
}

function wrapText(ctx, text, x, y, max, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  words.forEach((word) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > max && line) {
      ctx.fillText(line.trim(), x, yy);
      line = `${word} `;
      yy += lineHeight;
    } else line = test;
  });
  ctx.fillText(line.trim(), x, yy);
}

export async function shareResult({ game, client, result, elapsed, stats }) {
  const canvas = document.createElement('canvas');
  await document.fonts.ready.catch(() => {});
  await drawShareCard({ game, client, result, elapsed, canvas });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'website-in-5-minutes.png', { type: 'image/png' });
  const who = firstName(client);
  const mood = result.outcome?.id || 'meh';
  const text = game.share.headline
    .replace('{client}', who)
    .replace('{outcomeVerb}', game.share.outcomeVerbs[mood] || mood)
    .replace('{time}', formatClock(elapsed));
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: game.meta.title, text });
      stats.send('shared', { method: 'share' });
      return;
    } catch { /* download instead */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'website-in-5-minutes.png';
  a.click();
  URL.revokeObjectURL(url);
  stats.send('shared', { method: 'download' });
}

export function bubble(text, extra = '') {
  if (!text) return '';
  return `<p class="bubble ${extra}" role="status">${esc(text)}</p>`;
}

