import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/quizData';
import { useTaxonomy } from '../data/taxonomy';

const PASS = 60;       // % pour valider un quiz
const WEAK = 70;       // moyenne en dessous de laquelle un thème est « à renforcer »
const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 10 };
const color = p => (p >= 80 ? 'var(--cyan)' : p >= PASS ? 'var(--purple)' : 'var(--pink)');

function Bar({ pct, h = 6 }) {
  return (
    <div style={{ height: h, background: 'var(--s2)', borderRadius: h, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: color(pct), borderRadius: h, transition: 'width .6s' }} />
    </div>
  );
}


const JOURS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
export function statsFromHistory(history) {
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); days.push({ d, key: d.toDateString(), xp: 0, n: 0 }); }
  const byKey = Object.fromEntries(days.map(x => [x.key, x]));
  const buckets = { matin: 0, apres: 0, soir: 0, nuit: 0 };
  (history || []).forEach(h => {
    const dt = new Date(h.date); if (isNaN(dt)) return;
    const slot = byKey[dt.toDateString()]; if (slot) { slot.xp += h.xp || 0; slot.n += 1; }
    const hr = dt.getHours();
    buckets[hr >= 5 && hr < 12 ? 'matin' : hr >= 12 && hr < 18 ? 'apres' : hr >= 18 && hr < 23 ? 'soir' : 'nuit'] += 1;
  });
  return { days, buckets };
}

function StatsCard({ profile }) {
  const { days, buckets } = statsFromHistory(profile?.history);
  const max = Math.max(1, ...days.map(d => d.xp));
  const tot = Object.values(buckets).reduce((a, b) => a + b, 0);
  const top = tot >= 5 ? Object.entries(buckets).sort((a, b) => b[1] - a[1])[0] : null;
  const label = { matin: '🌅 le matin', apres: '☀️ l\'après-midi', soir: '🌆 le soir', nuit: '🌙 la nuit' };
  const week = days.reduce((a, d) => a + d.xp, 0);
  const acc = profile?.totalAnswers ? Math.round(100 * (profile.correctAnswers || 0) / profile.totalAnswers) : null;
  const kpi = (v, l) => <div style={{ textAlign: 'center' }}><div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 900, fontSize: 20 }}>{v}</div><div style={{ fontSize: 10, color: 'var(--muted)' }}>{l}</div></div>;
  return (
    <div data-testid="stats-card" style={card}>
      <div style={{ fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 10 }}>📊 Mes stats</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
        {kpi(profile?.quizzesPlayed || 0, 'parties')}
        {kpi(profile?.totalXP || 0, 'XP')}
        {kpi(acc === null ? '–' : acc + ' %', 'bonnes rép.')}
        {kpi(profile?.streak || 0, 'jours de série')}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>XP des 7 derniers jours · {week} XP</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
        {days.map(d => (
          <div key={d.key} data-testid="stats-day" style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: Math.max(3, Math.round(52 * d.xp / max)), background: d.xp ? 'var(--yellow)' : 'var(--s2)', borderRadius: 4, marginBottom: 3 }} title={`${d.xp} XP`} />
            <div style={{ fontSize: 9, color: 'var(--muted)' }}>{JOURS[d.d.getDay()]}</div>
          </div>
        ))}
      </div>
      {top && <div data-testid="stats-moment" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Tu joues surtout {label[top[0]]} ({Math.round(100 * top[1] / tot)} % de tes parties récentes).</div>}
    </div>
  );
}

export default function Progress() {
  useTaxonomy();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState(null);
  const best = profile?.bestScores || {};

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'quizzes'));
        setQuizzes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); setQuizzes([]); }
    })();
  }, []);

  const data = useMemo(() => {
    if (!quizzes) return null;
    const cats = Object.values(CATEGORIES).map(cat => {
      const themes = Object.values(cat.themes).map(t => {
        const qs = quizzes.filter(z => z.catId === cat.id && z.themeId === t.id);
        const played = qs.filter(z => best[z.id] !== undefined);
        const sum = qs.reduce((a, z) => a + (best[z.id] ?? 0), 0);
        return {
          ...t, catId: cat.id, total: qs.length, played: played.length,
          validated: qs.filter(z => (best[z.id] ?? -1) >= PASS).length,
          mastery: qs.length ? Math.round(sum / qs.length) : 0,
          avgPlayed: played.length ? Math.round(played.reduce((a, z) => a + best[z.id], 0) / played.length) : null,
        };
      }).filter(t => t.total > 0);
      const total = themes.reduce((a, t) => a + t.total, 0);
      const validated = themes.reduce((a, t) => a + t.validated, 0);
      const mastery = total ? Math.round(themes.reduce((a, t) => a + t.mastery * t.total, 0) / total) : 0;
      return { ...cat, themes, total, validated, mastery };
    }).filter(c => c.themes.length);
    const all = cats.flatMap(c => c.themes);
    const weak = all.filter(t => t.played > 0 && t.avgPlayed < WEAK).sort((a, b) => a.avgPlayed - b.avgPlayed).slice(0, 5);
    const todo = all.filter(t => t.played === 0).length;
    const total = cats.reduce((a, c) => a + c.total, 0);
    const validated = cats.reduce((a, c) => a + c.validated, 0);
    const mastery = total ? Math.round(cats.reduce((a, c) => a + c.mastery * c.total, 0) / total) : 0;
    return { cats, weak, todo, total, validated, mastery };
  }, [quizzes, profile?.bestScores]); // eslint-disable-line

  if (!user) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>Connecte-toi pour voir ta progression.</div>;
  if (!data) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>⏳ Chargement…</div>;

  const acc = profile?.totalAnswers ? Math.round(100 * (profile.correctAnswers || 0) / profile.totalAnswers) : null;
  const go = t => navigate(`/category/${t.catId}/theme/${t.id}`);

  return (
    <div className="page">
      <div className="page-title">Ma progression</div>
      <div className="page-sub">Tes stats et ta maîtrise, thème par thème</div>

      <StatsCard profile={profile} />

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 900, fontSize: 28 }}>{data.mastery}%</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>maîtrise globale</div>
        </div>
        <Bar pct={data.mastery} h={8} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
          <span>{data.validated}/{data.total} quiz validés (≥ {PASS} %)</span>
          {acc !== null && <span>{acc} % de bonnes réponses</span>}
        </div>
      </div>

      {data.weak.length > 0 && (
        <div style={{ ...card, borderColor: 'var(--yellow)' }}>
          <div style={{ fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 8 }}>À renforcer</div>
          {data.weak.map(t => (
            <div key={t.catId + t.id} onClick={() => go(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ fontSize: 20 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.avgPlayed} % de moyenne sur tes quiz joués</div>
              </div>
              <div style={{ color: 'var(--yellow)', fontSize: 12, fontWeight: 700 }}>Rejouer ›</div>
            </div>
          ))}
        </div>
      )}

      {data.todo > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', margin: '2px 2px 12px' }}>{data.todo} thème{data.todo > 1 ? 's' : ''} pas encore commencé{data.todo > 1 ? 's' : ''}</div>}

      {data.cats.map(c => (
        <div key={c.id} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif" }}>{c.icon} {c.label}</div>
            <div style={{ fontWeight: 800, color: color(c.mastery) }}>{c.mastery}%</div>
          </div>
          <Bar pct={c.mastery} h={8} />
          <div style={{ marginTop: 10 }}>
            {c.themes.map(t => (
              <div key={t.id} onClick={() => go(t)} style={{ marginBottom: 9, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span>{t.icon} {t.label}</span>
                  <span style={{ color: 'var(--muted)' }}>{t.validated}/{t.total} · {t.mastery}%</span>
                </div>
                <Bar pct={t.mastery} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
