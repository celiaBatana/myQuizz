import ShareButton from '../components/ShareButton';
import { addEvent } from '../utils/activity';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { BLIND_CATS, ALL_TRACKS, getBlindCat } from '../data/blindtest';
import { fetchPreview } from '../utils/itunes';
import { doc, setDoc, addDoc, serverTimestamp, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { DuelBoard } from './Leaderboard';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { nextLeagueState } from '../utils/league';
import { dayKey } from '../hooks/useQuiz';
import Avatar from '../components/Avatar';

const XP_PER_LEVEL = 200;
const XP_PER_GOOD = 8;      // 10 bonnes réponses = 80 XP
const FULL_GAMES_PER_DAY = 3; // ensuite 25 % (anti-farm)

const ROUNDS = 10;
const label = t => `${t.title} — ${t.artist}`;
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, marginBottom: 12 };

function build(pool) {
  return shuffle(pool).slice(0, ROUNDS).map(t => ({
    track: t,
    options: shuffle([t, ...shuffle(pool.filter(x => x !== t)).slice(0, 3)]),
  }));
}

// Un duel stocke ses manches sous forme de texte « style:index:d1.d2.d3 » (3 mauvaises réponses) : les deux joueurs ont les mêmes questions
const poolOf = id => id === 'mix' ? ALL_TRACKS : (getBlindCat(id)?.tracks || []);
export function encodeRounds(styleId, rounds) {
  const pool = poolOf(styleId);
  return rounds.map(r => `${styleId}:${pool.indexOf(r.track)}:${r.options.filter(o => o !== r.track).map(o => pool.indexOf(o)).join('.')}`);
}
export function decodeRounds(ids) {
  return (ids || []).map(id => {
    const [sid, idx, ds] = String(id).split(':');
    const pool = poolOf(sid);
    const track = pool[Number(idx)];
    if (!track) return null;
    const wrong = String(ds || '').split('.').map(n => pool[Number(n)]).filter(Boolean);
    return { track, options: shuffle([track, ...wrong]) };
  }).filter(Boolean);
}

// ── Choix du type de blind test ──
export default function BlindHub() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const rec = id => profile?.blindBest?.[id];
  return (
    <div className="page">
      <style>{`@keyframes bh-eq { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } } @media (prefers-reduced-motion: reduce) { .bh-bar { animation: none !important } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>🎵 Blind test</div>
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 3, height: 26 }}>
          {[0, 0.2, 0.1, 0.35, 0.05, 0.3].map((d, k) => (
            <div key={k} className="bh-bar" style={{ width: 4, height: '100%', borderRadius: 2, background: ['#E8844A', '#C96AB0', '#9A7BC9'][k % 3], transformOrigin: 'center', animation: `bh-eq ${0.7 + k * 0.11}s ${d}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
      <div className="page-sub">10 extraits de 30 s : devine le morceau. Choisis ton style.</div>
      <button data-testid="bt-ranking" onClick={() => navigate('/blindtest/classement')} className="btn btn-secondary btn-full" style={{ marginBottom: 12 }}>🏆 Classement du blind test</button>
      <div data-testid="bt-cat" data-cat="mix" onClick={() => navigate('/blindtest/mix')}
        style={{ background: 'linear-gradient(135deg, rgba(232,132,74,.4), rgba(154,123,201,.32))', border: '1px solid rgba(232,132,74,.7)', borderRadius: 20, padding: '18px 18px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🎲</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 19 }}>Tout mélangé</div>
          <div style={{ fontSize: 12, color: 'var(--text)', opacity: .85 }}>Un peu de tous les styles · {ALL_TRACKS.length} morceaux</div>
        </div>
        <div style={{ fontSize: 22 }}>›</div>
      </div>
      <div className="bt-grid">
        {BLIND_CATS.map(c => (
          <div key={c.id} data-testid="bt-cat" data-cat={c.id} onClick={() => navigate(`/blindtest/${c.id}`)}
            style={{ background: `${c.color}2E`, border: `1px solid ${c.color}80`, borderRadius: 18, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 138 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{c.icon}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', opacity: .75, lineHeight: 1.4, flex: 1 }}>{c.desc}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.color }}>{rec(c.id) ? `Record : ${rec(c.id)}/10` : `${c.tracks.length} morceaux`}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Visualiseur : barres + halo qui bougent pendant l'écoute ──
function Visualizer({ playing, loading, onPlay, disabled }) {
  const bars = Array.from({ length: 28 }, (_, i) => ({
    d: ((i * 37) % 11) / 10, // décalage pseudo-aléatoire stable
    t: 0.55 + ((i * 53) % 9) / 14,
    h: 30 + ((i * 29) % 50),
  }));
  return (
    <div style={{ textAlign: 'center', padding: '6px 0 2px' }}>
      <style>{`
        @keyframes bt-eq { 0%,100% { transform: scaleY(.18) } 50% { transform: scaleY(1) } }
        @keyframes bt-ring { 0% { transform: scale(.8); opacity: .55 } 100% { transform: scale(1.3); opacity: 0 } }
        @keyframes bt-beat { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
        @media (prefers-reduced-motion: reduce) { .bt-anim { animation: none !important } }
      `}</style>
      <div style={{ position: 'relative', width: 190, height: 190, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {playing && [0, 1, 2].map(i => (
          <div key={i} className="bt-anim" style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '2px solid var(--yellow)', animation: `bt-ring 2.1s ${i * 0.7}s ease-out infinite` }} />
        ))}
        <button data-testid="bt-play" disabled={disabled} onClick={onPlay} aria-label={playing ? 'Réécouter' : "Écouter l'extrait"}
          className={playing ? 'bt-anim' : ''}
          style={{ position: 'relative', zIndex: 1, width: 140, height: 140, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--yellow)', color: 'var(--on-primary)', fontSize: 44,
            boxShadow: playing ? '0 0 34px rgba(232,132,74,.55)' : '0 6px 18px rgba(0,0,0,.35)', animation: playing ? 'bt-beat .9s ease-in-out infinite' : 'none' }}>
          {loading ? '…' : playing ? '♪' : '▶'}
        </button>
      </div>
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 64 }}>
        {bars.map((b, i) => (
          <div key={i} className="bt-anim" style={{
            width: 5, height: `${b.h}%`, borderRadius: 3, background: i % 3 === 0 ? 'var(--yellow)' : i % 3 === 1 ? 'var(--pink)' : 'var(--purple)',
            transformOrigin: 'center', transform: 'scaleY(.18)', opacity: playing ? 1 : 0.35,
            animation: playing ? `bt-eq ${b.t}s ${b.d}s ease-in-out infinite` : 'none',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{loading ? "Chargement de l'extrait…" : playing ? 'Écoute bien…' : "Touche le disque pour écouter"}</div>
    </div>
  );
}

export function BlindPlay({ preset }) {
  const { cat } = useParams();
  const navigate = useNavigate();
  const styleId = preset ? preset.styleId : cat;
  const info = styleId === 'mix' ? { id: 'mix', label: 'Tout mélangé', icon: '🎲', tracks: ALL_TRACKS } : getBlindCat(styleId);
  const duelId = preset?.duelId || null;
  const [rounds, setRounds] = useState(preset ? preset.rounds : null);
  const [friends, setFriends] = useState([]);
  const [invitee, setInvitee] = useState('');
  const [creating, setCreating] = useState(false);
  const [dErr, setDErr] = useState('');
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [url, setUrl] = useState(undefined); // undefined = chargement, null = indisponible
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  const { user, profile, updateProfile } = useAuth();
  const awarded = useRef(false);
  const [gain, setGain] = useState(null); // { xp, reduced, best }

  // Fin de partie : XP, record du style, classement hebdo
  useEffect(() => {
    if (!rounds || i < ROUNDS || awarded.current) return;
    awarded.current = true;
    if (!user || !profile) { setGain({ xp: 0, guest: true }); return; }
    (async () => {
      try {
        const today = dayKey();
        const played = profile.blindDay?.date === today ? (profile.blindDay.count || 0) : 0;
        const reduced = played >= FULL_GAMES_PER_DAY;
        const xp = Math.round(score * XP_PER_GOOD * (reduced ? 0.25 : 1));
        const totalXP = (profile.totalXP || 0) + xp;
        let lvl = 1, remaining = totalXP; while (remaining >= XP_PER_LEVEL) { remaining -= XP_PER_LEVEL; lvl++; }
        const lg = nextLeagueState(profile, xp);
        const prevBest = profile.blindBest?.[info.id] || 0;
        const best = Math.max(prevBest, score);
        setGain({ xp, reduced, best, newRecord: score > prevBest && score > 0 });
        const blindBest = { ...(profile.blindBest || {}), [info.id]: best };
        const blindTotal = Object.values(blindBest).reduce((a, b) => a + (Number(b) || 0), 0);
        const events = best > prevBest && best >= 5 ? addEvent(profile, { k: '🎵', t: `nouveau record au blind test (${best}/10)` }) : (profile.events || []);
        await updateProfile({
          events,
          totalXP, xpAt: serverTimestamp(), level: lvl, xpInLevel: remaining, weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league,
          blindBest,
          blindPlayed: (profile.blindPlayed || 0) + 1,
          blindDay: { date: today, count: played + 1 },
        });
        if (duelId) await setDoc(doc(db, 'duel_results', `${duelId}_${user.uid}`), { uid: user.uid, name: profile.displayName || user.displayName || 'Joueur', duelId, score, total: ROUNDS, createdAt: serverTimestamp() });
        await setDoc(doc(db, 'leaderboard', user.uid), {
          uid: user.uid, name: profile.displayName || user.displayName || 'Joueur', totalXP, level: lvl,
          weekKey: lg.weekKey, weekXP: lg.weekXP, league: lg.league,
          avatar: profile.avatar || '', title: profile.title || '', blindBest, blindTotal, events, updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (e) { console.error(e); }
    })();
    // eslint-disable-next-line
  }, [rounds, i]);

  useEffect(() => {
    if (!rounds || i >= ROUNDS) return undefined;
    let alive = true;
    setUrl(undefined); setPlaying(false);
    fetchPreview(rounds[i].track).then(u => { if (alive) setUrl(u || null); }).catch(() => { if (alive) setUrl(null); });
    return () => { alive = false; if (audio.current) audio.current.pause(); };
  }, [rounds, i]);

  useEffect(() => {
    if (!user || preset) return;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', user.uid))),
          getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', user.uid))),
        ]);
        const out = [];
        a.forEach(d => { const x = d.data(); if (x.status === 'accepted') out.push({ uid: x.toUid, name: x.toName }); });
        b.forEach(d => { const x = d.data(); if (x.status === 'accepted') out.push({ uid: x.fromUid, name: x.fromName }); });
        setFriends(out);
      } catch (e) { /* règles amis pas publiées : pas de liste */ }
    })();
  }, [user, preset]);

  if (!info) return <Navigate to="/blindtest" replace />;

  async function createDuel() {
    setDErr(''); setCreating(true);
    try {
      const rs = build(info.tracks);
      const friend = friends.find(f => f.uid === invitee);
      const ref = await addDoc(collection(db, 'duels'), {
        type: 'blind', styleId: info.id, questionIds: encodeRounds(info.id, rs), cat: info.id, diff: 'all',
        creatorUid: user.uid, creatorName: profile?.displayName || user.displayName || 'Un joueur', createdAt: serverTimestamp(),
        ...(friend ? { invitedUid: friend.uid, invitedName: friend.name } : {}),
      });
      navigate(`/duel/${ref.id}`);
    } catch (e) { console.error(e); setDErr('Impossible de créer le duel.'); setCreating(false); }
  }

  function play() {
    const a = audio.current; if (!a || !url) return;
    a.currentTime = 0;
    const p = a.play(); if (p && p.catch) p.catch(() => setPlaying(false));
    setPlaying(true);
  }
  function pick(opt) {
    if (picked) return;
    setPicked(opt);
    if (opt === rounds[i].track) setScore(s => s + 1);
    // on laisse l'extrait finir : on peut encore l'écouter après la réponse
  }
  function next() { if (audio.current) audio.current.pause(); setPicked(null); setI(x => x + 1); }
  function restart() { awarded.current = false; setGain(null); setRounds(build(info.tracks)); setI(0); setScore(0); setPicked(null); }

  if (!rounds) {
    return (
      <div className="page">
        <div className="page-title">{info.icon || '🎲'} {info.label}</div>
        <div className="page-sub">10 extraits, 4 choix chacun</div>
        <div style={card}>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>Tu écoutes un extrait de 30 secondes, puis tu choisis le bon morceau. Monte le son !</div>
          <button className="btn btn-primary btn-full" data-testid="bt-start" onClick={restart}>Commencer</button>
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>⚔️ Défier un ami</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>Mêmes 10 extraits pour vous deux, les scores s'affichent à la fin.</div>
          {!user ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>Connecte-toi pour créer un duel.</div> : (
            <>
              {friends.length > 0 && (
                <select data-testid="bt-invitee" value={invitee} onChange={e => setInvitee(e.target.value)}
                  style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontSize: 14, marginBottom: 8 }}>
                  <option value="">Partager par lien (pas d'ami précis)</option>
                  {friends.map(f => <option key={f.uid} value={f.uid}>Inviter {f.name}</option>)}
                </select>
              )}
              <button className="btn btn-secondary btn-full" data-testid="bt-duel-create" disabled={creating} onClick={createDuel}>{creating ? '…' : 'Créer le duel'}</button>
              {dErr && <div role="alert" style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{dErr}</div>}
            </>
          )}
        </div>
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/blindtest')}>Changer de style</button>
      </div>
    );
  }

  if (i >= ROUNDS) {
    return (
      <div className="page" data-testid="bt-result">
        <div className="page-title">🎵 Blind test terminé</div>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 44, fontWeight: 800, color: 'var(--yellow)' }}>{score}/{ROUNDS}</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>{score >= 8 ? 'Quelle oreille ! 🎧' : score >= 5 ? 'Pas mal du tout !' : 'Tu feras mieux à la prochaine écoute.'}</div>
        </div>
        {gain && (
          <div data-testid="bt-gain" style={{ ...card, textAlign: 'center', borderColor: gain.xp ? 'var(--yellow)' : 'var(--s2)' }}>
            {gain.guest ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>Connecte-toi pour gagner de l'XP et enregistrer tes records.</div> : (
              <>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--yellow)' }}>+{gain.xp} XP</div>
                {gain.newRecord && <div style={{ fontSize: 13, color: 'var(--cyan)', marginTop: 4 }}>🏆 Nouveau record sur ce style : {gain.best}/{ROUNDS}</div>}
                {!gain.newRecord && gain.best > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Ton record sur ce style : {gain.best}/{ROUNDS}</div>}
                {gain.reduced && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>XP réduit : tu as déjà fait {FULL_GAMES_PER_DAY} parties complètes aujourd'hui.</div>}
              </>
            )}
          </div>
        )}
        {duelId ? (
          <>
            <div className="section-label">Résultats du duel</div>
            <DuelBoard duelId={duelId} invitedUid={preset.invitedUid} invitedName={preset.invitedName} />
            <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={() => navigate('/blindtest')}>Retour au blind test</button>
          </>
        ) : (
          <>
            <ShareButton title={`Blind test · ${info.label}`} big={`${score}/${ROUNDS}`} sub={gain ? `+${gain.xp} XP` : ''} emoji="🎵" color={info.color} style={{ marginBottom: 8 }} />
            <button className="btn btn-primary btn-full" onClick={restart}>Rejouer ce style</button>
            <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => navigate('/blindtest')}>Changer de style</button>
          </>
        )}
      </div>
    );
  }

  const r = rounds[i];
  return (
    <div className="page">
      <div className="page-title">{info.icon || '🎲'} {info.label}</div>
      <div className="page-sub">Extrait {i + 1}/{ROUNDS} · {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''}</div>
      <div style={{ ...card, overflow: 'hidden' }}>
        {url ? <audio ref={audio} src={url} preload="auto" onEnded={() => setPlaying(false)} /> : null}
        {url === null ? (
          <div role="alert" style={{ fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>
            Extrait indisponible pour ce morceau.
            <div><button className="btn btn-secondary" style={{ marginTop: 8 }} data-testid="bt-skip" onClick={next}>Passer</button></div>
          </div>
        ) : (
          <Visualizer playing={playing} loading={url === undefined} disabled={!url} onPlay={play} />
        )}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {r.options.map(o => {
          const good = o === r.track;
          const bg = !picked ? 'var(--s1)' : good ? 'rgba(143,195,159,.22)' : picked === o ? 'rgba(229,96,77,.22)' : 'var(--s1)';
          const bd = !picked ? 'var(--s2)' : good ? 'var(--cyan)' : picked === o ? 'var(--red)' : 'var(--s2)';
          return (
            <button key={label(o)} data-testid="bt-opt" onClick={() => pick(o)} disabled={!!picked}
              style={{ textAlign: 'left', background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14, cursor: picked ? 'default' : 'pointer' }}>
              {label(o)}
            </button>
          );
        })}
      </div>
      {picked && (
        <button className="btn btn-primary btn-full" data-testid="bt-next" style={{ marginTop: 12 }} onClick={next}>
          {i + 1 >= ROUNDS ? 'Voir mon score' : 'Extrait suivant'}
        </button>
      )}
    </div>
  );
}

// ── Classement : meilleurs scores par style (et total) ──
export function BlindBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [sel, setSel] = useState('total');
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'leaderboard'), where('blindTotal', '>', 0), orderBy('blindTotal', 'desc'), limit(200)));
        setRows(snap.docs.map(d => d.data()));
      } catch (e) { console.error(e); setRows([]); }
    })();
  }, []);
  const score = r => sel === 'total' ? (r.blindTotal || 0) : (r.blindBest?.[sel] || 0);
  const list = (rows || []).filter(r => score(r) > 0).sort((a, b) => score(b) - score(a)).slice(0, 30);
  const MEDALS = ['🥇', '🥈', '🥉'];
  const chip = a => ({ padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${a ? 'var(--yellow)' : 'var(--s2)'}`, background: a ? 'rgba(232,132,74,.2)' : 'var(--s1)', color: a ? '#fff' : 'var(--muted)', whiteSpace: 'nowrap' });
  return (
    <div className="page">
      <div className="page-title">🏆 Classement blind test</div>
      <div className="page-sub">{sel === 'total' ? 'Somme de tes meilleurs scores de chaque style' : 'Meilleur score sur 10'}</div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
        <div data-testid="bb-tab" data-tab="total" style={chip(sel === 'total')} onClick={() => setSel('total')}>Total</div>
        {BLIND_CATS.map(c => <div key={c.id} data-testid="bb-tab" data-tab={c.id} style={chip(sel === c.id)} onClick={() => setSel(c.id)}>{c.icon} {c.label}</div>)}
        <div data-testid="bb-tab" data-tab="mix" style={chip(sel === 'mix')} onClick={() => setSel('mix')}>🎲 Mélangé</div>
      </div>
      {rows === null && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 28, fontSize: 13 }}>Chargement…</div>}
      {rows !== null && list.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 28, fontSize: 13 }}>Personne n'a encore de score ici. Sois le premier !</div>}
      {list.map((r, k) => (
        <div key={r.uid} data-testid="bb-row" style={{ display: 'flex', alignItems: 'center', gap: 10, background: r.uid === user?.uid ? 'rgba(232,132,74,.15)' : 'var(--s1)', border: `1px solid ${r.uid === user?.uid ? 'var(--yellow)' : 'var(--s2)'}`, borderRadius: 12, padding: '10px 13px', marginBottom: 6 }}>
          <div style={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: k < 3 ? 18 : 13, color: 'var(--muted)' }}>{MEDALS[k] || k + 1}</div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><Avatar id={r.avatar} frame={r.frame} size={24} />{r.name}{r.uid === user?.uid && ' (toi)'}</div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, color: 'var(--yellow)' }}>{sel === 'total' ? score(r) : `${score(r)}/10`}</div>
        </div>
      ))}
      <button className="btn btn-secondary btn-full" style={{ marginTop: 10 }} onClick={() => navigate('/blindtest')}>Retour</button>
    </div>
  );
}
