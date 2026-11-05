import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { dayKey } from '../hooks/useQuiz';
import { fetchDaily } from '../utils/questions';
import { QuizPlayInner } from './QuizPlay';
import { DailyBoard } from './Leaderboard';

export default function Daily() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const date = dayKey();
  const [state, setState] = useState('loading'); // loading | ready | played | empty
  const [mine, setMine] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!user) { setState('ready'); return; }
    (async () => {
      try {
        const done = await getDoc(doc(db, 'daily_scores', `${date}_${user.uid}`));
        if (done.exists()) { setMine(done.data()); setState('played'); return; }
        const qs = await fetchDaily(date);
        setQuestions(qs);
        setState(qs.length ? 'ready' : 'empty');
      } catch (e) { console.error(e); setState('empty'); }
    })();
  }, [user, date]);

  const back = '/';
  const wrap = (children) => (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div className="page-title">📅 Défi du jour</div>
      {children}
    </div>
  );

  if (state === 'loading') return wrap(<div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Chargement…</div>);

  if (!user) return wrap(
    <div style={{ textAlign: 'center', padding: 24 }}>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>Connecte-toi pour relever le défi du jour et apparaître au classement.</p>
      <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Se connecter</button>
    </div>
  );

  if (state === 'empty') return wrap(<div style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>Le défi n'est pas disponible pour le moment.</div>);

  if (state === 'played') return wrap(
    <>
      <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
        <div style={{ fontSize: 40 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Défi relevé : {mine.score}/{mine.total}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Reviens demain pour un nouveau défi !</div>
      </div>
      <DailyBoard date={date} />
      <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={() => navigate('/')}>Accueil</button>
    </>
  );

  if (!started) return wrap(
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>🎯</div>
      <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 300, margin: '0 auto 18px', lineHeight: 1.6 }}>
        {questions.length} questions, les mêmes pour tout le monde. <strong>Un seul essai</strong> : ton score va au classement du jour.
      </p>
      <button className="btn btn-primary" onClick={() => setStarted(true)}>C'est parti !</button>
    </div>
  );

  const quizData = { id: `daily_${date}`, name: `Défi du jour ${date}`, diff: 'medium', mode: 'daily', dailyDate: date, noBest: true, questions };
  return <QuizPlayInner quizData={quizData} navigate={navigate} backTo={back} tagLabel="Défi du jour" noReplay
    extra={<div style={{ marginTop: 14 }}><div className="section-label">Classement du jour</div><DailyBoard date={date} /></div>} />;
}
