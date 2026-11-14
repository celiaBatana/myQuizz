import React, { useMemo } from 'react';

const COLORS = ['#FFD166', '#FF6B9D', '#CF7A45', '#4DE1C1', '#FF8A3D'];

// Confettis CSS (aucune dépendance)
export default function Confetti({ count = 50 }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 1.2, dur: 2.4 + Math.random() * 1.8,
    size: 6 + Math.random() * 7, color: COLORS[i % COLORS.length], rot: Math.random() * 360,
  })), [count]);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1200 }}>
      <style>{`@keyframes qz-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1 } 100% { transform: translateY(110vh) rotate(720deg); opacity: .9 } }`}</style>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${p.left}%`, width: p.size, height: p.size * 0.5, background: p.color,
          borderRadius: 2, transform: `rotate(${p.rot}deg)`, animation: `qz-fall ${p.dur}s ${p.delay}s linear forwards`,
        }} />
      ))}
    </div>
  );
}
