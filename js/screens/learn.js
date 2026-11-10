import { esc, infoUrl } from '../dom.js';
import { logo, muteButton } from '../chrome.js';
import { config } from '../../config.js';

const EXPLORE = { df: 'Design Formation', dgmd: 'DGMD', aiap: 'AIAP' };
const SKILLS = ['Typography', 'Colour theory', 'Composition', 'Visual hierarchy', 'Reading a client brief'];

export function render(state, game) {
  const cards = game.programs.map((program) => {
    const session = infoUrl(config, program);
    const learns = program.learn.map((item) => `<li>${esc(item)}</li>`).join('');
    return `<article class="program" data-program="${esc(program.id)}">
      <p class="program-tag">${esc(program.tagline)}</p>
      <img class="program-mark" src="assets/svg/logos/${esc(program.id)}-on-light.svg" alt="">
      <h2>${esc(program.name)}</h2>
      <p>${esc(program.description)}</p>
      <ul class="chips">${learns}</ul>
      <a class="btn btn-primary" data-program="${esc(program.id)}" data-action="explore" href="${esc(program.url)}" target="_blank" rel="noopener">Explore ${esc(EXPLORE[program.id] || program.name)}</a>
      ${session
        ? `<a class="text-btn" data-program="${esc(program.id)}" data-action="info-session" href="${esc(session)}" target="_blank" rel="noopener">Book an info session</a>`
        : '<button type="button" class="text-btn" disabled>Book an info session</button>'}
    </article>`;
  }).join('');
  return `<div class="screen screen-light">
    <header class="topbar">
      ${logo()}
      <div class="top-tools">
        <button type="button" class="btn" data-action="play-again">Play again</button>
        ${muteButton(state.muted)}
      </div>
    </header>
    <div class="learn">
      <h1>What kind of designer will you be?</h1>
      <p class="lede">You just did what designers do every day: read a client, chose type and colour on purpose, and built something that works. Here is where you can learn it properly.</p>
      <div class="program-row">${cards}</div>
      <div class="learn-foot">
        <div>
          <h2>Skills you just practised</h2>
          <ul class="chips">${SKILLS.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        </div>
        <a class="qr" href="https://www.designformation.ca/" target="_blank" rel="noopener">
          <img src="assets/svg/qr-designformation.svg" alt="QR code for designformation.ca" width="96" height="96">
          <span>Scan to explore on your phone<br>designformation.ca</span>
        </a>
      </div>
    </div>
  </div>`;
}
