// Boss : chaque boss a un thème (catégories de questions), des PV et une carte à gagner
export const BOSSES = [
  { id: 'gardien',  name: 'Le Gardien du Temps',    emoji: '🗿', color: '#C9A34F', cats: ['histoire'],                                     hp: 100, desc: 'Un colosse de pierre qui connaît chaque date. Histoire.' },
  { id: 'dragon',   name: 'Le Dragon Savant',       emoji: '🐉', color: '#5FA8A0', cats: ['sciences', 'astronomie', 'mathematiques'],       hp: 100, desc: 'Il crache du feu et des équations. Sciences, espace, maths.' },
  { id: 'spectre',  name: 'Le Spectre des Écrans',  emoji: '👻', color: '#C96A7E', cats: ['cinema', 'theatre_culture'],                     hp: 100, desc: 'Il hante les salles obscures. Cinéma et théâtre.' },
  { id: 'minotaure', name: 'Le Minotaure du Stade', emoji: '🐂', color: '#8BB36B', cats: ['sport'],                                         hp: 100, desc: 'Il ne recule devant aucun défi sportif. Sport.' },
  { id: 'oni',      name: "L'Oni des Mangas",       emoji: '👺', color: '#E0678F', cats: ['anime_manga'],                                   hp: 100, desc: 'Un démon fan d\'animes. Animes & mangas.' },
  { id: 'sphinx',   name: 'Le Sphinx Curieux',      emoji: '🦁', color: '#D9825B', cats: ['culture', 'langues', 'gastronomie', 'nature', 'politique', 'economie'], hp: 120, desc: 'Il pose des énigmes sur tout. Culture générale.' },
];
export const getBoss = id => BOSSES.find(b => b.id === id);
export const DAMAGE = { easy: 10, medium: 14, hard: 20 };
