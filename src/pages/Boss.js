import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { BOSSES, getBoss, DAMAGE, HERO_HP_MULT, HERO_XP_MULT, HERO_GEMS, HERO_TITLES, HERO_FRAMES } from '../data/bosses';
import { findCosmetic } from '../data/cosmetics';
import { usePowerups } from '../utils/powerups';
import { fetchVaried, shuffle } from '../utils/questions';
import { nextLeagueState } from '../utils/league';
import { dayKey } from '../hooks/useQuiz';
import { CATEGORIES } from '../data/quizData';
import { weeklyBoss, WEEKLY_MULT, WEEKLY_BOSS_GEMS, weekKeyNow } from '../utils/weekly';
import { addEvent } from '../utils/activity';
import ShareButton from '../components/ShareButton';
import CardReveal from '../components/CardReveal';
import Confetti from '../components/Confetti';
import { useTaxonomy } from '../data/taxonomy';

const XP_PER_LEVEL = 200;
const HEARTS = 3;
const WIN_XP = 60, HEART_XP = 10;
const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, marginBottom: 12 };
const disp = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };

// ── Liste des boss ──
export default function BossHub() {
  useTaxonomy();
  const navigate = useNavigate();
  const wb = weeklyBoss();
  const { profile } = useAuth();
  const wins = profile?.bossWins || {};
  const hw = profile?.heroWins || {};
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
              <div style={{ fontSize: 11, fontWeight: 700, color: b.color, marginTop: 4 }}>{wins[b.id] ? `🏅 Vaincu ×${wins[b.id]}` : `${b.hp} PV · à vaincre`}{hw[b.id] ? ` · 🔥 Héroïque ×${hw[b.id]}` : ''}</div>
              {wins[b.id] > 0 && <button data-testid="boss-hero-btn" className="btn btn-secondary" onClick={e => { e.stopPropagation(); navigate(`/boss/${b.id}?mode=h`); }} style={{ marginTop: 8, padding: '5px 12px', fontSize: 12, borderColor: '#E5604D', color: '#E5604D' }}>🔥 Mode héroïque · {b.hp * HERO_HP_MULT} PV</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// File de questions : phase 1 = faciles/moyennes, phase 2 (boss ≤ 50 %) = moyennes/difficiles
function nextQuestion(pool, phase2, heroic) {
  const order = phase2 || heroic ? ['hard', 'medium', 'easy'] : ['easy', 'medium', 'hard'];
  for (const d of order) {
    const i = pool.findIndex(q => q.d === d);
    if (i >= 0) return pool.splice(i, 1)[0];
  }
  return pool.length ? pool.splice(0, 1)[0] : null;
}

export function BossFight() {
  useTaxonomy();
  const { id } = useParams();
  const boss = getBoss(id);
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [sp] = useSearchParams();
  const heroic = sp.get('mode') === 'h' && (profile?.bossWins?.[id] || 0) > 0;
  const pu = usePowerups();
  const [shielded, setShielded] = useState(false);
  const [hidden, setHidden] = useState([]);
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
  const maxHp = (boss?.hp || 100) * (heroic ? HERO_HP_MULT : 1);

  function load() {
    setPool(null); setQ(null); setPicked(null); setHp(maxHp); setShielded(false); setHidden([]); setHearts(HEARTS); setCombo(0); setFx(null); setOver(null); setCorrect(0); setGain(null); setRage(false);
    awarded.current = false;
    fetchVaried(boss.cats.join(','), 'all', 45).then(list => {
      poolRef.current = [...list];
      setPool(list);
      const first = nextQuestion(poolRef.current, false, heroic);
      setQ(first); setOpts(first ? shuffle(first.o.map((t, i) => ({ t, i }))) : []);
    }).catch(() => setPool([]));
  }
  // eslint-disable-next-line
  useEffect(() => { if (boss) load(); }, [id, heroic]);

  // Fin de combat : XP, trophée, carte
  useEffect(() => {
    if (!over || awarded.current) return;
    awarded.current = true;
    if (!user || !profile) { setGain({ xp: 0, guest: true, win: over === 'win' }); return; }
    (async () => {
      try {
        const today = dayKey();
        const bd = profile.bossDay?.date === today ? profile.bossDay : { date: today, wins: {} };
        const dayId = (heroic ? 'h_' : '') + boss.id;
        const repeat = !!bd.wins?.[dayId];
        const win = over === 'win';
        let xp = win ? WIN_XP + hearts * HEART_XP : Math.min(20, correct * 2);
        if (heroic) xp = Math.round(xp * HERO_XP_MULT);
        if (win && repeat) xp = Math.round(xp * 0.25);
        const weekly = win && boss.id === weeklyBoss().id;
        if (weekly) xp = Math.round(xp * WEEKLY_MULT);
        const wkBonus = weekly && profile.weeklyBossWeek !== weekKeyNow();
        const firstWin = win && !heroic && !(profile.bossWins?.[boss.id] > 0);
        const totalXP = (profile.totalXP || 0) + xp;
        let lvl = 1, rem = totalXP; while (rem >= XP_PER_LEVEL) { rem -= XP_PER_LEVEL; lvl++; }
        const lg = nextLeagueState(profile, xp);
        // Récompenses exclusives du mode héroïque (première victoire sur ce boss)
        const firstHero = win && heroic && !(profile.heroWins?.[boss.id] > 0);
        const heroWins = win && heroic ? { ...(profile.heroWins || {}), [boss.id]: (profile.heroWins?.[boss.id] || 0) + 1 } : (profile.heroWins || {});
        const grants = [];
        if (firstHero) {
          grants.push(HERO_TITLES[boss.id]); if (HERO_FRAMES[boss.id]) grants.push(HERO_FRAMES[boss.id]);
          if (BOSSES.every(b => heroWins[b.id] > 0)) grants.push('t_h_all', 'f_hero');
        }
        const newGrants = grants.filter(g => g && !(profile.unlocked || []).includes(g));
        const gemsAdd = (wkBonus ? WEEKLY_BOSS_GEMS : 0) + (firstHero ? HERO_GEMS : 0);
        setGain({ xp, win, repeat, firstWin, weekly, wkBonus, heroic, firstHero, grants: newGrants.map(g => findCosmetic(g)?.name).filter(Boolean), gemsAdd });
        if (firstWin) setShowCard(true);
        const events = win ? addEvent(profile, { k: boss.emoji, t: heroic ? `a vaincu ${boss.name} en héroïque` : `a vaincu ${boss.name}` }) : (profile.events || []);
        await updateProfile({
          events,
          totalXP, xpAt: serverTimestamp(), level: lvl, xpInLevel: rem, weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league,
          ...(gemsAdd ? { gemsBonus: (profile.gemsBonus || 0) + gemsAdd } : {}),
          ...(wkBonus ? { weeklyBossWeek: weekKeyNow() } : {}),
          ...(newGrants.length ? { unlocked: [...new Set([...(profile.unlocked || []), ...newGrants])] } : {}),
          ...(win && heroic ? { heroWins } : {}),
          ...(win && !heroic ? { bossWins: { ...(profile.bossWins || {}), [boss.id]: (profile.bossWins?.[boss.id] || 0) + 1 } } : {}),
          ...(win ? { bossDay: { date: today, wins: { ...(bd.wins || {}), [dayId]: true } } } : {}),
        });
        await setDoc(doc(db, 'leaderboard', user.uid), {
          uid: user.uid, name: profile.displayName || user.displayName || 'Joueur', totalXP, level: lvl,
          weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league, events, avatar: profile.avatar || '', title: profile.title || '', updatedAt: serverTimestamp(),
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
      if (shielded) { setShielded(false); setFx({ kind: 'shield', n: 0, key: Date.now() }); return; }
      setFx({ kind: 'hurt', n: 1, key: Date.now() });
      const nh = hearts - 1; setHearts(nh);
      if (nh <= 0) setTimeout(() => setOver('lose'), 1100);
    }
  }
  function useFifty() {
    if (picked || hidden.length || !pu.use('fifty')) return;
    const wrong = opts.filter(o => o.i !== q.a);
    setHidden(shuffle(wrong).slice(0, Math.max(0, Math.min(2, wrong.length - 1))).map(o => o.i));
  }
  function useSkip() {
    if (picked || !pu.use('skip')) return;
    const nq = nextQuestion(poolRef.current, hp <= maxHp / 2, heroic);
    if (!nq) return;
    setHidden([]); setQ(nq); setOpts(shuffle(nq.o.map((t, i) => ({ t, i }))));
  }
  function useShield() { if (picked || shielded || !pu.use('shield')) return; setShielded(true); }
  function next() {
    const nq = nextQuestion(poolRef.current, hp <= maxHp / 2, heroic);
    if (!nq) { setOver(hp <= 0 ? 'win' : 'lose'); return; }
    setHidden([]); setPicked(null); setQ(nq); setOpts(shuffle(nq.o.map((t, i) => ({ t, i })))); setFx(f => f && { ...f, done: true });
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
        <div style={{ ...disp, fontSize: 28, color: win ? 'var(--cyan)' : 'var(--red)' }}>{win ? (heroic ? 'Boss héroïque vaincu !' : 'Boss vaincu !') : 'Défaite…'}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 16px' }}>{win ? `${boss.name} s'effondre. Il te restait ${hearts} cœur${hearts > 1 ? 's' : ''}.` : `${boss.name} tient encore debout avec ${hp} PV. Retente !`}</div>
        {gain && (
          <div data-testid="boss-gain" style={{ ...card, borderColor: gain.xp ? 'var(--yellow)' : 'var(--s2)' }}>
            {gain.guest ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>Connecte-toi pour gagner de l'XP et collectionner les trophées.</div> : (
              <>
                <div style={{ ...disp, fontSize: 24, color: 'var(--yellow)' }}>+{gain.xp} XP</div>
                {gain.win && gain.repeat && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>XP réduit : déjà vaincu aujourd'hui.</div>}
                {gain.weekly && <div style={{ fontSize: 12, color: '#FFD166', marginTop: 4 }}>⭐ Boss de la semaine : XP ×1,5{gain.wkBonus ? ` · +${WEEKLY_BOSS_GEMS} 💎` : ''}</div>}
                {gain.firstHero && <div data-testid="hero-reward" style={{ fontSize: 13, color: '#FFD166', marginTop: 6 }}>🔥 Première victoire héroïque · +{HERO_GEMS} 💎{gain.grants?.length ? <><br />Débloqué : {gain.grants.join(' · ')}</> : ''}</div>}
                {gain.firstWin && <div style={{ fontSize: 13, color: 'var(--cyan)', marginTop: 4 }}>🏅 Première victoire : trophée débloqué !</div>}
              </>
            )}
          </div>
        )}
        {win && <ShareButton title={heroic ? `J'ai vaincu ${boss.name} en héroïque` : `J'ai vaincu ${boss.name}`} big={`${hearts} ❤️ restants`} sub={`+${gain?.xp ?? 0} XP`} emoji={boss.emoji} color={boss.color} style={{ marginBottom: 8 }} />}
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
        <div style={{ ...disp, fontSize: 15 }}>{boss.name}{heroic && <span data-testid="hero-badge" style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: '#E5604D33', color: '#E5604D' }}>🔥 HÉROÏQUE</span>}</div>
        {rage && <div className="bf-anim" style={{ fontSize: 11, fontWeight: 800, color: '#E5604D', animation: 'bf-pulse 1s infinite' }}>🔥 PHASE 2 · EN RAGE</div>}
      </div>
      <div style={{ height: 16, borderRadius: 10, background: 'var(--s2)', overflow: 'hidden', border: '1px solid var(--s3)' }}>
        <div data-testid="boss-hp" style={{ width: `${pct}%`, height: '100%', background: c, transition: 'width .6s cubic-bezier(.3,.9,.3,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 3 }}><span>{hp} / {maxHp} PV</span><span>{'❤️'.repeat(hearts)}{'🖤'.repeat(HEARTS - hearts)}</span></div>

      <div style={{ position: 'relative', textAlign: 'center', height: 130, margin: '6px 0' }}>
        <div key={fx?.key || 0} className="bf-anim" style={{ display: 'inline-block', fontSize: 92, lineHeight: '120px',
          animation: fx && !fx.done && (fx.kind === 'hit' || fx.kind === 'crit') ? 'bf-shake .5s, bf-flash .6s' : fx && !fx.done && fx.kind !== 'hit' && fx.kind !== 'crit' ? 'bf-pulse .5s' : 'bf-bob 2.4s ease-in-out infinite', filter: rage ? 'hue-rotate(-30deg) saturate(1.5)' : 'none' }}>{boss.emoji}</div>
        {fx && !fx.done && fx.kind === 'shield' && <div className="bf-anim" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, ...disp, fontSize: 15, color: 'var(--cyan)', animation: 'bf-float 1.1s ease-out forwards' }}>🛡️ Bouclier ! Aucun cœur perdu</div>}
        {fx && !fx.done && (fx.kind === 'hit' || fx.kind === 'crit') && (
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
      {user && !picked && (pu.count('fifty') + pu.count('skip') + pu.count('shield') > 0 || shielded) && (
        <div data-testid="powerups" style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['fifty', '✂️ 50/50', useFifty, hidden.length > 0], ['skip', '⏭️ Passer', useSkip, false], ['shield', shielded ? '🛡️ Actif' : '🛡️ Bouclier', useShield, shielded]].map(([k, label, fn, off]) => (
            <button key={k} data-testid={`pu-${k}`} disabled={off || pu.count(k) <= 0} onClick={fn} style={{ fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 20, border: '1px solid var(--s3)', background: shielded && k === 'shield' ? 'rgba(143,195,159,.25)' : 'var(--s1)', color: 'var(--text)', opacity: off || pu.count(k) <= 0 ? .4 : 1, cursor: 'pointer' }}>{label} ×{pu.count(k)}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gap: 8 }}>
        {opts.filter(o => !hidden.includes(o.i)).map(o => {
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
