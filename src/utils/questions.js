import { collection, getDocs, query, where, orderBy, startAt, limit, documentId } from 'firebase/firestore';
import { db } from '../firebase';

export function mapQ(d) {
  const x = d.data();
  return { id: d.id, t: x.text, o: x.options, a: x.answer, e: x.explanation || '', d: x.diff };
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Questions d'une catégorie (et d'un niveau si diff != 'all'), valides uniquement
export async function fetchByCatDiff(cat, diff) {
  const conds = [where('category', '==', cat)];
  if (diff && diff !== 'all') conds.push(where('diff', '==', diff));
  const snap = await getDocs(query(collection(db, 'questions'), ...conds));
  return snap.docs
    .filter(d => d.data().active !== false && Array.isArray(d.data().options) && d.data().options.length >= 2)
    .map(mapQ);
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

// Les mêmes 5 questions pour tout le monde pour une date donnée (5 lectures seulement)
export async function fetchDaily(dateKey, n = 5) {
  const col = collection(db, 'questions');
  const first = await getDocs(query(col, orderBy(documentId()), startAt(seededId('quizly-' + dateKey)), limit(n)));
  let docs = first.docs;
  if (docs.length < n) {
    const more = await getDocs(query(col, orderBy(documentId()), limit(n - docs.length)));
    docs = [...docs, ...more.docs.filter(d => !docs.some(x => x.id === d.id))];
  }
  return docs.map(mapQ);
}
