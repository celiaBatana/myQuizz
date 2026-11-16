// Saison : 4 semaines (28 jours) à partir du lundi 16 nov. 2026. Les points = XP gagnés depuis le début de la saison.
const START = new Date('2026-11-16T00:00:00');
export const SEASON_DAYS = 28;

export function seasonInfo(now = new Date()) {
  const n = Math.max(0, Math.floor((now - START) / 86400000 / SEASON_DAYS));
  const start = new Date(START); start.setDate(start.getDate() + n * SEASON_DAYS);
  const end = new Date(start); end.setDate(end.getDate() + SEASON_DAYS);
  return { id: n + 1, start, end, daysLeft: Math.max(1, Math.ceil((end - now) / 86400000)) };
}

// Paliers (points = XP) et récompenses
export const TIERS = [
  { pts: 100,  gems: 20 },
  { pts: 250,  frame: 'f_s1_a', label: 'Cadre Bronze' },
  { pts: 450,  gems: 30 },
  { pts: 700,  title: 't_s1_fan', label: 'Titre Pionnier' },
  { pts: 1000, gems: 50 },
  { pts: 1400, frame: 'f_s1_b', label: 'Cadre Émeraude' },
  { pts: 1800, gems: 80 },
  { pts: 2300, frame: 'f_s1_c', label: 'Cadre Aurore' },
  { pts: 2800, avatar: 'a_phoenix', label: 'Avatar Phénix' },
  { pts: 3500, title: 't_s1_top', gems: 150, label: 'Titre Légende + 150 💎' },
];
export const tierLabel = t => t.label || `${t.gems} 💎`;
export const tierIcon = t => t.frame ? '🖼️' : t.title ? '🏷️' : t.avatar ? '🦅' : '💎';

export const seasonPts = (profile, info = seasonInfo()) =>
  profile?.season?.id === info.id ? Math.max(0, (profile.totalXP || 0) - (profile.season.base || 0)) : 0;
export const claimedTiers = (profile, info = seasonInfo()) => (profile?.season?.id === info.id ? profile.season.claimed || [] : []);
