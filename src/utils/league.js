// Ligues hebdomadaires : la semaine commence le lundi
export const LEAGUES = [
  { name: 'Bronze',  icon: '🥉' },
  { name: 'Argent',  icon: '🥈' },
  { name: 'Or',      icon: '🥇' },
  { name: 'Diamant', icon: '💎' },
];
export const PROMOTE_XP = 150; // XP sur la semaine pour monter
export const DEMOTE_XP  = 40;  // en dessous, on descend

const p2 = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

export function weekKey(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7);
  return fmt(d);
}

// Calcule la ligue et les XP de la semaine après une partie
export function nextLeagueState(profile, xpToAdd) {
  const wk = weekKey();
  const prevWk = profile?.weekKey;
  let league = profile?.league || 0;
  let moved = null;
  let weekXP = xpToAdd;
  if (prevWk === wk) {
    weekXP = (profile?.weekXP || 0) + xpToAdd;
  } else if (prevWk) {
    if (prevWk === weekKey(-1)) {
      const prev = profile?.weekXP || 0;
      if (prev >= PROMOTE_XP && league < LEAGUES.length - 1) { league += 1; moved = 'up'; }
      else if (prev < DEMOTE_XP && league > 0) { league -= 1; moved = 'down'; }
    } else if (league > 0) { league -= 1; moved = 'down'; } // semaine(s) entière(s) sans jouer
  }
  return { weekKey: wk, weekXP, league, moved };
}

// Révision espacée (Leitner) : intervalles en jours entre deux révisions
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const REVIEW_MAX = 200;

export function updateReview(review, results, dayKeyFn) {
  const r = { ...(review || {}) };
  const today = dayKeyFn(0);
  results.forEach(({ id, ok }) => {
    if (!id) return;
    if (!ok) r[id] = { b: 0, d: dayKeyFn(1) };
    else if (r[id] && r[id].d <= today) {
      const b = r[id].b + 1;
      if (b >= REVIEW_INTERVALS.length) delete r[id];
      else r[id] = { b, d: dayKeyFn(REVIEW_INTERVALS[b]) };
    }
  });
  const keys = Object.keys(r);
  if (keys.length > REVIEW_MAX) {
    keys.sort((a, b) => r[a].d.localeCompare(r[b].d));
    keys.slice(REVIEW_MAX).forEach(k => delete r[k]);
  }
  return r;
}

export function dueReviewIds(review, todayKey) {
  return Object.entries(review || {}).filter(([, v]) => v.d <= todayKey)
    .sort((a, b) => a[1].d.localeCompare(b[1].d)).map(([id]) => id);
}
