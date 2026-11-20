// Catégories & thèmes dynamiques : base écrite dans quizData.js + réglages Firestore
//   collection `categories` : doc dont l'id est celui d'une catégorie intégrée = réglage (label, icon, hidden, order) ;
//                             autre id = catégorie créée dans l'Admin
//   collection `themes`     : idem (catId = catégorie actuelle ; cardCat = catégorie d'origine, pour garder les cartes)
// CATEGORIES (quizData) est reconstruit « en place » : tout le code existant continue de l'importer tel quel.
import { useSyncExternalStore } from 'react';
import { CATEGORIES } from './quizData';

const clone = o => JSON.parse(JSON.stringify(o));
const BASE = clone(CATEGORIES);
const PALETTE = ['#D9825B', '#C96A7E', '#5FA8A0', '#7C8FD1', '#9A7BC9', '#6BAF7A', '#B5A25A', '#6F93B8', '#B96FA0', '#D96B4B'];
const gradOf = c => {
  const n = parseInt(c.slice(1), 16);
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  return `linear-gradient(135deg, rgba(${rgb},.26), rgba(${rgb},.08))`;
};

let version = 0;
let admin = [];            // arbre complet (masqués inclus), trié
const listeners = new Set();
const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const getTaxonomyVersion = () => version;
export const useTaxonomy = () => useSyncExternalStore(subscribe, getTaxonomyVersion);

export const slugify = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x';

// catDocs / themeDocs : [{id, ...champs}]
export function applyTaxonomy(catDocs = [], themeDocs = []) {
  const cdoc = Object.fromEntries(catDocs.map(d => [d.id, d]));
  const tdoc = Object.fromEntries(themeDocs.map(d => [d.id, d]));
  const cats = [];
  Object.values(BASE).forEach((c, i) => {
    const o = cdoc[c.id] || {};
    cats.push({ id: c.id, builtin: true, label: o.label || c.label, icon: o.icon || c.icon, color: o.color || c.color, gradient: o.color ? gradOf(o.color) : c.gradient, hidden: !!o.hidden, order: o.order ?? (i + 1) * 10, themes: [] });
  });
  catDocs.filter(d => !BASE[d.id]).forEach((d, i) => {
    const color = d.color || PALETTE[i % PALETTE.length];
    cats.push({ id: d.id, builtin: false, label: d.label || d.id, icon: d.icon || '📚', color, gradient: gradOf(color), hidden: !!d.hidden, order: d.order ?? (1000 + i), themes: [] });
  });
  const byId = Object.fromEntries(cats.map(c => [c.id, c]));
  let k = 0;
  Object.values(BASE).forEach(c => Object.values(c.themes).forEach(t => {
    const o = tdoc[t.id] || {};
    const catId = byId[o.catId] ? o.catId : c.id;
    byId[catId].themes.push({ id: t.id, builtin: true, catId, cardCat: o.cardCat || c.id, label: o.label || t.label, icon: o.icon || t.icon, hidden: !!o.hidden, order: o.order ?? (++k) * 10 });
  }));
  themeDocs.filter(d => !tdoc[d.id]?.__x && !Object.values(BASE).some(c => c.themes[d.id])).forEach((d, i) => {
    if (!byId[d.catId]) return;
    byId[d.catId].themes.push({ id: d.id, builtin: false, catId: d.catId, cardCat: d.cardCat || d.catId, label: d.label || d.id, icon: d.icon || '📖', hidden: !!d.hidden, order: d.order ?? (1000 + i) });
  });
  cats.sort((a, b) => a.order - b.order);
  cats.forEach(c => c.themes.sort((a, b) => a.order - b.order));
  admin = cats;

  // Version publique : sans les éléments masqués, au format historique de CATEGORIES
  Object.keys(CATEGORIES).forEach(k2 => delete CATEGORIES[k2]);
  cats.filter(c => !c.hidden).forEach(c => {
    CATEGORIES[c.id] = { id: c.id, label: c.label, icon: c.icon, color: c.color, gradient: c.gradient, themes: {} };
    c.themes.filter(t => !t.hidden).forEach(t => { CATEGORIES[c.id].themes[t.id] = { id: t.id, label: t.label, icon: t.icon, cardCat: t.cardCat }; });
  });
  version++;
  listeners.forEach(f => f());
}

// Arbre complet pour l'Admin (catégories et thèmes masqués inclus)
export const getAdminTree = () => admin;
export const findTheme = themeId => { for (const c of admin) { const t = c.themes.find(x => x.id === themeId); if (t) return { ...t, catId: c.id }; } return null; };
export const nextColor = () => PALETTE[admin.length % PALETTE.length];

applyTaxonomy([], []);
