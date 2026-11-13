export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export function firstName(client) {
  return String(client?.name || '').split(' ')[0] || '';
}

export function clientById(game, id) {
  return game.clients.find((c) => c.id === id) || null;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function deviceKind() {
  const w = window.innerWidth;
  if (w < 768) return 'phone';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function sentences(text) {
  const parts = String(text || '').match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!parts || !parts.length) return [String(text || '')];
  return parts.map((s) => s.trim());
}

export function punchyLine(text) {
  const parts = sentences(text).filter((part) => part.length > 18);
  const pool = parts.length ? parts : sentences(text);
  return pool.slice().sort((a, b) => a.length - b.length)[0] || text;
}

export function onClientInk(hex) {
  const n = parseInt(String(hex || '#ffffff').replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return l > 0.62 ? 'dark' : 'light';
}

export function slugHost(label) {
  const slug = String(label || 'preview')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 3)
    .join('-');
  return `${slug || 'preview'}.ca`;
}

export function infoUrl(config, program) {
  const fromConfig = config?.INFO_SESSION?.[program.id];
  if (fromConfig && /^https?:\/\//.test(fromConfig)) return fromConfig;
  if (program.infoSessionUrl && /^https?:\/\//.test(program.infoSessionUrl)) return program.infoSessionUrl;
  return '';
}
