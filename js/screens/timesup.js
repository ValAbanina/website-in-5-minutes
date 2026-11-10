import { esc, firstName } from '../dom.js';
import { logo, muteButton, progress } from '../chrome.js';
import { characterHTML } from '../characters.js';

export function render(state, game, client) {
  const who = firstName(client);
  return `<div class="screen screen-timesup">
    <header class="topbar topbar-dark">
      ${logo()}
      <p class="timer is-panic"><span class="timer-k">Time left</span><span class="timer-num">0:00</span></p>
      ${muteButton(state.muted)}
    </header>
    <div class="timesup">
      <div class="timesup-person moment-rise">
        <p class="bubble">${esc(game.deadline.lines[0])}</p>
        ${characterHTML('deadline', 'neutral', 'deadline-art')}
      </div>
      <div class="timesup-copy moment-slide">
        <h1>Time’s up!</h1>
        <p>The Deadline has sent your website to ${esc(who)}, exactly as it is. Let’s hope they like surprises. (They don’t.)</p>
        <button type="button" class="btn btn-primary" data-action="see-verdict">See what ${esc(who)} thinks</button>
        <p class="bubble bubble-sm">${esc(client.lines.timesUp)}</p>
      </div>
    </div>
  </div>`;
}
