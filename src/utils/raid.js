import { weekKey } from './league';
import { BOSSES } from '../data/bosses';

// Raid collectif : un boss par semaine, tous les joueurs lui infligent des dégâts ensemble.
// PV = base + un supplément par joueur actif, pour que le boss reste battable même à quelques-uns.
export const RAID_BASE_HP = 800;
export const RAID_HP_PER_PLAYER = 500;
export const RAID_RUNS_PER_DAY = 3;
export const RAID_QUESTIONS = 10;
export const RAID_MIN_DMG = 50;      // dégâts minimum pour toucher la récompense
export const RAID_GEMS = 100;

function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
export const raidBoss = () => BOSSES[hash('raid-' + weekKey()) % BOSSES.length];
export const raidMaxHp = players => RAID_BASE_HP + RAID_HP_PER_PLAYER * Math.max(1, players);
export { weekKey as raidWeek };
