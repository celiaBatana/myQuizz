import { CATEGORIES } from '../data/quizData';
import { cardKey, rarityOf } from '../data/cards';
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
  const out = { tier: t, gems, card: null, cosmetic: null, dupe: null };
  if (rnd() < t.rare) {
    // Toutes les cartes peuvent tomber, les plus rares moins souvent ; une carte déjà possédée = doublon (converti en éclats)
    const owned = new Set(profile?.cards || []);
    const pool = [];
    Object.values(CATEGORIES).forEach(c => Object.keys(c.themes || {}).forEach(th => pool.push(cardKey(c.id, th))));
    const weights = pool.map(k => rarityOf(k).w);
    let r = rnd() * weights.reduce((a, b) => a + b, 0), pick = pool[0];
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { pick = pool[i]; break; } }
    if (pick) {
      if (owned.has(pick)) out.dupe = { key: pick, gems: rarityOf(pick).gems }; else out.card = pick;
    }
  }
  if (!out.card && rnd() < t.rare / 2) {
    const have = ownedIds(profile);
    const pool = [...AVATARS, ...TITLES].filter(c => c.chest && !have.has(c.id));
    if (pool.length) out.cosmetic = pool[Math.floor(rnd() * pool.length)].id;
  }
  return out;
}
