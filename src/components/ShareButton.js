import React, { useState } from 'react';
import { shareScore } from '../utils/share';

export default function ShareButton({ title, big, sub, emoji, color, style }) {
  const [state, setState] = useState('');
  const go = async () => {
    setState('…');
    const r = await shareScore({ title, big, sub, emoji, color });
    setState(r === 'copied' ? 'Texte copié et image enregistrée ✓' : r === 'shared' ? 'Partagé ✓' : '');
    if (r !== 'cancelled') setTimeout(() => setState(''), 3500);
  };
  return (
    <button className="btn btn-secondary btn-full" data-testid="share-btn" style={style} onClick={go}>
      {state || '📤 Partager mon score'}
    </button>
  );
}
