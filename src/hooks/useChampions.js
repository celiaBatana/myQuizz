import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const KEY = 'quizly-champs', TTL = 5 * 60 * 1000;
const read = () => { try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return c && Date.now() - c.t < TTL ? c.m : null; } catch (e) { return null; } };

// Meilleur joueur de chaque catégorie (points gagnés dans les quiz de la catégorie)
export function useChampions(catIds) {
  const [m, setM] = useState(read);
  const key = catIds.join(',');
  useEffect(() => {
    if (m || !catIds.length) return;
    let alive = true;
    (async () => {
      const out = {};
      await Promise.all(catIds.map(async id => {
        try {
          const s = await getDocs(query(collection(db, 'leaderboard'), orderBy(`catXP.${id}`, 'desc'), limit(1)));
          const d = s.docs[0]?.data();
          out[id] = d && d.catXP?.[id] > 0 ? { uid: d.uid, name: d.name, xp: d.catXP[id] } : null;
        } catch (e) { out[id] = null; }
      }));
      if (!alive) return;
      try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), m: out })); } catch (e) { /* ignoré */ }
      setM(out);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [key]);
  return m;
}
