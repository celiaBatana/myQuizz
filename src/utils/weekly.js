import { weekKey } from './league';
import { BOSSES } from '../data/bosses';
import { CATEGORIES } from '../data/quizData';

// Choix déterministe par semaine : même boss / même catégorie pour tout le monde
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
export const WEEKLY_MULT = 1.5;
export const WEEKLY_BOSS_GEMS = 50;
export const weeklyBoss = () => BOSSES[hash('boss-' + weekKey()) % BOSSES.length];
export function weeklyCat() {
  const ids = Object.keys(CATEGORIES).sort();
  return CATEGORIES[ids[hash('cat-' + weekKey()) % ids.length]];
}
export const weeklyEnds = () => { const d = new Date(weekKey() + 'T00:00:00'); d.setDate(d.getDate() + 7); return Math.max(1, Math.ceil((d - new Date()) / 86400000)); };
export { weekKey as weekKeyNow };
