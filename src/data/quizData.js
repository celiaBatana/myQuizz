// quizData.js — Structure de navigation uniquement
// Les questions sont toutes dans Firebase Firestore
// Importer via Admin → Ajouter → Import CSV

export const CATEGORIES = {
  culture: {
    id: 'culture', label: 'Culture générale', icon: '🧠',
    color: '#D9825B',
    gradient: 'linear-gradient(135deg, rgba(217,130,91,.26), rgba(217,130,91,.08))',
    themes: {
      classique:    { id: 'classique',    label: 'Culture classique',  icon: '📚' },
      geographie:   { id: 'geographie',   label: 'Géographie',          icon: '🌍' },
      histoire_gen: { id: 'histoire_gen', label: 'Histoire générale',   icon: '📜' },
      sciences_gen: { id: 'sciences_gen', label: 'Sciences générales',  icon: '🔭' },
    },
  },
  cinema: {
    id: 'cinema', label: 'Cinéma & Pop culture', icon: '🎬',
    color: '#C96A7E',
    gradient: 'linear-gradient(135deg, rgba(201,106,126,.26), rgba(201,106,126,.08))',
    themes: {
      classiques: { id: 'classiques', label: 'Films classiques',        icon: '🎞️' },
      animation:  { id: 'animation',  label: "Cinéma d'animation",      icon: '🎨' },
      musique:    { id: 'musique',    label: 'Musique & Pop culture',   icon: '🎵' },
      series:     { id: 'series',     label: 'Séries TV',               icon: '📺' },
    },
  },
  sciences: {
    id: 'sciences', label: 'Sciences & Tech', icon: '🔬',
    color: '#5FA8A0',
    gradient: 'linear-gradient(135deg, rgba(95,168,160,.26), rgba(95,168,160,.08))',
    themes: {
      physique:     { id: 'physique',     label: 'Physique',              icon: '⚛️' },
      informatique: { id: 'informatique', label: 'Informatique & Tech',   icon: '💻' },
      biologie:     { id: 'biologie',     label: 'Biologie',              icon: '🧬' },
    },
  },
  sport: {
    id: 'sport', label: 'Sport', icon: '⚽',
    color: '#8BB36B',
    gradient: 'linear-gradient(135deg, rgba(139,179,107,.26), rgba(139,179,107,.08))',
    themes: {
      football:   { id: 'football',   label: 'Football',   icon: '⚽' },
      athletisme: { id: 'athletisme', label: 'Athlétisme', icon: '🏃' },
      tennis:     { id: 'tennis',     label: 'Tennis',     icon: '🎾' },
    },
  },
  histoire: {
    id: 'histoire', label: 'Histoire & Géo', icon: '🗺️',
    color: '#C9A34F',
    gradient: 'linear-gradient(135deg, rgba(201,163,79,.26), rgba(201,163,79,.08))',
    themes: {
      antiquite: { id: 'antiquite', label: 'Antiquité',       icon: '🏛️' },
      modernite: { id: 'modernite', label: 'Époque moderne',  icon: '⚔️' },
      geo_monde: { id: 'geo_monde', label: 'Géopolitique',    icon: '🌐' },
    },
  },
  langues: {
    id: 'langues', label: 'Langues', icon: '🌍',
    color: '#7C8FD1',
    gradient: 'linear-gradient(135deg, rgba(124,143,209,.26), rgba(124,143,209,.08))',
    themes: {
      langues_monde: { id: 'langues_monde', label: 'Langues du monde',        icon: '💬' },
      vocabulaire:   { id: 'vocabulaire',   label: 'Vocabulaire & Traduction', icon: '📖' },
      etymologie:    { id: 'etymologie',    label: 'Étymologie',              icon: '🔤' },
    },
  },
  gastronomie: {
    id: 'gastronomie', label: 'Gastronomie & Cuisine', icon: '🍕',
    color: '#D96B4B',
    gradient: 'linear-gradient(135deg, rgba(217,107,75,.26), rgba(217,107,75,.08))',
    themes: {
      cuisine_monde:    { id: 'cuisine_monde',    label: 'Cuisines du monde',    icon: '🌍' },
      cuisine_francaise:{ id: 'cuisine_francaise',label: 'Cuisine française',    icon: '🥐' },
      gastronomie_pro:  { id: 'gastronomie_pro',  label: 'Gastronomie & Chefs',  icon: '👨‍🍳' },
    },
  },
  jeux_video: {
    id: 'jeux_video', label: 'Jeux vidéo', icon: '🎮',
    color: '#9A7BC9',
    gradient: 'linear-gradient(135deg, rgba(154,123,201,.26), rgba(154,123,201,.08))',
    themes: {
      classiques_jv: { id: 'classiques_jv', label: 'Classiques & Histoire', icon: '👾' },
      esport:        { id: 'esport',        label: 'Esport & Compétition',  icon: '🏆' },
      jv_culture:    { id: 'jv_culture',    label: 'Culture & Univers',     icon: '🌐' },
    },
  },
  nature: {
    id: 'nature', label: 'Nature & Animaux', icon: '🌿',
    color: '#6BAF7A',
    gradient: 'linear-gradient(135deg, rgba(107,175,122,.26), rgba(107,175,122,.08))',
    themes: {
      animaux:      { id: 'animaux',      label: 'Animaux',                icon: '🦁' },
      plantes:      { id: 'plantes',      label: 'Plantes & Écologie',     icon: '🌱' },
      environnement:{ id: 'environnement',label: 'Environnement & Climat', icon: '🌍' },
    },
  },
  politique: {
    id: 'politique', label: 'Politique & Institutions', icon: '🏛️',
    color: '#6F93B8',
    gradient: 'linear-gradient(135deg, rgba(111,147,184,.26), rgba(111,147,184,.08))',
    themes: {
      institutions:{ id: 'institutions', label: 'Institutions françaises', icon: '🇫🇷' },
      international:{ id: 'international',label: 'Politique internationale',icon: '🌐' },
      democratie:  { id: 'democratie',   label: 'Démocratie & Droits',    icon: '⚖️' },
    },
  },
  economie: {
    id: 'economie', label: 'Économie & Finance', icon: '💰',
    color: '#B5A25A',
    gradient: 'linear-gradient(135deg, rgba(181,162,90,.26), rgba(181,162,90,.08))',
    themes: {
      bases_eco:          { id: 'bases_eco',          label: "Bases de l'économie",  icon: '📊' },
      finance:            { id: 'finance',            label: 'Finance & Marchés',    icon: '📈' },
      grands_economistes: { id: 'grands_economistes', label: 'Grands économistes',   icon: '🎓' },
    },
  },
  astronomie: {
    id: 'astronomie', label: 'Astronomie & Espace', icon: '🔭',
    color: '#8A7FB8',
    gradient: 'linear-gradient(135deg, rgba(138,127,184,.26), rgba(138,127,184,.08))',
    themes: {
      systeme_solaire:  { id: 'systeme_solaire',  label: 'Système solaire',   icon: '☀️' },
      univers:          { id: 'univers',           label: 'Univers & Cosmologie',icon: '🌌' },
      conquete_spatiale:{ id: 'conquete_spatiale', label: 'Conquête spatiale', icon: '🚀' },
    },
  },
  theatre_culture: {
    id: 'theatre_culture', label: 'Théâtre & Culture française', icon: '🎭',
    color: '#B96FA0',
    gradient: 'linear-gradient(135deg, rgba(185,111,160,.26), rgba(185,111,160,.08))',
    themes: {
      theatre:          { id: 'theatre',          label: 'Théâtre & Dramaturgie',  icon: '🎭' },
      litterature_fr:   { id: 'litterature_fr',   label: 'Littérature française',  icon: '📚' },
      culture_generale_fr:{ id: 'culture_generale_fr', label: 'Culture française', icon: '🥖' },
    },
  },
  mathematiques: {
    id: 'mathematiques', label: 'Logique & Mathématiques', icon: '🧩',
    color: '#4FA6C2',
    gradient: 'linear-gradient(135deg, rgba(79,166,194,.26), rgba(79,166,194,.08))',
    themes: {
      logique:             { id: 'logique',             label: 'Logique & Raisonnement', icon: '🧠' },
      maths_fondamentaux:  { id: 'maths_fondamentaux',  label: 'Mathématiques',          icon: '📐' },
      enigmes:             { id: 'enigmes',             label: 'Énigmes & Puzzles',      icon: '🔮' },
    },
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCategoryList() {
  return Object.values(CATEGORIES);
}

export function getThemeList(catId) {
  return Object.values(CATEGORIES[catId]?.themes || {});
}

export const XP_MAP        = { easy: 5, medium: 10, hard: 20 };
export const XP_TIMER_BONUS= { easy: 10, medium: 20, hard: 30 };
export const DIFF_LABELS   = { easy: 'Facile', medium: 'Moyen', hard: 'Expert' };
export const DIFF_COLORS   = { easy: '#8FC39F', medium: '#E6B35A', hard: '#E58B73' };
export const XP_PER_LEVEL  = 200;
export const FREE_DAILY_LIMIT = 3;
