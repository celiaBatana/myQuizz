// Succès : calculés à partir du profil, puis mémorisés (profile.badges) pour rester acquis même si une série retombe.
const perfectCount = p => Math.max(p?.perfectQuizzes || 0, Object.values(p?.bestScores || {}).filter(v => v >= 100).length);
const bossCount = p => Object.values(p?.bossWins || {}).filter(v => v > 0).length;
const heroCount = p => Object.values(p?.heroWins || {}).filter(v => v > 0).length;
const n = (p, k) => p?.[k] || 0;

// [id, icône, nom, indice, valeur actuelle, objectif]
const DEF = [
  ['q1',   '🎯', 'Premier pas',        'Joue ton premier quiz',          p => n(p, 'quizzesPlayed'), 1],
  ['q10',  '🔟', 'Habitué',            'Joue 10 quiz',                   p => n(p, 'quizzesPlayed'), 10],
  ['q50',  '📚', 'Passionné',          'Joue 50 quiz',                   p => n(p, 'quizzesPlayed'), 50],
  ['q200', '🎓', 'Quizzeur confirmé',  'Joue 200 quiz',                  p => n(p, 'quizzesPlayed'), 200],
  ['a100', '✅', '100 bonnes réponses','Donne 100 bonnes réponses',      p => n(p, 'correctAnswers'), 100],
  ['a1000','🧠', 'Encyclopédie',       'Donne 1 000 bonnes réponses',    p => n(p, 'correctAnswers'), 1000],
  ['p1',   '💯', 'Sans faute',         'Fais un 100 % sur un quiz',      perfectCount, 1],
  ['p10',  '🏆', 'Perfectionniste',    'Fais 10 quiz à 100 %',           perfectCount, 10],
  ['s3',   '🔥', 'Série de 3',         '3 jours d\'affilée',             p => n(p, 'streak'), 3],
  ['s7',   '🌋', 'Une semaine',        '7 jours d\'affilée',             p => n(p, 'streak'), 7],
  ['s30',  '☄️', 'Un mois sans faillir','30 jours d\'affilée',           p => n(p, 'streak'), 30],
  ['x500', '⚡', '500 XP',             'Atteins 500 XP',                 p => n(p, 'totalXP'), 500],
  ['x5k',  '🌟', '5 000 XP',           'Atteins 5 000 XP',               p => n(p, 'totalXP'), 5000],
  ['x20k', '👑', '20 000 XP',          'Atteins 20 000 XP',              p => n(p, 'totalXP'), 20000],
  ['l5',   '🚀', 'Niveau 5',           'Atteins le niveau 5',            p => n(p, 'level') || 1, 5],
  ['l25',  '🛸', 'Niveau 25',          'Atteins le niveau 25',           p => n(p, 'level') || 1, 25],
  ['c5',   '🃏', 'Collectionneur',     'Obtiens 5 cartes',               p => (p?.cards || []).length, 5],
  ['c15',  '🗂️', 'Grand collectionneur','Obtiens 15 cartes',             p => (p?.cards || []).length, 15],
  ['c30',  '🏛️', 'Conservateur',       'Obtiens 30 cartes',              p => (p?.cards || []).length, 30],
  ['b1',   '🗡️', 'Chasseur de boss',   'Bats un boss',                   bossCount, 1],
  ['h1',   '🦸', 'Héros',              'Bats un boss en mode héroïque',  heroCount, 1],
  ['r10',  '⏱️', 'Rapide comme l\'éclair','10 bonnes réponses en Rush',  p => n(p, 'rushBest'), 10],
  ['raid', '🐉', 'Briseur de raid',    'Participe à la victoire d\'un raid', p => (p?.raidClaimed ? 1 : 0), 1],
  ['shop', '🛍️', 'Premier achat',      'Dépense des éclats en boutique', p => (n(p, 'gemsSpent') > 0 ? 1 : 0), 1],
];

export const BADGES = DEF.map(([id, icon, name, hint, get, goal]) => ({ id, icon, name, hint, get, goal }));
export const badgeById = id => BADGES.find(b => b.id === id);
export const earnedBadges = p => BADGES.filter(b => b.get(p) >= b.goal).map(b => b.id);
