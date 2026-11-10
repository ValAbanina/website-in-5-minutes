import { esc, firstName, formatClock } from './dom.js';
import { characterHTML } from './characters.js';

export function logo() {
  return `<a class="logo" href="#main" aria-label="Design Formation">
    <img class="logo-img logo-on-dark" src="assets/svg/logos/df-on-dark.svg" alt="">
    <img class="logo-img logo-on-light" src="assets/svg/logos/df-on-light.svg" alt="">
  </a>`;
}

export function muteButton(muted) {
  const label = muted ? 'Unmute sound' : 'Mute sound';
  return `<button type="button" class="icon-btn" data-action="toggle-mute" aria-pressed="${muted}" aria-label="${label}">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3z"/>
      ${muted
        ? '<path fill="currentColor" d="M16 9.4 17.4 8 21 11.6 19.6 13 16 9.4zM16 14.6 19.6 11 21 12.4 17.4 16 16 14.6z"/>'
        : '<path fill="none" stroke="currentColor" stroke-width="2" d="M16 9a5 5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'}
    </svg>
  </button>`;
}

const STEPS = ['Pick', 'Brief', 'Build', 'Verdict'];

export function progress(screen) {
  const map = { pick: 0, brief: 1, build: 2, timesup: 2, verdict: 3, learn: 3 };
  const current = map[screen] ?? -1;
  return `<ol class="steps" aria-label="Progress">${STEPS.map((label, i) => {
    const state = i < current ? 'done' : i === current ? 'now' : 'todo';
    return `<li class="step is-${state}"><span class="step-n" aria-hidden="true">${state === 'done' ? '✓' : i + 1}</span><span class="step-l">${label}</span>${state === 'now' ? '<span class="sr-only">(current)</span>' : ''}</li>`;
  }).join('')}</ol>`;
}

export function meterBlock(client, result) {
  const label = result.mood === 'dealbreaker'
    ? 'Deal-breaker!'
    : (result.outcome?.label || 'Meltdown');
  const pct = Math.max(0, Math.min(100, (result.meter / result.max) * 100));
  return `<div class="meter" data-mood="${esc(result.mood)}">
    <div class="meter-top"><span>${esc(firstName(client))}'s mood</span><strong>${esc(label)}</strong></div>
    <div class="meter-track" role="meter" aria-valuemin="0" aria-valuemax="${result.max}" aria-valuenow="${result.meter}" aria-valuetext="${esc(label)}. Score ${result.points} out of ${result.max}.">
      <span class="meter-fill" style="width:${pct}%"></span>
    </div>
  </div>`;
}

export function timerBlock(seconds, meta) {
  let mode = 'calm';
  if (seconds <= meta.panicAtSeconds) mode = 'panic';
  else if (seconds <= meta.hurryAtSeconds) mode = 'hurry';
  const word = mode === 'panic' ? 'Hurry, time left' : 'Time left';
  return `<p class="timer is-${mode}"><span class="timer-k">${word}</span><span class="timer-num">${formatClock(seconds)}</span></p>`;
}

export function cast(game, activeId, line) {
  const people = game.clients.map((c) => {
    const on = c.id === activeId;
    return `<figure class="cast-person${on ? ' is-speaking' : ''}" data-id="${esc(c.id)}">
      ${on ? `<p class="bubble">${esc(line)}</p>` : ''}
      ${characterHTML(c.id, 'neutral')}
      <figcaption class="sr-only">${esc(c.name)}</figcaption>
    </figure>`;
  }).join('');
  return `<div class="cast" data-cast>${people}</div><div class="program-stripe" aria-hidden="true"><span></span><span></span><span></span></div>`;
}

export function pickyDots(n) {
  return `<span class="dots" aria-label="Picky ${n} out of 5">${Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'is-on' : ''}"></i>`).join('')}</span>`;
}
