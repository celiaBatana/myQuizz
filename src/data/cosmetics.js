import { dynCosmetic, seasonItems } from './seasonThemes';
// Avatars et titres à débloquer.
// "when" = débloqué automatiquement quand la condition est remplie ; "chest" = peut tomber d'un coffre quotidien ; "free" = dès le départ.
export const AVATARS = [
  { id: 'a_smile',  icon: '🙂', name: 'Classique',     free: true },
  { id: 'a_fox',    icon: '🦊', name: 'Renard',        free: true },
  { id: 'a_panda',  icon: '🐼', name: 'Panda',         free: true },
  { id: 'a_frog',   icon: '🐸', name: 'Grenouille',    free: true },
  { id: 'a_lion',   icon: '🦁', name: 'Lion',          hint: 'Niveau 3',            when: s => s.level >= 3 },
  { id: 'a_dragon', icon: '🐉', name: 'Dragon',        hint: 'Niveau 5',            when: s => s.level >= 5 },
  { id: 'a_fire',   icon: '🔥', name: 'Flamme',        hint: 'Série de 7 jours',    when: s => s.streak >= 7 },
  { id: 'a_trophy', icon: '🏆', name: 'Champion',      hint: 'Un quiz sans faute',  when: s => s.perfectQuizzes >= 1 },
  { id: 'a_unicorn',icon: '🦄', name: 'Licorne',       chest: true },
  { id: 'a_alien',  icon: '👽', name: 'Alien',         chest: true },
  { id: 'a_robot',  icon: '🤖', name: 'Robot',         chest: true },
  { id: 'a_wizard', icon: '🧙', name: 'Magicien',      chest: true },
  { id: 'a_ninja',  icon: '🥷', name: 'Ninja',         chest: true },
  { id: 'a_owl',    icon: '🦉', name: 'Hibou',         chest: true },
  { id: 'a_octo',   icon: '🐙', name: 'Pieuvre',       chest: true },
  { id: 'a_rocket', icon: '🚀', name: 'Fusée',         chest: true },
  { id: 'a_crown',  icon: '👑', name: 'Couronne',      chest: true },
  { id: 'a_phoenix', icon: '🦅', name: 'Phénix',        hint: 'Saison 1 · palier 9' },
];

export const TITLES = [
  { id: 't_rookie',  name: 'Débutant',            free: true },
  { id: 't_curious', name: 'Curieux',             hint: '5 quiz joués',        when: s => s.quizzesPlayed >= 5 },
  { id: 't_regular', name: 'Habitué',             hint: '25 quiz joués',       when: s => s.quizzesPlayed >= 25 },
  { id: 't_scholar', name: 'Érudit',              hint: 'Niveau 5',            when: s => s.level >= 5 },
  { id: 't_perfect', name: 'Sans faute',          hint: 'Un quiz parfait',     when: s => s.perfectQuizzes >= 1 },
  { id: 't_flame',   name: 'Increvable',          hint: 'Série de 7 jours',    when: s => s.streak >= 7 },
  { id: 't_legend',  name: 'Légende',             hint: 'Niveau 10',           when: s => s.level >= 10 },
  { id: 't_lucky',   name: 'Chanceux',            chest: true },
  { id: 't_hunter',  name: 'Chasseur de trésors', chest: true },
  { id: 't_night',   name: 'Noctambule',          chest: true },
  { id: 't_master',  name: 'Maître du savoir',    chest: true },
  { id: 't_h_gardien',   name: 'Briseur de statues',     hint: 'Gardien en héroïque' },
  { id: 't_h_dragon',    name: 'Tueur de dragon',        hint: 'Dragon en héroïque' },
  { id: 't_h_spectre',   name: 'Chasseur de spectres',   hint: 'Spectre en héroïque' },
  { id: 't_h_minotaure', name: 'Dompteur de minotaure',  hint: 'Minotaure en héroïque' },
  { id: 't_h_oni',       name: "Exorciste d'oni",        hint: 'Oni en héroïque' },
  { id: 't_h_sphinx',    name: "Briseur d'énigmes",      hint: 'Sphinx en héroïque' },
  { id: 't_raid',      name: 'Fléau des boss',          hint: 'Raid hebdo vaincu en équipe' },
  { id: 't_h_all',       name: 'Héros des boss',         hint: 'Les 6 boss en héroïque' },
  { id: 't_s1_fan',  name: 'Pionnier',            hint: 'Saison 1 · palier 4' },
  { id: 't_s1_top',  name: 'Légende de saison 1', hint: 'Saison 1 · palier 10' },
];

// Cadres d'avatar (récompenses de saison)
export const FRAMES = [
  { id: 'f_none',   name: 'Aucun',    free: true, style: null },
  { id: 'f_s1_a',   name: 'Bronze',   hint: 'Saison 1 · palier 2', style: { border: '3px solid #CD7F32', boxShadow: '0 0 18px #CD7F3288' } },
  { id: 'f_s1_b',   name: 'Émeraude', hint: 'Saison 1 · palier 6', style: { border: '3px solid #8FC39F', boxShadow: '0 0 22px #8FC39FAA' } },
  { id: 'f_s1_c',   name: 'Aurore',   hint: 'Saison 1 · palier 8', style: { border: '3px solid #FFD166', boxShadow: '0 0 12px #FFD166, 0 0 30px #E8844A99' } },
];
FRAMES.push(
  { id: 'f_dragon', name: 'Écailles de dragon', hint: 'Dragon en héroïque', style: { border: '3px solid #E5604D', boxShadow: '0 0 14px #E5604D, 0 0 32px #5FA8A0AA' } },
  { id: 'f_hero',   name: 'Héros',              hint: 'Les 6 boss en héroïque', style: { border: '3px solid #FFD166', boxShadow: '0 0 14px #FFD166, 0 0 34px #E5604DAA' } },
);
export const frameStyle = id => FRAMES.find(f => f.id === id)?.style || dynCosmetic(id)?.style || null;

// Objets des saisons ≥ 2 : ceux déjà gagnés + ceux de la saison en cours (verrouillés)
export function seasonCosmetics(profile, currentSeason) {
  const owned = new Set(profile?.unlocked || []);
  const out = { frames: [], titles: [], avatars: [] };
  for (let n = 2; n <= currentSeason; n++) {
    const it = seasonItems(n);
    ['frames', 'titles', 'avatars'].forEach(k => it[k].forEach(c => { if (owned.has(c.id) || n === currentSeason) out[k].push(c); }));
  }
  return out;
}

const ALL = [...AVATARS, ...TITLES, ...FRAMES];
export const findCosmetic = id => ALL.find(c => c.id === id) || dynCosmetic(id);
export const isAvatar = id => AVATARS.some(a => a.id === id) || /^a_s\d+$/.test(String(id));

export const FREE_IDS = ALL.filter(c => c.free).map(c => c.id);
export const avatarIcon = id => AVATARS.find(a => a.id === id)?.icon || dynCosmetic(id)?.icon || '🙂';
export const titleName  = id => TITLES.find(t => t.id === id)?.name || dynCosmetic(id)?.name || '';

export function ownedIds(profile) {
  return new Set([...FREE_IDS, ...(profile?.unlocked || [])]);
}

// Nouveaux déblocages après une partie : réussites + éventuel drop du coffre
export function computeUnlocks(profile, stats, chestOpened) {
  const owned = ownedIds(profile);
  const gained = [];
  ALL.forEach(c => { if (c.when && !owned.has(c.id) && c.when(stats)) { gained.push(c.id); owned.add(c.id); } });
  if (chestOpened && Math.random() < 0.4) {
    const pool = ALL.filter(c => c.chest && !owned.has(c.id));
    if (pool.length) gained.push(pool[Math.floor(Math.random() * pool.length)].id);
  }
  return gained;
}
