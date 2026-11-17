import React from 'react';
import { BADGES } from '../data/badges';

export default function BadgesGrid({ profile }) {
  const mine = new Set(profile?.badges || []);
  const ok = b => mine.has(b.id) || b.get(profile) >= b.goal;
  const done = BADGES.filter(ok).length;
  return (
    <div data-testid="badges" style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
        <span>🏅 Succès</span><span data-testid="badges-count" style={{ color: 'var(--yellow)' }}>{done}/{BADGES.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {BADGES.map(b => {
          const got = ok(b); const cur = Math.min(b.goal, b.get(profile));
          return (
            <div key={b.id} data-testid={got ? 'badge-ok' : 'badge-todo'} title={b.hint} style={{ textAlign: 'center', opacity: got ? 1 : 0.45, filter: got ? 'none' : 'grayscale(1)' }}>
              <div style={{ fontSize: 24 }}>{b.icon}</div>
              <div style={{ fontSize: 9.5, fontWeight: got ? 700 : 400, marginTop: 2, lineHeight: 1.25 }}>{b.name}</div>
              {!got && b.goal > 1 && <div style={{ fontSize: 9, color: 'var(--muted)' }}>{cur}/{b.goal}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
