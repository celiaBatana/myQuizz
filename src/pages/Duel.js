import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { mapQ } from '../utils/questions';
import { QuizPlayInner } from './QuizPlay';
import { DuelBoard } from './Leaderboard';

export default function Duel() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('loading'); // loading | notfound | ready | played
  const [duel, setDuel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { setState('needauth'); return; }
    (async () => {
      try {
        const d = await getDoc(doc(db, 'duels', id));
        if (!d.exists()) { setState('notfound'); return; }
        const data = d.data();
        setDuel(data);
        const done = await getDoc(doc(db, 'duel_results', `${id}_${user.uid}`));
        if (done.exists()) { setState('played'); return; }
        const snap = await getDocs(query(collection(db, 'questions'), where(documentId(), 'in', data.questionIds.slice(0, 10))));
        const byId = Object.fromEntries(snap.docs.map(x => [x.id, mapQ(x)]));
        const qs = data.questionIds.map(qid => byId[qid]).filter(Boolean);
        setQuestions(qs);
        setState(qs.length ? 'ready' : 'notfound');
      } catch (e) { console.error(e); setState('notfound'); }
    })();
  }, [id, user]);

  const link = `${window.location.origin}/duel/${id}`;
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'Défi Quizly', text: 'Je te défie sur Quizly !', url: link });
      else { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch (e) { /* annulé */ }
  }
  const shareBtn = (
    <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={share}>
      {copied ? '✓ Lien copié !' : '🔗 Inviter un ami (partager le lien)'}
    </button>
  );
  const wrap = (children) => (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div className="page-title">⚔️ Duel</div>
      {children}
    </div>
  );

  if (state === 'loading') return wrap(<div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Chargement…</div>);
  if (state === 'needauth') return wrap(
    <div style={{ textAlign: 'center', padding: 24 }}>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>Connecte-toi pour relever ce duel.</p>
      <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Se connecter</button>
    </div>
  );
  if (state === 'notfound') return wrap(<div style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>Duel introuvable.</div>);
  if (state === 'played') return wrap(
    <>
      <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>Tu as déjà joué ce duel. Résultats :</div>
      <DuelBoard duelId={id} />
      {shareBtn}
      <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => navigate('/jouer')}>Retour</button>
    </>
  );
  if (!started) return wrap(
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ fontSize: 44, marginBottom: 8 }}>⚔️</div>
      <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 300, margin: '0 auto 18px', lineHeight: 1.6 }}>
        <strong>{duel?.creatorName || 'Un ami'}</strong> te défie sur {questions.length} questions. Un seul essai !
      </p>
      <button className="btn btn-primary" onClick={() => setStarted(true)}>Relever le défi</button>
    </div>
  );

  const quizData = { id: `duel_${id}`, name: `Duel de ${duel?.creatorName || 'un ami'}`, diff: 'medium', mode: 'duel', duelId: id, noBest: true, questions };
  return <QuizPlayInner quizData={quizData} navigate={navigate} backTo="/jouer" tagLabel="Duel" noReplay
    extra={<div style={{ marginTop: 14 }}><div className="section-label">Résultats du duel</div><DuelBoard duelId={id} />{shareBtn}</div>} />;
}
