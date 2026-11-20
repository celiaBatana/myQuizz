import { useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { applyTaxonomy } from '../data/taxonomy';

// Charge une fois les réglages de catégories / thèmes (renommages, ajouts, déplacements faits dans l'Admin)
export default function TaxonomySync() {
  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([getDocs(collection(db, 'categories')), getDocs(collection(db, 'themes'))]);
        applyTaxonomy(c.docs.map(d => ({ id: d.id, ...d.data() })), t.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { /* hors ligne : on garde la base intégrée */ }
    })();
  }, []);
  return null;
}
