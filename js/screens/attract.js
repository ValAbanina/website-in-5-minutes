import { punchyLine } from '../dom.js';
import { logo, muteButton, cast } from '../chrome.js';

export function render(state, game) {
  const active = game.clients[0];
  const line = punchyLine(active.brief);
  return `<div class="stage stage-dark" data-action="to-start">
    <header class="topbar topbar-dark">
      ${logo()}
      ${muteButton(state.muted)}
    </header>
    <div class="stage-copy moment-rise">
      <h1>Can you build a website in 5 minutes?</h1>
      <p>Five picky clients. One drag-and-drop builder. Make them happy before the clock runs out.</p>
      <button type="button" class="pill" data-action="to-start"><span aria-hidden="true">◎</span> Tap anywhere to play</button>
      <p class="fine">Sound starts when you tap. Takes 5 minutes, promise.</p>
    </div>
    ${cast(game, active.id, line)}
  </div>`;
}

export function lineFor(game, index) {
  const client = game.clients[index % game.clients.length];
  return { client, line: punchyLine(client.brief) };
}
