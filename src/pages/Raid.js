import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, query, where, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { fetchVaried, shuffle } from '../utils/questions';
import { nextLeagueState, weekKey } from '../utils/league';
import { dayKey } from '../hooks/useQuiz';
import { DAMAGE } from '../data/bosses';
import { raidBoss, raidMaxHp, RAID_RUNS_PER_DAY, RAID_QUESTIONS, RAID_MIN_DMG, RAID_GEMS } from '../utils/raid';
import { addEvent } from '../utils/activity';
import Avatar from '../components/Avatar';
import Confetti from '../components/Confetti';

const XP_LEVEL = 200;
const disp = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };
const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, marginBottom: 12 };

export default function Raid() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const boss = raidBoss();
  const wk = weekKey(), today = dayKey();
  const [rows, setRows] = useState(null);
  const [phase, setPhase] = useState('hub'); // hub | loading | play | over
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  const [picked, setPicked] = useState(null);
  const [idx, setIdx] = useState(0);
  const [combo, setCombo] = useState(0);
  const [runDmg, setRunDmg] = useState(0);
  const [result, setResult] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const poolRef = useRef([]);
  const dmgRef = useRef(0);
  const comboRef = useRef(0);

  async function load() {
    try {
      const snap = await getDocs(query(collection(db, 'leaderboard'), where('collWeek', '==', wk), limit(100)));
      setRows(snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(r => (r.collDmg || 0) > 0).sort((a, b) => b.collDmg - a.collDmg));
    } catch (e) { setRows([]); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const mine = profile?.raid?.week === wk ? profile.raid : { week: wk, dmg: 0 };
  const total = (rows || []).reduce((a, r) => a + (r.collDmg || 0), 0);
  const players = Math.max(1, (rows || []).length);
  const maxHp = raidMaxHp(players);
  const hpLeft = Math.max(0, maxHp - total);
  const dead = hpLeft <= 0 && total > 0;
  const runsToday = profile?.raidDay?.date === today ? profile.raidDay.runs : 0;
  const runsLeft = Math.max(0, RAID_RUNS_PER_DAY - runsToday);
  const canClaim = dead && mine.dmg >= RAID_MIN_DMG && profile?.raidClaimed !== wk && !claimed;

  function show(qq) { setQ(qq); setOpts(shuffle(qq.o.map((t, i) => ({ t, i })))); setPicked(null); }

  async function start() {
    if (!user || runsLeft <= 0) return;
    setPhase('loading'); dmgRef.current = 0; comboRef.current = 0; setRunDmg(0); setCombo(0); setIdx(0);
    try {
      const list = await fetchVaried(boss.cats.join(','), 'all', 30);
      if (list.length < 6) { setPhase('hub'); return; }
      poolRef.current = list.slice(0, RAID_QUESTIONS); show(poolRef.current.shift()); setPhase('play');
    } catch (e) { setPhase('hub'); }
  }

  function answer(o) {
    if (picked) return;
    setPicked(o);
    if (o.i === q.a) {
      const crit = comboRef.current + 1 >= 3;
      const d = (DAMAGE[q.d] || 12) * (crit ? 2 : 1);
      comboRef.current = crit ? 0 : comboRef.current + 1; setCombo(comboRef.current);
      dmgRef.current += d; setRunDmg(dmgRef.current);
    } else { comboRef.current = 0; setCombo(0); }
    setTimeout(() => {
      const nq = poolRef.current.shift();
      if (!nq) finish(); else { setIdx(i => i + 1); show(nq); }
    }, 800);
  }

  async function finish() {
    setPhase('over');
    const dmg = dmgRef.current;
    const xp = Math.min(30, Math.round(dmg / 5));
    setResult({ dmg, xp });
    try {
      const rd = profile.raidDay?.date === today ? profile.raidDay : { date: today, runs: 0 };
      const newDmg = (mine.dmg || 0) + dmg;
      const totalXP = (profile.totalXP || 0) + xp;
      let lvl = 1, rem = totalXP; while (rem >= XP_LEVEL) { rem -= XP_LEVEL; lvl++; }
      const lg = nextLeagueState(profile, xp);
      const finisher = total + dmg >= maxHp && total < maxHp;
      const events = finisher ? addEvent(profile, { k: boss.emoji, t: `a porté le coup final au raid contre ${boss.name}` }) : (profile.events || []);
      await updateProfile({
        raid: { week: wk, dmg: newDmg }, raidDay: { date: today, runs: rd.runs + 1 }, events,
        totalXP, xpAt: serverTimestamp(), level: lvl, xpInLevel: rem, weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league,
      });
      await setDoc(doc(db, 'leaderboard', user.uid), {
        uid: user.uid, name: profile.displayName || user.displayName || 'Joueur', totalXP, level: lvl, events,
        weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league, avatar: profile.avatar || '', title: profile.title || '',
        collWeek: wk, collDmg: newDmg, updatedAt: serverTimestamp(),
      }, { merge: true });
      load();
    } catch (e) { console.error(e); }
  }

  async function claim() {
    setClaimed(true);
    const unlocked = [...new Set([...(profile.unlocked || []), 't_raid'])];
    try { await updateProfile({ gemsBonus: (profile.gemsBonus || 0) + RAID_GEMS, raidClaimed: wk, unlocked }); } catch (e) { console.error(e); setClaimed(false); }
  }

  const pct = Math.max(0, hpLeft / maxHp * 100);
  const HpBar = () => (
    <div data-testid="raid-hp-wrap" style={{ marginBottom: 12 }}>
      <div style={{ height: 18, borderRadius: 10, background: 'var(--s2)', overflow: 'hidden', border: '1px solid var(--s3)' }}>
        <div data-testid="raid-hp" style={{ width: `${pct}%`, height: '100%', background: boss.color, transition: 'width .6s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
        <span data-testid="raid-hp-text">{hpLeft} / {maxHp} PV</span><span>{players} joueur{players > 1 ? 's' : ''}</span>
      </div>
    </div>
  );

  if (phase === 'loading') return <div className="page page-narrow"><div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Le boss approche…</div></div>;

  if (phase === 'play') return (
    <div className="page page-narrow">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ ...disp, fontSize: 15 }}>{boss.emoji} {boss.name}</div>
        <div style={{ ...disp, color: 'var(--yellow)' }} data-testid="raid-run-dmg">{runDmg} dégâts</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Question {idx + 1}/{RAID_QUESTIONS} · combo {combo}/3 {combo === 2 ? '· prochain coup CRITIQUE ×2 !' : ''}</div>
      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: boss.color, fontWeight: 700, marginBottom: 6 }}>{q.d === 'hard' ? 'ATTAQUE PUISSANTE · 20' : q.d === 'medium' ? 'ATTAQUE MOYENNE · 14' : 'ATTAQUE LÉGÈRE · 10'}</div>
        <div data-testid="raid-q" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q.t}</div>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {opts.map(o => {
          const good = o.i === q.a;
          const bg = !picked ? 'var(--s1)' : good ? 'rgba(143,195,159,.22)' : picked === o ? 'rgba(229,96,77,.22)' : 'var(--s1)';
          const bd = !picked ? 'var(--s2)' : good ? 'var(--cyan)' : picked === o ? 'var(--red)' : 'var(--s2)';
          return <button key={o.i} data-testid="raid-opt" disabled={!!picked} onClick={() => answer(o)} style={{ textAlign: 'left', background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14 }}>{o.t}</button>;
        })}
      </div>
    </div>
  );

  if (phase === 'over') return (
    <div className="page page-narrow" data-testid="raid-over" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 70 }}>{boss.emoji}</div>
      <div style={{ ...disp, fontSize: 34, color: 'var(--yellow)' }} data-testid="raid-result-dmg">-{result?.dmg} PV</div>
      <div style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 14px' }}>Dégâts infligés au boss · +{result?.xp} XP</div>
      <HpBar />
      <button className="btn btn-primary btn-full" onClick={() => setPhase('hub')}>Voir le raid</button>
    </div>
  );

  return (
    <div className="page page-narrow">
      <div className="page-title">🛡️ Raid de la semaine</div>
      <div className="page-sub">Tous les joueurs attaquent le même boss. Quand sa barre est vide, tout le monde gagne.</div>
      <div style={{ ...card, borderColor: boss.color + '99', background: `linear-gradient(135deg, ${boss.color}2A, var(--s1) 70%)`, textAlign: 'center' }}>
        {dead && <Confetti count={30} />}
        <div style={{ fontSize: 72, filter: dead ? 'grayscale(1)' : 'none', opacity: dead ? .5 : 1 }}>{boss.emoji}</div>
        <div style={{ ...disp, fontSize: 18, marginBottom: 10 }}>{boss.name}{dead ? ' · vaincu !' : ''}</div>
        <HpBar />
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Ta contribution : <strong data-testid="raid-mine">{mine.dmg}</strong> dégâts · {RAID_RUNS_PER_DAY} attaques par jour</div>
      </div>
      {canClaim && <button className="btn btn-primary btn-full" data-testid="raid-claim" onClick={claim} style={{ marginBottom: 12 }}>🎁 Récupérer la récompense : +{RAID_GEMS} 💎 et le titre « Fléau des boss »</button>}
      {claimed && <div data-testid="raid-claimed" style={{ ...card, fontSize: 13 }}>✓ Récompense récupérée !</div>}
      {dead && mine.dmg < RAID_MIN_DMG && <div style={{ ...card, fontSize: 12, color: 'var(--muted)' }}>Il fallait infliger au moins {RAID_MIN_DMG} dégâts pour toucher la récompense.</div>}
      {!user ? <div style={{ ...card, fontSize: 13, color: 'var(--muted)' }}>Connecte-toi pour attaquer le boss.</div> : (
        <button className="btn btn-primary btn-full" data-testid="raid-attack" disabled={runsLeft <= 0 || dead} onClick={start}>{dead ? 'Boss vaincu cette semaine' : runsLeft > 0 ? `⚔️ Attaquer (${runsLeft} restante${runsLeft > 1 ? 's' : ''} aujourd'hui)` : 'Reviens demain pour attaquer'}</button>
      )}
      <div className="section-label" style={{ marginTop: 18 }}>Contributions</div>
      {rows === null ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Chargement…</div> : rows.length === 0 ? <div style={{ ...card, fontSize: 13, color: 'var(--muted)' }}>Personne n'a encore attaqué. Sois le premier !</div> :
        rows.slice(0, 10).map((r, i) => (
          <div key={r.uid} data-testid="raid-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 6, borderRadius: 14, background: user && r.uid === user.uid ? 'rgba(232,132,74,.18)' : 'var(--s1)', border: `1px solid ${user && r.uid === user.uid ? 'var(--yellow)' : 'var(--s2)'}` }}>
            <div style={{ width: 26, textAlign: 'center', fontWeight: 800 }}>{['🥇', '🥈', '🥉'][i] || i + 1}</div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Avatar id={r.avatar} frame={r.frame} size={24} />{r.name}{user && r.uid === user.uid ? ' (toi)' : ''}</div>
            <div style={{ ...disp, color: 'var(--yellow)' }}>{r.collDmg}</div>
          </div>
        ))}
      <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={() => navigate('/boss')}>Combats de boss</button>
    </div>
  );
}
