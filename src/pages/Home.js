import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getCategoryList } from '../data/quizData';

const styles = {
  hero: { textAlign: 'center', padding: '28px 0 20px' },
  h1: { fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(28px, 7vw, 46px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 12 },
  em: { fontStyle: 'normal', background: 'linear-gradient(90deg, #FFE14D, #FF7A3D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  p: { color: 'var(--muted)', fontSize: 15, maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.6 },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24 },
  stat: { textAlign: 'center' },
  statNum: { fontFamily: "'Raleway', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--yellow)' },
  statLabel: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  featured: { background: 'linear-gradient(135deg, #9B6DFF, #FF5FA0)', borderRadius: 16, padding: 18, marginBottom: 10, cursor: 'pointer', transition: 'transform .2s' },
  featuredLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', opacity: .8, marginBottom: 6 },
  featuredTitle: { fontFamily: "'Raleway', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 6 },
  featuredMeta: { fontSize: 12, opacity: .8, display: 'flex', gap: 12, flexWrap: 'wrap' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 24 },
  catCard: { borderRadius: 16, padding: '14px 13px', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', border: '1px solid transparent' },
  catIcon: { fontSize: 24, marginBottom: 6, display: 'block' },
  catName: { fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 2 },
  catMeta: { fontSize: 10, opacity: .65 },
};

const CAT_STYLES = {
  culture:         { background: 'linear-gradient(135deg, #2a1f4e, #3d2a6e)', borderColor: '#4a3580' },
  sciences:        { background: 'linear-gradient(135deg, #1f3a2e, #1a4d3a)', borderColor: '#2a6b4e' },
  cinema:          { background: 'linear-gradient(135deg, #3a1f2a, #5a1f35)', borderColor: '#7a2a45' },
  sport:           { background: 'linear-gradient(135deg, #2a2a1f, #3d3a18)', borderColor: '#5a5520' },
  histoire:        { background: 'linear-gradient(135deg, #1f2a3a, #1a3050)', borderColor: '#2a4570' },
  langues:         { background: 'linear-gradient(135deg, #2a1f1f, #4a2a1a)', borderColor: '#6a3a20' },
  gastronomie:     { background: 'linear-gradient(135deg, #3a2010, #5a3015)', borderColor: '#7a4a20' },
  jeux_video:      { background: 'linear-gradient(135deg, #1a0f3a, #2d1a5e)', borderColor: '#3d2a7a' },
  nature:          { background: 'linear-gradient(135deg, #0f2d1f, #1a4a2e)', borderColor: '#1a6a3e' },
  politique:       { background: 'linear-gradient(135deg, #0f1f3a, #1a2d5e)', borderColor: '#1a3a7a' },
  economie:        { background: 'linear-gradient(135deg, #2a2500, #3d3800)', borderColor: '#5a5000' },
  astronomie:      { background: 'linear-gradient(135deg, #0a0520, #150a35)', borderColor: '#2a1550' },
  theatre_culture: { background: 'linear-gradient(135deg, #2d0f20, #4a1535)', borderColor: '#6a1a45' },
  mathematiques:   { background: 'linear-gradient(135deg, #0a1f2a, #0f3040)', borderColor: '#0a4560' },
};

export default function Home() {
  const navigate = useNavigate();
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
        const withQ = quizzes.filter(q => questions.some(qu => qu.quizId === q.id));
        if (withQ.length > 0) {
          // Choisir un quiz du jour basé sur le jour de l'année
          const dayIndex = Math.floor(Date.now() / 86400000) % withQ.length;
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
  const diffEmoji = { easy: '🟢', medium: '🟡', hard: '🔴' };
  const xpLabel   = { easy: '+5–15 XP', medium: '+10–30 XP', hard: '+20–50 XP' };

  return (
    <div className="page">
      <div style={styles.hero}>
        <h1 style={styles.h1}>
          Teste tes<br />
          <em style={styles.em}>connaissances</em>
        </h1>
        <p style={styles.p}>Quiz thématiques, difficulté progressive, système XP. Joue et progresse.</p>
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <div style={styles.statNum}>{categories.length}</div>
            <div style={styles.statLabel}>Catégories</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNum}>{totalThemes}</div>
            <div style={styles.statLabel}>Thèmes</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNum}>{totalQuizzes}</div>
            <div style={styles.statLabel}>Quiz</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNum}>{totalQuestions}</div>
            <div style={styles.statLabel}>Questions</div>
          </div>
        </div>
      </div>

      {/* Quiz du jour */}
      <div className="section-label">Quiz du jour</div>
      {featuredQuiz ? (
        <div
          style={styles.featured}
          onClick={() => navigate(`/quiz/${featuredQuiz.catId}/${featuredQuiz.themeId}/${featuredQuiz.id}`)}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={styles.featuredLabel}>⭐ Sélection du jour</div>
          <div style={styles.featuredTitle}>{featuredQuiz.name}</div>
          <div style={styles.featuredMeta}>
            <span>{diffEmoji[featuredQuiz.diff]} {diffLabel[featuredQuiz.diff]}</span>
            <span>⚡ {xpLabel[featuredQuiz.diff]}/question</span>
          </div>
        </div>
      ) : (
        <div style={{ ...styles.featured, opacity: 0.5, cursor: 'default' }}>
          <div style={styles.featuredLabel}>⭐ Sélection du jour</div>
          <div style={styles.featuredTitle}>Chargement…</div>
        </div>
      )}

      {/* Catégories */}
      <div className="section-label" style={{ marginTop: 20 }}>Catégories</div>
      <div style={styles.catGrid}>
        {categories.map(cat => {
          const themeCount = Object.keys(cat.themes).length;
          return (
            <div
              key={cat.id}
              style={{ ...styles.catCard, ...(CAT_STYLES[cat.id] || {}) }}
              onClick={() => navigate(`/category/${cat.id}`)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={styles.catIcon}>{cat.icon}</span>
              <div style={styles.catName}>{cat.label}</div>
              <div style={styles.catMeta}>{themeCount} thèmes</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
