// Collection : une carte par thème. Règle : réussir (≥ 60 %) au moins un quiz de chaque niveau
// existant dans le thème. Une carte gagnée est enregistrée dans le profil (profile.cards) et
// n'est jamais retirée, même si de nouveaux quiz sont ajoutés ensuite.
import { CATEGORIES } from './quizData';

export const PASS = 60;
export const DIFFS = ['easy', 'medium', 'hard'];
export const DIFF_SHORT = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };
export const cardKey = (catId, themeId) => `${catId}:${themeId}`;

// Niveaux présents dans le thème, niveaux réussis, carte gagnée ou non
export function themeStatus(quizzes, best) {
  const levels = DIFFS.filter(d => quizzes.some(q => q.diff === d));
  const done = levels.filter(d => quizzes.some(q => q.diff === d && (best?.[q.id] ?? -1) >= PASS));
  return { levels, done, earned: levels.length > 0 && done.length === levels.length };
}

export function cardInfo(key) {
  const [catId, themeId] = String(key).split(':');
  const cat = CATEGORIES[catId]; const th = cat?.themes?.[themeId];
  if (!th) return null;
  return { key, catId, themeId, name: th.label, icon: th.icon, color: cat.color, gradient: cat.gradient, catLabel: cat.label, fact: FACTS[themeId] || 'Tu maîtrises ce thème sur tous les niveaux. Bravo !' };
}

const FACTS = {
  classique: "Le mot « culture » vient du latin colere : cultiver. « Mieux vaut une tête bien faite qu'une tête bien pleine », écrivait Montaigne.",
  geographie: "Le Vatican est le plus petit État du monde : environ 0,44 km², moins qu'un grand parc.",
  histoire_gen: "Le 14 juillet 1789, la Bastille ne contenait que sept prisonniers.",
  sciences_gen: "Un adulte a 206 os, mais un bébé en a plus de 300 à la naissance : beaucoup se soudent en grandissant.",
  classiques: "La première projection publique payante des frères Lumière, en 1895 à Paris, durait moins d'une minute par film.",
  animation: "Blanche-Neige et les Sept Nains (1937) est le premier long-métrage d'animation de Disney.",
  musique: "Le premier clip diffusé sur MTV, en 1981, était « Video Killed the Radio Star » des Buggles.",
  series: "La série « Friends » a été diffusée de 1994 à 2004, pour dix saisons.",
  physique: "La lumière du Soleil met environ 8 minutes et 20 secondes pour nous parvenir.",
  informatique: "Le mot « bug » fut illustré en 1947 par un insecte réellement coincé dans un relais d'un ordinateur de Harvard.",
  biologie: "L'ADN d'une seule cellule humaine, déroulé, mesurerait environ deux mètres.",
  football: "La première Coupe du monde de football s'est jouée en 1930, en Uruguay.",
  athletisme: "La distance officielle du marathon, 42,195 km, a été fixée en 1921.",
  tennis: "Wimbledon est le plus ancien tournoi du Grand Chelem : première édition en 1877.",
  antiquite: "Les premiers Jeux olympiques antiques sont traditionnellement datés de 776 av. J.-C.",
  modernite: "Vers 1450, l'imprimerie de Gutenberg a bouleversé la diffusion du savoir en Europe.",
  geo_monde: "L'Afrique compte 54 pays reconnus par l'ONU.",
  langues_monde: "Le mandarin est la langue la plus parlée au monde comme langue maternelle.",
  vocabulaire: "Le français et l'anglais se sont mutuellement emprunté des milliers de mots au fil des siècles.",
  etymologie: "Le mot « salaire » vient du latin salarium, lié au sel (l'explication exacte est débattue par les historiens).",
  cuisine_monde: "À l'origine, le sushi était une façon de conserver le poisson dans du riz fermenté.",
  cuisine_francaise: "Le repas gastronomique des Français est inscrit au patrimoine immatériel de l'UNESCO depuis 2010.",
  gastronomie_pro: "Selon la légende, la toque de chef aurait 100 plis, pour les 100 façons d'accommoder un œuf.",
  classiques_jv: "Pong, sorti par Atari en 1972, est l'un des premiers jeux vidéo à avoir connu un grand succès commercial.",
  esport: "Les finales de jeux vidéo remplissent aujourd'hui des stades de dizaines de milliers de spectateurs.",
  jv_culture: "Mario est apparu en 1981 dans Donkey Kong, sous le nom de « Jumpman ».",
  animaux: "Le poulpe possède trois cœurs.",
  plantes: "Certains bambous poussent de près d'un mètre par jour.",
  environnement: "Les forêts couvrent environ 31 % des terres émergées de la planète.",
  institutions: "La Cinquième République française date de 1958.",
  international: "L'Organisation des Nations unies a été fondée en 1945.",
  democratie: "Athènes, au Ve siècle av. J.-C., est considérée comme le berceau de la démocratie.",
  bases_eco: "Le mot « économie » vient du grec oikonomia : l'administration de la maison.",
  finance: "La Bourse d'Amsterdam, au début du XVIIe siècle, est souvent citée comme la première Bourse moderne.",
  grands_economistes: "Adam Smith publie « La Richesse des nations » en 1776.",
  systeme_solaire: "Jupiter est plus de deux fois plus massive que toutes les autres planètes réunies.",
  univers: "L'Univers observable mesure environ 93 milliards d'années-lumière de diamètre.",
  conquete_spatiale: "Youri Gagarine est devenu le premier homme dans l'espace le 12 avril 1961.",
  theatre: "Selon la tradition, on dit « merde » aux comédiens car, autrefois, beaucoup de crottin devant le théâtre signifiait beaucoup de spectateurs.",
  litterature_fr: "Victor Hugo a écrit une grande partie des « Misérables » en exil ; le roman paraît en 1862.",
  culture_generale_fr: "Le Louvre a ouvert comme musée en 1793, en pleine Révolution.",
  logique: "Le mot « logique » vient du grec logos : la parole, la raison.",
  maths_fondamentaux: "Le zéro, comme nombre à part entière, s'est développé en Inde.",
  enigmes: "L'énigme du Sphinx — quel animal marche à quatre pattes le matin, deux à midi, trois le soir ? — a pour réponse l'homme.",
};
