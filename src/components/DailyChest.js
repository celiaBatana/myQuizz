import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dayKey } from '../hooks/useQuiz';
import { chestTier, rollChest } from '../utils/chest';
import { cardInfo } from '../data/cards';
import { findCosmetic } from '../data/cosmetics';
import Confetti from './Confetti';
import CardReveal from './CardReveal';

const display = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };

export default function DailyChest() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle'); // idle | shaking | opened
  const [res, setRes] = useState(null);
  const [showCard, setShowCard] = useState(false);
  if (!user || !profile) return null;
  const today = dayKey();
  const streak = profile.streak || 0;
  const tier = chestTier(streak);
  if (profile.chestDay === today && phase === 'idle') return null;

  async function open() {
    if (phase !== 'idle') return;
    const r = rollChest(profile, streak);
    setRes(r); setPhase('shaking');
    // On enregistre tout de suite : impossible de retirer en rechargeant la page
    const patch = { chestDay: today, gemsBonus: (profile.gemsBonus || 0) + r.gems };
    if (r.card) patch.cards = [...(profile.cards || []), r.card];
    if (r.cosmetic) patch.unlocked = [...new Set([...(profile.unlocked || []), r.cosmetic])];
    try { await updateProfile(patch); } catch (e) { console.warn('Coffre non enregistré', e); }
    setTimeout(() => setPhase('opened'), 1700);
  }

  if (phase === 'idle') return (
    <div data-testid="chest-card" onClick={open} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 14, padding: '14px 16px', borderRadius: 18, background: `linear-gradient(120deg, ${tier.color}33, var(--s1) 70%)`, border: `1px solid ${tier.color}88` }}>
      <style>{`@keyframes ch-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } } @media (prefers-reduced-motion: reduce) { .ch-bob { animation: none !important } }`}</style>
      <div className="ch-bob" style={{ fontSize: 44, animation: 'ch-bob 1.6s ease-in-out infinite' }}>{tier.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ ...display, fontSize: 16 }}>{tier.label} à ouvrir !</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{tier.mult > 1 ? `Bonus série ${streak} jours : récompenses ×${tier.mult}` : 'Des éclats, parfois une carte rare'}</div>
      </div>
      <button className="btn btn-primary" data-testid="chest-open" style={{ padding: '8px 16px' }}>Ouvrir</button>
    </div>
  );

  const cInfo = res?.card ? cardInfo(res.card) : null;
  const cos = res?.cosmetic ? findCosmetic(res.cosmetic) : null;
  return (
    <>
      {showCard && cInfo && <CardReveal card={cInfo} title="Carte rare !" onClose={() => { setShowCard(false); setPhase('idle'); }} onCollection={() => navigate('/collection')} />}
      {!showCard && (
        <div data-testid="chest-modal" style={{ position: 'fixed', inset: 0, zIndex: 1150, background: 'rgba(12,8,5,.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
          <style>{`
            @keyframes ch-shake { 0%,100% { transform: rotate(0) scale(1) } 15% { transform: rotate(-12deg) scale(1.05) } 30% { transform: rotate(10deg) scale(1.1) } 45% { transform: rotate(-14deg) scale(1.15) } 60% { transform: rotate(12deg) scale(1.2) } 80% { transform: rotate(-6deg) scale(1.3) } }
            @keyframes ch-pop { 0% { transform: scale(.3); opacity: 0 } 70% { transform: scale(1.2) } 100% { transform: scale(1); opacity: 1 } }
            @keyframes ch-rise { from { transform: translateY(14px); opacity: 0 } to { transform: none; opacity: 1 } }
            @media (prefers-reduced-motion: reduce) { .ch-a { animation: none !important } }
          `}</style>
          {phase === 'shaking' ? (
            <>
              <div className="ch-a" style={{ fontSize: 110, animation: 'ch-shake 1.6s ease-in-out both', filter: `drop-shadow(0 0 24px ${res.tier.color})` }}>{res.tier.icon}</div>
              <div style={{ ...display, fontSize: 18, marginTop: 20, color: 'var(--muted)' }}>Ça bouge là-dedans…</div>
            </>
          ) : (
            <>
              <Confetti />
              <div className="ch-a" style={{ ...display, fontSize: 26, marginBottom: 14, animation: 'ch-rise .5s both' }}>{res.tier.label}</div>
              <div className="ch-a" data-testid="chest-gems" style={{ ...display, fontSize: 64, color: '#7FD6E8', animation: 'ch-pop .6s .1s both' }}>+{res.gems} 💎</div>
              {cos && <div className="ch-a" style={{ marginTop: 14, fontSize: 16, animation: 'ch-rise .5s .5s both' }}>{cos.icon || '🏷️'} Nouveau : <strong>{cos.name}</strong></div>}
              {cInfo && <div className="ch-a" style={{ marginTop: 14, fontSize: 16, color: '#FFD166', animation: 'ch-rise .5s .7s both' }}>🃏 Une carte rare t'attend !</div>}
              <button className="btn btn-primary" data-testid="chest-close" style={{ marginTop: 28 }} onClick={() => { if (cInfo) setShowCard(true); else setPhase('idle'); }}>{cInfo ? 'Voir la carte' : 'Super !'}</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
