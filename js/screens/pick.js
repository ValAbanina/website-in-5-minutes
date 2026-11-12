import { esc, punchyLine } from '../dom.js';
import { logo, muteButton, progress, pickyDots } from '../chrome.js';
import { characterHTML } from '../characters.js';

export function render(state, game) {
  const selected = game.clients.find((c) => c.id === state.clientId) || game.clients[0];
  const cards = game.clients.map((c) => {
    const on = c.id === selected.id;
    return `<button type="button" class="card${on ? ' is-on' : ''}" data-action="select-client" data-id="${esc(c.id)}" aria-pressed="${on}" style="--card:${esc(c.color)}">
      <span class="sticker">Your client</span>
      ${characterHTML(c.id, 'neutral', 'card-art')}
      <span class="card-plate">
        <strong>${esc(c.name)}</strong>
        <span>${esc(c.role)}</span>
        <span class="picky">Picky ${pickyDots(c.picky)}</span>
      </span>
    </button>`;
  }).join('');
  return `<div class="screen screen-light">
    <header class="topbar">
      ${logo()}
      ${progress('pick')}
      <div class="top-tools">
        <button type="button" class="btn" data-action="open-howto">How to play</button>
        ${muteButton(state.muted)}
      </div>
    </header>
    <div class="pick">
      <div class="pick-head">
        <div>
          <h1>Who needs a website today?</h1>
          <p>Five clients, five very different websites. Pick one and read the brief. Nobody says exactly what they want.</p>
        </div>
      </div>
      <div class="card-row" tabindex="0" aria-label="Clients">${cards}</div>
      <div class="pick-foot">
        <p class="bubble">${esc(punchyLine(selected.brief))}</p>
        <div class="row-actions">
          <button type="button" class="btn" data-action="surprise">Surprise me</button>
        </div>
      </div>
    </div>
  </div>`;
}
