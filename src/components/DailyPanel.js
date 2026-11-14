import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  streakInfo, activeSet, dk, addDays, DAILY_GOALS, GOAL_BONUS, goalProgress,
  dailyMissions, todayStats, doneToday, weeklyStatus, MISSION_XP, WEEKLY_XP, MILESTONES,
} from '../utils/retention';

const LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: '14px 16px', marginBottom: 12 };

function Ring({ pct, label }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--s2)" strokeWidth="7" />
      <circle cx="34" cy="34" r={r} fill="none" stroke={pct >= 1 ? 'var(--cyan)' : 'var(--purple)'} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 34 34)" style={{ transition: 'stroke-dashoffset .6s' }} />
      <text x="34" y="38" textAnchor="middle" fontSize="13" fontWeight="800" fill="currentColor">{label}</text>
    </svg>
  );
}

export default function DailyPanel() {
  const { user, profile, updateProfile } = useAuth();
  if (!user || !profile) return null;

  const s = streakInfo(profile);
  const active = activeSet(profile);
  const days = Array.from({ length: 7 }, (_, i) => dk(-(6 - i)));
  const g = goalProgress(profile);
  const stats = todayStats(profile);
  const done = doneToday(profile);
  const missions = dailyMissions();
  const w = weeklyStatus(profile);
  const nextMs = Object.keys(MILESTONES).map(Number).find(n => n > s.count);

  return (
    <div>
      {/* Série */}
      <div style={{ ...card, borderColor: s.danger ? 'var(--yellow)' : 'var(--s2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 40, lineHeight: 1, filter: s.count ? 'none' : 'grayscale(1)', opacity: s.count ? 1 : 0.5 }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22 }}>
              {s.count} jour{s.count > 1 ? 's' : ''} <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>de série</span>
            </div>
            <div style={{ fontSize: 11, color: s.danger ? 'var(--yellow)' : 'var(--muted)', fontWeight: s.danger ? 700 : 400 }}>
              {s.danger ? `Joue avant minuit pour garder ta série de ${s.count} jours !`
                : s.playedToday ? '✓ Série validée aujourd\'hui'
                : 'Lance un quiz pour démarrer ta série'}
              {nextMs && s.count > 0 && !s.danger ? ` · prochain palier : ${nextMs} jours` : ''}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>🧊<div style={{ fontWeight: 700 }}>{s.freezes}</div></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          {days.map(k => {
            const on = active.has(k);
            const isToday = k === dk(0);
            const letter = LETTERS[new Date(k + 'T12:00:00').getDay()];
            return (
              <div key={k} style={{ textAlign: 'center', width: 34 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{letter}</div>
                <div style={{
                  width: 28, height: 28, margin: '0 auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  background: on ? 'var(--yellow)' : 'var(--s2)', color: on ? 'var(--on-primary)' : '#fff',
                  border: isToday ? '2px solid var(--yellow)' : '2px solid transparent', opacity: on || isToday ? 1 : 0.55,
                }}>{on ? '🔥' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Objectif quotidien */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Ring pct={g.pct} label={g.pct >= 1 ? '✓' : `${Math.round(g.pct * 100)}%`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif" }}>Objectif du jour</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
              {g.xp >= g.goal ? `Atteint ! +${GOAL_BONUS} XP gagnés` : `${g.xp} / ${g.goal} XP · bonus +${GOAL_BONUS} XP à l'arrivée`}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DAILY_GOALS.map(n => (
                <div key={n} onClick={() => updateProfile({ dailyGoal: n }).catch(() => {})}
                  style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                    background: g.goal === n ? 'var(--purple)' : 'var(--s2)', color: g.goal === n ? '#fff' : 'var(--muted)' }}>{n} XP</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Missions */}
      <div style={card}>
        <div style={{ fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 8 }}>Missions du jour</div>
        {missions.map(m => {
          const val = Math.min(m.target, m.val(stats));
          const ok = done.includes(m.id) || val >= m.target;
          return (
            <div key={m.id} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ textDecoration: ok ? 'line-through' : 'none', opacity: ok ? 0.6 : 1 }}>{ok ? '✅' : '⬜'} {m.label}</span>
                <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>+{MISSION_XP} XP</span>
              </div>
              <div style={{ height: 5, background: 'var(--s2)', borderRadius: 4, marginTop: 4 }}>
                <div style={{ height: '100%', width: `${(ok ? 1 : val / m.target) * 100}%`, background: ok ? 'var(--cyan)' : 'var(--purple)', borderRadius: 4, transition: 'width .5s' }} />
              </div>
            </div>
          );
        })}
        <div style={{ borderTop: '1px solid var(--s2)', paddingTop: 8, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>{w.done || w.n >= w.target ? '🏆' : '📅'} Mission de la semaine : joue {w.target} jours</span>
            <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>+{WEEKLY_XP} XP</span>
          </div>
          <div style={{ height: 5, background: 'var(--s2)', borderRadius: 4, marginTop: 4 }}>
            <div style={{ height: '100%', width: `${Math.min(1, w.n / w.target) * 100}%`, background: w.done ? 'var(--cyan)' : 'var(--pink)', borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{Math.min(w.n, w.target)} / {w.target} jours cette semaine</div>
        </div>
      </div>
    </div>
  );
}
