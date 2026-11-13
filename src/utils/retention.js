// Série, objectif quotidien, missions et paliers
import { weekKey } from './league';

const p2 = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const dk = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return fmt(d); };
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() + n); return fmt(dt);
}

// ── Série ─────────────────────────────────────────────────────────────────
export function streakInfo(profile) {
  const last = profile?.lastStreakDate;
  const freezes = profile?.freezes || 0;
  const alive = !!last && (last === dk(0) || last === dk(-1) || (last === dk(-2) && freezes > 0));
  const count = alive ? (profile?.streak || 0) : 0;
  const playedToday = last === dk(0);
  return { count, alive, playedToday, danger: alive && count > 0 && !playedToday, freezes };
}

// Jours joués : activeDays stocké + jours déduits de la série en cours
export function activeSet(profile) {
  const set = new Set(profile?.activeDays || []);
  const last = profile?.lastStreakDate;
  const s = streakInfo(profile);
  if (last && s.count > 0) for (let i = 0; i < s.count; i++) set.add(addDays(last, -i));
  return set;
}

export function addActiveDay(list, today) {
  const l = Array.isArray(list) ? list : [];
  return (l.includes(today) ? l : [...l, today]).slice(-60);
}

// Paliers de série : bonus d'XP au jour J
export const MILESTONES = { 3: 20, 7: 50, 14: 80, 30: 150, 50: 200, 100: 400, 200: 600, 365: 1000 };

// ── Objectif quotidien ────────────────────────────────────────────────────
export const DAILY_GOALS = [20, 50, 100];
export const GOAL_BONUS = 10;
export function goalProgress(profile) {
  const goal = profile?.dailyGoal || 50;
  const xp = profile?.goalDate === dk(0) ? (profile?.goalXP || 0) : 0;
  return { goal, xp, pct: Math.min(1, xp / goal) };
}

// ── Missions ──────────────────────────────────────────────────────────────
export const MISSION_XP = 15;
export const WEEKLY_XP = 60;

const POOL = [
  { id: 'm_play3',    label: 'Joue 3 quiz',                    target: 3,  val: s => s.quizzes },
  { id: 'm_perfect',  label: 'Fais un quiz sans faute',        target: 1,  val: s => s.perfect },
  { id: 'm_correct15',label: 'Réponds juste à 15 questions',   target: 15, val: s => s.correct },
  { id: 'm_combo5',   label: 'Atteins un combo de 5',          target: 5,  val: s => s.maxCombo },
  { id: 'm_xp60',     label: 'Gagne 60 XP',                    target: 60, val: s => s.xp },
  { id: 'm_daily',    label: 'Fais le défi du jour',           target: 1,  val: s => (s.modes || []).includes('daily') ? 1 : 0 },
  { id: 'm_sudden',   label: 'Tente la mort subite',           target: 1,  val: s => (s.modes || []).includes('sudden') ? 1 : 0 },
];

function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export function dailyMissions(dateKey = dk(0)) {
  // 3 missions déterministes pour la date (les mêmes pour tout le monde)
  const arr = [...POOL];
  let h = hash('quizly-missions-' + dateKey);
  const out = [];
  while (out.length < 3) { h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; out.push(arr.splice(h % arr.length, 1)[0]); }
  return out;
}

export const EMPTY_STATS = { quizzes: 0, perfect: 0, correct: 0, xp: 0, maxCombo: 0, modes: [], ids: [] };
export function todayStats(profile) {
  return profile?.dayStats?.date === dk(0) ? { ...EMPTY_STATS, ...profile.dayStats } : { ...EMPTY_STATS, date: dk(0) };
}

// Rejouer un quiz déjà fait aujourd'hui ne compte plus pour les missions (quiz, sans-faute, bonnes réponses) :
// il faut des quiz DIFFÉRENTS. `add.quizId` n'est fourni que pour les quiz du parcours.
export function updateDayStats(profile, add) {
  const s = todayStats(profile);
  const dup = !!add.quizId && (s.ids || []).includes(add.quizId);
  return {
    date: dk(0),
    quizzes: s.quizzes + (dup ? 0 : 1),
    perfect: s.perfect + (!dup && add.perfect ? 1 : 0),
    correct: s.correct + (dup ? 0 : add.correct),
    xp: s.xp + add.xp,
    maxCombo: Math.max(s.maxCombo, add.maxCombo || 0),
    modes: Array.from(new Set([...(s.modes || []), add.mode])),
    ids: add.quizId ? Array.from(new Set([...(s.ids || []), add.quizId])) : (s.ids || []),
  };
}

export function doneToday(profile) {
  return profile?.missionsDone?.date === dk(0) ? (profile.missionsDone.ids || []) : [];
}

export function weeklyStatus(profile, activeDaysOverride) {
  const wk = weekKey();
  const set = activeDaysOverride ? new Set(activeDaysOverride) : activeSet(profile);
  let n = 0;
  for (let i = 0; i < 7; i++) if (set.has(addDays(wk, i))) n++;
  return { target: 5, n, done: profile?.weeklyDone === wk, wk };
}

// Missions nouvellement terminées après une partie
export function newlyCompleted(profile, newStats, activeDays) {
  const already = doneToday(profile);
  const missions = dailyMissions().filter(m => !already.includes(m.id) && m.val(newStats) >= m.target);
  const w = weeklyStatus(profile, activeDays);
  const weeklyNew = !w.done && w.n >= w.target;
  const bonus = missions.length * MISSION_XP + (weeklyNew ? WEEKLY_XP : 0);
  return { missions, weeklyNew, bonus, ids: [...already, ...missions.map(m => m.id)], wk: w.wk };
}
