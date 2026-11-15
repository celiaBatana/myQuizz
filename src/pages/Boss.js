import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BOSSES, getBoss, DAMAGE } from '../data/bosses';
import { fetchVaried, shuffle } from '../utils/questions';
import { nextLeagueState } from '../utils/league';
import { dayKey } from '../hooks/useQuiz';
import { CATEGORIES } from '../data/quizData';
import { weeklyBoss, WEEKLY_MULT, WEEKLY_BOSS_GEMS, weekKeyNow } from '../utils/weekly';
import CardReveal from '../components/CardReveal';
import Confetti from '../components/Confetti';

const XP_PER_LEVEL = 200;
const HEARTS = 3;
const WIN_XP = 60, HEART_XP = 10;
const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, marginBottom: 12 };
const disp = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };

// ── Liste des boss ──
export default function BossHub() {
  const navigate = useNavigate();
  const wb = weeklyBoss();
  const { profile } = useAuth();
  const wins = profile?.bossWins || {};
  return (
    <div className="page">
      <div className="page-title">⚔️ Combats de boss</div>
      <div className="page-sub">Chaque bonne réponse est une attaque. 3 cœurs, une barre de vie à vider.</div>
      <div className="boss-grid">
        {BOSSES.map(b => (
          <div key={b.id} data-testid="boss-card" data-boss={b.id} onClick={() => navigate(`/boss/${b.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, background: `${b.color}26`, border: `1px solid ${b.color}80`, borderRadius: 18, padding: 14, cursor: 'pointer' }}>
            <div style={{ width: 62, height: 62, borderRadius: 18, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>{b.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...disp, fontSize: 16 }}>{b.name}{b.id === wb.id && <span data-testid="weekly-boss" style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: '#FFD16633', color: '#FFD166', verticalAlign: 2 }}>⭐ BOSS DE LA SEMAINE</span>}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', opacity: .75, lineHeight: 1.4 }}>{b.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: b.color, marginTop: 4 }}>{wins[b.id] ? `🏅 Vaincu ×${wins[b.id]}` : `${b.hp} PV · à vaincre`}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// File de questions : phase 1 = faciles/moyennes, phase 2 (boss ≤ 50 %) = moyennes/difficiles
function nextQuestion(pool, phase2) {
  const order = phase2 ? ['hard', 'medium', 'easy'] : ['easy', 'medium', 'hard'];
  for (const d of order) {
    const i = pool.findIndex(q => q.d === d);
    if (i >= 0) return pool.splice(i, 1)[0];
  }
  return pool.length ? pool.splice(0, 1)[0] : null;
}

export function BossFight() {
  const { id } = useParams();
  const boss = getBoss(id);
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [pool, setPool] = useState(null);
  const poolRef = useRef([]);
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  const [picked, setPicked] = useState(null);
  const [hp, setHp] = useState(boss?.hp || 100);
  const [hearts, setHearts] = useState(HEARTS);
  const [combo, setCombo] = useState(0);
  const [fx, setFx] = useState(null); // { kind: 'hit'|'crit'|'hurt', n, key }
  const [over, setOver] = useState(null); // 'win' | 'lose'
  const [correct, setCorrect] = useState(0);
  const [gain, setGain] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [rage, setRage] = useState(false);
  const awarded = useRef(false);
  const maxHp = boss?.hp || 100;

  function load() {
    setPool(null); setQ(null); setPicked(null); setHp(maxHp); setHearts(HEARTS); setCombo(0); setFx(null); setOver(null); setCorrect(0); setGain(null); setRage(false);
    awarded.current = false;
    fetchVaried(boss.cats.join(','), 'all', 45).then(list => {
      poolRef.current = [...list];
      setPool(list);
      const first = nextQuestion(poolRef.current, false);
      setQ(first); setOpts(first ? shuffle(first.o.map((t, i) => ({ t, i }))) : []);
    }).catch(() => setPool([]));
  }
  // eslint-disable-next-line
  useEffect(() => { if (boss) load(); }, [id]);

  // Fin de combat : XP, trophée, carte
  useEffect(() => {
    if (!over || awarded.current) return;
    awarded.current = true;
    if (!user || !profile) { setGain({ xp: 0, guest: true, win: over === 'win' }); return; }
    (async () => {
      try {
        const today = dayKey();
        const bd = profile.bossDay?.date === today ? profile.bossDay : { date: today, wins: {} };
        const repeat = !!bd.wins?.[boss.id];
        const win = over === 'win';
        let xp = win ? WIN_XP + hearts * HEART_XP : Math.min(20, correct * 2);
        if (win && repeat) xp = Math.round(xp * 0.25);
        const weekly = win && boss.id === weeklyBoss().id;
        if (weekly) xp = Math.round(xp * WEEKLY_MULT);
        const wkBonus = weekly && profile.weeklyBossWeek !== weekKeyNow();
        const firstWin = win && !(profile.bossWins?.[boss.id] > 0);
        const totalXP = (profile.totalXP || 0) + xp;
        let lvl = 1, rem = totalXP; while (rem >= XP_PER_LEVEL) { rem -= XP_PER_LEVEL; lvl++; }
        const lg = nextLeagueState(profile, xp);
        setGain({ xp, win, repeat, firstWin, weekly, wkBonus });
        if (firstWin) setShowCard(true);
        await updateProfile({
          totalXP, xpAt: serverTimestamp(), level: lvl, xpInLevel: rem, weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league,
          ...(wkBonus ? { gemsBonus: (profile.gemsBonus || 0) + WEEKLY_BOSS_GEMS, weeklyBossWeek: weekKeyNow() } : {}),
          ...(win ? { bossWins: { ...(profile.bossWins || {}), [boss.id]: (profile.bossWins?.[boss.id] || 0) + 1 }, bossDay: { date: today, wins: { ...(bd.wins || {}), [boss.id]: true } } } : {}),
        });
        await setDoc(doc(db, 'leaderboard', user.uid), {
          uid: user.uid, name: profile.displayName || user.displayName || 'Joueur', totalXP, level: lvl,
          weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league, avatar: profile.avatar || '', title: profile.title || '', updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) { console.error(e); }
    })();
    // eslint-disable-next-line
  }, [over]);

  if (!boss) return <Navigate to="/boss" replace />;

  function answer(o) {
    if (picked || over) return;
    setPicked(o);
    const good = o.i === q.a;
    if (good) {
      const crit = combo + 1 >= 3;
      const dmg = (DAMAGE[q.d] || 12) * (crit ? 2 : 1);
      const nhp = Math.max(0, hp - dmg);
      setCombo(crit ? 0 : combo + 1); setCorrect(c => c + 1);
      setFx({ kind: crit ? 'crit' : 'hit', n: dmg, key: Date.now() });
      if (!rage && nhp > 0 && nhp <= maxHp / 2) setRage(true);
      setHp(nhp);
      if (nhp <= 0) setTimeout(() => setOver('win'), 1100);
    } else {
      setCombo(0);
      setFx({ kind: 'hurt', n: 1, key: Date.now() });
      const nh = hearts - 1; setHearts(nh);
      if (nh <= 0) setTimeout(() => setOver('lose'), 1100);
    }
  }
  function next() {
    const nq = nextQuestion(poolRef.current, hp <= maxHp / 2);
    if (!nq) { setOver(hp <= 0 ? 'win' : 'lose'); return; }
    setPicked(null); setQ(nq); setOpts(shuffle(nq.o.map((t, i) => ({ t, i })))); setFx(f => f && { ...f, done: true });
  }

  const c = rage ? '#E5604D' : boss.color;
  const css = `
    @keyframes bf-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
    @keyframes bf-shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-12px) rotate(-4deg) } 40% { transform: translateX(10px) rotate(3deg) } 60% { transform: translateX(-7px) } 80% { transform: translateX(5px) } }
    @keyframes bf-flash { 0% { filter: brightness(2.2) saturate(.3) } 100% { filter: none } }
    @keyframes bf-float { 0% { transform: translateY(0) scale(.6); opacity: 0 } 20% { opacity: 1; transform: translateY(-14px) scale(1.15) } 100% { transform: translateY(-64px) scale(1); opacity: 0 } }
    @keyframes bf-hurt { 0% { box-shadow: inset 0 0 0 0 rgba(229,96,77,0) } 30% { box-shadow: inset 0 0 70px 14px rgba(229,96,77,.55) } 100% { box-shadow: inset 0 0 0 0 rgba(229,96,77,0) } }
    @keyframes bf-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
    @keyframes bf-die { to { transform: scale(.2) rotate(200deg); opacity: 0 } }
    @media (prefers-reduced-motion: reduce) { .bf-anim { animation: none !important } }
  `;

  if (pool === null) return <div className="page"><div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Le boss approche…</div></div>;
  if (pool.length < 5) return (
    <div className="page">
      <div className="page-title">{boss.emoji} {boss.name}</div>
      <div style={card}>Pas assez de questions pour ce boss pour l'instant.</div>
      <button className="btn btn-secondary btn-full" onClick={() => navigate('/boss')}>Retour</button>
    </div>
  );

  if (over) {
    const win = over === 'win';
    return (
      <div className="page" data-testid="boss-over" style={{ textAlign: 'center' }}>
        <style>{css}</style>
        {win && <Confetti />}
        <div className="bf-anim" style={{ fontSize: 90, margin: '10px 0', animation: win ? 'bf-die 1.2s ease-in forwards' : 'bf-bob 2s ease-in-out infinite', filter: win ? 'none' : 'saturate(.9)' }}>{boss.emoji}</div>
        <div style={{ ...disp, fontSize: 28, color: win ? 'var(--cyan)' : 'var(--red)' }}>{win ? 'Boss vaincu !' : 'Défaite…'}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 16px' }}>{win ? `${boss.name} s'effondre. Il te restait ${hearts} cœur${hearts > 1 ? 's' : ''}.` : `${boss.name} tient encore debout avec ${hp} PV. Retente !`}</div>
        {gain && (
          <div data-testid="boss-gain" style={{ ...card, borderColor: gain.xp ? 'var(--yellow)' : 'var(--s2)' }}>
            {gain.guest ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>Connecte-toi pour gagner de l'XP et collectionner les trophées.</div> : (
              <>
                <div style={{ ...disp, fontSize: 24, color: 'var(--yellow)' }}>+{gain.xp} XP</div>
                {gain.win && gain.repeat && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>XP réduit : déjà vaincu aujourd'hui.</div>}
                {gain.weekly && <div style={{ fontSize: 12, color: '#FFD166', marginTop: 4 }}>⭐ Boss de la semaine : XP ×1,5{gain.wkBonus ? ` · +${WEEKLY_BOSS_GEMS} 💎` : ''}</div>}
                {gain.firstWin && <div style={{ fontSize: 13, color: 'var(--cyan)', marginTop: 4 }}>🏅 Première victoire : trophée débloqué !</div>}
              </>
            )}
          </div>
        )}
        <button className="btn btn-primary btn-full" data-testid="boss-retry" onClick={load}>{win ? 'Le combattre à nouveau' : 'Réessayer'}</button>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => navigate('/boss')}>Autres boss</button>
        {showCard && <CardReveal card={{ icon: boss.emoji, name: boss.name, color: boss.color, gradient: `linear-gradient(135deg, ${boss.color}55, ${boss.color}15)`, catLabel: 'Carte de boss', fact: `Tu as vaincu ${boss.name} ! ${boss.desc}` }} title="Trophée de boss !" onClose={() => setShowCard(false)} />}
      </div>
    );
  }

  const pct = Math.max(0, hp / maxHp * 100);
  return (
    <div className="page" style={{ animation: fx?.kind === 'hurt' && !fx.done ? 'bf-hurt .7s ease-out' : 'none' }} key={fx?.kind === 'hurt' ? fx.key : 'p'}>
      <style>{css}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ ...disp, fontSize: 15 }}>{boss.name}</div>
        {rage && <div className="bf-anim" style={{ fontSize: 11, fontWeight: 800, color: '#E5604D', animation: 'bf-pulse 1s infinite' }}>🔥 PHASE 2 · EN RAGE</div>}
      </div>
      <div style={{ height: 16, borderRadius: 10, background: 'var(--s2)', overflow: 'hidden', border: '1px solid var(--s3)' }}>
        <div data-testid="boss-hp" style={{ width: `${pct}%`, height: '100%', background: c, transition: 'width .6s cubic-bezier(.3,.9,.3,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 3 }}><span>{hp} / {maxHp} PV</span><span>{'❤️'.repeat(hearts)}{'🖤'.repeat(HEARTS - hearts)}</span></div>

      <div style={{ position: 'relative', textAlign: 'center', height: 130, margin: '6px 0' }}>
        <div key={fx?.key || 0} className="bf-anim" style={{ display: 'inline-block', fontSize: 92, lineHeight: '120px',
          animation: fx && !fx.done && fx.kind !== 'hurt' ? 'bf-shake .5s, bf-flash .6s' : fx && !fx.done && fx.kind === 'hurt' ? 'bf-pulse .5s' : 'bf-bob 2.4s ease-in-out infinite', filter: rage ? 'hue-rotate(-30deg) saturate(1.5)' : 'none' }}>{boss.emoji}</div>
        {fx && !fx.done && fx.kind !== 'hurt' && (
          <div key={'d' + fx.key} className="bf-anim" style={{ position: 'absolute', left: '50%', top: 18, marginLeft: -40, width: 80, ...disp, fontSize: fx.kind === 'crit' ? 34 : 26, color: fx.kind === 'crit' ? '#FFD166' : '#fff', textShadow: '0 2px 8px rgba(0,0,0,.7)', animation: 'bf-float 1.1s ease-out forwards' }}>
            {fx.kind === 'crit' ? '💥 ' : ''}-{fx.n}
          </div>
        )}
        {fx && !fx.done && fx.kind === 'hurt' && <div className="bf-anim" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, ...disp, fontSize: 15, color: 'var(--red)', animation: 'bf-float 1.1s ease-out forwards' }}>💔 {boss.name.split(' ')[0]} riposte !</div>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10, alignItems: 'center' }} data-testid="boss-combo">
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Combo</span>
        {[0, 1, 2].map(k => <span key={k} style={{ width: 12, height: 12, borderRadius: '50%', background: k < combo ? '#FFD166' : 'var(--s3)', boxShadow: k < combo ? '0 0 10px #FFD166' : 'none', transition: 'all .2s' }} />)}
        <span style={{ fontSize: 11, color: combo === 2 ? '#FFD166' : 'var(--muted)', fontWeight: combo === 2 ? 800 : 400 }}>{combo === 2 ? 'Prochaine attaque : CRITIQUE ×2 !' : ''}</span>
      </div>

      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: c, fontWeight: 700, marginBottom: 6 }}>{q.d === 'hard' ? 'ATTAQUE PUISSANTE · 20' : q.d === 'medium' ? 'ATTAQUE MOYENNE · 14' : 'ATTAQUE LÉGÈRE · 10'}</div>
        <div data-testid="boss-q" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q.t}</div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {opts.map(o => {
          const good = o.i === q.a;
          const bg = !picked ? 'var(--s1)' : good ? 'rgba(143,195,159,.22)' : picked === o ? 'rgba(229,96,77,.22)' : 'var(--s1)';
          const bd = !picked ? 'var(--s2)' : good ? 'var(--cyan)' : picked === o ? 'var(--red)' : 'var(--s2)';
          return <button key={o.i} data-testid="boss-opt" disabled={!!picked} onClick={() => answer(o)} style={{ textAlign: 'left', background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14, cursor: picked ? 'default' : 'pointer' }}>{o.t}</button>;
        })}
      </div>
      {picked && hp > 0 && hearts > 0 && <button className="btn btn-primary btn-full" data-testid="boss-next" style={{ marginTop: 12 }} onClick={next}>Attaque suivante →</button>}
    </div>
  );
}
