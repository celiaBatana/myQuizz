// Messages de fin de quiz : plusieurs variantes par tranche de score, jamais deux fois la même d'affilée
const BANDS = [
  { min: 1, emoji: '🏆', list: [
    ['Parfait !', 'Sans-faute, tu es intouchable.'],
    ['Zéro faute !', 'Rien ne t\'échappe, bravo.'],
    ['Quel score !', 'Du 100 %, difficile de faire mieux.'],
    ['Sans faute !', 'Les autres joueurs ont du souci à se faire.'],
  ] },
  { min: 0.8, emoji: '⭐', list: [
    ['Excellent !', 'À une ou deux questions du sans-faute.'],
    ['Très fort !', 'Encore un petit effort pour le parfait.'],
    ['Bravo !', 'Tu maîtrises le sujet, vise le 100 % maintenant.'],
    ['Impressionnant !', 'Presque parfait, qu\'est-ce qui t\'a échappé ?'],
  ] },
  { min: 0.6, emoji: '👍', list: [
    ['Bien joué !', 'Solide, mais tu peux aller plus haut.'],
    ['Pas mal du tout !', 'Un quiz de plus et tu passes au niveau supérieur.'],
    ['C\'est bien !', 'Révise tes erreurs et tu fais mieux.'],
    ['Correct !', 'La moyenne est passée, vise l\'excellence.'],
  ] },
  { min: 0.4, emoji: '😬', list: [
    ['Bof, tu peux mieux faire !', 'Rejoue tes erreurs pour les retenir.'],
    ['Il y a du boulot…', 'Ce n\'est pas ton meilleur score, prends ta revanche !'],
    ['Pas terrible…', 'Tu en sais plus que ça, on retente ?'],
    ['Peut mieux faire !', 'Relis les explications et relance une partie.'],
    ['Aïe, juste en dessous…', 'Quelques bonnes réponses de plus et c\'était bon.'],
  ] },
  { min: 0.2, emoji: '😅', list: [
    ['Aïe, ça pique !', 'Lis bien les explications, la revanche t\'attend.'],
    ['Mauvais score…', 'Rejoue tes erreurs, tu vas vite progresser.'],
    ['Ce n\'était pas ton jour !', 'Un quiz de plus pour te refaire ?'],
    ['Là, c\'est raté !', 'Tu peux faire bien mieux, prouve-le.'],
  ] },
  { min: 0, emoji: '💀', list: [
    ['Catastrophe !', 'Impossible de faire pire, la seule issue : rejouer.'],
    ['Zéro pointé…', 'Relève le défi, la revanche est à un clic.'],
    ['Aïe aïe aïe !', 'Lis les explications et reviens plus fort.'],
    ['Quel désastre !', 'Ça ne peut que s\'améliorer, rejoue !'],
  ] },
];

const KEY = 'quizly-last-msg';

export function pickResultMessage(pct) {
  const band = BANDS.find(b => pct >= b.min) || BANDS[BANDS.length - 1];
  let last = '';
  try { last = localStorage.getItem(KEY) || ''; } catch (e) { /* sans stockage */ }
  const choices = band.list.filter(m => m[0] !== last);
  const [title, sub] = choices[Math.floor(Math.random() * choices.length)] || band.list[0];
  try { localStorage.setItem(KEY, title); } catch (e) { /* sans stockage */ }
  return { emoji: band.emoji, title, sub };
}
