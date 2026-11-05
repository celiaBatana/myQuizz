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
];

const ALL = [...AVATARS, ...TITLES];
export const findCosmetic = id => ALL.find(c => c.id === id);
export const isAvatar = id => AVATARS.some(a => a.id === id);

export const FREE_IDS = ALL.filter(c => c.free).map(c => c.id);
export const avatarIcon = id => AVATARS.find(a => a.id === id)?.icon || '🙂';
export const titleName  = id => TITLES.find(t => t.id === id)?.name || '';

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
