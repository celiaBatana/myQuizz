import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const XP_MAP = { easy: 5, medium: 10, hard: 20 };
const XP_TIMER_BONUS = { easy: 10, medium: 20, hard: 30 };
const TIMER_DURATION = 15;
const XP_PER_LEVEL = 200;
const FREE_DAILY_LIMIT = 3;

export function useQuiz(quiz) {
  const { user, profile, updateProfile } = useAuth();

  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [status, setStatus] = useState('playing'); // playing | finished
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [explanation, setExplanation] = useState('');

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const currentQuestion = quiz?.questions[qIndex];
  const totalQuestions = quiz?.questions?.length || 0;
  const diff = quiz?.diff || 'medium';

  // Démarre le timer
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(TIMER_DURATION);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  // Arrête le timer
  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  // Quand timeLeft atteint 0, auto-wrong
  useEffect(() => {
    if (timerEnabled && timeLeft === 0 && !answered && status === 'playing') {
      handleTimeout();
    }
  }, [timeLeft, answered, timerEnabled, status]);

  // Démarre le timer si activé
  useEffect(() => {
    if (timerEnabled && status === 'playing' && !answered) {
      startTimer();
    }
    return () => clearInterval(timerRef.current);
  }, [qIndex, timerEnabled, status]);

  function handleTimeout() {
    setAnswered(true);
    setSelectedOption(null);
    setExplanation(currentQuestion?.e || '');
  }

  // Répond à une question
  function answer(optionIndex) {
    if (answered) return;
    setAnswered(true);
    stopTimer();

    const elapsed = timerEnabled
      ? TIMER_DURATION - timeLeft
      : 0;

    setSelectedOption(optionIndex);
    const correct = optionIndex === currentQuestion.a;

    let xpGained = 0;
    if (correct) {
      xpGained = XP_MAP[diff];
      if (timerEnabled) {
        const speedRatio = Math.max(0, (TIMER_DURATION - elapsed) / TIMER_DURATION);
        xpGained += Math.floor(speedRatio * XP_TIMER_BONUS[diff]);
      }
      setScore((s) => s + 1);
      setTotalXP((x) => x + xpGained);
    }

    if (timerEnabled) {
      setTotalTime((t) => t + elapsed);
    }

    setExplanation(currentQuestion?.e || '');
    return { correct, xpGained };
  }

  // Passe à la question suivante
  function next() {
    if (qIndex + 1 >= totalQuestions) {
      finish();
    } else {
      setQIndex((i) => i + 1);
      setAnswered(false);
      setSelectedOption(null);
      setExplanation('');
      if (timerEnabled) startTimer();
    }
  }

  // Termine le quiz et sauvegarde en Firebase
  async function finish() {
    stopTimer();
    setStatus('finished');

    if (!user || !profile) return;

    const xpToAdd = totalXP;
    const newTotalXP = (profile.totalXP || 0) + xpToAdd;

    // Calcul du niveau
    let lvl = 1;
    let remaining = newTotalXP;
    while (remaining >= XP_PER_LEVEL) {
      remaining -= XP_PER_LEVEL;
      lvl++;
    }

    const historyEntry = {
      quizId: quiz.id,
      quizName: quiz.name,
      category: quiz.category,
      theme: quiz.theme,
      diff: quiz.diff,
      score,
      total: totalQuestions,
      xp: xpToAdd,
      date: new Date().toISOString(),
    };

    // Vérification limite gratuit
    const today = new Date().toDateString();
    const lastPlay = profile.lastPlayDate;
    const quizzesToday = lastPlay === today ? (profile.quizzesToday || 0) : 0;

    await updateDoc(doc(db, 'users', user.uid), {
      totalXP: increment(xpToAdd),
      level: lvl,
      xpInLevel: remaining,
      quizzesPlayed: increment(1),
      correctAnswers: increment(score),
      totalAnswers: increment(totalQuestions),
      quizzesToday: lastPlay === today ? increment(1) : 1,
      lastPlayDate: today,
      history: arrayUnion(historyEntry),
      updatedAt: serverTimestamp(),
    });

    await updateProfile({
      totalXP: newTotalXP,
      level: lvl,
      xpInLevel: remaining,
      quizzesPlayed: (profile.quizzesPlayed || 0) + 1,
      quizzesToday: quizzesToday + 1,
      lastPlayDate: today,
    });
  }

  // Vérifie si l'utilisateur peut jouer (limite gratuit)
  function canPlay() {
    if (!user) return { allowed: true }; // non connecté = pas de limite (pour l'instant)
    if (profile?.isPremium) return { allowed: true };
    const today = new Date().toDateString();
    const quizzesToday =
      profile?.lastPlayDate === today ? profile.quizzesToday || 0 : 0;
    if (quizzesToday >= FREE_DAILY_LIMIT) {
      return { allowed: false, reason: 'limit', remaining: 0 };
    }
    return { allowed: true, remaining: FREE_DAILY_LIMIT - quizzesToday };
  }

  function toggleTimer() {
    setTimerEnabled((v) => {
      if (!v) startTimer();
      else stopTimer();
      return !v;
    });
  }

  const avgTime =
    timerEnabled && score > 0 ? Math.round(totalTime / totalQuestions) : null;

  return {
    // État
    qIndex,
    currentQuestion,
    totalQuestions,
    score,
    totalXP,
    answered,
    selectedOption,
    status,
    explanation,
    timerEnabled,
    timeLeft,
    avgTime,
    diff,
    // Actions
    answer,
    next,
    toggleTimer,
    canPlay,
    // Constantes
    XP_MAP,
    XP_TIMER_BONUS,
    TIMER_DURATION,
  };
}
