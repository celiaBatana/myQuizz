import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getCategoryList, XP_PER_LEVEL } from '../data/quizData';
import { useAuth } from '../context/AuthContext';
import { dayKey } from '../hooks/useQuiz';
import { dueReviewIds } from '../utils/league';
import DailyPanel from '../components/DailyPanel';
import Onboarding from '../components/Onboarding';
import { cleanQuizName } from '../utils/quizName';

const Icon = ({ d, size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONS = {
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  cards: 'M5 7h10v13H5zM9 4h10v13M8 11h4',
  brain: 'M12 4a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 1 5 3 3 0 0 0 5 3zM12 4a3 3 0 0 1 3 3 3 3 0 0 1 3 3 3 3 0 0 1-1 5 3 3 0 0 1-5 3M12 4v14',
  arrow: 'M9 6l6 6-6 6',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
};
const RING_R = 40, RING_C = 2 * Math.PI * RING_R;
const row = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 };
const display = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700 };

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const dueCount = dueReviewIds(profile?.review, dayKey()).length;
  const categories = getCategoryList();

  const [totalQuizzes, setTotalQuizzes] = useState('...');
  const [totalQuestions, setTotalQuestions] = useState('...');
  const [featuredQuiz, setFeaturedQuiz] = useState(null);

  const totalThemes = categories.reduce((s, c) => s + Object.keys(c.themes).length, 0);

  useEffect(() => {
    (async () => {
      try {
        const [quizSnap, qSnap] = await Promise.all([
          getDocs(collection(db, 'quizzes')),
          getDocs(collection(db, 'questions')),
        ]);
        setTotalQuizzes(quizSnap.size);
        setTotalQuestions(qSnap.size);

        // Quiz du jour : premier quiz avec des questions
        const quizzes = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const withQ = quizzes
          .filter(q => questions.some(qu => qu.quizId === q.id))
          .sort((a, b) => a.id.localeCompare(b.id)); // ordre stable
        if (withQ.length > 0) {
          // Choisir un quiz du jour basé sur le jour de l'année
          // Jour local (Paris) et non UTC : change bien à minuit
          const now = new Date();
          const dayNum = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
          const dayIndex = dayNum % withQ.length;
          setFeaturedQuiz(withQ[dayIndex]);
        }
      } catch (e) {
        console.error('Erreur chargement home:', e);
        setTotalQuizzes('?');
        setTotalQuestions('?');
      }
    })();
  }, []);

  const diffLabel = { easy: 'Facile', medium: 'Moyen', hard: 'Expert' };
  const xpLabel   = { easy: '+5–15 XP', medium: '+10–30 XP', hard: '+20–50 XP' };

  const level = profile?.level || 1;
  const xpInLevel = profile?.xpInLevel || 0;
  const xpPct = Math.min(1, xpInLevel / XP_PER_LEVEL);
  const firstName = (profile?.displayName || '').split(' ')[0];

  return (
    <div className="page">
      <div style={{ background: 'var(--s1)', borderRadius: 24, padding: 20, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
          <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
            <circle cx="46" cy="46" r={RING_R} fill="none" stroke="var(--s2)" strokeWidth="8" />
            <circle cx="46" cy="46" r={RING_R} fill="none" stroke="var(--yellow)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - xpPct)} transform="rotate(-90 46 46)" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...display, fontSize: 28, lineHeight: 1 }}>{level}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>niveau</div>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{firstName ? `Bonjour ${firstName}` : 'Bienvenue'}</div>
          <div style={{ ...display, fontSize: 21, lineHeight: 1.2, marginTop: 2 }}>
            {profile ? `${XP_PER_LEVEL - xpInLevel} XP avant le niveau ${level + 1}` : 'Teste tes connaissances'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            {categories.length} catégories · {totalThemes} thèmes · {totalQuizzes} quiz · {totalQuestions} questions
          </div>
        </div>
      </div>

      <div
        onClick={() => navigate('/daily')}
        style={{ background: 'var(--yellow)', color: 'var(--on-primary)', borderRadius: 20, padding: '16px 18px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ ...display, fontSize: 19 }}>Défi du jour</div>
          <div style={{ fontSize: 13, marginTop: 2 }}>5 questions pour tous · un seul essai · classement</div>
        </div>
        <Icon d="M5 12h14M13 6l6 6-6 6" size={26} />
      </div>

      {profile && !profile.onboarded && !(profile.quizzesPlayed > 0) && <Onboarding />}
      <DailyPanel />

      {dueCount > 0 && (
        <div onClick={() => navigate('/revision')} style={{ ...row, borderColor: 'var(--cyan)' }}>
          <Icon d={ICONS.brain} color="var(--cyan)" />
          <div style={{ flex: 1 }}>
            <div style={{ ...display, fontSize: 15 }}>Révision du jour</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{dueCount} question{dueCount > 1 ? 's' : ''} à revoir pour mieux les retenir</div>
          </div>
          <Icon d={ICONS.arrow} color="var(--cyan)" size={18} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
        <div onClick={() => navigate('/progression')} style={{ ...row, marginBottom: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <Icon d={ICONS.chart} color="var(--yellow)" />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Ma progression</div>
        </div>
        <div onClick={() => navigate('/collection')} style={{ ...row, marginBottom: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <Icon d={ICONS.cards} color="var(--yellow)" />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Ma collection{(profile?.cards || []).length ? ` · ${(profile.cards || []).length}` : ''}</div>
        </div>
      </div>

      {/* Quiz du jour */}
      <div className="section-label">Quiz du jour</div>
      {featuredQuiz ? (
        <div
          style={{ background: 'var(--s1)', border: '1px solid var(--yellow)', borderRadius: 18, padding: 18, marginBottom: 10, cursor: 'pointer' }}
          onClick={() => navigate(`/quiz/${featuredQuiz.catId}/${featuredQuiz.themeId}/${featuredQuiz.id}`)}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--yellow)', marginBottom: 6 }}>Sélection du jour</div>
          <div style={{ ...display, fontSize: 19, marginBottom: 8 }}>{cleanQuizName(featuredQuiz.name)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className={`diff-badge diff-${featuredQuiz.diff}`}>{diffLabel[featuredQuiz.diff]}</span>
            <span>{xpLabel[featuredQuiz.diff]} par question</span>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--s1)', borderRadius: 18, padding: 18, marginBottom: 10, opacity: 0.5 }}>
          <div style={{ ...display, fontSize: 19 }}>Chargement…</div>
        </div>
      )}

      {/* Catégories */}
      <div className="section-label" style={{ marginTop: 20 }}>Catégories</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 24 }}>
        {categories.map(cat => {
          const themeCount = Object.keys(cat.themes).length;
          return (
            <div
              key={cat.id}
              style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 18, padding: '14px 14px', cursor: 'pointer', transition: 'border-color .2s' }}
              onClick={() => navigate(`/category/${cat.id}`)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--yellow)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--s2)'; }}
            >
              <span style={{ fontSize: 24, marginBottom: 8, display: 'block' }}>{cat.icon}</span>
              <div style={{ ...display, fontSize: 14, marginBottom: 2 }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{themeCount} thèmes</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
