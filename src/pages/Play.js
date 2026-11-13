import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../data/quizData';
import { fetchVaried } from '../utils/questions';
import { QuizPlayInner } from './QuizPlay';

// Quiz mixte (10 questions au hasard) et mort subite (jusqu'à la première erreur)
export default function Play() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const mode = params.get('mode') === 'sudden' ? 'sudden' : 'mix';
  const cat  = params.get('cat');
  const diff = params.get('diff') || 'all';
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setQuestions(await fetchVaried(cat, diff, mode === 'mix' ? 10 : 60));
      } catch (e) { console.error(e); setQuestions([]); }
    })();
  }, [mode, cat, diff]);

  if (!questions) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>⏳ Chargement…</div>;
  if (!questions.length) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 36 }}>😕</div>
      <div style={{ color: 'var(--muted)', margin: '10px 0 18px', fontSize: 13 }}>Aucune question pour cette sélection.</div>
      <button className="btn btn-primary" onClick={() => navigate('/jouer')}>← Retour</button>
    </div>
  );

  const label = cat === 'all' ? 'Toutes catégories' : String(cat).split(',').map(c => CATEGORIES[c]?.label || c).join(' + ');
  const quizData = {
    id: `${mode}_${cat}_${diff}`,
    name: `${mode === 'sudden' ? 'Mort subite' : 'Quiz mixte'} – ${label}`,
    diff: diff === 'all' ? 'medium' : diff,
    mode, noBest: true, questions,
  };
  return <QuizPlayInner key={`${mode}${cat}${diff}`} quizData={quizData} navigate={navigate} backTo="/jouer"
    tagLabel={`${mode === 'sudden' ? '💥 Mort subite' : '🎲 Mixte'} · ${label}`} />;
}
