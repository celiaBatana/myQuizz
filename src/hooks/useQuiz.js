import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, setDoc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { nextLeagueState, updateReview } from '../utils/league';
import { computeUnlocks } from '../data/cosmetics';
import { MILESTONES, GOAL_BONUS, addActiveDay, updateDayStats, newlyCompleted } from '../utils/retention';

const XP_MAP         = { easy: 5,  medium: 10, hard: 20 };
const XP_TIMER_BONUS = { easy: 10, medium: 20, hard: 30 };
const TIMER_DURATION = 15;
const XP_PER_LEVEL   = 200;
const HISTORY_MAX    = 50;

export function dayKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Multiplicateur de combo : 3 bonnes d'affilée = x1,5 ; 5 = x2
export function comboMult(c) { return c >= 5 ? 2 : c >= 3 ? 1.5 : 1; }

export function useQuiz(quiz) {
  const { user, profile, updateProfile } = useAuth();

  // Mélanger les questions (Fisher-Yates)
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Mélange l'ordre des réponses (la bonne réponse n'est plus toujours au même endroit).
  // Les questions du type « Toutes les réponses… » gardent leur ordre.
  function shuffleOptions(q) {
    const opts = q?.o;
    if (!Array.isArray(opts) || opts.length < 2) return q;
    if (opts.some(o => /^\s*(toutes|tous|aucun|aucune|les deux|a et b|b et c|a, b)/i.test(String(o)))) return q;
    const order = shuffle(opts.map((_, i) => i));
    return { ...q, o: order.map(i => opts[i]), a: order.indexOf(q.a) };
  }
  const prepare = list => shuffle(list).map(shuffleOptions);

  const [questions,      setQuestions]      = useState(() => prepare(quiz?.questions || []));
  const [qIndex,         setQIndex]         = useState(0);
  const [status,         setStatus]         = useState('playing');
  const [answered,       setAnswered]       = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [explanation,    setExplanation]    = useState('');
  const [timerEnabled,   setTimerEnabled]   = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(TIMER_DURATION);

  // Refs pour éviter les problèmes async
  const scoreRef     = useRef(0);
  const totalXPRef   = useRef(0);
  const totalTimeRef = useRef(0);
  const timedCountRef = useRef(0);
  const wrongRef      = useRef([]);
  const resultsRef    = useRef([]); // [{id, ok}] pour les stats par question
  const comboRef      = useRef(0);
  const maxComboRef   = useRef(0);
  const mode          = quiz?.mode || 'normal';
  const [combo, setCombo] = useState(0);
  const [over, setOver]   = useState(false);
  const [rewards, setRewards] = useState(null);
  const [saved, setSaved]     = useState(false);
  const [practice, setPractice] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  // States affichés dans l'UI
  const [scoreDisplay,   setScoreDisplay]   = useState(0);
  const [totalXPDisplay, setTotalXPDisplay] = useState(0);

  const timerRef     = useRef(null);
  const startTimeRef = useRef(null);

  const currentQuestion = questions[qIndex];
  const questionCount   = questions?.length || 0;
  const totalQuestions  = (mode === 'sudden' && status === 'finished') ? qIndex + 1 : questionCount;
  const diff            = quiz?.diff || 'medium';
  const qDiff           = XP_MAP[currentQuestion?.d] ? currentQuestion.d : (XP_MAP[diff] ? diff : 'medium');

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(TIMER_DURATION);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timerEnabled && timeLeft === 0 && !answered && status === 'playing') {
      handleTimeout();
    }
  }, [timeLeft, answered, timerEnabled, status]);

  useEffect(() => {
    if (timerEnabled && status === 'playing' && !answered) startTimer();
    return () => clearInterval(timerRef.current);
  }, [qIndex, timerEnabled, status]);

  function handleTimeout() {
    totalTimeRef.current += TIMER_DURATION;
    timedCountRef.current += 1;
    comboRef.current = 0; setCombo(0);
    if (mode === 'sudden') setOver(true);
    if (currentQuestion) { wrongRef.current.push(currentQuestion); setWrongCount(wrongRef.current.length); resultsRef.current.push({ id: currentQuestion.id, ok: false }); }
    setAnswered(true);
    setSelectedOption(null);
    setExplanation(currentQuestion?.e || '');
  }

  function answer(optionIndex) {
    if (answered) return;
    setAnswered(true);
    stopTimer();

    const elapsed = timerEnabled ? TIMER_DURATION - timeLeft : 0;
    setSelectedOption(optionIndex);

    const correct = optionIndex === currentQuestion?.a;
    if (currentQuestion?.id) resultsRef.current.push({ id: currentQuestion.id, ok: correct });
    let xpGained = 0;

    let mult = 1;
    if (correct) {
      xpGained = XP_MAP[qDiff];
      if (timerEnabled) {
        const speedRatio = Math.max(0, (TIMER_DURATION - elapsed) / TIMER_DURATION);
        xpGained += Math.floor(speedRatio * XP_TIMER_BONUS[qDiff]);
      }
      comboRef.current += 1; setCombo(comboRef.current);
      if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
      mult = comboMult(comboRef.current);
      xpGained = Math.round(xpGained * mult);
      // Mettre à jour les refs immédiatement (pas de problème async)
      scoreRef.current   += 1;
      totalXPRef.current += xpGained;
      setScoreDisplay(scoreRef.current);
      setTotalXPDisplay(totalXPRef.current);
    } else if (currentQuestion) {
      comboRef.current = 0; setCombo(0);
      if (mode === 'sudden') setOver(true);
      wrongRef.current.push(currentQuestion);
      setWrongCount(wrongRef.current.length);
    }

    if (timerEnabled) {
      totalTimeRef.current += elapsed;
      timedCountRef.current += 1;
    }

    setExplanation(currentQuestion?.e || '');
    return { correct, xpGained, combo: comboRef.current, mult };
  }

  function next() {
    if (qIndex + 1 >= questionCount || over) {
      finish();
    } else {
      setQIndex(i => i + 1);
      setAnswered(false);
      setSelectedOption(null);
      setExplanation('');
      if (timerEnabled) startTimer();
    }
  }

  async function finish() {
    stopTimer();
    setStatus('finished');

    // Lire les valeurs depuis les refs (pas depuis le state React)
    const finalScore = scoreRef.current;
    const finalXP    = totalXPRef.current;
    const finalTotal = mode === 'sudden' ? qIndex + 1 : questionCount;

    if (practice) return; // mode révision : rien n'est sauvegardé
    if (!user) {
      console.warn('Pas de user connecté — stats non sauvegardées');
      return;
    }

    // Stats par question (taux de réussite, vues dans l'admin) : échec non bloquant
    const results = resultsRef.current.slice();
    if (results.length) {
      (async () => {
        try {
          const batch = writeBatch(db);
          results.forEach(r => batch.set(doc(db, 'question_stats', r.id),
            { plays: increment(1), correct: increment(r.ok ? 1 : 0) }, { merge: true }));
          await batch.commit();
        } catch (e) { console.warn('Stats de question non enregistrées (règles Firestore à publier ?)', e); }
      })();
    }

    try {
      const todayKey  = dayKey();
      const lastKey   = profile?.lastStreakDate;

      // Série + gel de série
      let freezes = profile?.freezes || 0;
      let freezeUsed = false, freezeGained = false, newStreak;
      if (lastKey === todayKey)            newStreak = profile?.streak || 1;
      else if (lastKey === dayKey(-1))     newStreak = (profile?.streak || 0) + 1;
      else if (lastKey === dayKey(-2) && freezes > 0 && (profile?.streak || 0) > 0) {
        newStreak = profile.streak + 1; freezes -= 1; freezeUsed = true;
      } else newStreak = 1;
      if (lastKey !== todayKey && newStreak % 7 === 0 && freezes < 2) { freezes += 1; freezeGained = true; }

      // Coffre quotidien : bonus à la première partie du jour
      const chestXP   = profile?.lastChestDate === todayKey ? 0 : 10 + 5 * Math.floor(Math.random() * 9);

      // Paliers de série, missions du jour / semaine, objectif quotidien
      const streakUp = lastKey !== todayKey;
      const milestone = streakUp && MILESTONES[newStreak] ? newStreak : 0;
      const milestoneBonus = milestone ? MILESTONES[milestone] : 0;
      const perfectNow = finalScore === finalTotal && finalTotal > 0 && mode !== 'sudden';
      const newDayStats = updateDayStats(profile, { perfect: perfectNow, correct: finalScore, xp: finalXP, maxCombo: maxComboRef.current, mode: quiz.id === 'review' ? 'review' : mode });
      const newActiveDays = addActiveDay(profile?.activeDays, todayKey);
      const mis = newlyCompleted(profile, newDayStats, newActiveDays);
      const baseXP = finalXP + chestXP + milestoneBonus + mis.bonus;
      const goal = profile?.dailyGoal || 50;
      const prevGoalXP = profile?.goalDate === todayKey ? (profile?.goalXP || 0) : 0;
      const goalReached = prevGoalXP < goal && prevGoalXP + baseXP >= goal;
      const goalBonus = goalReached ? GOAL_BONUS : 0;
      const xpToAdd   = baseXP + goalBonus;
      const newGoalXP = prevGoalXP + xpToAdd;
      const newTotalXP = (profile?.totalXP || 0) + xpToAdd;
      const lg = nextLeagueState(profile, xpToAdd);
      const newReview = updateReview(profile?.review, results, dayKey);

      let lvl = 1, remaining = newTotalXP;
      while (remaining >= XP_PER_LEVEL) { remaining -= XP_PER_LEVEL; lvl++; }

      const today        = new Date().toDateString();
      const lastPlay     = profile?.lastPlayDate;
      const quizzesToday = lastPlay === today ? (profile?.quizzesToday || 0) : 0;

      const historyEntry = {
        quizId:   quiz.id   || '',
        quizName: quiz.name || 'Quiz',
        diff:     quiz.diff || 'medium',
        score:    finalScore,
        total:    finalTotal,
        xp:       xpToAdd,
        date:     new Date().toISOString(),
      };
      const newHistory = [...(profile?.history || []), historyEntry].slice(-HISTORY_MAX);

      const pctScore = finalTotal > 0 ? Math.round((finalScore / finalTotal) * 100) : 0;
      const prevBest = profile?.bestScores?.[quiz.id];
      const isBest   = !quiz.noBest && quiz.id && (prevBest === undefined || pctScore > prevBest);
      const perfect  = finalScore === finalTotal && finalTotal > 0 && mode !== 'sudden';
      const newSudden = mode === 'sudden' ? Math.max(profile?.suddenBest || 0, finalScore) : (profile?.suddenBest || 0);

      const gainedCosmetics = computeUnlocks(profile, {
        level: lvl, streak: newStreak,
        quizzesPlayed: (profile?.quizzesPlayed || 0) + 1,
        perfectQuizzes: (profile?.perfectQuizzes || 0) + (perfect ? 1 : 0),
      }, chestXP > 0);
      const newUnlocked = gainedCosmetics.length ? [...(profile?.unlocked || []), ...gainedCosmetics] : (profile?.unlocked || []);

      await updateDoc(doc(db, 'users', user.uid), {
        totalXP:        increment(xpToAdd),
        level:          lvl,
        xpInLevel:      remaining,
        quizzesPlayed:  increment(1),
        correctAnswers: increment(finalScore),
        totalAnswers:   increment(finalTotal),
        quizzesToday:   lastPlay === today ? increment(1) : 1,
        lastPlayDate:   today,
        history:        newHistory,
        streak:         newStreak,
        lastStreakDate: todayKey,
        freezes,
        lastChestDate:  todayKey,
        suddenBest:     newSudden,
        weekKey:        lg.weekKey,
        weekXP:         lg.weekXP,
        league:         lg.league,
        xpAt:           serverTimestamp(),
        review:         newReview,
        unlocked:       newUnlocked,
        dayStats:       newDayStats,
        activeDays:     newActiveDays,
        missionsDone:   { date: todayKey, ids: mis.ids },
        goalDate:       todayKey,
        goalXP:         newGoalXP,
        ...(mis.weeklyNew ? { weeklyDone: mis.wk } : {}),
        updatedAt:      serverTimestamp(),
        ...(isBest ? { [`bestScores.${quiz.id}`]: pctScore } : {}),
        ...(perfect ? { perfectQuizzes: increment(1) } : {}),
      });

      setRewards({ chestXP, freezeUsed, freezeGained, streak: newStreak, leagueMoved: lg.moved, league: lg.league, newCosmetics: gainedCosmetics,
        milestone, milestoneBonus, missions: mis.missions.map(m => m.label), weeklyNew: mis.weeklyNew, missionBonus: mis.bonus, goalReached, goalBonus });

      await updateProfile({
        totalXP:        newTotalXP,
        level:          lvl,
        xpInLevel:      remaining,
        quizzesPlayed:  (profile?.quizzesPlayed || 0) + 1,
        correctAnswers: (profile?.correctAnswers || 0) + finalScore,
        totalAnswers:   (profile?.totalAnswers   || 0) + finalTotal,
        quizzesToday:   quizzesToday + 1,
        lastPlayDate:   today,
        history:        newHistory,
        streak:         newStreak,
        lastStreakDate: todayKey,
        freezes,
        lastChestDate:  todayKey,
        suddenBest:     newSudden,
        weekKey:        lg.weekKey,
        weekXP:         lg.weekXP,
        league:         lg.league,
        review:         newReview,
        unlocked:       newUnlocked,
        dayStats:       newDayStats,
        activeDays:     newActiveDays,
        missionsDone:   { date: todayKey, ids: mis.ids },
        goalDate:       todayKey,
        goalXP:         newGoalXP,
        ...(mis.weeklyNew ? { weeklyDone: mis.wk } : {}),
        perfectQuizzes: (profile?.perfectQuizzes || 0) + (perfect ? 1 : 0),
        bestScores:     isBest ? { ...(profile?.bestScores || {}), [quiz.id]: pctScore } : (profile?.bestScores || {}),
      });

      // Données publiques (classement, défi du jour, duel) : échec non bloquant
      const name = profile?.displayName || user.displayName || 'Joueur';
      try {
        await setDoc(doc(db, 'leaderboard', user.uid), {
          uid: user.uid, name, totalXP: newTotalXP, level: lvl, streak: newStreak,
          weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league,
          avatar: profile?.avatar || '', title: profile?.title || '', updatedAt: serverTimestamp(),
        }, { merge: true });
        // Classements de groupes privés
        for (const code of (profile?.groups || [])) {
          await setDoc(doc(db, 'group_members', `${code}_${user.uid}`), {
            code, uid: user.uid, name, totalXP: newTotalXP, level: lvl,
            weekKey: lg.weekKey, weekXP: lg.weekXP, avatar: profile?.avatar || '', title: profile?.title || '', updatedAt: serverTimestamp(),
          }, { merge: true });
        }
        if (mode === 'daily' && quiz.dailyDate) {
          await setDoc(doc(db, 'daily_scores', `${quiz.dailyDate}_${user.uid}`), {
            uid: user.uid, name, date: quiz.dailyDate, score: finalScore, total: finalTotal, xp: finalXP, createdAt: serverTimestamp(),
          });
        }
        if (mode === 'duel' && quiz.duelId) {
          await setDoc(doc(db, 'duel_results', `${quiz.duelId}_${user.uid}`), {
            uid: user.uid, name, duelId: quiz.duelId, score: finalScore, total: finalTotal, createdAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.warn('Données publiques non enregistrées (règles Firestore à publier ?)', e);
      }
    } catch (err) {
      console.error('❌ Erreur sauvegarde quiz:', err);
    }
    setSaved(true);
  }

  function reset(list, isPractice) {
    wrongRef.current = [];
    resultsRef.current = [];
    comboRef.current = 0; maxComboRef.current = 0; setCombo(0); setOver(false); setRewards(null); setSaved(false);
    setWrongCount(0);
    setPractice(isPractice);
    scoreRef.current     = 0;
    totalXPRef.current   = 0;
    totalTimeRef.current = 0;
    timedCountRef.current = 0;
    setScoreDisplay(0);
    setTotalXPDisplay(0);
    setQIndex(0);
    setStatus('playing');
    setAnswered(false);
    setSelectedOption(null);
    setExplanation('');
    setTimeLeft(TIMER_DURATION);
    // Mélanger les questions dans un nouvel ordre
    setQuestions(prepare(list));
    clearInterval(timerRef.current);
  }

  function restart() { reset(quiz?.questions || [], false); }
  function practiceWrong() { reset(wrongRef.current.slice(), true); }

  function toggleTimer() {
    setTimerEnabled(v => {
      if (!v) startTimer();
      else stopTimer();
      return !v;
    });
  }

  const avgTime = timedCountRef.current > 0
    ? Math.round(totalTimeRef.current / timedCountRef.current)
    : null;

  return {
    qIndex,
    currentQuestion,
    totalQuestions,
    score:    scoreDisplay,
    totalXP:  totalXPDisplay,
    answered,
    selectedOption,
    status,
    explanation,
    timerEnabled,
    timeLeft,
    avgTime,
    practice,
    mode,
    combo,
    over,
    rewards,
    saved,
    qDiff,
    wrongCount,
    practiceWrong,
    diff,
    answer,
    next,
    restart,
    toggleTimer,
    XP_MAP,
    XP_TIMER_BONUS,
    TIMER_DURATION,
  };
}
