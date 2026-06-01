// quizData.js — Structure de navigation uniquement
// Les questions sont toutes dans Firebase Firestore
// Importer via Admin → Ajouter → Import CSV

export const CATEGORIES = {
  culture: {
    id: 'culture', label: 'Culture générale', icon: '🧠',
    color: '#9B6DFF',
    gradient: 'linear-gradient(135deg, #2a1f4e, #3d2a6e)',
    themes: {
      classique:    { id: 'classique',    label: 'Culture classique',  icon: '📚' },
      geographie:   { id: 'geographie',   label: 'Géographie',          icon: '🌍' },
      histoire_gen: { id: 'histoire_gen', label: 'Histoire générale',   icon: '📜' },
      sciences_gen: { id: 'sciences_gen', label: 'Sciences générales',  icon: '🔭' },
    },
  },
  cinema: {
    id: 'cinema', label: 'Cinéma & Pop culture', icon: '🎬',
    color: '#FF5FA0',
    gradient: 'linear-gradient(135deg, #3a1f2a, #5a1f35)',
    themes: {
      classiques: { id: 'classiques', label: 'Films classiques',        icon: '🎞️' },
      animation:  { id: 'animation',  label: "Cinéma d'animation",      icon: '🎨' },
      musique:    { id: 'musique',    label: 'Musique & Pop culture',   icon: '🎵' },
      series:     { id: 'series',     label: 'Séries TV',               icon: '📺' },
    },
  },
  sciences: {
    id: 'sciences', label: 'Sciences & Tech', icon: '🔬',
    color: '#3DFFD0',
    gradient: 'linear-gradient(135deg, #1f3a2e, #1a4d3a)',
    themes: {
      physique:     { id: 'physique',     label: 'Physique',              icon: '⚛️' },
      informatique: { id: 'informatique', label: 'Informatique & Tech',   icon: '💻' },
      biologie:     { id: 'biologie',     label: 'Biologie',              icon: '🧬' },
    },
  },
  sport: {
    id: 'sport', label: 'Sport', icon: '⚽',
    color: '#FFE14D',
    gradient: 'linear-gradient(135deg, #2a2a1f, #3d3a18)',
    themes: {
      football:   { id: 'football',   label: 'Football',   icon: '⚽' },
      athletisme: { id: 'athletisme', label: 'Athlétisme', icon: '🏃' },
      tennis:     { id: 'tennis',     label: 'Tennis',     icon: '🎾' },
    },
  },
  histoire: {
    id: 'histoire', label: 'Histoire & Géo', icon: '🗺️',
    color: '#378ADD',
    gradient: 'linear-gradient(135deg, #1f2a3a, #1a3050)',
    themes: {
      antiquite: { id: 'antiquite', label: 'Antiquité',       icon: '🏛️' },
      modernite: { id: 'modernite', label: 'Époque moderne',  icon: '⚔️' },
      geo_monde: { id: 'geo_monde', label: 'Géopolitique',    icon: '🌐' },
    },
  },
  langues: {
    id: 'langues', label: 'Langues', icon: '🌍',
    color: '#FF7A3D',
    gradient: 'linear-gradient(135deg, #2a1f1f, #4a2a1a)',
    themes: {
      langues_monde: { id: 'langues_monde', label: 'Langues du monde',        icon: '💬' },
      vocabulaire:   { id: 'vocabulaire',   label: 'Vocabulaire & Traduction', icon: '📖' },
      etymologie:    { id: 'etymologie',    label: 'Étymologie',              icon: '🔤' },
    },
  },
  gastronomie: {
    id: 'gastronomie', label: 'Gastronomie & Cuisine', icon: '🍕',
    color: '#FF7A3D',
    gradient: 'linear-gradient(135deg, #3a2010, #5a3015)',
    themes: {
      cuisine_monde:    { id: 'cuisine_monde',    label: 'Cuisines du monde',    icon: '🌍' },
      cuisine_francaise:{ id: 'cuisine_francaise',label: 'Cuisine française',    icon: '🥐' },
      gastronomie_pro:  { id: 'gastronomie_pro',  label: 'Gastronomie & Chefs',  icon: '👨‍🍳' },
    },
  },
  jeux_video: {
    id: 'jeux_video', label: 'Jeux vidéo', icon: '🎮',
    color: '#9B6DFF',
    gradient: 'linear-gradient(135deg, #1a0f3a, #2d1a5e)',
    themes: {
      classiques_jv: { id: 'classiques_jv', label: 'Classiques & Histoire', icon: '👾' },
      esport:        { id: 'esport',        label: 'Esport & Compétition',  icon: '🏆' },
      jv_culture:    { id: 'jv_culture',    label: 'Culture & Univers',     icon: '🌐' },
    },
  },
  nature: {
    id: 'nature', label: 'Nature & Animaux', icon: '🌿',
    color: '#3DFFD0',
    gradient: 'linear-gradient(135deg, #0f2d1f, #1a4a2e)',
    themes: {
      animaux:      { id: 'animaux',      label: 'Animaux',                icon: '🦁' },
      plantes:      { id: 'plantes',      label: 'Plantes & Écologie',     icon: '🌱' },
      environnement:{ id: 'environnement',label: 'Environnement & Climat', icon: '🌍' },
    },
  },
  politique: {
    id: 'politique', label: 'Politique & Institutions', icon: '🏛️',
    color: '#378ADD',
    gradient: 'linear-gradient(135deg, #0f1f3a, #1a2d5e)',
    themes: {
      institutions:{ id: 'institutions', label: 'Institutions françaises', icon: '🇫🇷' },
      international:{ id: 'international',label: 'Politique internationale',icon: '🌐' },
      democratie:  { id: 'democratie',   label: 'Démocratie & Droits',    icon: '⚖️' },
    },
  },
  economie: {
    id: 'economie', label: 'Économie & Finance', icon: '💰',
    color: '#FFE14D',
    gradient: 'linear-gradient(135deg, #2a2500, #3d3800)',
    themes: {
      bases_eco:          { id: 'bases_eco',          label: "Bases de l'économie",  icon: '📊' },
      finance:            { id: 'finance',            label: 'Finance & Marchés',    icon: '📈' },
      grands_economistes: { id: 'grands_economistes', label: 'Grands économistes',   icon: '🎓' },
    },
  },
  astronomie: {
    id: 'astronomie', label: 'Astronomie & Espace', icon: '🔭',
    color: '#9B6DFF',
    gradient: 'linear-gradient(135deg, #0a0520, #150a35)',
    themes: {
      systeme_solaire:  { id: 'systeme_solaire',  label: 'Système solaire',   icon: '☀️' },
      univers:          { id: 'univers',           label: 'Univers & Cosmologie',icon: '🌌' },
      conquete_spatiale:{ id: 'conquete_spatiale', label: 'Conquête spatiale', icon: '🚀' },
    },
  },
  theatre_culture: {
    id: 'theatre_culture', label: 'Théâtre & Culture française', icon: '🎭',
    color: '#FF5FA0',
    gradient: 'linear-gradient(135deg, #2d0f20, #4a1535)',
    themes: {
      theatre:          { id: 'theatre',          label: 'Théâtre & Dramaturgie',  icon: '🎭' },
      litterature_fr:   { id: 'litterature_fr',   label: 'Littérature française',  icon: '📚' },
      culture_generale_fr:{ id: 'culture_generale_fr', label: 'Culture française', icon: '🥖' },
    },
  },
  mathematiques: {
    id: 'mathematiques', label: 'Logique & Mathématiques', icon: '🧩',
    color: '#3DFFD0',
    gradient: 'linear-gradient(135deg, #0a1f2a, #0f3040)',
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
export const DIFF_COLORS   = { easy: '#3DFFD0', medium: '#FFE14D', hard: '#FF5FA0' };
export const XP_PER_LEVEL  = 200;
export const FREE_DAILY_LIMIT = 3;
