import { esc, firstName } from '../dom.js';
import { logo, muteButton, progress } from '../chrome.js';
import { characterHTML } from '../characters.js';

export function render(state, game, client) {
  const who = firstName(client);
  return `<div class="screen screen-client">
    <header class="topbar topbar-clear">
      ${logo()}
      ${progress('brief')}
      ${muteButton(state.muted)}
    </header>
    <div class="brief">
      <div class="brief-person moment-rise">
        <p class="bubble bubble-lg">${esc(client.brief)}</p>
        ${characterHTML(client.id, 'neutral', 'brief-art')}
      </div>
      <article class="brief-card moment-slide">
        <div class="brief-who">
          <h1>${esc(client.name)}</h1>
          <p class="role">${esc(client.role)}, ${esc(client.business)}</p>
        </div>
        <div class="brief-howto">
          <h2>How it works</h2>
          <ol class="brief-steps">
            <li>Add sections, drag to reorder, pick columns.</li>
            <li>Choose colours, fonts, style, pictures, decor.</li>
            <li>Send it to ${esc(who)} before the clock runs out.</li>
          </ol>
        </div>
        <button type="button" class="btn needs-audio" data-action="play-brief">Play ${esc(who)}'s voice</button>
        <div class="brief-go">
          <button type="button" class="btn btn-primary" data-action="to-build">Start building</button>
          <p>The 5:00 clock starts when you tap.</p>
        </div>
      </article>
    </div>
  </div>`;
}

export function reread(client) {
  return `<div class="modal-back" data-action="close-brief">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="brief-title" tabindex="-1">
      <header class="modal-head">
        <h2 id="brief-title">${esc(client.name)}'s brief</h2>
        <button type="button" class="icon-btn" data-action="close-brief" aria-label="Close">×</button>
      </header>
      <p class="bubble bubble-lg">${esc(client.brief)}</p>
      <p>${esc(client.personality)}</p>
      <footer class="modal-foot">
        <button type="button" class="btn btn-primary" data-action="close-brief">Back to building</button>
      </footer>
    </div>
  </div>`;
}
