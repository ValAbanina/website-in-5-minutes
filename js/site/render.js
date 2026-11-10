import { esc } from '../dom.js';

const SITE_KEY = { 'logo-strip': 'logoStrip' };

export function defaultSection(type, game) {
  const meta = game.kit.sections.find((s) => s.id === type) || { id: type };
  const layout = meta.layouts?.[0] || null;
  let columns = null;
  const options = columnOptions(meta, layout);
  if (options.length) columns = options[Math.ceil((options.length - 1) / 2)];
  return { type, layout, columns };
}

export function columnOptions(meta, layout) {
  if (!meta?.columns) return [];
  if (Array.isArray(meta.columns)) return meta.columns;
  if (layout && Array.isArray(meta.columns[layout])) return meta.columns[layout];
  const first = Object.values(meta.columns).find((v) => Array.isArray(v));
  return first || [];
}

function copyFor(client, type) {
  const key = SITE_KEY[type] || type;
  return client.site?.[key] || {};
}

function pictureFigure(game, pictureId) {
  if (!pictureId) {
    return `<figure class="pic pic-empty"><span class="pic-fallback"><span>Picture</span><strong>Choose one</strong></span></figure>`;
  }
  const pic = game.kit.pictures.find((p) => p.id === pictureId);
  const name = pic?.name || pictureId;
  const kind = pic?.kind === 'photo' ? 'Photo' : 'Picture';
  return `<figure class="pic">
    <img src="assets/svg/pictures/${esc(pictureId)}.svg" alt="${esc(name)}">
    <span class="pic-fallback"><span>${esc(kind)}</span><strong>${esc(name)}</strong></span>
  </figure>`;
}

function patternLayer(game, patternId) {
  if (!patternId || patternId === 'none') return '';
  const pat = game.kit.sectionPatterns.find((p) => p.id === patternId);
  if (!pat) return '';
  if (pat.asset) {
    return `<div class="kit-pattern" style="background-image:url('${esc(pat.asset)}')" aria-hidden="true"></div>`;
  }
  if (pat.css) return `<div class="kit-pattern" style="background:${esc(pat.css)}" aria-hidden="true"></div>`;
  return '';
}

const PATTERNED = new Set(['features', 'stats', 'testimonial', 'pricing', 'team', 'faq', 'about']);

function toolbar(section, index, total, game) {
  const meta = game.kit.sections.find((s) => s.id === section.type);
  const layouts = meta?.layouts || [];
  const columns = columnOptions(meta, section.layout);
  const layoutButtons = layouts.map((id) => {
    const label = id.replace(/-/g, ' ');
    const on = section.layout === id;
    return `<button type="button" data-action="set-layout" data-layout="${esc(id)}" aria-pressed="${on}">${esc(label)}</button>`;
  }).join('');
  const columnButtons = columns.map((n) => {
    const on = Number(section.columns) === Number(n);
    return `<button type="button" data-action="set-columns" data-columns="${n}" aria-pressed="${on}">${n}</button>`;
  }).join('');
  return `<div class="section-toolbar">
    <span class="section-toolbar-name">${esc(meta?.name || section.type)}</span>
    ${layouts.length ? `<span class="section-toolbar-label">Layout</span><span class="seg">${layoutButtons}</span>` : ''}
    ${columns.length ? `<span class="section-toolbar-label">Columns</span><span class="seg">${columnButtons}</span>` : ''}
    <button type="button" data-action="move-section" data-dir="-1" aria-label="Move up" ${index === 0 ? 'disabled' : ''}>↑</button>
    <button type="button" data-action="move-section" data-dir="1" aria-label="Move down" ${index === total - 1 ? 'disabled' : ''}>↓</button>
    <button type="button" data-action="remove-section" aria-label="Remove section">×</button>
  </div>`;
}

function block(section, index, total, state, inner, game) {
  const selected = state.selectedSection === index;
  const pattern = PATTERNED.has(section.type) ? patternLayer(game, state.pattern) : '';
  return `<section class="block block-${esc(section.type)}${selected ? ' is-selected' : ''}" data-index="${index}" data-action="select-section" data-layout="${esc(section.layout || '')}" data-type="${esc(section.type)}" draggable="true">
    ${selected ? toolbar(section, index, total, game) : ''}
    ${pattern}
    <div class="block-inner">${inner}</div>
  </section>`;
}

function renderNav(copy, section) {
  const links = (copy.links || []).map((l) => `<span class="nav-link">${esc(l)}</span>`).join('');
  return `<div class="nav nav-${esc(section.layout || 'simple')}">
    <strong class="wordmark">${esc(copy.logo || 'Logo')}</strong>
    <div class="nav-links">${links}</div>
    ${copy.button ? `<span class="kit-btn">${esc(copy.button)}</span>` : ''}
  </div>`;
}

function renderHero(copy, section, state, game) {
  const layout = section.layout || 'split';
  const decor = state.heroDecor && state.heroDecor !== 'none'
    ? `<div class="hero-decor" data-decor="${esc(state.heroDecor)}" aria-hidden="true"></div>`
    : '';
  const text = `<div class="hero-copy">
      ${copy.eyebrow ? `<p class="eyebrow">${esc(copy.eyebrow)}</p>` : ''}
      <h2 class="display">${esc(copy.title || 'Headline')}</h2>
      ${copy.body ? `<p class="lede">${esc(copy.body)}</p>` : ''}
      ${copy.button ? `<span class="kit-btn">${esc(copy.button)}</span>` : ''}
    </div>`;
  const pic = pictureFigure(game, state.picture);
  if (layout === 'centered') {
    return `${decor}<div class="hero hero-centered">${text}${pic}</div>`;
  }
  if (layout === 'image-background') {
    return `${decor}<div class="hero hero-bg">${pic}<div class="hero-bg-copy">${text}</div></div>`;
  }
  return `${decor}<div class="hero hero-split">${text}${pic}</div>`;
}

function renderAbout(copy, section, state, game) {
  const pic = pictureFigure(game, state.picture);
  const text = `<div>
    ${copy.eyebrow ? `<p class="eyebrow">${esc(copy.eyebrow)}</p>` : ''}
    <h2>${esc(copy.title || 'About')}</h2>
    ${copy.body ? `<p>${esc(copy.body)}</p>` : ''}
    ${copy.button ? `<span class="kit-btn kit-btn-ghost">${esc(copy.button)}</span>` : ''}
  </div>`;
  const flip = section.layout === 'image-right';
  return `<div class="split ${flip ? 'is-flip' : ''}">${pic}${text}</div>`;
}

function renderStats(copy, section) {
  const items = (copy.items || []).map(([n, label]) => `<div class="stat"><strong>${esc(n)}</strong><span>${esc(label)}</span></div>`).join('');
  return `<h2>${esc(copy.title || 'Stats')}</h2><div class="cols" data-columns="${esc(section.columns || '')}">${items}</div>`;
}

function renderFeatures(copy, section) {
  const layout = section.layout || 'cards';
  const items = (copy.items || []).map(([title, body], i) => `<article class="kit-card feature feature-${esc(layout)}">
      <span class="feature-icon" aria-hidden="true">${i + 1}</span>
      <h3>${esc(title)}</h3>
      <p>${esc(body)}</p>
    </article>`).join('');
  return `<h2>${esc(copy.title || 'Features')}</h2><div class="cols features features-${esc(layout)}" data-columns="${esc(section.columns || '')}">${items}</div>`;
}

function renderTestimonial(copy, section) {
  const quotes = copy.quotes || [];
  const shown = section.layout === 'trio' ? quotes : quotes.slice(0, 1);
  const cards = (shown.length ? shown : [['A kind word goes here.', 'A client']]).map(([quote, by]) => `<blockquote class="kit-card quote">
      <p>“${esc(quote)}”</p>
      <footer>${esc(by)}</footer>
    </blockquote>`).join('');
  return `<div class="quotes quotes-${esc(section.layout || 'single')}">${cards}</div>`;
}

function renderGallery(copy, section, state, game) {
  const count = Math.max(3, Number(section.columns) || 3);
  const cells = Array.from({ length: count }, () => `<div class="kit-card gal">${pictureFigure(game, state.picture)}</div>`).join('');
  return `<h2>${esc(copy.title || 'Gallery')}</h2><div class="cols gallery" data-columns="${esc(section.columns || '')}">${cells}</div>`;
}

function renderPricing(copy, section) {
  const plans = (copy.plans || []).map(([name, price, unit, features]) => `<article class="kit-card plan">
      <h3>${esc(name)}</h3>
      <p class="price">${esc(price)} <small>${esc(unit || '')}</small></p>
      <ul>${(features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
    </article>`).join('');
  return `<h2>${esc(copy.title || 'Pricing')}</h2><div class="cols" data-columns="${esc(section.columns || '')}">${plans}</div>`;
}

function renderTeam(copy, section) {
  const people = (copy.people || []).map(([name, role]) => `<article class="kit-card person">
      <span class="avatar" aria-hidden="true">${esc(String(name).slice(0, 1))}</span>
      <h3>${esc(name)}</h3>
      <p>${esc(role)}</p>
    </article>`).join('');
  return `<h2>${esc(copy.title || 'Team')}</h2><div class="cols" data-columns="${esc(section.columns || '')}">${people}</div>`;
}

function renderFaq(copy) {
  const items = (copy.items || []).map(([q, a], i) => `<div class="faq-item">
      <button type="button" class="faq-q" data-action="toggle-faq" aria-expanded="false" id="faq-${i}">${esc(q)}</button>
      <div class="faq-a" hidden>${esc(a)}</div>
    </div>`).join('');
  return `<h2>${esc(copy.title || 'FAQ')}</h2><div class="faq">${items}</div>`;
}

function renderContact(copy, section) {
  const hours = (copy.hours || []).map(([day, time]) => `<div class="hours-row"><span>${esc(day)}</span><span>${esc(time)}</span></div>`).join('');
  const form = `<form class="kit-card form" action="#" onsubmit="return false">
      <p class="eyebrow">Preview only</p>
      <label>Name <input disabled placeholder="Not collected"></label>
      <label>Email <input disabled placeholder="Not collected"></label>
      <label>Message <textarea disabled placeholder="Not collected"></textarea></label>
      <span class="kit-btn">Send</span>
    </form>`;
  const aside = `<div class="contact-aside">
      ${copy.body ? `<p>${esc(copy.body)}</p>` : ''}
      ${copy.email ? `<p><strong>${esc(copy.email)}</strong></p>` : ''}
      ${copy.address ? `<p>${esc(copy.address)}</p>` : ''}
      ${hours ? `<div class="hours">${hours}</div>` : ''}
    </div>`;
  if (section.layout === 'hours-and-map') {
    return `<h2>${esc(copy.title || 'Visit')}</h2><div class="split">${aside}<div class="kit-card map"><span>Map</span><strong>${esc(copy.address || 'Visit us')}</strong></div></div>`;
  }
  return `<h2>${esc(copy.title || 'Contact')}</h2><div class="split">${form}${aside}</div>`;
}

function renderBanner(copy, section, state, game) {
  const layout = section.layout || 'big-statement';
  if (layout === 'image') {
    return `<div class="banner banner-image">${pictureFigure(game, state.picture)}<h2>${esc(copy.statement || copy.title || '')}</h2></div>`;
  }
  if (layout === 'marquee') {
    const line = esc(copy.statement || copy.title || '');
    return `<div class="banner banner-marquee"><p>${line} <span aria-hidden="true">${line}</span></p></div>`;
  }
  return `<div class="banner banner-statement"><h2>${esc(copy.statement || copy.title || '')}</h2></div>`;
}

function renderLogos(copy) {
  const logos = (copy.logos || []).map((name) => `<span class="logo-pill">${esc(name)}</span>`).join('');
  return `<p class="eyebrow">${esc(copy.label || 'As seen in')}</p><div class="logo-row">${logos}</div>`;
}

function renderCta(copy, section) {
  return `<div class="cta cta-${esc(section.layout || 'band')}">
    <h2>${esc(copy.title || 'Say hello')}</h2>
    ${copy.body ? `<p>${esc(copy.body)}</p>` : ''}
    ${copy.button ? `<span class="kit-btn">${esc(copy.button)}</span>` : ''}
  </div>`;
}

function renderFooter(copy, section) {
  if (section.layout === 'columns') {
    return `<div class="foot foot-columns">
      <strong>${esc(copy.logo || '')}</strong>
      <p>${esc(copy.note || '')}</p>
    </div>`;
  }
  return `<div class="foot foot-simple"><strong>${esc(copy.logo || '')}</strong><p>${esc(copy.note || '')}</p></div>`;
}

function innerFor(section, state, client, game) {
  const copy = copyFor(client, section.type);
  switch (section.type) {
    case 'nav': return renderNav(copy, section);
    case 'hero': return renderHero(copy, section, state, game);
    case 'about': return renderAbout(copy, section, state, game);
    case 'stats': return renderStats(copy, section);
    case 'features': return renderFeatures(copy, section);
    case 'testimonial': return renderTestimonial(copy, section);
    case 'gallery': return renderGallery(copy, section, state, game);
    case 'pricing': return renderPricing(copy, section);
    case 'team': return renderTeam(copy, section);
    case 'faq': return renderFaq(copy);
    case 'contact': return renderContact(copy, section);
    case 'banner': return renderBanner(copy, section, state, game);
    case 'logo-strip': return renderLogos(copy);
    case 'cta': return renderCta(copy, section);
    case 'footer': return renderFooter(copy, section);
    default: return `<h2>${esc(section.type)}</h2>`;
  }
}

export function renderSite(state, client, game) {
  const narrow = state.previewMode === 'mobile';
  const attrs = [
    `data-palette="${esc(state.palette || '')}"`,
    `data-heading="${esc(state.heading || '')}"`,
    `data-body="${esc(state.body || '')}"`,
    `data-style="${esc(state.style || '')}"`,
  ].join(' ');
  if (!state.sections.length) {
    return `<div class="site ${narrow ? 'is-narrow' : ''}" ${attrs}><div class="site-empty"><p>Drag a section here, or press +.</p></div></div>`;
  }
  const total = state.sections.length;
  const html = state.sections.map((section, index) => block(
    section,
    index,
    total,
    state,
    innerFor(section, state, client, game),
    game,
  )).join('');
  return `<div class="site ${narrow ? 'is-narrow' : ''}" ${attrs}>${html}</div>`;
}

export function browserShell(state, client, siteHtml) {
  const host = (client?.site?.nav?.logo || client?.business || 'preview')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 3)
    .join('-');
  return `<div class="browser ${state.previewMode === 'mobile' ? 'is-phone' : ''}">
    <div class="browser-bar"><span>${esc(host || 'preview')}.ca</span></div>
    <div class="browser-page" data-dropzone>${siteHtml}</div>
  </div>`;
}
