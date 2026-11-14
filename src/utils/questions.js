import { collection, getDocs, query, where, orderBy, startAt, limit, documentId } from 'firebase/firestore';
import { db } from '../firebase';

export function mapQ(d) {
  const x = d.data();
  return { id: d.id, t: x.text, o: x.options, a: x.answer, e: x.explanation || '', d: x.diff, c: x.category, th: x.theme };
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// « easy,medium » → ['easy','medium'] ; 'all' ou vide → null (tous les niveaux)
export const diffList = diff => { const l = String(diff || '').split(',').filter(x => x && x !== 'all'); return l.length ? l : null; };

// Questions d'une catégorie (et d'un niveau si diff != 'all'), valides uniquement
export async function fetchByCatDiff(cat, diff) {
  const conds = [where('category', '==', cat)];
  const dl = diffList(diff);
  if (dl) conds.push(dl.length === 1 ? where('diff', '==', dl[0]) : where('diff', 'in', dl));
  const snap = await getDocs(query(collection(db, 'questions'), ...conds));
  return snap.docs
    .filter(d => d.data().active !== false && Array.isArray(d.data().options) && d.data().options.length >= 2)
    .map(mapQ);
}

const isValid = d => d.data().active !== false && Array.isArray(d.data().options) && d.data().options.length >= 2;

// ── Mémoire des questions déjà vues (par appareil) pour éviter les répétitions ──
const SEEN_KEY = 'quizly-seen';
const SEEN_MAX = 400;
function getSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch (e) { return new Set(); }
}
function markSeen(ids) {
  try {
    const old = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    const merged = [...old.filter(x => !ids.includes(x)), ...ids].slice(-SEEN_MAX);
    localStorage.setItem(SEEN_KEY, JSON.stringify(merged));
  } catch (e) { /* stockage indisponible : sans conséquence */ }
}

// Choisit n questions variées : jamais deux de suite sur le même thème si possible,
// les questions jamais vues d'abord, tirage aléatoire sinon.
export function pickVaried(list, n, seen = new Set()) {
  const groups = {};
  shuffle(list).forEach(q => { (groups[q.th || q.c || '_'] = groups[q.th || q.c || '_'] || []).push(q); });
  Object.values(groups).forEach(g => g.sort((a, b) => (seen.has(a.id) ? 1 : 0) - (seen.has(b.id) ? 1 : 0)));
  const queues = shuffle(Object.values(groups));
  const out = [];
  let last = null;
  while (out.length < n && queues.some(g => g.length)) {
    // thème suivant : celui qui a le plus de questions jamais vues, différent du précédent
    const avail = queues.filter(g => g.length && g[0].th !== last);
    const pool = avail.length ? avail : queues.filter(g => g.length);
    const unseen = pool.filter(g => !seen.has(g[0].id));
    const from = shuffle(unseen.length ? unseen : pool)[0];
    const q = from.shift();
    out.push(q); last = q.th;
  }
  return out;
}

// Tirage aléatoire dans toute la base à partir d'identifiants aléatoires (peu de lectures)
async function fetchRandomAll(diff, target = 120) {
  const col = collection(db, 'questions');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const rid = () => Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const found = new Map();
  const per = diffList(diff) ? 40 : 30;
  for (let i = 0; i < 6 && found.size < target; i++) {
    const snap = await getDocs(query(col, orderBy(documentId()), startAt(rid()), limit(per)));
    snap.docs.filter(isValid).forEach(d => found.set(d.id, mapQ(d)));
  }
  let list = [...found.values()];
  const dl = diffList(diff);
  if (dl) list = list.filter(q => dl.includes(q.d));
  return list;
}

// Questions variées pour mixte / mort subite / duel.
// cat = 'all', un identifiant de catégorie, ou plusieurs séparés par des virgules (« culture,cinema »).
// Plusieurs catégories : on alterne entre elles pour que chacune soit représentée.
export async function fetchVaried(cat, diff, n, avoidIds = []) {
  const seen = new Set([...getSeen(), ...avoidIds]);
  let picked;
  const cats = cat === 'all' ? null : String(cat).split(',').filter(Boolean);
  if (!cats) {
    picked = pickVaried(await fetchRandomAll(diff), n, seen);
  } else if (cats.length === 1) {
    picked = pickVaried(await fetchByCatDiff(cats[0], diff), n, seen);
  } else {
    const lists = await Promise.all(cats.map(c => fetchByCatDiff(c, diff)));
    const queues = shuffle(lists.map(l => pickVaried(l, n, seen)).filter(l => l.length));
    picked = [];
    while (picked.length < n && queues.some(q => q.length)) {
      for (const q of queues) { if (q.length && picked.length < n) picked.push(q.shift()); }
    }
  }
  markSeen(picked.map(q => q.id));
  return picked;
}

// Identifiant Firestore pseudo-aléatoire mais déterministe à partir d'un texte
function seededId(seed) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  let out = '';
  for (let i = 0; i < 20; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    h = (h + 0x9e3779b9) >>> 0;
    out += chars[h % chars.length];
  }
  return out;
}

// Les mêmes 5 questions pour tout le monde pour une date donnée (30 lectures environ).
// Choix déterministe : une question par catégorie, puis par thème, puis le reste.
export async function fetchDaily(dateKey, n = 5) {
  const col = collection(db, 'questions');
  const pool = 30;
  const first = await getDocs(query(col, orderBy(documentId()), startAt(seededId('quizly-' + dateKey)), limit(pool)));
  let docs = first.docs;
  if (docs.length < pool) {
    const more = await getDocs(query(col, orderBy(documentId()), limit(pool - docs.length)));
    docs = [...docs, ...more.docs.filter(d => !docs.some(x => x.id === d.id))];
  }
  const all = docs.filter(isValid).map(mapQ);
  const chosen = [];
  const usedCat = new Set(), usedTheme = new Set();
  all.forEach(q => { if (chosen.length < n && !usedCat.has(q.c)) { chosen.push(q); usedCat.add(q.c); usedTheme.add(q.th); } });
  all.forEach(q => { if (chosen.length < n && !chosen.includes(q) && !usedTheme.has(q.th)) { chosen.push(q); usedTheme.add(q.th); } });
  all.forEach(q => { if (chosen.length < n && !chosen.includes(q)) chosen.push(q); });
  return chosen;
}
