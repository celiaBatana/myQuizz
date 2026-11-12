import React, { useState, useEffect } from 'react';
import { isSoundOn, setSoundOn } from '../utils/sound';

// Bouton son / vibrations (désactivé par défaut)
export default function SoundToggle({ style }) {
  const [on, setOn] = useState(isSoundOn());
  useEffect(() => {
    const h = () => setOn(isSoundOn());
    window.addEventListener('quizly-sound', h);
    return () => window.removeEventListener('quizly-sound', h);
  }, []);
  return (
    <button
      aria-label={on ? 'Couper le son' : 'Activer le son'}
      title={on ? 'Son et vibrations activés' : 'Son coupé : touche pour activer'}
      onClick={() => setSoundOn(!on)}
      style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 20, width: 30, height: 28, fontSize: 14, cursor: 'pointer', color: 'inherit', padding: 0, ...style }}
    >{on ? '🔊' : '🔇'}</button>
  );
}
