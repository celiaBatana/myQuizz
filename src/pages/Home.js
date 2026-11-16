import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getCategoryList, XP_PER_LEVEL } from '../data/quizData';
import { useAuth } from '../context/AuthContext';
import { dayKey } from '../hooks/useQuiz';
import { dueReviewIds } from '../utils/league';
import DailyPanel from '../components/DailyPanel';
import Onboarding from '../components/Onboarding';
import { rankFor } from '../utils/rank';
import DailyChest from '../components/DailyChest';
import SeasonCard from '../components/SeasonCard';
import ActivityFeed from '../components/ActivityFeed';
import InstallPrompt from '../components/InstallPrompt';
import { useChampions } from '../hooks/useChampions';
import { weeklyBoss, weeklyCat, weeklyEnds, WEEKLY_MULT, WEEKLY_BOSS_GEMS } from '../utils/weekly';
import { BOSSES } from '../data/bosses';
import { gemsBalance } from '../utils/gems';
import { streakInfo } from '../utils/retention';
import { cleanQuizName } from '../utils/quizName';

const Icon = ({ d, size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONS = {
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  cards: 'M5 7h10v13H5zM9 4h10v13M8 11h4',
  brain: 'M12 4a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 1 5 3 3 0 0 0 5 3zM12 4a3 3 0 0 1 3 3 3 3 0 0 1 3 3 3 3 0 0 1-1 5 3 3 0 0 1-5 3M12 4v14',
  arrow: 'M9 6l6 6-6 6',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
};
const RING_R = 40, RING_C = 2 * Math.PI * RING_R;
const row = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 };
const display = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700 };

export default function Home() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [invites, setInvites] = useState([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const r = await getDocs(query(collection(db, 'duels'), where('invitedUid', '==', user.uid), limit(10)));
        const out = [];
        for (const d of r.docs) {
          const x = d.data();
          if (x.nextId) continue;
          const done = await getDoc(doc(db, 'duel_results', `${d.id}_${user.uid}`));
          if (!done.exists()) out.push({ id: d.id, from: x.creatorName });
        }
        setInvites(out);
      } catch (e) { /* règles */ }
    })();
  }, [user]);
  const dueCount = dueReviewIds(profile?.review, dayKey()).length;
  const categories = getCategoryList();

  const [totalQuizzes, setTotalQuizzes] = useState('...');
  const [totalQuestions, setTotalQuestions] = useState('...');
  const [featuredQuiz, setFeaturedQuiz] = useState(null);
  const [catQuizzes, setCatQuizzes] = useState([]);

  const totalThemes = categories.reduce((s, c) => s + Object.keys(c.themes).length, 0);

  useEffect(() => {
    (async () => {
      try {
        const [quizSnap, qSnap] = await Promise.all([
          getDocs(collection(db, 'quizzes')),
          getDocs(collection(db, 'questions')),
        ]);
        setTotalQuizzes(quizSnap.size);
        setCatQuizzes(quizSnap.docs.map(d => ({ id: d.id, catId: d.data().catId })));
        setTotalQuestions(qSnap.size);

        // Quiz du jour : premier quiz avec des questions
        const quizzes = quizSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const withQ = quizzes
          .filter(q => questions.some(qu => qu.quizId === q.id))
          .sort((a, b) => a.id.localeCompare(b.id)); // ordre stable
        if (withQ.length > 0) {
          // Choisir un quiz du jour basé sur le jour de l'année
          // Jour local (Paris) et non UTC : change bien à minuit
          const now = new Date();
          const dayNum = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
          const dayIndex = dayNum % withQ.length;
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
  const xpLabel   = { easy: '+5–15 XP', medium: '+10–30 XP', hard: '+20–50 XP' };

  const level = profile?.level || 1;
  const xpInLevel = profile?.xpInLevel || 0;
  const xpPct = Math.min(1, xpInLevel / XP_PER_LEVEL);
  const streak = streakInfo(profile);
  const rank = rankFor(level);
  const champs = useChampions(categories.map(c => c.id));
  const wBoss = weeklyBoss(), wCat = weeklyCat();
  const bossDone = BOSSES.filter(b => (profile?.bossWins || {})[b.id] > 0).length;
  const blindRec = Math.max(0, ...Object.values(profile?.blindBest || {}).filter(x => typeof x === 'number'));
  const nCards = (profile?.cards || []).length;
  const firstName = (profile?.displayName || '').split(' ')[0];

  return (
    <div className="page">
      <InstallPrompt />
      <div className="home-top">
      <div className="home-hero hero-grid" style={{ background: 'linear-gradient(135deg, var(--s1), #33291F)', border: '1px solid var(--s2)', borderRadius: 24, padding: 20, marginBottom: 14 }}>
        <div className="hero-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 92, height: 92, flexShrink: 0 }}>
            <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
              <circle cx="46" cy="46" r={RING_R} fill="none" stroke="var(--s2)" strokeWidth="8" />
              <circle cx="46" cy="46" r={RING_R} fill="none" stroke="var(--yellow)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - xpPct)} transform="rotate(-90 46 46)" style={{ transition: 'stroke-dashoffset .8s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ ...display, fontSize: 28, lineHeight: 1 }}>{level}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>niveau</div>
            </div>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{firstName ? `Bonjour ${firstName}` : 'Bienvenue'}</div>
            <div style={{ ...display, fontSize: 21, lineHeight: 1.2, marginTop: 2 }}>
              {profile ? `${XP_PER_LEVEL - xpInLevel} XP avant le niveau ${level + 1}` : 'Teste tes connaissances'}
            </div>
            {profile && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span data-testid="home-streak" style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: 'rgba(232,132,74,.18)', color: 'var(--yellow)' }}>🔥 {streak.count} jour{streak.count > 1 ? 's' : ''}</span>
                <span data-testid="home-rank" style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: rank.color + '2A', color: rank.color }}>{rank.icon} {rank.name}</span>
                <span onClick={() => navigate('/boutique')} style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(127,214,232,.16)', color: '#7FD6E8', cursor: 'pointer' }}>💎 {gemsBalance(profile)}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 6, background: 'var(--s2)', margin: '16px 0 14px', overflow: 'hidden' }}>
          <div style={{ width: `${xpPct * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--yellow), var(--amber))', borderRadius: 6, transition: 'width .8s' }} />
        </div>
        <div className="hero-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" data-testid="home-play" style={{ flex: 1 }} onClick={() => navigate('/jouer')}>▶ Jouer</button>
          <button className="btn btn-secondary" data-testid="home-daily" style={{ flex: 1 }} onClick={() => navigate('/daily')}>Défi du jour</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
          {categories.length} catégories · {totalThemes} thèmes · {totalQuizzes} quiz · {totalQuestions} questions
        </div>
        </div>
        {profile && (
          <div className="hero-stats" data-testid="hero-stats">
            {[['🐉', `${bossDone}/${BOSSES.length}`, 'boss vaincus'], ['🃏', nCards, 'cartes'], ['🎵', blindRec ? `${blindRec}/10` : '—', 'record blind test'], ['🎯', profile.quizzesPlayed || 0, 'quiz joués']].map(([ic, v, l]) => (
              <div key={l} className="hero-stat"><div style={{ fontSize: 22 }}>{ic}</div><div style={{ ...display, fontSize: 22, lineHeight: 1.1 }}>{v}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{l}</div></div>
            ))}
          </div>
        )}
      </div>
      </div>

      <DailyChest />

      <div className="section-label">Modes de jeu</div>
      <style>{`
        @keyframes hb-eq { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
        @keyframes hb-boss { 0%,100% { transform: translateY(0) rotate(-4deg) } 50% { transform: translateY(-6px) rotate(4deg) } }
        @keyframes hb-swing { 0%,100% { transform: rotate(-12deg) } 50% { transform: rotate(12deg) } }
        .mode-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px }
        .mode-card { position: relative; overflow: hidden; border-radius: 20px; padding: 14px; cursor: pointer; min-height: 188px; display: flex; flex-direction: column; justify-content: flex-end; transition: transform .15s }
        .mode-card:hover { transform: translateY(-2px) }
        .mode-art { position: absolute; top: 10px; right: 10px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center }
        @media (prefers-reduced-motion: reduce) { .mode-art, .mode-art * { animation: none !important } }
      `}</style>
      <div className="mode-grid">
        <div className="mode-card" data-testid="home-boss" onClick={() => navigate('/boss')} style={{ background: 'linear-gradient(145deg, rgba(229,96,77,.42), rgba(201,163,79,.16))', border: '1px solid rgba(229,96,77,.6)' }}>
          <div className="mode-art" style={{ fontSize: 46, animation: 'hb-boss 2.2s ease-in-out infinite' }}>🐉</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#FF9C8A' }}>BOSS FIGHT</div>
          <div style={{ ...display, fontSize: 17, marginTop: 2 }}>Affronte les boss</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 3, lineHeight: 1.35 }}>Chaque bonne réponse frappe, chaque erreur coûte un cœur.</div>
          {profile && <div className="mode-stat">{bossDone}/{BOSSES.length} vaincus</div>}
        </div>
        <div className="mode-card" data-testid="home-blindtest" onClick={() => navigate('/blindtest')} style={{ background: 'linear-gradient(145deg, rgba(154,123,201,.45), rgba(201,106,176,.18))', border: '1px solid rgba(154,123,201,.6)' }}>
          <div className="mode-art" aria-hidden="true" style={{ gap: 4 }}>
            {[0, 0.25, 0.1, 0.4, 0.15].map((d, k) => <div key={k} style={{ width: 6, height: 44, borderRadius: 3, background: k % 2 ? '#C96AB0' : '#B79BE0', transformOrigin: 'center', animation: `hb-eq ${0.8 + k * 0.13}s ${d}s ease-in-out infinite` }} />)}
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#C8B1EE' }}>BLIND TEST</div>
          <div style={{ ...display, fontSize: 17, marginTop: 2 }}>D'où vient ce son ?</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 3, lineHeight: 1.35 }}>Devine le morceau en 30 s · 7 styles.</div>
          {profile && blindRec > 0 && <div className="mode-stat">Record : {blindRec}/10</div>}
        </div>
        <div className="mode-card" data-testid="home-amis" onClick={() => navigate('/amis')} style={{ background: 'linear-gradient(145deg, rgba(143,195,159,.36), rgba(143,195,159,.1))', border: '1px solid rgba(143,195,159,.55)' }}>
          <div className="mode-art" style={{ fontSize: 42 }}><span style={{ display: 'inline-block', animation: 'hb-swing 1.6s ease-in-out infinite' }}>⚔️</span></div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#A9D8B8' }}>DUELS</div>
          <div style={{ ...display, fontSize: 17, marginTop: 2 }}>Défie tes amis</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 3, lineHeight: 1.35 }}>Ajoute des amis, lance un duel, compare vos scores.</div>
        </div>
        <div className="mode-card" data-testid="home-modes" onClick={() => navigate('/jouer')} style={{ background: 'linear-gradient(145deg, rgba(232,132,74,.38), rgba(230,179,90,.12))', border: '1px solid rgba(232,132,74,.6)' }}>
          <div className="mode-art" style={{ fontSize: 42 }}>⚡</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#F2A877' }}>QUIZ</div>
          <div style={{ ...display, fontSize: 17, marginTop: 2 }}>Mixte & mort subite</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 3, lineHeight: 1.35 }}>Mélange les catégories ou tiens le plus longtemps.</div>
          {profile && profile.suddenBest > 0 && <div className="mode-stat">Record : {profile.suddenBest} d'affilée</div>}
        </div>
      </div>

      <div data-testid="weekly" className="weekly-grid">
        <div className="weekly-card" onClick={() => navigate(`/boss/${wBoss.id}`)} style={{ borderColor: wBoss.color + '99' }}>
          <div style={{ fontSize: 34 }}>{wBoss.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#FFD166' }}>⭐ BOSS DE LA SEMAINE · {weeklyEnds()} j</div>
            <div style={{ ...display, fontSize: 15 }}>{wBoss.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>XP ×{String(WEEKLY_MULT).replace('.', ',')} · +{WEEKLY_BOSS_GEMS} 💎 à la 1ʳᵉ victoire</div>
          </div>
        </div>
        <div className="weekly-card" onClick={() => navigate(`/category/${wCat.id}`)} style={{ borderColor: (wCat.color || '#888') + '99' }}>
          <div style={{ fontSize: 34 }}>{wCat.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', color: '#FFD166' }}>⭐ CATÉGORIE DE LA SEMAINE · {weeklyEnds()} j</div>
            <div style={{ ...display, fontSize: 15 }}>{wCat.label}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>XP ×{String(WEEKLY_MULT).replace('.', ',')} sur ses quiz</div>
          </div>
        </div>
      </div>

      <SeasonCard />
      <ActivityFeed />

      {profile && !profile.onboarded && !(profile.quizzesPlayed > 0) && <Onboarding />}
      <DailyPanel />

      {dueCount > 0 && (
        <div onClick={() => navigate('/revision')} style={{ ...row, borderColor: 'var(--cyan)' }}>
          <Icon d={ICONS.brain} color="var(--cyan)" />
          <div style={{ flex: 1 }}>
            <div style={{ ...display, fontSize: 15 }}>Révision du jour</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{dueCount} question{dueCount > 1 ? 's' : ''} à revoir pour mieux les retenir</div>
          </div>
          <Icon d={ICONS.arrow} color="var(--cyan)" size={18} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
        <div onClick={() => navigate('/progression')} style={{ ...row, marginBottom: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <Icon d={ICONS.chart} color="var(--yellow)" />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Ma progression</div>
        </div>
        <div onClick={() => navigate('/collection')} style={{ ...row, marginBottom: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          <Icon d={ICONS.cards} color="var(--yellow)" />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Ma collection{(profile?.cards || []).length ? ` · ${(profile.cards || []).length}` : ''}</div>
        </div>
      </div>

      {invites.map(i => (
        <div key={i.id} data-testid="duel-invite" onClick={() => navigate(`/duel/${i.id}`)} style={{ ...row, borderColor: 'var(--yellow)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...display, fontSize: 15 }}>⚔️ {i.from} te défie !</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Touche pour relever le défi</div>
          </div>
          <Icon d={ICONS.arrow} color="var(--yellow)" size={18} />
        </div>
      ))}
      {/* Quiz du jour */}
      <div className="section-label">Quiz du jour</div>
      {featuredQuiz ? (
        <div
          style={{ background: 'var(--s1)', border: '1px solid var(--yellow)', borderRadius: 18, padding: 18, marginBottom: 10, cursor: 'pointer' }}
          onClick={() => navigate(`/quiz/${featuredQuiz.catId}/${featuredQuiz.themeId}/${featuredQuiz.id}`)}
        >
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--yellow)', marginBottom: 6 }}>Sélection du jour</div>
          <div style={{ ...display, fontSize: 19, marginBottom: 8 }}>{cleanQuizName(featuredQuiz.name)}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className={`diff-badge diff-${featuredQuiz.diff}`}>{diffLabel[featuredQuiz.diff]}</span>
            <span>{xpLabel[featuredQuiz.diff]} par question</span>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--s1)', borderRadius: 18, padding: 18, marginBottom: 10, opacity: 0.5 }}>
          <div style={{ ...display, fontSize: 19 }}>Chargement…</div>
        </div>
      )}

      {/* Catégories */}
      <div className="section-label" style={{ marginTop: 20 }}>Catégories</div>
      <div className="cat-grid">
        {categories.map(cat => {
          const themeCount = Object.keys(cat.themes).length;
          const col = cat.color || '#888888';
          const list = catQuizzes.filter(z => z.catId === cat.id);
          const done = list.filter(z => (profile?.bestScores?.[z.id] ?? -1) >= 60).length;
          const pct = list.length ? Math.round(100 * done / list.length) : 0;
          return (
            <div key={cat.id} className="cat-card" data-testid="cat-card" style={{ '--cc': col, background: `linear-gradient(160deg, ${col}38, ${col}10)`, border: `1px solid ${col}55` }}
              onClick={() => navigate(`/category/${cat.id}`)}>
              <div className="cat-icon" style={{ background: col + '40', boxShadow: `0 0 0 1px ${col}66 inset` }}>{cat.icon}</div>
              <div style={{ ...display, fontSize: 14, marginTop: 10 }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{themeCount} thèmes{list.length ? ` · ${list.length} quiz` : ''}</div>
              {champs && (
                <div data-testid="champion" data-mine={champs[cat.id] && champs[cat.id].uid === user?.uid ? '1' : '0'} style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: champs[cat.id] ? '#FFD166' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {champs[cat.id] ? `👑 ${champs[cat.id].uid === user?.uid ? 'C\'est toi !' : champs[cat.id].name} · ${champs[cat.id].xp} XP` : '👑 Couronne à prendre'}
                </div>
              )}
              {profile && list.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 5, borderRadius: 4, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
                    <div data-testid="cat-progress" style={{ width: `${pct}%`, height: '100%', background: col, transition: 'width .6s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: pct === 100 ? col : 'var(--muted)', fontWeight: pct === 100 ? 800 : 400, marginTop: 4 }}>{pct === 100 ? '✓ Terminée' : `${done}/${list.length} réussis`}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
