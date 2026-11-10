import { esc, firstName, prefersReducedMotion } from '../dom.js';
import { logo, muteButton, progress } from '../chrome.js';
import { characterHTML } from '../characters.js';
import { outcomeHeadline, outcomeWhy } from '../scoring.js';

function mark(icon) {
  if (icon === 'check') return '✓';
  if (icon === 'tilde') return '~';
  if (icon === 'deal') return '!';
  return '×';
}

export function render(state, game, client) {
  const result = state.result;
  const mood = result?.outcome?.id || 'meh';
  const face = mood === 'happy' ? 'happy' : mood === 'meh' ? 'meh' : 'meltdown';
  const line = (client.lines[mood] || client.lines.meltdown || [''])[0];
  const rows = [...(result?.rows || []), ...(result?.penalties || [])];
  const list = rows.map((row) => `<li class="score-row is-${esc(row.icon)}">
      <span class="score-mark" aria-hidden="true">${mark(row.icon)}</span>
      <span>${esc(row.text)}</span>
      ${row.dealBreaker ? '<span class="badge">Deal-breaker</span>' : `<span class="pts">${row.points > 0 ? '+' : ''}${row.points}</span>`}
    </li>`).join('');
  const extra = result?.dealBreakers?.length
    ? ' One deal-breaker is enough for a meltdown, whatever the score.'
    : '';
  return `<div class="screen screen-client">
    <header class="topbar topbar-clear">
      ${logo()}
      ${progress('verdict')}
      ${muteButton(state.muted)}
    </header>
    <div class="verdict">
      <div class="verdict-person moment-rise">
        <p class="bubble bubble-lg">${esc(line)}</p>
        ${characterHTML(client.id, face, 'verdict-art')}
        ${mood === 'happy' ? '<span class="confetti" aria-hidden="true"></span>' : ''}
      </div>
      <article class="report moment-slide">
        <p class="stamp" data-stamp="${esc(result.outcome.stamp)}" style="--stamp:${esc(result.outcome.stampColor)}">${esc(result.outcome.stamp)}</p>
        <h1><span data-count>0</span><span class="of">/${result.max}</span> ${esc(outcomeHeadline(result, client))}</h1>
        <ul class="score-list">${list}</ul>
        <div class="lesson">
          <h2>${esc(outcomeWhy(result))}</h2>
          <p>${esc(client.lesson)}${esc(extra)}</p>
        </div>
        <div class="row-actions">
          <button type="button" class="btn btn-primary" data-action="next-client">Next client</button>
          <button type="button" class="btn" data-action="share">Share result</button>
          <button type="button" class="text-btn" data-action="to-learn">Learn the theory</button>
        </div>
      </article>
    </div>
  </div>`;
}

export function mount(root, state) {
  const el = root.querySelector('[data-count]');
  const target = state.result?.points || 0;
  if (!el) return;
  if (prefersReducedMotion()) {
    el.textContent = String(target);
    root.querySelector('.stamp')?.classList.add('is-in');
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 700);
    el.textContent = String(Math.round(target * t));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.setTimeout(() => root.querySelector('.stamp')?.classList.add('is-in'), 420);
}
