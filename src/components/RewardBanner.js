import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cardInfo } from '../data/cards';
import { findCosmetic } from '../data/cosmetics';
import { badgeById } from '../data/badges';

// Détecte tout gain du joueur (XP, éclats, niveau, cartes, cosmétiques) quelle que soit la page,
// et l'annonce dans un bandeau bien visible. Les gains rapprochés sont regroupés dans le même bandeau.
export function diffGains(prev, next) {
  if (!prev || !next) return [];
  const g = [];
  const dXP = (next.totalXP || 0) - (prev.totalXP || 0);
  if (dXP > 0) g.push({ k: 'xp', v: dXP, icon: '⚡', text: `+${dXP} XP` });
  const dG = (next.gemsBonus || 0) - (prev.gemsBonus || 0);
  if (dG > 0) g.push({ k: 'gems', v: dG, icon: '💎', text: `+${dG} éclats` });
  if ((next.level || 1) > (prev.level || 1)) g.push({ k: 'level', v: next.level, icon: '🎉', text: `Niveau ${next.level} !` });
  const pc = new Set(prev.cards || []);
  (next.cards || []).filter(c => !pc.has(c)).forEach(c => { const ci = cardInfo(c); g.push({ k: 'card:' + c, icon: ci?.icon || '🃏', text: `Nouvelle carte : ${ci?.name || c}` }); });
  const pu = new Set(prev.unlocked || []);
  (next.unlocked || []).filter(c => !pu.has(c)).forEach(c => { const co = findCosmetic(c); if (co) g.push({ k: 'cos:' + c, icon: co.icon || '🎁', text: `Débloqué : ${co.name}` }); });
  const pb = new Set(prev.badges || []);
  const nb = (next.badges || []).filter(c => !pb.has(c) && badgeById(c));
  if (nb.length > 3) g.push({ k: 'badges', icon: '🏅', text: `${nb.length} succès débloqués !` });
  else nb.forEach(c => { const b = badgeById(c); g.push({ k: 'badge:' + c, icon: b.icon, text: `Succès : ${b.name}` }); });
  return g;
}

// Pages qui affichent déjà elles-mêmes ce que tu as gagné : le bandeau n'y annonce que les succès
const SELF = ['/quiz/', '/play', '/daily', '/blindtest/', '/raid', '/rush', '/boss/', '/duel/', '/revision', '/boutique'];
export const hasOwnResult = path => path === '/' || (SELF.some(p => path.startsWith(p)) && path !== '/blindtest/classement');

export default function RewardBanner() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const prev = useRef(null);
  const prevUid = useRef(null);
  const timer = useRef(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user || !profile) { prev.current = null; prevUid.current = null; return; }
    if (prevUid.current !== user.uid) { prevUid.current = user.uid; prev.current = profile; return; } // 1er chargement : rien à annoncer
    const g = diffGains(prev.current, profile);
    prev.current = profile;
    if (!g.length) return;
    setItems(cur => {
      const m = new Map(cur.map(i => [i.k, i]));
      g.forEach(i => {
        const old = m.get(i.k);
        if (old && typeof i.v === 'number' && i.k !== 'level') { const v = old.v + i.v; m.set(i.k, { ...i, v, text: i.k === 'xp' ? `+${v} XP` : `+${v} éclats` }); }
        else m.set(i.k, i);
      });
      return [...m.values()];
    });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setItems([]), 5000);
  }, [profile, user]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const shown = hasOwnResult(pathname) ? items.filter(i => i.k.startsWith('badge')) : items;
  if (!shown.length) return null;
  return (
    <div data-testid="reward-banner" role="status" aria-live="polite" onClick={() => setItems([])}
      style={{ position: 'fixed', top: 66, left: '50%', transform: 'translateX(-50%)', zIndex: 900, width: 'calc(100% - 32px)', maxWidth: 400, cursor: 'pointer',
        background: 'linear-gradient(135deg, #3a2414, #2a1c12)', border: '1.5px solid var(--yellow)', borderRadius: 16, padding: '12px 16px',
        boxShadow: '0 10px 30px rgba(0,0,0,.55), 0 0 24px rgba(232,132,74,.35)', animation: 'rbIn .35s cubic-bezier(.175,.885,.32,1.275)' }}>
      <style>{'@keyframes rbIn { from { opacity: 0; transform: translate(-50%, -16px) scale(.94) } to { opacity: 1; transform: translate(-50%, 0) scale(1) } }'}</style>
      <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 800, marginBottom: 6 }}>Tu as gagné</div>
      {shown.map(i => (
        <div key={i.k} data-testid="reward-line" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 800, lineHeight: 1.5 }}>
          <span style={{ fontSize: 22 }}>{i.icon}</span><span>{i.text}</span>
        </div>
      ))}
    </div>
  );
}
