import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CATEGORIES } from '../data/quizData';
import { normText } from '../utils/csv';

const DIFF = { easy: 'Facile', medium: 'Moyen', hard: 'Expert' };
const row = { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' };

export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => { (async () => { try { const s = await getDocs(collection(db, 'quizzes')); setQuizzes(s.docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error(e); } })(); }, []);

  const res = useMemo(() => {
    const words = normText(q).split(' ').filter(Boolean);
    if (!words.length) return null;
    const hit = text => { const t = normText(text); return words.every(w => t.includes(w)); };
    const cats = [], themes = [];
    Object.values(CATEGORIES).forEach(c => {
      if (hit(c.label)) cats.push(c);
      Object.values(c.themes).forEach(t => { if (hit(`${t.label} ${c.label}`)) themes.push({ ...t, catId: c.id, catLabel: c.label, catIcon: c.icon }); });
    });
    const qs = quizzes.filter(z => hit(`${z.name || ''} ${CATEGORIES[z.catId]?.themes?.[z.themeId]?.label || ''} ${CATEGORIES[z.catId]?.label || ''}`)).slice(0, 30);
    return { cats, themes, qs };
  }, [q, quizzes]);

  const none = res && !res.cats.length && !res.themes.length && !res.qs.length;
  return (
    <div className="page">
      <div className="page-title">Rechercher</div>
      <div className="page-sub">Un quiz, un thème ou une catégorie</div>
      <input data-testid="search-input" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Ex : cinéma, Tennis, faux amis…"
        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '12px 14px', color: 'inherit', fontSize: 15, marginBottom: 14 }} />
      {!res && <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Tape au moins une lettre pour chercher.</div>}
      {none && <div data-testid="search-none" style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Aucun résultat pour « {q} ».</div>}
      {res?.cats.length > 0 && <><div style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 2px 8px' }}>Catégories</div>
        {res.cats.map(c => <div key={c.id} data-testid="sr-cat" style={row} onClick={() => navigate(`/category/${c.id}`)}><span style={{ fontSize: 22 }}>{c.icon}</span><strong>{c.label}</strong></div>)}</>}
      {res?.themes.length > 0 && <><div style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 2px 8px' }}>Thèmes</div>
        {res.themes.map(t => <div key={t.catId + t.id} data-testid="sr-theme" style={row} onClick={() => navigate(`/category/${t.catId}/theme/${t.id}`)}><span style={{ fontSize: 22 }}>{t.icon}</span><div><strong>{t.label}</strong><div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.catIcon} {t.catLabel}</div></div></div>)}</>}
      {res?.qs.length > 0 && <><div style={{ fontSize: 12, color: 'var(--muted)', margin: '10px 2px 8px' }}>Quiz</div>
        {res.qs.map(z => <div key={z.id} data-testid="sr-quiz" style={row} onClick={() => navigate(`/quiz/${z.catId}/${z.themeId}/${z.id}`)}><div style={{ flex: 1 }}><strong>{z.name}</strong><div style={{ fontSize: 11, color: 'var(--muted)' }}>{CATEGORIES[z.catId]?.themes?.[z.themeId]?.label || z.themeId} · {DIFF[z.diff] || z.diff}</div></div><span style={{ color: 'var(--yellow)' }}>›</span></div>)}</>}
    </div>
  );
}
