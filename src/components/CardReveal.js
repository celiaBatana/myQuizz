import React from 'react';
import Confetti from './Confetti';

// Révélation animée d'une carte gagnée (carte = { icon, name, color, gradient, catLabel, fact })
export default function CardReveal({ card, title = 'Nouvelle carte !', onClose, onCollection }) {
  const c = card.rarity ? card.rarity.color : (card.color || '#E8844A');
  return (
    <div data-testid="card-reveal" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(12,8,5,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <style>{`
        @keyframes cr-flip { 0% { transform: perspective(900px) rotateY(90deg) scale(.6); opacity: 0 } 60% { transform: perspective(900px) rotateY(-12deg) scale(1.06); opacity: 1 } 100% { transform: perspective(900px) rotateY(0) scale(1); opacity: 1 } }
        @keyframes cr-glow { 0%,100% { box-shadow: 0 0 24px var(--cr-c), 0 10px 40px rgba(0,0,0,.6) } 50% { box-shadow: 0 0 56px var(--cr-c), 0 10px 40px rgba(0,0,0,.6) } }
        @keyframes cr-rise { from { transform: translateY(14px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes cr-shine { 0% { transform: translateX(-120%) } 100% { transform: translateX(220%) } }
        @media (prefers-reduced-motion: reduce) { .cr-anim { animation: none !important } }
      `}</style>
      <Confetti />
      <div className="cr-anim" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 900, fontSize: 28, marginBottom: 18, animation: 'cr-rise .5s .1s both' }}>{title}</div>
      <div className="cr-anim" style={{ '--cr-c': c, position: 'relative', overflow: 'hidden', width: 230, minHeight: 300, borderRadius: 22, padding: '26px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: card.gradient || 'var(--s1)', backgroundColor: '#2A231E', border: `2px solid ${c}`, animation: 'cr-flip .9s cubic-bezier(.2,.9,.3,1.2) both, cr-glow 2.2s .9s ease-in-out infinite' }}>
        <div className="cr-anim" style={{ position: 'absolute', top: 0, bottom: 0, width: 60, left: 0, background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.22), transparent)', animation: 'cr-shine 2.4s 1s ease-in-out infinite' }} />
        <div style={{ fontSize: 64 }}>{card.icon}</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 21 }}>{card.name}</div>
        {card.rarity && <div data-testid="card-rarity" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', padding: '2px 10px', borderRadius: 10, background: c + '33', color: c }}>{card.rarity.label}</div>}
        {card.catLabel && <div style={{ fontSize: 12, color: c, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{card.catLabel}</div>}
        {card.fact && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{card.fact}</div>}
      </div>
      <div className="cr-anim" style={{ display: 'flex', gap: 10, marginTop: 22, animation: 'cr-rise .5s 1.1s both' }}>
        <button className="btn btn-primary" data-testid="card-reveal-close" onClick={e => { e.stopPropagation(); onClose(); }}>Continuer</button>
        {onCollection && <button className="btn btn-secondary" onClick={e => { e.stopPropagation(); onCollection(); }}>Ma collection</button>}
      </div>
    </div>
  );
}
