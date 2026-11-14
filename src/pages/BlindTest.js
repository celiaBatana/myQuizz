import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { BLIND_CATS, ALL_TRACKS, getBlindCat } from '../data/blindtest';
import { fetchPreview } from '../utils/itunes';

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

// ── Choix du type de blind test ──
export default function BlindHub() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="page-title">🎵 Blind test</div>
      <div className="page-sub">10 extraits de 30 s : devine le morceau. Choisis ton style.</div>
      <div data-testid="bt-cat" data-cat="mix" onClick={() => navigate('/blindtest/mix')}
        style={{ ...card, borderColor: 'var(--yellow)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28 }}>🎲</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16 }}>Tout mélangé</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Un peu de tous les styles</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {BLIND_CATS.map(c => (
          <div key={c.id} data-testid="bt-cat" data-cat={c.id} onClick={() => navigate(`/blindtest/${c.id}`)}
            style={{ ...card, marginBottom: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 26 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{c.desc}</div>
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
        @keyframes bt-ring { 0% { transform: scale(.8); opacity: .55 } 100% { transform: scale(1.9); opacity: 0 } }
        @keyframes bt-beat { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
        @media (prefers-reduced-motion: reduce) { .bt-anim { animation: none !important } }
      `}</style>
      <div style={{ position: 'relative', width: 140, height: 140, margin: '6px auto 10px' }}>
        {playing && [0, 1, 2].map(i => (
          <div key={i} className="bt-anim" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--yellow)', animation: `bt-ring 2.1s ${i * 0.7}s ease-out infinite` }} />
        ))}
        <button data-testid="bt-play" disabled={disabled} onClick={onPlay} aria-label={playing ? 'Réécouter' : "Écouter l'extrait"}
          className={playing ? 'bt-anim' : ''}
          style={{ position: 'relative', width: 140, height: 140, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--yellow)', color: 'var(--on-primary)', fontSize: 44,
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

export function BlindPlay() {
  const { cat } = useParams();
  const navigate = useNavigate();
  const info = cat === 'mix' ? { id: 'mix', label: 'Tout mélangé', tracks: ALL_TRACKS } : getBlindCat(cat);
  const [rounds, setRounds] = useState(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [url, setUrl] = useState(undefined); // undefined = chargement, null = indisponible
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);

  useEffect(() => {
    if (!rounds || i >= ROUNDS) return undefined;
    let alive = true;
    setUrl(undefined); setPlaying(false);
    fetchPreview(rounds[i].track).then(u => { if (alive) setUrl(u || null); }).catch(() => { if (alive) setUrl(null); });
    return () => { alive = false; if (audio.current) audio.current.pause(); };
  }, [rounds, i]);

  if (!info) return <Navigate to="/blindtest" replace />;

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
  function restart() { setRounds(build(info.tracks)); setI(0); setScore(0); setPicked(null); }

  if (!rounds) {
    return (
      <div className="page">
        <div className="page-title">{info.icon || '🎲'} {info.label}</div>
        <div className="page-sub">10 extraits, 4 choix chacun</div>
        <div style={card}>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>Tu écoutes un extrait de 30 secondes, puis tu choisis le bon morceau. Monte le son !</div>
          <button className="btn btn-primary btn-full" data-testid="bt-start" onClick={restart}>Commencer</button>
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
        <button className="btn btn-primary btn-full" onClick={restart}>Rejouer ce style</button>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => navigate('/blindtest')}>Changer de style</button>
      </div>
    );
  }

  const r = rounds[i];
  return (
    <div className="page">
      <div className="page-title">{info.icon || '🎲'} {info.label}</div>
      <div className="page-sub">Extrait {i + 1}/{ROUNDS} · {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''}</div>
      <div style={{ ...card }}>
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
