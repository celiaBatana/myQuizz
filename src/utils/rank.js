// Rangs selon le niveau
export const RANKS = [
  { from: 1,  name: 'Recrue',      icon: '🪵', color: '#B9A58F' },
  { from: 3,  name: 'Apprenti',    icon: '🥉', color: '#D08A4E' },
  { from: 5,  name: 'Aventurier',  icon: '🥈', color: '#C9D2DA' },
  { from: 8,  name: 'Expert',      icon: '🥇', color: '#E6B35A' },
  { from: 12, name: 'Maître',      icon: '💎', color: '#7FD6E8' },
  { from: 18, name: 'Légende',     icon: '👑', color: '#E8844A' },
];
export function rankFor(level = 1) {
  let r = RANKS[0], i = 0;
  RANKS.forEach((x, k) => { if (level >= x.from) { r = x; i = k; } });
  return { ...r, next: RANKS[i + 1] || null };
}
