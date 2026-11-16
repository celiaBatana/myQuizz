import { CATEGORIES } from '../data/quizData';
import { cardKey } from '../data/cards';
import { AVATARS, TITLES, ownedIds } from '../data/cosmetics';

// Le coffre grossit avec la série : x1 (normal), x2 (7 jours), x4 (30 jours)
export function chestTier(streak) {
  if (streak >= 30) return { id: 'legend', mult: 4, label: 'Coffre légendaire', icon: '👑', color: '#FFD166', rare: 0.4 };
  if (streak >= 7)  return { id: 'gold',   mult: 2, label: 'Coffre en or',      icon: '🎁', color: '#E6B35A', rare: 0.2 };
  return               { id: 'wood',   mult: 1, label: 'Coffre du jour',    icon: '📦', color: '#E8844A', rare: 0.08 };
}

// Tirage : éclats + (parfois) une carte rare ou un cosmétique de coffre
export function rollChest(profile, streak, rnd = Math.random) {
  const t = chestTier(streak);
  const gems = (8 + Math.floor(rnd() * 13)) * t.mult;
  const out = { tier: t, gems, card: null, cosmetic: null };
  if (rnd() < t.rare) {
    const owned = new Set(profile?.cards || []);
    const pool = [];
    Object.values(CATEGORIES).forEach(c => Object.keys(c.themes || {}).forEach(th => { const k = cardKey(c.id, th); if (!owned.has(k)) pool.push(k); }));
    if (pool.length) out.card = pool[Math.floor(rnd() * pool.length)];
  }
  if (!out.card && rnd() < t.rare / 2) {
    const have = ownedIds(profile);
    const pool = [...AVATARS, ...TITLES].filter(c => c.chest && !have.has(c.id));
    if (pool.length) out.cosmetic = pool[Math.floor(rnd() * pool.length)].id;
  }
  return out;
}
