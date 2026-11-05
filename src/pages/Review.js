import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, documentId, doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { dayKey } from '../hooks/useQuiz';
import { dueReviewIds } from '../utils/league';
import { mapQ, shuffle } from '../utils/questions';
import { QuizPlayInner } from './QuizPlay';

const SESSION = 10;

// Révision espacée : les questions ratées reviennent à J+1, J+3, J+7, J+14, J+30
export default function Review() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    if (!user || !profile) return;
    (async () => {
      const ids = dueReviewIds(profile.review, dayKey()).slice(0, SESSION * 2);
      const found = [];
      try {
        for (let i = 0; i < ids.length; i += 10) {
          const snap = await getDocs(query(collection(db, 'questions'), where(documentId(), 'in', ids.slice(i, i + 10))));
          snap.docs.forEach(d => found.push(mapQ(d)));
        }
        // Questions supprimées depuis : on les retire de la révision
        const missing = ids.filter(id => !found.some(q => q.id === id));
        if (missing.length) {
          const upd = {}; missing.forEach(id => { upd[`review.${id}`] = deleteField(); });
          updateDoc(doc(db, 'users', user.uid), upd).catch(() => {});
        }
      } catch (e) { console.error(e); }
      setQuestions(shuffle(found).slice(0, SESSION));
    })();
    // eslint-disable-next-line
  }, [user?.uid, !!profile]);

  if (!user) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>Connecte-toi pour utiliser la révision.</div>;
  if (!questions) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>⏳ Chargement…</div>;
  if (!questions.length) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 40 }}>🎉</div>
      <div style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 800, fontSize: 18, margin: '8px 0' }}>Rien à revoir pour aujourd'hui</div>
      <div style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 18px' }}>Tes erreurs reviendront ici au bon moment pour mieux les retenir.</div>
      <button className="btn btn-primary" onClick={() => navigate('/')}>Accueil</button>
    </div>
  );
  const quizData = { id: 'review', name: 'Révision espacée', diff: 'medium', mode: 'mix', noBest: true, questions };
  return <QuizPlayInner quizData={quizData} navigate={navigate} backTo="/" tagLabel="🧠 Révision espacée" noReplay />;
}
