import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/quizData';
import { cardKey, cardInfo, themeStatus, DIFFS, DIFF_SHORT } from '../data/cards';

export default function Collection() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null);
  const [open, setOpen] = useState(null);
  const best = profile?.bestScores || {};
  const owned = useMemo(() => new Set(profile?.cards || []), [profile?.cards]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'quizzes'));
        setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); setQuizzes([]); }
    })();
  }, []);

  const cats = useMemo(() => {
    if (!quizzes) return null;
    return Object.values(CATEGORIES).map(cat => ({
      cat,
      items: Object.values(cat.themes).map(t => {
        const qs = quizzes.filter(z => z.catId === cat.id && z.themeId === t.id);
        return { key: cardKey(cat.id, t.id), t, st: themeStatus(qs, best), hasQuiz: qs.length > 0 };
      }).filter(x => x.hasQuiz),
    })).filter(c => c.items.length);
  }, [quizzes, best]);

  // Récupère les cartes déjà méritées avant la sortie de la collection (une seule fois)
  useEffect(() => {
    if (!cats || !profile) return;
    const missing = cats.flatMap(c => c.items).filter(x => x.st.earned && !owned.has(x.key)).map(x => x.key);
    if (missing.length) updateProfile({ cards: [...(profile.cards || []), ...missing] }).catch(() => {});
  }, [cats]); // eslint-disable-line

  if (!user) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>Connecte-toi pour voir ta collection.</div>;
  if (!cats) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>⏳ Chargement…</div>;

  const total = cats.reduce((a, c) => a + c.items.length, 0);
  const have = cats.reduce((a, c) => a + c.items.filter(x => owned.has(x.key) || x.st.earned).length, 0);
  const info = open && cardInfo(open);

  return (
    <div className="page">
      <div className="page-title">🃏 Ma collection</div>
      <div className="page-sub">Une carte par thème : réussis (≥ 60 %) un quiz de chaque niveau pour la gagner</div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{have} / {total} cartes</div>
        <div style={{ height: 6, background: 'var(--s2)', borderRadius: 6, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${total ? (100 * have) / total : 0}%`, background: 'var(--purple)', transition: 'width .6s' }} />
        </div>
      </div>

      {cats.map(({ cat, items }) => (
        <div key={cat.id} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{cat.icon} {cat.label} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {items.filter(x => owned.has(x.key) || x.st.earned).length}/{items.length}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {items.map(({ key, t, st }) => {
              const got = owned.has(key) || st.earned;
              return (
                <div key={key} data-card={key} data-owned={got ? '1' : '0'}
                  onClick={() => (got ? setOpen(key) : navigate(`/category/${cat.id}/theme/${t.id}`))}
                  style={{ borderRadius: 14, padding: '12px 6px 10px', textAlign: 'center', cursor: 'pointer', minHeight: 104,
                    background: got ? cat.gradient : 'var(--s1)', border: `1px solid ${got ? cat.color : 'var(--s2)'}`, opacity: got ? 1 : 0.75 }}>
                  <div style={{ fontSize: 28, filter: got ? 'none' : 'grayscale(1)', opacity: got ? 1 : 0.5 }}>{got ? t.icon : '🔒'}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, margin: '6px 0' }}>{t.label}</div>
                  {!got && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                      {DIFFS.filter(d => st.levels.includes(d)).map(d => (
                        <span key={d} title={DIFF_SHORT[d]} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 8, background: st.done.includes(d) ? 'var(--cyan)' : 'var(--s2)', color: st.done.includes(d) ? '#000' : 'var(--muted)' }}>{DIFF_SHORT[d][0]}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {info && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: info.gradient, border: `2px solid ${info.color}`, borderRadius: 20, padding: 24, maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 56 }}>{info.icon}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 900, fontSize: 20, margin: '8px 0 2px' }}>{info.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{info.catLabel}</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>💡 {info.fact}</div>
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setOpen(null)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
