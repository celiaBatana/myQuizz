import { seasonItems, themeOf } from '../data/seasonThemes';
export { themeOf };
// Saison : 4 semaines (28 jours) à partir du lundi 16 nov. 2026. Les points = XP gagnés depuis le début de la saison.
const START = new Date('2026-11-16T00:00:00');
export const SEASON_DAYS = 28;

export function seasonInfo(now = new Date()) {
  const n = Math.max(0, Math.floor((now - START) / 86400000 / SEASON_DAYS));
  const start = new Date(START); start.setDate(start.getDate() + n * SEASON_DAYS);
  const end = new Date(start); end.setDate(end.getDate() + SEASON_DAYS);
  return { id: n + 1, start, end, daysLeft: Math.max(1, Math.ceil((end - now) / 86400000)) };
}

// Paliers (points = XP). Saison 1 : récompenses faites main ; saisons suivantes : générées depuis le thème.
const BASE = [
  { pts: 100,  gems: 20 }, { pts: 250, frame: 'a' }, { pts: 450, gems: 30 }, { pts: 700, title: 'fan' }, { pts: 1000, gems: 50 },
  { pts: 1400, frame: 'b' }, { pts: 1800, gems: 80 }, { pts: 2300, frame: 'c' }, { pts: 2800, avatar: true }, { pts: 3500, title: 'top', gems: 150 },
];
export function tiersFor(id) {
  const n = Math.max(1, id);
  const k = 1 + 0.1 * (n - 1);                       // les éclats augmentent un peu à chaque saison
  const it = n >= 2 ? seasonItems(n) : null;
  return BASE.map(t => {
    const o = { pts: t.pts };
    if (t.gems) o.gems = Math.round(t.gems * k);
    if (n === 1) {
      if (t.frame) { o.frame = `f_s1_${t.frame}`; o.label = { a: 'Cadre Bronze', b: 'Cadre Émeraude', c: 'Cadre Aurore' }[t.frame]; }
      if (t.title) { o.title = `t_s1_${t.title}`; o.label = t.title === 'fan' ? 'Titre Pionnier' : `Titre Légende + ${o.gems} 💎`; }
      if (t.avatar) { o.avatar = 'a_phoenix'; o.label = 'Avatar Phénix'; }
    } else {
      if (t.frame) { const f = it.frames.find(x => x.id === `f_s${n}_${t.frame}`); o.frame = f.id; o.label = f.name; }
      if (t.title) { const x = it.titles.find(y => y.id === `t_s${n}_${t.title}`); o.title = x.id; o.label = t.title === 'top' ? `${x.name} + ${o.gems} 💎` : `Titre ${x.name}`; }
      if (t.avatar) { o.avatar = it.avatars[0].id; o.label = `Avatar ${it.avatars[0].name}`; }
    }
    return o;
  });
}
export const tierLabel = t => t.label || `${t.gems} 💎`;
export const tierIcon = t => t.frame ? '🖼️' : t.title ? '🏷️' : t.avatar ? '🦅' : '💎';

export const seasonPts = (profile, info = seasonInfo()) =>
  profile?.season?.id === info.id ? Math.max(0, (profile.totalXP || 0) - (profile.season.base || 0)) : 0;
export const claimedTiers = (profile, info = seasonInfo()) => (profile?.season?.id === info.id ? profile.season.claimed || [] : []);
