// ─── THEMES PAGE ───────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CATEGORIES, DIFF_LABELS, DIFF_COLORS, XP_MAP, XP_TIMER_BONUS } from '../data/quizData';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../hooks/useQuiz';

// ── Themes ──────────────────────────────────────────────────────────────────
export function Themes() {
  const { catId } = useParams();
  const navigate = useNavigate();
  const cat = CATEGORIES[catId];
  if (!cat) { navigate('/'); return null; }
  const themes = Object.values(cat.themes);

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Accueil</Link>
        <span className="sep">›</span>
        <span className="current">{cat.icon} {cat.label}</span>
      </div>
      <div className="page-title">{cat.icon} {cat.label}</div>
      <div className="page-sub">{themes.length} thèmes disponibles</div>

      {/* Légende difficulté */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(DIFF_LABELS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: DIFF_COLORS[k] }} />
            {v} +{XP_MAP[k]} XP
          </div>
        ))}
      </div>

      {themes.map((theme) => {
        const totalQ = theme.quizzes.reduce((s, q) => s + q.questions.length, 0);
        const diffs = [...new Set(theme.quizzes.map((q) => q.diff))];
        return (
          <div
            key={theme.id}
            onClick={() => navigate(`/category/${catId}/theme/${theme.id}`)}
            style={{
              background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16,
              padding: '14px 15px', marginBottom: 8, cursor: 'pointer', transition: 'all .2s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'rgba(155,109,255,.07)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--s2)'; e.currentTarget.style.background = 'var(--s1)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, background: 'var(--s2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {theme.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{theme.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {theme.quizzes.length} quiz · {totalQ} questions
                  {diffs.map((d) => (
                    <span key={d} className={`diff-badge diff-${d}`}>{DIFF_LABELS[d]}</span>
                  ))}
                </div>
              </div>
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 18 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quizzes ──────────────────────────────────────────────────────────────────
export function Quizzes() {
  const { catId, themeId } = useParams();
  const navigate = useNavigate();
  const cat = CATEGORIES[catId];
  const theme = cat?.themes[themeId];
  if (!cat || !theme) { navigate('/'); return null; }

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Accueil</Link>
        <span className="sep">›</span>
        <Link to={`/category/${catId}`}>{cat.icon} {cat.label}</Link>
        <span className="sep">›</span>
        <span className="current">{theme.label}</span>
      </div>
      <div className="page-title">{theme.icon} {theme.label}</div>
      <div className="page-sub">{theme.quizzes.length} quiz disponibles</div>

      {theme.quizzes.map((quiz) => {
        const xpBase = XP_MAP[quiz.diff];
        const xpMax = xpBase + XP_TIMER_BONUS[quiz.diff];
        return (
          <div
            key={quiz.id}
            onClick={() => navigate(`/quiz/${catId}/${themeId}/${quiz.id}`)}
            style={{
              background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16,
              padding: '14px 15px', marginBottom: 8, cursor: 'pointer', transition: 'all .2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--s2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 }}>{quiz.name}</div>
              <span className={`diff-badge diff-${quiz.diff}`}>{DIFF_LABELS[quiz.diff]}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--muted)' }}>
              <span>📋 {quiz.questions.length} questions</span>
              <span style={{ fontWeight: 600, color: 'var(--yellow)' }}>⚡ {xpBase}–{xpMax} XP/question</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── QuizPlay ──────────────────────────────────────────────────────────────────
export function QuizPlay() {
  const { catId, themeId, quizId } = useParams();
  const navigate = useNavigate();
  const cat = CATEGORIES[catId];
  const theme = cat?.themes[themeId];
  const quizData = theme?.quizzes.find((q) => q.id === quizId);

  if (!quizData) { navigate('/'); return null; }

  const quiz = useQuiz(quizData);

  // Toast XP local
  const [xpToast, setXpToast] = useState({ show: false, msg: '' });
  const toastTimer = useRef(null);

  function showXPToast(msg) {
    clearTimeout(toastTimer.current);
    setXpToast({ show: true, msg });
    toastTimer.current = setTimeout(() => setXpToast({ show: false, msg: '' }), 1800);
  }

  function handleAnswer(i) {
    const result = quiz.answer(i);
    if (result?.correct) {
      showXPToast(`+${result.xpGained} XP ⚡`);
    }
  }

  // Résultats
  if (quiz.status === 'finished') {
    return <ResultScreen quiz={quiz} quizData={quizData} catId={catId} themeId={themeId} navigate={navigate} />;
  }

  const q = quiz.currentQuestion;
  const pct = (quiz.qIndex / quiz.totalQuestions) * 100;
  const timerPct = quiz.timeLeft / quiz.TIMER_DURATION;
  const timerColor = timerPct > 0.5 ? 'var(--cyan)' : timerPct > 0.25 ? 'var(--yellow)' : 'var(--pink)';

  return (
    <div className="page">
      {/* XP Toast */}
      <div className={`toast ${xpToast.show ? 'show' : ''}`}>{xpToast.msg}</div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingTop: 4 }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 11px', fontSize: 12 }}
          onClick={() => navigate(`/category/${catId}/theme/${themeId}`)}
        >
          ← Retour
        </button>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
          {quiz.qIndex + 1} / {quiz.totalQuestions}
        </div>
        {quiz.timerEnabled ? (
          <div className="timer-circle">
            <svg viewBox="0 0 36 36" width="36" height="36">
              <circle className="tc-bg" cx="18" cy="18" r="15.9" />
              <circle
                className="tc-fg"
                cx="18" cy="18" r="15.9"
                style={{ strokeDashoffset: 100 - timerPct * 100, stroke: timerColor }}
              />
            </svg>
            <div className="timer-num" style={{ color: timerColor }}>{quiz.timeLeft}</div>
          </div>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>

      {/* Timer toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 11, padding: '9px 13px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>⏱ Timer</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Bonus XP si activé</div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={quiz.timerEnabled} onChange={quiz.toggleTimer} />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--s2)', borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--purple), var(--pink))', borderRadius: 10, width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>

      {/* Difficulté */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className={`diff-badge diff-${quiz.diff}`}>{DIFF_LABELS[quiz.diff]}</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          +{quiz.XP_MAP[quiz.diff]} XP/réponse
          {quiz.timerEnabled && ` · bonus vitesse jusqu'à +${quiz.XP_TIMER_BONUS[quiz.diff]} XP`}
        </span>
      </div>

      {/* Question */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: '18px 16px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--purple)', marginBottom: 8 }}>
          {cat.label} › {theme.label}
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(14px, 3.8vw, 18px)', fontWeight: 700, lineHeight: 1.4 }}>
          {q?.t}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
        {q?.o.map((opt, i) => {
          let borderColor = 'var(--s2)';
          let bg = 'var(--s1)';
          let letterBg = 'var(--s2)';
          let letterColor = 'var(--muted)';

          if (quiz.answered) {
            if (i === q.a) { borderColor = 'var(--cyan)'; bg = 'rgba(61,255,208,.07)'; letterBg = 'var(--cyan)'; letterColor = '#0f0e17'; }
            else if (i === quiz.selectedOption) { borderColor = 'var(--pink)'; bg = 'rgba(255,95,160,.07)'; letterBg = 'var(--pink)'; letterColor = '#fff'; }
          }

          return (
            <div
              key={i}
              onClick={() => !quiz.answered && handleAnswer(i)}
              style={{
                background: bg, border: `2px solid ${borderColor}`, borderRadius: 10,
                padding: '12px 13px', cursor: quiz.answered ? 'default' : 'pointer',
                transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500,
              }}
              onMouseEnter={(e) => { if (!quiz.answered) { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'rgba(155,109,255,.08)'; } }}
              onMouseLeave={(e) => { if (!quiz.answered) { e.currentTarget.style.borderColor = 'var(--s2)'; e.currentTarget.style.background = 'var(--s1)'; } }}
            >
              <div style={{ width: 25, height: 25, borderRadius: 7, background: letterBg, color: letterColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {['A', 'B', 'C', 'D'][i]}
              </div>
              {opt}
            </div>
          );
        })}
      </div>

      {/* Explication */}
      {quiz.answered && quiz.explanation && (
        <div style={{ background: 'rgba(61,255,208,.05)', border: '1px solid rgba(61,255,208,.16)', borderRadius: 10, padding: '11px 13px', marginBottom: 12, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, animation: 'fadeIn .3s ease' }}>
          <strong style={{ color: 'var(--cyan)' }}>
            {quiz.selectedOption === quiz.currentQuestion?.a ? '✓ Bonne réponse !' : '✗ Pas tout à fait.'}
          </strong>{' '}
          {quiz.explanation}
        </div>
      )}

      {/* Bouton suivant */}
      {quiz.answered && (
        <button
          className="btn btn-primary btn-full"
          onClick={quiz.next}
          style={{ animation: 'fadeIn .3s ease', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
        >
          {quiz.qIndex + 1 >= quiz.totalQuestions ? 'Voir mes résultats 🏆' : 'Question suivante →'}
        </button>
      )}
    </div>
  );
}

// ── ResultScreen ──────────────────────────────────────────────────────────────
function ResultScreen({ quiz, quizData, catId, themeId, navigate }) {
  const pct = quiz.score / quiz.totalQuestions;
  const emoji = pct === 1 ? '🏆' : pct >= 0.8 ? '⭐' : pct >= 0.6 ? '👍' : pct >= 0.4 ? '🤔' : '💪';
  const title = pct === 1 ? 'Parfait !' : pct >= 0.8 ? 'Excellent !' : pct >= 0.6 ? 'Bien joué !' : pct >= 0.4 ? 'Pas mal !' : 'Continue !';
  const [xpBarWidth, setXpBarWidth] = React.useState(0);
  const { profile } = useAuth();
  const xpInLevel = profile?.xpInLevel || 0;
  const level = profile?.level || 1;

  React.useEffect(() => {
    setTimeout(() => setXpBarWidth((xpInLevel / 200) * 100), 400);
  }, [xpInLevel]);

  return (
    <div className="page">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 50, marginBottom: 10, animation: 'popIn .5s cubic-bezier(.175,.885,.32,1.275)' }}>{emoji}</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{title}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{pct >= 0.6 ? 'Tu maîtrises le sujet !' : "Reviens t'entraîner !"}</div>
      </div>

      {/* Score grid */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, margin: '14px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--yellow)' }}>{quiz.score}/{quiz.totalQuestions}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Score</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--cyan)' }}>+{quiz.totalXP}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>XP gagnés</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--purple)' }}>
            {quiz.avgTime !== null ? `${quiz.avgTime}s` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Temps moy.</div>
        </div>
      </div>

      {/* XP bar */}
      <div className="xp-bar-wrap">
        <div className="xp-bar-labels">
          <span>Niveau {level}</span>
          <span>{xpInLevel} / 200 XP</span>
        </div>
        <div className="xp-bar-bg">
          <div className="xp-bar-fill" style={{ width: `${xpBarWidth}%` }} />
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary btn-full" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
          onClick={() => navigate(`/quiz/${catId}/${themeId}/${quizData.id}`)}>
          Rejouer ce quiz
        </button>
        <button className="btn btn-secondary btn-full" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
          onClick={() => navigate(`/category/${catId}/theme/${themeId}`)}>
          Autres quiz du thème
        </button>
        <button className="btn btn-secondary btn-full" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
          onClick={() => navigate('/')}>
          Accueil
        </button>
      </div>

      <style>{`
        @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
      `}</style>
    </div>
  );
}

export default QuizPlay;
