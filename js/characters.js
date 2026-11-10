/** Fallback portraits. The game shows assets/svg/characters when those files load. */

function eyes(mood, left, right, y) {
  if (mood === 'happy') {
    return `<path d="M${left - 9} ${y} Q${left} ${y + 8} ${left + 9} ${y}" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M${right - 9} ${y} Q${right} ${y + 8} ${right + 9} ${y}" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (mood === 'meltdown') {
    return `<circle cx="${left}" cy="${y}" r="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <circle cx="${right}" cy="${y}" r="8" fill="#fff" stroke="#1a1a1a" stroke-width="2"/>
      <circle cx="${left + 1}" cy="${y + 1}" r="3.2" fill="#1a1a1a"/>
      <circle cx="${right + 1}" cy="${y + 1}" r="3.2" fill="#1a1a1a"/>`;
  }
  const r = mood === 'meh' ? 2.4 : 3.4;
  return `<circle cx="${left}" cy="${y}" r="${r + 1.4}" fill="#1a1a1a"/>
    <circle cx="${right}" cy="${y}" r="${r + 1.4}" fill="#1a1a1a"/>
    <circle cx="${left - 1}" cy="${y - 1}" r="1.2" fill="#fff"/>
    <circle cx="${right - 1}" cy="${y - 1}" r="1.2" fill="#fff"/>`;
}

function brows(mood, left, right, y) {
  const lift = mood === 'meltdown' ? -2 : mood === 'meh' ? 2 : 0;
  const arch = mood === 'happy' ? 6 : mood === 'meh' ? 1 : 4;
  return `<path d="M${left - 10} ${y - 12 + lift} Q${left} ${y - 12 - arch} ${left + 10} ${y - 12 + lift}" fill="none" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M${right - 10} ${y - 12 + lift} Q${right} ${y - 12 - arch} ${right + 10} ${y - 12 + lift}" fill="none" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round"/>`;
}

function mouth(mood, y) {
  const my = y + 24;
  if (mood === 'happy') return `<path d="M78 ${my - 2} Q100 ${my + 18} 122 ${my - 2}" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
  if (mood === 'meh') return `<path d="M86 ${my + 2} H114" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
  if (mood === 'meltdown') return `<ellipse cx="100" cy="${my + 4}" rx="9" ry="12" fill="#1a1a1a"/>`;
  return `<path d="M86 ${my} Q100 ${my + 10} 114 ${my}" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>`;
}

function cheeks(color, y) {
  return `<ellipse cx="68" cy="${y + 14}" rx="8" ry="5" fill="${color}" opacity=".55"/>
    <ellipse cx="132" cy="${y + 14}" rx="8" ry="5" fill="${color}" opacity=".55"/>`;
}

function sweat(mood) {
  if (mood !== 'meltdown') return '';
  return `<path d="M150 78 q7 12 0 18 q-7 -6 0 -18" fill="#7EC8E3"/>`;
}

function frame(inner, label) {
  return `<svg viewBox="0 0 200 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}">${inner}</svg>`;
}

function bust(fill) {
  return `<path d="M16 196 C34 158 64 148 100 148 C136 148 166 158 184 196 L198 270 H2 Z" fill="${fill}"/>`;
}

function neck(skin) {
  return `<path d="M84 150 h32 v18 c0 10 -7 16 -16 16 s-16 -6 -16 -16 Z" fill="${skin}"/>`;
}

function ears(skin, y = 116) {
  return `<ellipse cx="50" cy="${y}" rx="9" ry="12" fill="${skin}"/>
    <ellipse cx="150" cy="${y}" rx="9" ry="12" fill="${skin}"/>`;
}

function head(skin) {
  return `<circle cx="100" cy="112" r="52" fill="${skin}"/>`;
}

function face(mood, y, blush) {
  return `${brows(mood, 80, 120, y)}
    ${eyes(mood, 80, 120, y)}
    ${cheeks(blush, y)}
    ${mouth(mood, y)}
    ${sweat(mood)}`;
}

function gerald(mood) {
  return frame(`
    ${bust('#243E73')}
    ${neck('#F3C6A8')}
    <path d="M78 168 l22 8 22 -8 v14 l-22 8 -22 -8 Z" fill="#F7F4EF"/>
    <path d="M96 176 h8 l-1 28 h-6 Z" fill="#C4364A"/>
    <rect x="84" y="206" width="32" height="36" rx="4" fill="#152848"/>
    <rect x="88" y="210" width="24" height="8" rx="1.5" fill="#B7E2D4"/>
    <g fill="#8FB8E8">
      <rect x="89" y="222" width="6" height="5" rx="1"/>
      <rect x="97" y="222" width="6" height="5" rx="1"/>
      <rect x="105" y="222" width="6" height="5" rx="1"/>
      <rect x="89" y="230" width="6" height="5" rx="1"/>
      <rect x="97" y="230" width="6" height="5" rx="1"/>
      <rect x="105" y="230" width="6" height="5" rx="1"/>
    </g>
    ${ears('#F3C6A8')}
    ${head('#F3C6A8')}
    <path d="M50 112 C50 58 70 40 100 40 C130 40 150 58 150 112 C142 86 126 76 100 76 C74 76 58 86 50 112" fill="#D5D8DE"/>
    <path d="M48 108 C42 96 46 78 58 74" fill="none" stroke="#D5D8DE" stroke-width="10" stroke-linecap="round"/>
    ${face(mood, 112, '#E7A48C')}
    <circle cx="80" cy="112" r="16" fill="none" stroke="#1a1a1a" stroke-width="4"/>
    <circle cx="120" cy="112" r="16" fill="none" stroke="#1a1a1a" stroke-width="4"/>
    <path d="M96 112 h8" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
    <path d="M64 110 h-8" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
    <path d="M136 110 h8" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
  `, 'Gerald');
}

function kaia(mood) {
  return frame(`
    <path d="M28 168 C18 120 36 86 64 78 C78 96 122 96 136 78 C164 86 182 120 172 168 L186 270 H14 Z" fill="#4A2278"/>
    ${bust('#5C2D91')}
    ${neck('#C47A3A')}
    <path d="M86 176 L100 154 L114 176 L104 176 L110 196 L96 176 Z" fill="#D6FF4A"/>
    ${ears('#C47A3A', 118)}
    ${head('#C47A3A')}
    <path d="M46 108 C46 52 68 36 100 36 C140 32 158 64 156 108 C148 78 128 68 100 70 C72 68 54 82 46 108" fill="#FF4FA3"/>
    <path d="M156 96 C172 88 176 112 160 118 C152 108 154 100 156 96" fill="#FF4FA3"/>
    <circle cx="46" cy="124" r="6" fill="none" stroke="#E2B43A" stroke-width="3"/>
    <circle cx="154" cy="124" r="6" fill="none" stroke="#E2B43A" stroke-width="3"/>
    ${face(mood, 114, '#E08A62')}
  `, 'Kaia');
}

function rosa(mood) {
  return frame(`
    ${bust('#F7F1E6')}
    <path d="M28 196 C48 176 152 176 172 196 L184 270 H16 Z" fill="#9C2F2F"/>
    <path d="M86 214 h28 v22 h-28 Z" fill="#F7F1E6"/>
    <path d="M92 214 h16 v8 h-16 Z" fill="#E7C27A"/>
    ${neck('#E0A97A')}
    ${ears('#E0A97A', 118)}
    <circle cx="100" cy="58" r="20" fill="#5C3317"/>
    <path d="M52 124 C46 70 68 40 100 38 C132 40 154 70 148 124 C140 150 128 132 120 118 C112 104 88 104 80 118 C72 132 60 150 52 124" fill="#5C3317"/>
    ${head('#E0A97A')}
    <path d="M54 96 C78 84 122 84 146 96" fill="none" stroke="#E23B4A" stroke-width="8" stroke-linecap="round"/>
    <circle cx="70" cy="90" r="3" fill="#fff"/>
    <circle cx="90" cy="86" r="3" fill="#fff"/>
    <circle cx="110" cy="86" r="3" fill="#fff"/>
    <circle cx="130" cy="90" r="3" fill="#fff"/>
    <circle cx="44" cy="126" r="7" fill="none" stroke="#E2B43A" stroke-width="3"/>
    <circle cx="156" cy="126" r="7" fill="none" stroke="#E2B43A" stroke-width="3"/>
    ${face(mood, 116, '#E08A62')}
  `, 'Rosa');
}

function damien(mood) {
  return frame(`
    ${bust('#1A1A1A')}
    <circle cx="132" cy="196" r="8" fill="#8E1B2B"/>
    <circle cx="132" cy="196" r="3" fill="#3E1218"/>
    ${neck('#F6E6DC')}
    <path d="M42 150 C36 70 62 28 100 28 C138 28 164 70 158 150 L148 230 H52 Z" fill="#161616"/>
    ${head('#F6E6DC')}
    <path d="M58 118 C62 62 84 46 100 46 C116 46 138 62 142 118 C128 88 112 80 100 80 C88 80 72 88 58 118" fill="#161616"/>
    <path d="M58 118 C64 104 76 112 78 126 C70 120 62 124 58 118" fill="#161616"/>
    <path d="M142 118 C136 104 124 112 122 126 C130 120 138 124 142 118" fill="#161616"/>
    ${face(mood, 118, '#E7B8B0')}
  `, 'Damien');
}

function brenda(mood) {
  return frame(`
    ${bust('#7E9A78')}
    ${neck('#C68642')}
    <path d="M36 150 C28 90 48 36 100 32 C152 36 172 90 164 150 C150 176 50 176 36 150" fill="#3E2A22"/>
    <circle cx="158" cy="64" r="10" fill="#F4B4C4"/>
    <circle cx="168" cy="74" r="6" fill="#F7E27A"/>
    ${ears('#C68642', 122)}
    ${head('#C68642')}
    <path d="M52 108 C78 92 124 92 150 112" fill="none" stroke="#B7D3A8" stroke-width="9" stroke-linecap="round"/>
    <circle cx="42" cy="128" r="6" fill="none" stroke="#E2B43A" stroke-width="3"/>
    <circle cx="158" cy="128" r="6" fill="none" stroke="#E2B43A" stroke-width="3"/>
    ${face(mood, 118, '#E08A62')}
  `, 'Brenda');
}

function deadline() {
  return frame(`
    <path d="M78 28 h44 l8 16 H70 Z" fill="#1a1a1a"/>
    <path d="M46 46 h108 v168 c0 18 -20 28 -54 28 s-54 -10 -54 -28 Z" fill="#1a1a1a"/>
    <circle cx="100" cy="96" r="30" fill="#F6E6DC"/>
    <circle cx="90" cy="92" r="4" fill="#1a1a1a"/>
    <circle cx="112" cy="92" r="4" fill="#1a1a1a"/>
    <path d="M90 108 Q100 116 110 108" fill="none" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="100" cy="178" r="36" fill="#fff" stroke="#1a1a1a" stroke-width="4"/>
    <path d="M100 156 v22" stroke="#E23B4A" stroke-width="3" stroke-linecap="round"/>
    <path d="M100 178 h16" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
    <path d="M154 36 q36 16 18 64" fill="none" stroke="#8D6E63" stroke-width="6" stroke-linecap="round"/>
    <path d="M168 30 q26 8 16 26 q-18 4 -16 -26" fill="#C5CED6"/>
  `, 'The Deadline');
}

const DRAW = { gerald, kaia, rosa, damien, brenda, deadline };

export function characterSVG(id, mood = 'neutral') {
  const draw = DRAW[id] || gerald;
  if (id === 'deadline') return deadline();
  return draw(mood);
}

export function characterHTML(id, mood = 'neutral', className = '') {
  const src = id === 'deadline'
    ? 'assets/svg/characters/deadline.svg'
    : `assets/svg/characters/${id}-${mood}.svg`;
  return `<span class="char ${className}">
    <img src="${src}" alt="" data-char="${id}" data-mood="${mood}">
    <span class="char-fallback">${characterSVG(id, mood)}</span>
  </span>`;
}
