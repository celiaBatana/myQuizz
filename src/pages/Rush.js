import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, query, where, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { fetchVaried, shuffle } from '../utils/questions';
import { nextLeagueState } from '../utils/league';
import { dayKey } from '../hooks/useQuiz';
import { addEvent } from '../utils/activity';
import { usePowerups } from '../utils/powerups';
import ShareButton from '../components/ShareButton';
import Avatar from '../components/Avatar';

const ROUND = 60, PENALTY = 3, XP_PER = 2, XP_CAP = 40, XP_RUNS = 3, XP_LEVEL = 200;
const disp = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };
const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, marginBottom: 12 };

export default function Rush() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const pu = usePowerups();
  const [phase, setPhase] = useState('intro'); // intro | loading | play | over
  const [board, setBoard] = useState(null);
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [left, setLeft] = useState(ROUND);
  const [gain, setGain] = useState(null);
  const poolRef = useRef([]);
  const endAt = useRef(0);
  const scoreRef = useRef(0);
  const today = dayKey();

  // Classement du jour (meilleur score de chacun)
  async function loadBoard() {
    try {
      const snap = await getDocs(query(collection(db, 'leaderboard'), where('rushDate', '==', today), limit(50)));
      setBoard(snap.docs.map(d => ({ uid: d.id, ...d.data() })).sort((a, b) => (b.rushScore || 0) - (a.rushScore || 0)).slice(0, 10));
    } catch (e) { setBoard([]); }
  }
  useEffect(() => { loadBoard(); /* eslint-disable-next-line */ }, []);

  function show(qq) { setQ(qq); setOpts(shuffle(qq.o.map((t, i) => ({ t, i })))); setHidden([]); setPicked(null); }
  function nextQ() {
    const qq = poolRef.current.shift();
    if (!qq) { finish(); return; }
    show(qq);
  }

  async function start() {
    setPhase('loading'); setScore(0); scoreRef.current = 0; setWrong(0); setGain(null);
    try {
      const list = await fetchVaried('all', 'all', 70);
      if (list.length < 8) { setPhase('intro'); setBoard(b => b); return; }
      poolRef.current = list; nextQ();
      endAt.current = Date.now() + ROUND * 1000; setLeft(ROUND); setPhase('play');
    } catch (e) { setPhase('intro'); }
  }

  // Chrono
  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => {
      const l = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) finish();
    }, 200);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [phase]);

  function answer(o) {
    if (picked || phase !== 'play') return;
    setPicked(o);
    const ok = o.i === q.a;
    if (ok) { scoreRef.current += 1; setScore(scoreRef.current); }
    else { setWrong(w => w + 1); endAt.current -= PENALTY * 1000; }
    setTimeout(() => { if (Date.now() < endAt.current) nextQ(); else finish(); }, ok ? 350 : 800);
  }
  function useFifty() {
    if (picked || hidden.length || !pu.use('fifty')) return;
    const w = opts.filter(o => o.i !== q.a);
    setHidden(shuffle(w).slice(0, 2).map(o => o.i));
  }
  function useSkip() { if (picked || !pu.use('skip')) return; nextQ(); }
  function useTime() { if (picked || !pu.use('time')) return; endAt.current += 10000; }

  const doneRef = useRef(false);
  function finish() {
    if (doneRef.current) return;
    doneRef.current = true; setPhase('over');
    setTimeout(() => { doneRef.current = false; }, 500);
    const sc = scoreRef.current;
    if (!user || !profile) { setGain({ xp: 0, guest: true, score: sc }); return; }
    (async () => {
      try {
        const rd = profile.rushDay?.date === today ? profile.rushDay : { date: today, best: 0, runs: 0 };
        const xp = rd.runs < XP_RUNS ? Math.min(XP_CAP, sc * XP_PER) : 0;
        const bestDay = Math.max(rd.best || 0, sc);
        const newRecord = sc > (profile.rushBest || 0) && sc >= 8;
        const totalXP = (profile.totalXP || 0) + xp;
        let lvl = 1, rem = totalXP; while (rem >= XP_LEVEL) { rem -= XP_LEVEL; lvl++; }
        const lg = nextLeagueState(profile, xp);
        const events = newRecord ? addEvent(profile, { k: '⚡', t: `nouveau record au Rush : ${sc} bonnes réponses` }) : (profile.events || []);
        setGain({ xp, score: sc, bestDay, newRecord, runs: rd.runs + 1, noXp: rd.runs >= XP_RUNS });
        await updateProfile({
          rushDay: { date: today, best: bestDay, runs: rd.runs + 1 }, rushBest: Math.max(profile.rushBest || 0, sc), events,
          ...(xp ? { totalXP, xpAt: serverTimestamp(), level: lvl, xpInLevel: rem, weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league } : {}),
        });
        await setDoc(doc(db, 'leaderboard', user.uid), {
          uid: user.uid, name: profile.displayName || user.displayName || 'Joueur', totalXP, level: lvl, events,
          weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league, avatar: profile.avatar || '', title: profile.title || '',
          rushDate: today, rushScore: bestDay, updatedAt: serverTimestamp(),
        }, { merge: true });
        loadBoard();
      } catch (e) { console.error(e); }
    })();
  }

  const myBest = profile?.rushDay?.date === today ? profile.rushDay.best : 0;
  const Board = () => (
    <div data-testid="rush-board" style={{ marginTop: 6 }}>
      <div className="section-label">Classement du jour</div>
      {board === null ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Chargement…</div>
        : board.length === 0 ? <div style={{ ...card, fontSize: 13, color: 'var(--muted)' }}>Personne n'a joué aujourd'hui. Prends la première place !</div>
        : board.map((r, i) => (
          <div key={r.uid} data-testid="rush-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 6, borderRadius: 14, background: user && r.uid === user.uid ? 'rgba(232,132,74,.18)' : 'var(--s1)', border: `1px solid ${user && r.uid === user.uid ? 'var(--yellow)' : 'var(--s2)'}` }}>
            <div style={{ width: 26, textAlign: 'center', fontWeight: 800 }}>{['🥇', '🥈', '🥉'][i] || i + 1}</div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Avatar id={r.avatar} frame={r.frame} size={24} />{r.name}{user && r.uid === user.uid ? ' (toi)' : ''}</div>
            <div style={{ ...disp, color: 'var(--yellow)' }}>{r.rushScore} ⚡</div>
          </div>
        ))}
    </div>
  );

  if (phase === 'intro' || phase === 'loading') return (
    <div className="page page-narrow">
      <div className="page-title">⚡ Rush 60 s</div>
      <div className="page-sub">Un maximum de bonnes réponses en 60 secondes. Une erreur coûte {PENALTY} s.</div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, borderColor: 'var(--yellow)' }}>
        <div style={{ fontSize: 42 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ ...disp, fontSize: 16 }}>{user ? `Ton meilleur du jour : ${myBest}` : 'Connecte-toi pour entrer au classement'}</div>
          {user && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Record perso : {profile?.rushBest || 0} · XP pour les {XP_RUNS} premières parties du jour</div>}
        </div>
      </div>
      {user && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Power-ups en stock : ✂️ {pu.count('fifty')} · ⏭️ {pu.count('skip')} · ⏱️ {pu.count('time')} <span onClick={() => navigate('/boutique')} style={{ color: 'var(--yellow)', cursor: 'pointer', fontWeight: 700 }}>(boutique)</span></div>}
      <button className="btn btn-primary btn-full" data-testid="rush-start" disabled={phase === 'loading'} onClick={start}>{phase === 'loading' ? 'Préparation…' : 'Lancer le Rush'}</button>
      <Board />
    </div>
  );

  if (phase === 'over') return (
    <div className="page page-narrow" data-testid="rush-over" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 60 }}>⚡</div>
      <div style={{ ...disp, fontSize: 56, color: 'var(--yellow)', lineHeight: 1 }} data-testid="rush-score">{score}</div>
      <div style={{ color: 'var(--muted)', margin: '4px 0 14px' }}>bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''} · {wrong} erreur{wrong > 1 ? 's' : ''}</div>
      {gain && (
        <div style={{ ...card, borderColor: gain.xp ? 'var(--yellow)' : 'var(--s2)' }}>
          {gain.guest ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>Connecte-toi pour gagner de l'XP et entrer au classement.</div> : (
            <>
              <div style={{ ...disp, fontSize: 22, color: 'var(--yellow)' }}>+{gain.xp} XP</div>
              {gain.noXp && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Plus d'XP aujourd'hui (limite de {XP_RUNS} parties), mais ton score compte pour le classement.</div>}
              {gain.newRecord && <div style={{ fontSize: 13, color: 'var(--cyan)', marginTop: 4 }}>🏅 Nouveau record personnel !</div>}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Meilleur du jour : {gain.bestDay}</div>
            </>
          )}
        </div>
      )}
      <ShareButton title="Rush 60 s" big={`${score} ⚡`} sub="en 60 secondes" emoji="⚡" color="#E6B35A" style={{ marginBottom: 8 }} />
      <button className="btn btn-primary btn-full" data-testid="rush-again" onClick={() => { setPhase('intro'); loadBoard(); }}>Rejouer</button>
      <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => navigate('/')}>Accueil</button>
      <Board />
    </div>
  );

  const pct = Math.min(100, (left / ROUND) * 100);
  return (
    <div className="page page-narrow">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div data-testid="rush-time" style={{ ...disp, fontSize: 30, color: left <= 10 ? 'var(--red)' : 'var(--text)', minWidth: 54 }}>{left}s</div>
        <div style={{ flex: 1, height: 10, borderRadius: 6, background: 'var(--s2)', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: left <= 10 ? 'var(--red)' : 'var(--yellow)', transition: 'width .3s linear' }} /></div>
        <div style={{ ...disp, fontSize: 22 }}>{score} ⚡</div>
      </div>
      {user && (pu.count('fifty') + pu.count('skip') + pu.count('time') > 0) && (
        <div data-testid="powerups" style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {[['fifty', '✂️ 50/50', useFifty, hidden.length > 0], ['skip', '⏭️ Passer', useSkip, false], ['time', '⏱️ +10 s', useTime, false]].map(([k, label, fn, off]) => (
            <button key={k} data-testid={`pu-${k}`} disabled={off || !!picked || pu.count(k) <= 0} onClick={fn} style={{ fontSize: 12, fontWeight: 700, padding: '6px 11px', borderRadius: 20, border: '1px solid var(--s3)', background: 'var(--s1)', color: 'var(--text)', opacity: off || pu.count(k) <= 0 ? .4 : 1, cursor: 'pointer' }}>{label} ×{pu.count(k)}</button>
          ))}
        </div>
      )}
      <div style={{ ...card, marginBottom: 10 }}><div data-testid="rush-q" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q?.t}</div></div>
      <div style={{ display: 'grid', gap: 8 }}>
        {opts.filter(o => !hidden.includes(o.i)).map(o => {
          const good = o.i === q.a;
          const bg = !picked ? 'var(--s1)' : good ? 'rgba(143,195,159,.22)' : picked === o ? 'rgba(229,96,77,.22)' : 'var(--s1)';
          const bd = !picked ? 'var(--s2)' : good ? 'var(--cyan)' : picked === o ? 'var(--red)' : 'var(--s2)';
          return <button key={o.i} data-testid="rush-opt" disabled={!!picked} onClick={() => answer(o)} style={{ textAlign: 'left', background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14, cursor: picked ? 'default' : 'pointer' }}>{o.t}</button>;
        })}
      </div>
    </div>
  );
}
