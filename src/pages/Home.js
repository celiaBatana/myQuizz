import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryList } from '../data/quizData';

const CAT_CLASSES = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];

const styles = {
  hero: { textAlign: 'center', padding: '28px 0 20px' },
  h1: { fontFamily: "'Syne', sans-serif", fontSize: 'clamp(28px, 7vw, 46px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 12 },
  em: { fontStyle: 'normal', background: 'linear-gradient(90deg, #FFE14D, #FF7A3D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  p: { color: 'var(--muted)', fontSize: 15, maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.6 },
  statsRow: { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24 },
  stat: { textAlign: 'center' },
  statNum: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--yellow)' },
  statLabel: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  featured: { background: 'linear-gradient(135deg, #9B6DFF, #FF5FA0)', borderRadius: 16, padding: 18, marginBottom: 10, cursor: 'pointer', transition: 'transform .2s' },
  featuredLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', opacity: .8, marginBottom: 6 },
  featuredTitle: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 6 },
  featuredMeta: { fontSize: 12, opacity: .8, display: 'flex', gap: 12, flexWrap: 'wrap' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 24 },
  catCard: { borderRadius: 16, padding: '14px 13px', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s', border: '1px solid transparent' },
  catIcon: { fontSize: 24, marginBottom: 6, display: 'block' },
  catName: { fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 2 },
  catMeta: { fontSize: 10, opacity: .65 },
};

const CAT_STYLES = {
  culture:  { background: 'linear-gradient(135deg, #2a1f4e, #3d2a6e)', borderColor: '#4a3580' },
  sciences: { background: 'linear-gradient(135deg, #1f3a2e, #1a4d3a)', borderColor: '#2a6b4e' },
  cinema:   { background: 'linear-gradient(135deg, #3a1f2a, #5a1f35)', borderColor: '#7a2a45' },
  sport:    { background: 'linear-gradient(135deg, #2a2a1f, #3d3a18)', borderColor: '#5a5520' },
  histoire: { background: 'linear-gradient(135deg, #1f2a3a, #1a3050)', borderColor: '#2a4570' },
  langues:  { background: 'linear-gradient(135deg, #2a1f1f, #4a2a1a)', borderColor: '#6a3a20' },
};

export default function Home() {
  const navigate = useNavigate();
  const categories = getCategoryList();

  const totalThemes = categories.reduce((s, c) => s + Object.keys(c.themes).length, 0);
  const totalQuizzes = categories.reduce((s, c) =>
    s + Object.values(c.themes).reduce((s2, t) => s2 + t.quizzes.length, 0), 0);

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
            <div style={styles.statNum}>{totalQuizzes}+</div>
            <div style={styles.statLabel}>Quiz</div>
          </div>
        </div>
      </div>

      {/* Quiz du jour */}
      <div className="section-label">Quiz du jour</div>
      <div
        style={styles.featured}
        onClick={() => navigate('/quiz/cinema/classiques/cin-cl-1')}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <div style={styles.featuredLabel}>⭐ Sélection du jour</div>
        <div style={styles.featuredTitle}>Cinéma classique — Les incontournables</div>
        <div style={styles.featuredMeta}>
          <span>🟡 Moyen</span>
          <span>⚡ +10–30 XP/question</span>
          <span>5 questions</span>
        </div>
      </div>

      {/* Catégories */}
      <div className="section-label" style={{ marginTop: 20 }}>Catégories</div>
      <div style={styles.catGrid}>
        {categories.map((cat) => {
          const themeCount = Object.keys(cat.themes).length;
          const quizCount = Object.values(cat.themes).reduce((s, t) => s + t.quizzes.length, 0);
          return (
            <div
              key={cat.id}
              style={{ ...styles.catCard, ...CAT_STYLES[cat.id] }}
              onClick={() => navigate(`/category/${cat.id}`)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={styles.catIcon}>{cat.icon}</span>
              <div style={styles.catName}>{cat.label}</div>
              <div style={styles.catMeta}>{themeCount} thèmes · {quizCount} quiz</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
