import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLIND_TRACKS } from '../data/blindtest';
import { fetchPreview } from '../utils/itunes';

const ROUNDS = 10;
const label = t => `${t.title} — ${t.artist}`;
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

function build() {
  return shuffle(BLIND_TRACKS).slice(0, ROUNDS).map(t => ({
    track: t,
    options: shuffle([t, ...shuffle(BLIND_TRACKS.filter(x => x !== t)).slice(0, 3)]),
  }));
}

const card = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 16, marginBottom: 12 };

export default function BlindTest() {
  const navigate = useNavigate();
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
    if (audio.current) audio.current.pause(); setPlaying(false);
  }
  function next() { setPicked(null); setI(x => x + 1); }
  function restart() { setRounds(build()); setI(0); setScore(0); setPicked(null); }

  if (!rounds) {
    return (
      <div className="page">
        <div className="page-title">🎵 Blind test</div>
        <div className="page-sub">Version test · 10 extraits, devine le morceau</div>
        <div style={card}>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>Tu écoutes un extrait de 30 secondes, puis tu choisis le bon titre parmi 4. Monte le son !</div>
          <button className="btn btn-primary btn-full" data-testid="bt-start" onClick={restart}>Commencer</button>
        </div>
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/jouer')}>Retour</button>
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
        <button className="btn btn-primary btn-full" onClick={restart}>Rejouer</button>
        <button className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => navigate('/jouer')}>Retour</button>
      </div>
    );
  }

  const r = rounds[i];
  return (
    <div className="page">
      <div className="page-title">🎵 Blind test</div>
      <div className="page-sub">Extrait {i + 1}/{ROUNDS} · {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''}</div>
      <div style={{ ...card, textAlign: 'center' }}>
        {url ? <audio ref={audio} src={url} preload="auto" onEnded={() => setPlaying(false)} /> : null}
        {url === undefined && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Chargement de l'extrait…</div>}
        {url === null && (
          <div role="alert" style={{ fontSize: 13, color: 'var(--red)' }}>
            Extrait indisponible pour ce morceau.
            <div><button className="btn btn-secondary" style={{ marginTop: 8 }} data-testid="bt-skip" onClick={next}>Passer</button></div>
          </div>
        )}
        {url && (
          <button className="btn btn-primary" data-testid="bt-play" style={{ fontSize: 16, padding: '14px 26px' }} onClick={play}>
            {playing ? '🔊 En cours…' : '▶ Écouter l\'extrait'}
          </button>
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
