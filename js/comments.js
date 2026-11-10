import { score } from './scoring.js';

function kebab(value) {
  return String(value).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function createComments({ store, game, audio }) {
  let queue = [];
  let timer = 0;
  let hideTimer = 0;
  let showing = false;
  let lastAt = 0;
  const saidRules = new Set();
  const gap = (game.meta.liveCommentMinGapSeconds || 4) * 1000;

  function pump() {
    if (showing || !queue.length) return;
    const wait = Math.max(0, lastAt + gap - Date.now());
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const item = queue.shift();
      if (!item) return;
      showing = true;
      lastAt = Date.now();
      store.set({ comment: item.text });
      if (item.voice) audio.say(item.voice);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        showing = false;
        if (store.get().comment === item.text) store.set({ comment: null });
        pump();
      }, 3000);
    }, wait);
  }

  function push(text, voice) {
    if (!text) return;
    queue.push({ text, voice });
    if (queue.length > 3) queue = queue.slice(-3);
    pump();
  }

  function onDesign(prev, next, client) {
    if (!client || !prev || !next) return;
    const triggers = client.lines.triggers || {};
    const voice = (key) => {
      if (!triggers[key]) return;
      push(triggers[key], `voice.${client.id}.${kebab(key)}`);
    };

    if (next.palette !== prev.palette) {
      if (next.palette === client.wishlist.palette.perfect) voice('perfectPalette');
      if ((client.dealBreakers.palettes || []).includes(next.palette)) voice('dealBreakerPalette');
    }
    if (next.heading !== prev.heading) {
      if (next.heading === client.wishlist.headingFont.perfect) voice('perfectHeading');
      if ((client.dealBreakers.headingFonts || []).includes(next.heading)) voice('dealBreakerHeading');
    }
    if (next.style !== prev.style && next.style === client.wishlist.style.perfect) voice('perfectStyle');
    if (next.picture !== prev.picture) {
      if (next.picture === client.wishlist.pictures.perfect) voice('perfectPictures');
      const pic = game.kit.pictures.find((p) => p.id === next.picture);
      if (pic?.decoy) voice('decoyPicture');
    }
    if (next.heroDecor !== prev.heroDecor) {
      if ((client.dealBreakers.heroDecor || []).includes(next.heroDecor)) voice('dealBreakerDecoration');
      if (next.heroDecor === 'none') voice('noDecoration');
    }
    if (next.pattern !== prev.pattern && next.pattern === 'checks') voice('nicePattern');

    const prevTypes = (prev.sections || []).map((s) => s.type);
    const nextTypes = (next.sections || []).map((s) => s.type);
    const must = client.wishlist.mustHave;
    const prevCount = prevTypes.filter((t) => t === must).length;
    const nextCount = nextTypes.filter((t) => t === must).length;
    if (nextCount > prevCount) voice('mustHaveAdded');

    const before = new Set(score(prev, client, game).rulesBroken);
    const after = score(next, client, game);
    for (const ruleId of after.rulesBroken) {
      if (before.has(ruleId) || saidRules.has(`${client.id}:${ruleId}`)) continue;
      saidRules.add(`${client.id}:${ruleId}`);
      const rule = game.scoring.everyonesRules.find((r) => r.id === ruleId);
      push(rule?.comment, `voice.${client.id}.rule-${ruleId}`);
    }

    const prevScore = score(prev, client, game);
    if (after.dealBreakers.length > prevScore.dealBreakers.length) audio.play('mood.dealbreaker');
    else if (after.meter > prevScore.meter) audio.play('mood.up');
    else if (after.meter < prevScore.meter) audio.play('mood.down');
  }

  return {
    push,
    onDesign,
    reset() {
      queue = [];
      showing = false;
      saidRules.clear();
      window.clearTimeout(timer);
      window.clearTimeout(hideTimer);
    },
  };
}
