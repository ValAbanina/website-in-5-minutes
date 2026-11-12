/** Pure scoring. Reads rules from game-data.json; no DOM, no hard-coded clients. */

const PATTERN_SECTIONS = new Set(['features', 'stats', 'testimonial', 'pricing', 'team', 'faq', 'about']);

function find(list, id) {
  return (list || []).find((item) => item.id === id) || null;
}

function firstName(client) {
  return String(client?.name || '').split(' ')[0] || 'They';
}

function joinNames(names) {
  const clean = names.filter(Boolean);
  if (clean.length <= 1) return clean[0] || '';
  if (clean.length === 2) return `${clean[0]} or ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} or ${clean[clean.length - 1]}`;
}

function tierIcon(tier, deal) {
  if (deal) return 'deal';
  if (tier === 'perfect') return 'check';
  if (tier === 'also') return 'tilde';
  return 'miss';
}

/**
 * @param {object} state design fields: sections, palette, heading, body, style, picture, heroDecor, pattern
 * @param {object} client one entry from game.clients
 * @param {object} game the full game-data object (for kit names and rules)
 */
export function score(state, client, game) {
  const kit = game.kit;
  const wish = client.wishlist;
  const deals = client.dealBreakers || {};
  const who = firstName(client);
  const sections = Array.isArray(state.sections) ? state.sections : [];
  const types = sections.map((s) => s.type);

  const palette = find(kit.palettes, state.palette);
  const heading = find(kit.headingFonts, state.heading);
  const body = find(kit.bodyFonts, state.body);
  const style = find(kit.styles, state.style);
  const picture = find(kit.pictures, state.picture);
  const decor = find(kit.heroDecor, state.heroDecor || 'none');
  const pattern = find(kit.sectionPatterns, state.pattern || 'none');

  const perfectPalette = find(kit.palettes, wish.palette.perfect);
  const perfectHeading = find(kit.headingFonts, wish.headingFont.perfect);
  const perfectStyle = find(kit.styles, wish.style.perfect);
  const perfectPicture = find(kit.pictures, wish.pictures.perfect);

  const rows = [];

  const paletteDeal = (deals.palettes || []).includes(state.palette);
  let paletteTier = 'miss';
  let palettePts = 0;
  if (state.palette && state.palette === wish.palette.perfect) {
    paletteTier = 'perfect';
    palettePts = game.scoring.points.palette.perfect;
  } else if (state.palette && (wish.palette.alsoWorks || []).includes(state.palette)) {
    paletteTier = 'also';
    palettePts = game.scoring.points.palette.alsoWorks;
  }
  rows.push({
    id: 'palette',
    text: paletteTier === 'perfect'
      ? `Palette: ${palette.name}`
      : `Palette: ${palette?.name || 'not chosen'}. ${who} wanted ${perfectPalette?.name || 'another'}`,
    points: palettePts,
    icon: tierIcon(paletteTier, paletteDeal),
    dealBreaker: paletteDeal,
  });

  const headingDeal = (deals.headingFonts || []).includes(state.heading);
  let headingTier = 'miss';
  let headingPts = 0;
  if (state.heading && state.heading === wish.headingFont.perfect) {
    headingTier = 'perfect';
    headingPts = game.scoring.points.headingFont.perfect;
  } else if (state.heading && (wish.headingFont.alsoWorks || []).includes(state.heading)) {
    headingTier = 'also';
    headingPts = game.scoring.points.headingFont.alsoWorks;
  }
  const headingName = heading?.family || 'not chosen';
  rows.push({
    id: 'headingFont',
    text: headingTier === 'perfect'
      ? `Heading font: ${headingName}`
      : `Heading font: ${headingName}. ${who} wanted ${perfectHeading?.family || 'another'}`,
    points: headingPts,
    icon: tierIcon(headingTier, headingDeal),
    dealBreaker: headingDeal,
  });

  const bodyReadable = !!body?.readable;
  const bodyPts = bodyReadable ? game.scoring.points.bodyFont.readable : 0;
  rows.push({
    id: 'bodyFont',
    text: body ? `Body font: ${body.family}, ${bodyReadable ? 'easy to read' : 'hard to read'}` : 'Body font: not chosen',
    points: bodyPts,
    icon: bodyPts > 0 ? 'check' : 'miss',
    dealBreaker: false,
  });

  const styleDeal = (deals.styles || []).includes(state.style);
  let styleTier = 'miss';
  let stylePts = 0;
  if (state.style && state.style === wish.style.perfect) {
    styleTier = 'perfect';
    stylePts = game.scoring.points.style.perfect;
  } else if (state.style && (wish.style.alsoWorks || []).includes(state.style)) {
    styleTier = 'also';
    stylePts = game.scoring.points.style.alsoWorks;
  }
  const styleName = style?.name || 'not chosen';
  rows.push({
    id: 'style',
    text: styleTier === 'perfect'
      ? `Style: ${styleName}`
      : styleTier === 'also'
        ? `Style: ${styleName}. Close, ${who} wanted ${perfectStyle?.name || 'another'}`
        : `Style: ${styleName}. ${who} wanted ${perfectStyle?.name || 'another'}`,
    points: stylePts,
    icon: tierIcon(styleTier, styleDeal),
    dealBreaker: styleDeal,
  });

  const pictureDeal = (deals.pictures || []).includes(state.picture);
  const pictureDecoy = !!picture?.decoy;
  let pictureTier = 'miss';
  let picturePts = 0;
  if (state.picture && state.picture === wish.pictures.perfect) {
    pictureTier = 'perfect';
    picturePts = game.scoring.points.pictures.perfect;
  } else if (state.picture && (wish.pictures.alsoWorks || []).includes(state.picture)) {
    pictureTier = 'also';
    picturePts = game.scoring.points.pictures.alsoWorks;
  } else if (pictureDecoy) {
    picturePts = game.scoring.points.pictures.decoy;
  }
  const pictureName = picture?.name || 'not chosen';
  let pictureText = `Pictures: ${pictureName}`;
  if (pictureTier === 'also') pictureText = `Pictures: ${pictureName}. ${who} was hoping for ${perfectPicture?.name || 'another'}`;
  else if (pictureTier === 'miss') pictureText = `Pictures: ${pictureName}. ${who} wanted ${perfectPicture?.name || 'another'}`;
  rows.push({
    id: 'pictures',
    text: pictureText,
    points: picturePts,
    icon: tierIcon(pictureTier, pictureDeal),
    dealBreaker: pictureDeal,
  });

  const lovedDecor = wish.decoration?.heroDecor || [];
  const lovedPatterns = wish.decoration?.patterns || [];
  const decorId = state.heroDecor || 'none';
  const patternId = state.pattern || 'none';
  const decorOk = lovedDecor.includes(decorId);
  const patternOk = lovedPatterns.includes(patternId);
  const decorPts = decorOk && patternOk ? game.scoring.points.decoration.allFit : 0;
  const decorName = decor?.name || 'None';
  const patternName = pattern?.name || 'None';
  const wantedDecor = joinNames(lovedDecor.map((id) => find(kit.heroDecor, id)?.name || id));
  const wantedPatterns = joinNames(lovedPatterns.map((id) => find(kit.sectionPatterns, id)?.name || id));
  let decorText = `Decoration: ${decorName}, with ${patternName}`;
  if (!decorOk && patternOk) decorText = `Decoration: ${decorName}. ${who} wanted ${wantedDecor}`;
  else if (decorOk && !patternOk) decorText = `Decoration: ${patternName}. ${who} wanted ${wantedPatterns}`;
  else if (!decorOk && !patternOk) decorText = `Decoration: ${decorName}. ${who} wanted ${wantedDecor}`;
  const decorDeal = (deals.heroDecor || []).includes(decorId);
  rows.push({
    id: 'decoration',
    text: decorText,
    points: decorPts,
    icon: decorDeal ? 'deal' : (decorPts > 0 ? 'check' : 'miss'),
    dealBreaker: decorDeal,
  });

  const mustId = wish.mustHave;
  const must = find(kit.sections, mustId);
  const mustOn = types.includes(mustId);
  const mustPts = mustOn ? game.scoring.points.mustHave.onPage : 0;
  rows.push({
    id: 'mustHave',
    text: mustOn
      ? `Must-have section: ${must?.name || mustId}`
      : `Must-have section: ${must?.name || mustId} is missing`,
    points: mustPts,
    icon: mustPts > 0 ? 'check' : 'miss',
    dealBreaker: false,
  });

  const rules = game.scoring.everyonesRules || [];
  const ruleById = Object.fromEntries(rules.map((r) => [r.id, r]));
  const brokenIds = [];
  if (types[0] !== 'nav') brokenIds.push('nav-first');
  if (types[types.length - 1] !== 'footer') brokenIds.push('footer-last');
  if (!types.includes('hero')) brokenIds.push('needs-hero');
  if (types.length < 6) brokenIds.push('not-too-short');
  if (types.length > 13) brokenIds.push('not-too-long');
  if (state.body === 'caveat') brokenIds.push('readable-body');
  const loudDecor = decorId === 'confetti' || decorId === 'sparkles';
  const loudPattern = patternId === 'checks' || patternId === 'stripes';
  if (loudDecor && loudPattern) brokenIds.push('dont-overdecorate');
  let run = 1;
  for (let i = 1; i < types.length; i += 1) {
    run = types[i] === types[i - 1] ? run + 1 : 1;
    if (run >= 3) {
      brokenIds.push('dont-repeat');
      break;
    }
  }

  const penalties = brokenIds.map((id) => {
    const rule = ruleById[id];
    return {
      id,
      text: rule?.breaksWhen || id,
      points: rule?.penalty ?? -1,
      comment: rule?.comment || '',
      icon: 'miss',
      dealBreaker: false,
    };
  });

  const raw = rows.reduce((sum, row) => sum + row.points, 0)
    + penalties.reduce((sum, row) => sum + row.points, 0);
  const points = Math.max(0, Math.min(game.scoring.max, raw));

  const dealBreakers = rows.filter((row) => row.dealBreaker).map((row) => row.id);
  const outcomes = game.scoring.outcomes || [];
  const meltdownRule = outcomes.find((o) => o.rule);
  const byRange = outcomes.find((o) => !o.rule && points >= o.min && points <= o.max);
  const outcome = dealBreakers.length ? meltdownRule : byRange;

  let mood = outcome?.id || 'meltdown';
  if (dealBreakers.length) mood = 'dealbreaker';
  const meter = dealBreakers.length ? 0 : points;

  return {
    points,
    max: game.scoring.max,
    rows,
    penalties,
    outcome,
    dealBreakers,
    rulesBroken: brokenIds,
    meter,
    mood,
    patternSections: PATTERN_SECTIONS,
  };
}

export function outcomeHeadline(result, client) {
  const who = firstName(client);
  if (result.outcome?.id === 'happy') return `${who} is happy`;
  if (result.outcome?.id === 'meh') return `${who} is not impressed`;
  return `${who} is having a meltdown`;
}

export function outcomeWhy(result) {
  if (result.outcome?.id === 'happy') return 'Why it worked';
  if (result.outcome?.id === 'meh') return 'Why it fell flat';
  return 'What went wrong';
}
