// ─── THEMES / QUIZZES / QUIZPLAY ────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CATEGORIES, DIFF_LABELS, DIFF_COLORS, XP_MAP, XP_TIMER_BONUS } from '../data/quizData';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../hooks/useQuiz';
import { LEAGUES } from '../utils/league';
import { shareScore } from '../utils/share';
import { pickResultMessage } from '../utils/resultMessages';
import Confetti from '../components/Confetti';
import { findCosmetic, isAvatar } from '../data/cosmetics';

// ── Themes ───────────────────────────────────────────────────────────────────
export function Themes() {
  const { catId } = useParams();
  const navigate = useNavigate();
  const cat = CATEGORIES[catId];
  const [quizCounts, setQuizCounts] = useState({}); // themeId → nb quiz
  const [countsLoaded, setCountsLoaded] = useState(false);

  useEffect(() => {
    if (!cat) return;
    (async () => {
      const snap = await getDocs(query(collection(db, 'quizzes'), where('catId', '==', catId)));
      const counts = {};
      snap.docs.forEach(d => {
        const tid = d.data().themeId;
        counts[tid] = (counts[tid] || 0) + 1;
      });
      setQuizCounts(counts);
      setCountsLoaded(true);
    })();
  }, [catId]);

  if (!cat) return <Navigate to="/" replace />;

  // Thèmes avec quiz d'abord, thèmes encore vides en dernier (grisés, « bientôt »)
  const themes = Object.values(cat.themes).sort((a, b) => (quizCounts[b.id] ? 1 : 0) - (quizCounts[a.id] ? 1 : 0));
  const isEmpty = (t) => countsLoaded && !quizCounts[t.id];

  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Accueil</Link>
        <span className="sep">›</span>
        <span className="current">{cat.icon} {cat.label}</span>
      </div>
      <div className="page-title">{cat.icon} {cat.label}</div>
      <div className="page-sub">{themes.length} thèmes</div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(DIFF_LABELS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: DIFF_COLORS[k] }} />
            {v} +{XP_MAP[k]} XP
          </div>
        ))}
      </div>

      {themes.map(theme => (
        <div
          key={theme.id}
          onClick={() => !isEmpty(theme) && navigate(`/category/${catId}/theme/${theme.id}`)}
          style={{
            background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16,
            padding: '14px 15px', marginBottom: 8, cursor: isEmpty(theme) ? 'default' : 'pointer', transition: 'all .2s',
            opacity: isEmpty(theme) ? 0.45 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
          onMouseEnter={e => { if (isEmpty(theme)) return; e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'rgba(155,109,255,.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--s2)'; e.currentTarget.style.background = 'var(--s1)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, background: 'var(--s2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {theme.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{theme.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {!countsLoaded ? '…' : isEmpty(theme) ? 'Bientôt disponible' : `${quizCounts[theme.id]} quiz disponibles`}
              </div>
            </div>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 18 }}>›</span>
        </div>
      ))}
    </div>
  );
}

// ── Quizzes ───────────────────────────────────────────────────────────────────
const PASS = 60; // % à atteindre pour débloquer l'étape suivante

export function Quizzes() {
  const { catId, themeId } = useParams();
  const navigate = useNavigate();
  const cat = CATEGORIES[catId];
  const theme = cat?.themes[themeId];
  const [quizzes, setQuizzes]   = useState([]);
  const [qCounts, setQCounts]   = useState({});
  const [loading, setLoading]   = useState(true);
  const { user, profile, isAdmin } = useAuth();
  const bestScores = profile?.bestScores || {};
  const [lockMsg, setLockMsg] = useState('');

  const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };

  useEffect(() => {
    if (!cat || !theme) return;
    (async () => {
      const snap = await getDocs(
        query(collection(db, 'quizzes'),
          where('catId',    '==', catId),
          where('themeId',  '==', themeId)
        )
      );
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (DIFF_ORDER[a.diff] ?? 3) - (DIFF_ORDER[b.diff] ?? 3));
      setQuizzes(list);
      setLoading(false);
      // Nombre de questions par quiz (requêtes par paquets de 10 ids)
      const counts = {};
      for (let i = 0; i < list.length; i += 10) {
        const ids = list.slice(i, i + 10).map(q => q.id);
        const qs = await getDocs(query(collection(db, 'questions'), where('quizId', 'in', ids)));
        qs.docs.forEach(d => { const id = d.data().quizId; counts[id] = (counts[id] || 0) + 1; });
      }
      setQCounts(counts);
    })();
  }, [catId, themeId]);

  if (!cat || !theme) return <Navigate to="/" replace />;

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
      <div className="page-sub">{loading ? '…' : `${quizzes.length} quiz disponibles`}</div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Chargement…</div>}

      {!loading && quizzes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 14 }}>
          Aucun quiz disponible pour ce thème pour le moment.
        </div>
      )}

      {lockMsg && <div style={{ background: 'rgba(255,200,87,.12)', border: '1px solid var(--yellow)', borderRadius: 12, padding: '9px 12px', fontSize: 12, marginBottom: 10 }}>🔒 {lockMsg}</div>}

      {!loading && quizzes.length > 1 && user && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
          🗺️ Parcours : {quizzes.filter(z => (bestScores[z.id] ?? -1) >= PASS).length}/{quizzes.length} étapes validées (≥ {PASS} %)
        </div>
      )}

      {quizzes.map((quiz, idx) => {
        const xpBase = XP_MAP[quiz.diff] || 10;
        const xpMax  = xpBase + (XP_TIMER_BONUS[quiz.diff] || 20);
        const best   = bestScores[quiz.id];
        const prev   = quizzes[idx - 1];
        const laterPlayed = quizzes.slice(idx + 1).some(z => bestScores[z.id] !== undefined);
        const unlocked = !user || isAdmin || idx === 0 || (bestScores[prev.id] ?? -1) >= PASS || best !== undefined || laterPlayed;
        const stars = best === undefined ? 0 : best === 100 ? 3 : best >= 80 ? 2 : best >= PASS ? 1 : 0;
        return (
          <div key={quiz.id} style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 34, flexShrink: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800,
                background: !unlocked ? 'var(--s2)' : stars > 0 ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'var(--s1)',
                border: `2px solid ${unlocked ? 'var(--purple)' : 'var(--s3)'}`, color: '#fff',
              }}>{!unlocked ? '🔒' : stars > 0 ? '✓' : idx + 1}</div>
              {idx < quizzes.length - 1 && <div style={{ flex: 1, width: 3, background: unlocked && stars > 0 ? 'var(--purple)' : 'var(--s2)', margin: '2px 0' }} />}
            </div>
            <div
              onClick={() => {
                if (!unlocked) { setLockMsg(`Valide « ${prev.name} » avec au moins ${PASS} % pour débloquer cette étape.`); return; }
                setLockMsg(''); navigate(`/quiz/${catId}/${themeId}/${quiz.id}`);
              }}
              style={{
                flex: 1, background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, opacity: unlocked ? 1 : 0.55,
                padding: '14px 15px', marginBottom: 8, cursor: 'pointer', transition: 'all .2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 15 }}>{quiz.name}</div>
                <span className={`diff-badge diff-${quiz.diff}`}>{DIFF_LABELS[quiz.diff]}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
                <span>📋 {qCounts[quiz.id] ?? '…'} questions</span>
                <span style={{ fontWeight: 600, color: 'var(--yellow)' }}>⚡ {xpBase}–{xpMax} XP/question</span>
                {best !== undefined && (
                  <span style={{ fontWeight: 700, color: best === 100 ? 'var(--cyan)' : 'var(--purple)' }}>
                    {'★'.repeat(stars)}{'☆'.repeat(3 - stars)} Meilleur : {best}%
                  </span>
                )}
              </div>
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
  const navigate  = useNavigate();
  const cat   = CATEGORIES[catId];
  const theme = cat?.themes[themeId];

  const [quizMeta,   setQuizMeta]   = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Charger le quiz + ses questions depuis Firestore
        const [quizSnap, qSnap] = await Promise.all([
          getDocs(query(collection(db, 'quizzes'), where('__name__', '==', quizId))),
          getDocs(query(collection(db, 'questions'), where('quizId', '==', quizId))),
        ]);

        if (quizSnap.empty) { setNotFound(true); setLoading(false); return; }

        const meta = { id: quizSnap.docs[0].id, ...quizSnap.docs[0].data() };
        const qs   = qSnap.docs.map(d => ({
          id: d.id,
          t:  d.data().text,
          o:  d.data().options,
          a:  d.data().answer,
          e:  d.data().explanation || '',
        }));

        if (qs.length === 0) { setNotFound(true); setLoading(false); return; }

        setQuizMeta(meta);
        setQuestions(qs);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setNotFound(true);
        setLoading(false);
      }
    })();
  }, [quizId]);

  if (loading) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <div style={{ color: 'var(--muted)' }}>Chargement du quiz…</div>
    </div>
  );

  if (notFound) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>😕</div>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Quiz introuvable</div>
      <div style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 13 }}>Ce quiz n'a pas encore de questions.</div>
      <button className="btn btn-primary" onClick={() => navigate(-1)}>← Retour</button>
    </div>
  );

  // Construire l'objet quizData attendu par useQuiz
  const quizData = {
    id:        quizMeta.id,
    name:      quizMeta.name,
    diff:      quizMeta.diff,
    questions,
  };

  return <QuizPlayInner quizData={quizData} cat={cat} theme={theme} catId={catId} themeId={themeId} navigate={navigate} />;
}

// ── QuizPlayInner — logique de jeu ────────────────────────────────────────────
export function QuizPlayInner({ quizData, cat, theme, catId, themeId, navigate, backTo, tagLabel, extra, noReplay }) {
  const back = backTo || `/category/${catId}/theme/${themeId}`;
  const { user } = useAuth();
  const [report, setReport] = useState('idle'); // idle | menu | sent | login | error
  const quiz = useQuiz(quizData);
  const [xpToast, setXpToast] = useState({ show: false, msg: '' });
  const toastTimer = useRef(null);

  function showXPToast(msg) {
    clearTimeout(toastTimer.current);
    setXpToast({ show: true, msg });
    toastTimer.current = setTimeout(() => setXpToast({ show: false, msg: '' }), 1800);
  }

  async function sendReport(reason) {
    const cq = quiz.currentQuestion;
    if (!user) { setReport('login'); return; }
    try {
      await addDoc(collection(db, 'reports'), {
        questionId: cq?.id || '', quizId: quizData.id || '', quizName: quizData.name || '',
        text: cq?.t || '', reason, reporterUid: user.uid, createdAt: serverTimestamp(),
      });
      setReport('sent');
    } catch (e) { console.error(e); setReport('error'); }
  }

  // Nouvelle question → on réinitialise le bouton de signalement
  useEffect(() => { setReport('idle'); }, [quiz.qIndex]);

  function handleAnswer(i) {
    const result = quiz.answer(i);
    if (result?.correct) showXPToast(`+${result.xpGained} XP ⚡${result.mult > 1 ? ` · combo ×${result.mult} 🔥` : ''}`);
  }

  if (quiz.status === 'finished') {
    return <ResultScreen quiz={quiz} quizData={quizData} catId={catId} themeId={themeId} navigate={navigate} onReplay={quiz.restart} onPractice={quiz.practiceWrong} backTo={back} extra={extra} noReplay={noReplay} />;
  }

  const q        = quiz.currentQuestion;
  const pct      = (quiz.qIndex / quiz.totalQuestions) * 100;
  const timerPct = quiz.timeLeft / quiz.TIMER_DURATION;
  const timerColor = timerPct > 0.5 ? 'var(--cyan)' : timerPct > 0.25 ? 'var(--yellow)' : 'var(--pink)';

  return (
    <div className="page">
      <div className={`toast ${xpToast.show ? 'show' : ''}`}>{xpToast.msg}</div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingTop: 4 }}>
        <button className="btn btn-secondary" style={{ padding: '6px 11px', fontSize: 12 }}
          onClick={() => {
            const inProgress = quiz.qIndex > 0 || quiz.answered;
            if (inProgress && !window.confirm('Quitter le quiz en cours ? Ta progression sera perdue.')) return;
            navigate(back);
          }}>← Retour</button>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
          {quiz.qIndex + 1} / {quiz.totalQuestions}
        </div>
        {quiz.timerEnabled ? (
          <div className="timer-circle">
            <svg viewBox="0 0 36 36" width="36" height="36">
              <circle className="tc-bg" cx="18" cy="18" r="15.9" />
              <circle className="tc-fg" cx="18" cy="18" r="15.9"
                style={{ strokeDashoffset: 100 - timerPct * 100, stroke: timerColor }} />
            </svg>
            <div className="timer-num" style={{ color: timerColor }}>{quiz.timeLeft}</div>
          </div>
        ) : <div style={{ width: 36 }} />}
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
        <span className={`diff-badge diff-${quiz.qDiff}`}>{DIFF_LABELS[quiz.qDiff]}</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          +{quiz.XP_MAP[quiz.qDiff]} XP/réponse
          {quiz.timerEnabled && ` · bonus vitesse jusqu'à +${quiz.XP_TIMER_BONUS[quiz.qDiff]} XP`}
        </span>
        {quiz.combo >= 2 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--yellow)' }}>
            🔥 ×{quiz.combo}
          </span>
        )}
      </div>

      {/* Question */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: '18px 16px', marginBottom: 12 }}>
        {tagLabel && (
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--purple)', marginBottom: 8 }}>
            {tagLabel}
          </div>
        )}
        {cat && theme && (
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--purple)', marginBottom: 8 }}>
            {cat.label} › {theme.label}
          </div>
        )}
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 'clamp(14px, 3.8vw, 18px)', fontWeight: 700, lineHeight: 1.4 }}>
          {q?.t}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
        {q?.o.map((opt, i) => {
          let borderColor = 'var(--s2)', bg = 'var(--s1)', letterBg = 'var(--s2)', letterColor = 'var(--muted)';
          if (quiz.answered) {
            if (i === q.a)                   { borderColor = 'var(--cyan)';  bg = 'rgba(61,255,208,.07)'; letterBg = 'var(--cyan)';  letterColor = '#0f0e17'; }
            else if (i === quiz.selectedOption) { borderColor = 'var(--pink)'; bg = 'rgba(255,95,160,.07)'; letterBg = 'var(--pink)'; letterColor = '#fff'; }
          }
          return (
            <div key={i} onClick={() => !quiz.answered && handleAnswer(i)}
              style={{ background: bg, border: `2px solid ${borderColor}`, borderRadius: 10, padding: '12px 13px', cursor: quiz.answered ? 'default' : 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500 }}
              onMouseEnter={e => { if (!quiz.answered) { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.background = 'rgba(155,109,255,.08)'; } }}
              onMouseLeave={e => { if (!quiz.answered) { e.currentTarget.style.borderColor = 'var(--s2)'; e.currentTarget.style.background = 'var(--s1)'; } }}
            >
              <div style={{ width: 25, height: 25, borderRadius: 7, background: letterBg, color: letterColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {['A','B','C','D'][i]}
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

      {quiz.answered && quiz.currentQuestion?.id && (
        <div style={{ textAlign: 'right', marginBottom: 10, fontSize: 11 }}>
          {report === 'idle' && <span style={{ color: 'var(--muted)', cursor: 'pointer' }} onClick={() => setReport('menu')}>🚩 Signaler cette question</span>}
          {report === 'menu' && (
            <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {['Réponse fausse', 'Question ambiguë', 'Faute / typo', 'Autre'].map(r => (
                <span key={r} onClick={() => sendReport(r)} style={{ border: '1px solid var(--s3)', borderRadius: 14, padding: '3px 9px', cursor: 'pointer', color: 'var(--muted)' }}>{r}</span>
              ))}
            </span>
          )}
          {report === 'sent' && <span style={{ color: 'var(--cyan)' }}>Merci, signalement envoyé ✓</span>}
          {report === 'login' && <span style={{ color: 'var(--muted)' }}>Connecte-toi pour signaler une question</span>}
          {report === 'error' && <span style={{ color: 'var(--pink)' }}>Envoi impossible pour le moment</span>}
        </div>
      )}

      {quiz.answered && quiz.over && (
        <div style={{ textAlign: 'center', color: 'var(--pink)', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
          💥 Mort subite : une erreur et c'est fini !
        </div>
      )}

      {/* Suivant */}
      {quiz.answered && (
        <button className="btn btn-primary btn-full" onClick={quiz.next}
          style={{ animation: 'fadeIn .3s ease', fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>
          {(quiz.qIndex + 1 >= quiz.totalQuestions || quiz.over) ? 'Voir mes résultats 🏆' : 'Question suivante →'}
        </button>
      )}
    </div>
  );
}

// ── ResultScreen ──────────────────────────────────────────────────────────────
function ResultScreen({ quiz, quizData, catId, themeId, navigate, onReplay, onPractice, backTo, extra, noReplay }) {
  const pct   = quiz.score / quiz.totalQuestions;
  const msg = React.useMemo(() => pickResultMessage(pct), []);
  const { emoji, title } = msg;
  const [xpBarWidth, setXpBarWidth] = React.useState(0);
  const [shareMsg, setShareMsg] = React.useState('');
  const [celebrate, setCelebrate] = React.useState(true);
  const { profile } = useAuth();
  const xpInLevel = profile?.xpInLevel || 0;
  const level     = profile?.level || 1;

  React.useEffect(() => {
    setTimeout(() => setXpBarWidth((xpInLevel / 200) * 100), 400);
  }, [xpInLevel]);

  return (
    <div>
      {quiz.rewards?.milestone > 0 && celebrate && (
        <div onClick={() => setCelebrate(false)} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(10,5,30,.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <Confetti />
          <div style={{ fontSize: 84 }}>🔥</div>
          <div style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 900, fontSize: 34, margin: '6px 0' }}>{quiz.rewards.milestone} jours de série !</div>
          <div style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 14 }}>Tu joues sans interruption, bravo. Bonus : <strong style={{ color: 'var(--yellow)' }}>+{quiz.rewards.milestoneBonus} XP</strong></div>
          <button className="btn btn-primary" onClick={() => setCelebrate(false)}>Continuer</button>
        </div>
      )}
    <div className="page">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 50, marginBottom: 10, animation: 'popIn .5s cubic-bezier(.175,.885,.32,1.275)' }}>{emoji}</div>
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{title}</div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{msg.sub}</div>
      </div>

      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, margin: '14px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--yellow)' }}>{quiz.score}/{quiz.totalQuestions}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Score</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--cyan)' }}>+{quiz.totalXP}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{quiz.practice ? 'XP (révision)' : 'XP gagnés'}</div>
        </div>
        <div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--purple)' }}>
            {quiz.avgTime !== null ? `${quiz.avgTime}s` : '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Temps moy.</div>
        </div>
      </div>

      <div className="xp-bar-wrap">
        <div className="xp-bar-labels">
          <span>Niveau {level}</span>
          <span>{xpInLevel} / 200 XP</span>
        </div>
        <div className="xp-bar-bg">
          <div className="xp-bar-fill" style={{ width: `${xpBarWidth}%` }} />
        </div>
      </div>

      {quiz.rewards && (quiz.rewards.missionBonus > 0 || quiz.rewards.goalReached || quiz.rewards.milestone > 0 || quiz.rewards.newCosmetics?.length > 0 || quiz.rewards.leagueMoved || quiz.rewards.chestXP > 0 || quiz.rewards.freezeUsed || quiz.rewards.freezeGained || quiz.rewards.streak > 1) && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '11px 14px', marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
          {quiz.rewards.chestXP > 0 && <div>🎁 Coffre du jour : <strong style={{ color: 'var(--yellow)' }}>+{quiz.rewards.chestXP} XP</strong></div>}
          {quiz.rewards.goalReached && <div>🎯 Objectif du jour atteint : <strong style={{ color: 'var(--yellow)' }}>+{quiz.rewards.goalBonus} XP</strong></div>}
          {(quiz.rewards.missions || []).map(l => <div key={l}>✅ Mission : {l} <strong style={{ color: 'var(--yellow)' }}>+15 XP</strong></div>)}
          {quiz.rewards.weeklyNew && <div>🏆 Mission de la semaine accomplie <strong style={{ color: 'var(--yellow)' }}>+60 XP</strong></div>}
          {quiz.rewards.streak > 1 && <div>🔥 Série : <strong>{quiz.rewards.streak} jours</strong></div>}
          {quiz.rewards.freezeUsed && <div>🧊 Un gel de série a sauvé ta série d'hier !</div>}
          {quiz.rewards.freezeGained && <div>🧊 Nouveau gel de série gagné (7 jours d'affilée) !</div>}
          {(quiz.rewards.newCosmetics || []).map(id => { const c = findCosmetic(id); return c && <div key={id}>🎨 Débloqué : {isAvatar(id) ? `avatar ${c.icon} ${c.name}` : `titre « ${c.name} »`}</div>; })}
          {quiz.rewards.leagueMoved === 'up' && <div>🏅 Tu montes en ligue <strong>{LEAGUES[quiz.rewards.league].name}</strong> {LEAGUES[quiz.rewards.league].icon}</div>}
          {quiz.rewards.leagueMoved === 'down' && <div>📉 Tu redescends en ligue <strong>{LEAGUES[quiz.rewards.league].name}</strong>. Rejoue pour remonter !</div>}
        </div>
      )}

      {extra && (quiz.saved ? extra : <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 14 }}>Enregistrement du score…</div>)}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {quiz.wrongCount > 0 && (
          <button className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}
            onClick={onPractice}>
            🔁 Rejouer mes {quiz.wrongCount} erreur{quiz.wrongCount > 1 ? 's' : ''} (sans XP)
          </button>
        )}
        <button className="btn btn-secondary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}
          onClick={async () => {
            const r = await shareScore({ score: quiz.score, total: quiz.totalQuestions, name: quizData?.name || 'Quiz', url: window.location.href });
            setShareMsg(r === 'copied' ? 'Lien copié ✓' : r === 'downloaded' ? 'Image téléchargée ✓' : r === 'shared' ? 'Partagé ✓' : '');
          }}>
          📣 Partager mon score{shareMsg ? ` · ${shareMsg}` : ''}
        </button>
        {!noReplay && (
          <button className={`btn ${quiz.wrongCount > 0 ? 'btn-secondary' : 'btn-primary'} btn-full`} style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}
            onClick={onReplay}>
            Rejouer ce quiz
          </button>
        )}
        <button className="btn btn-secondary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}
          onClick={() => navigate(backTo || `/category/${catId}/theme/${themeId}`)}>
          {backTo && !catId ? 'Retour' : 'Autres quiz du thème'}
        </button>
        <button className="btn btn-secondary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}
          onClick={() => navigate('/')}>
          Accueil
        </button>
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
    </div>
    </div>
  );
}

export default QuizPlay;
