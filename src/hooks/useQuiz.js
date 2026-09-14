import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const XP_MAP         = { easy: 5,  medium: 10, hard: 20 };
const XP_TIMER_BONUS = { easy: 10, medium: 20, hard: 30 };
const TIMER_DURATION = 15;
const XP_PER_LEVEL   = 200;
const FREE_DAILY_LIMIT = 3;

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

  const [questions,      setQuestions]      = useState(() => shuffle(quiz?.questions || []));
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

  // States affichés dans l'UI
  const [scoreDisplay,   setScoreDisplay]   = useState(0);
  const [totalXPDisplay, setTotalXPDisplay] = useState(0);

  const timerRef     = useRef(null);
  const startTimeRef = useRef(null);

  const currentQuestion = questions[qIndex];
  const totalQuestions  = questions?.length || 0;
  const diff            = quiz?.diff || 'medium';

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
    let xpGained = 0;

    if (correct) {
      xpGained = XP_MAP[diff];
      if (timerEnabled) {
        const speedRatio = Math.max(0, (TIMER_DURATION - elapsed) / TIMER_DURATION);
        xpGained += Math.floor(speedRatio * XP_TIMER_BONUS[diff]);
      }
      // Mettre à jour les refs immédiatement (pas de problème async)
      scoreRef.current   += 1;
      totalXPRef.current += xpGained;
      setScoreDisplay(scoreRef.current);
      setTotalXPDisplay(totalXPRef.current);
    }

    if (timerEnabled) {
      totalTimeRef.current += elapsed;
    }

    setExplanation(currentQuestion?.e || '');
    return { correct, xpGained };
  }

  function next() {
    if (qIndex + 1 >= totalQuestions) {
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
    const finalTime  = totalTimeRef.current;

    console.log('Quiz terminé — score:', finalScore, 'XP:', finalXP, 'user:', user?.uid);

    if (!user) {
      console.warn('Pas de user connecté — stats non sauvegardées');
      return;
    }

    try {
      const xpToAdd    = finalXP;
      const prevXP     = profile?.totalXP || 0;
      const newTotalXP = prevXP + xpToAdd;

      // Calcul du niveau
      let lvl       = 1;
      let remaining = newTotalXP;
      while (remaining >= XP_PER_LEVEL) {
        remaining -= XP_PER_LEVEL;
        lvl++;
      }

      const today     = new Date().toDateString();
      const lastPlay  = profile?.lastPlayDate;
      const quizzesToday = lastPlay === today ? (profile?.quizzesToday || 0) : 0;

      const historyEntry = {
        quizId:    quiz.id   || '',
        quizName:  quiz.name || 'Quiz',
        diff:      quiz.diff || 'medium',
        score:     finalScore,
        total:     totalQuestions,
        xp:        xpToAdd,
        date:      new Date().toISOString(),
      };

      console.log('Sauvegarde Firestore...', { xpToAdd, finalScore, lvl, remaining });

      await updateDoc(doc(db, 'users', user.uid), {
        totalXP:        increment(xpToAdd),
        level:          lvl,
        xpInLevel:      remaining,
        quizzesPlayed:  increment(1),
        correctAnswers: increment(finalScore),
        totalAnswers:   increment(totalQuestions),
        quizzesToday:   lastPlay === today ? increment(1) : 1,
        lastPlayDate:   today,
        history:        arrayUnion(historyEntry),
        updatedAt:      serverTimestamp(),
      });

      console.log('✅ Firestore OK');

      // Mettre à jour le state local du contexte
      await updateProfile({
        totalXP:        newTotalXP,
        level:          lvl,
        xpInLevel:      remaining,
        quizzesPlayed:  (profile?.quizzesPlayed || 0) + 1,
        correctAnswers: (profile?.correctAnswers || 0) + finalScore,
        totalAnswers:   (profile?.totalAnswers   || 0) + totalQuestions,
        quizzesToday:   quizzesToday + 1,
        lastPlayDate:   today,
      });

      console.log('✅ Profile local mis à jour');

    } catch (err) {
      console.error('❌ Erreur sauvegarde quiz:', err);
    }
  }

  function restart() {
    // Remettre à zéro tout le state
    scoreRef.current     = 0;
    totalXPRef.current   = 0;
    totalTimeRef.current = 0;
    setScoreDisplay(0);
    setTotalXPDisplay(0);
    setQIndex(0);
    setStatus('playing');
    setAnswered(false);
    setSelectedOption(null);
    setExplanation('');
    setTimeLeft(TIMER_DURATION);
    // Mélanger les questions dans un nouvel ordre
    setQuestions(shuffle(quiz?.questions || []));
    clearInterval(timerRef.current);
  }

  function canPlay() {
    if (!user) return { allowed: true };
    if (profile?.isPremium) return { allowed: true };
    const today = new Date().toDateString();
    const quizzesToday = profile?.lastPlayDate === today ? (profile.quizzesToday || 0) : 0;
    if (quizzesToday >= FREE_DAILY_LIMIT) return { allowed: false, reason: 'limit', remaining: 0 };
    return { allowed: true, remaining: FREE_DAILY_LIMIT - quizzesToday };
  }

  function toggleTimer() {
    setTimerEnabled(v => {
      if (!v) startTimer();
      else stopTimer();
      return !v;
    });
  }

  const avgTime = timerEnabled && scoreRef.current > 0
    ? Math.round(totalTimeRef.current / totalQuestions)
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
    diff,
    answer,
    next,
    restart,
    toggleTimer,
    canPlay,
    XP_MAP,
    XP_TIMER_BONUS,
    TIMER_DURATION,
  };
}
