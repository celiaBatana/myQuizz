import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AVATARS, TITLES, ownedIds } from '../data/cosmetics';
import { gemsBalance } from '../utils/gems';

const PRICE = { freeze: 60, chest: 100, avatar: 150, title: 100 };
const disp = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };
const tile = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 16, padding: 14, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 };

export default function Boutique() {
  const { user, profile, updateProfile } = useAuth();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const owned = useMemo(() => ownedIds(profile), [profile]);
  const gems = gemsBalance(profile);
  const freezes = profile?.freezes || 0;
  const locked = [...AVATARS, ...TITLES].filter(c => c.chest && !owned.has(c.id));

  if (!user) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>Connecte-toi pour utiliser ta boutique.</div>;

  async function buy(cost, patch, ok) {
    if (busy || gems < cost) return;
    setBusy(true); setMsg('');
    try {
      await updateProfile({ ...patch, gemsSpent: (profile.gemsSpent || 0) + cost });
      setMsg(ok);
    } catch (e) { console.error(e); setMsg('Achat impossible pour le moment.'); }
    setBusy(false);
  }
  const buyFreeze = () => buy(PRICE.freeze, { freezes: freezes + 1 }, '🧊 Gel de série ajouté !');
  const buyChest = () => {
    const c = locked[Math.floor(Math.random() * locked.length)];
    if (!c) return;
    buy(PRICE.chest, { unlocked: [...(profile.unlocked || []), c.id] }, `🎁 Tu as obtenu : ${c.icon || ''} ${c.name} !`);
  };
  const buyItem = c => buy(c.icon ? PRICE.avatar : PRICE.title, { unlocked: [...(profile.unlocked || []), c.id] }, `Débloqué : ${c.icon || ''} ${c.name}. Équipe-le depuis ton profil.`);

  const Btn = ({ cost, onClick, disabled, id }) => (
    <button data-testid={id} className="btn btn-primary" disabled={disabled || busy || gems < cost} onClick={onClick} style={{ padding: '9px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>{cost} 💎</button>
  );

  return (
    <div className="page page-narrow">
      <div className="page-title">💎 Boutique</div>
      <div className="page-sub">Tes éclats : 1 pour 10 XP gagnés</div>
      <div data-testid="shop-balance" style={{ background: 'linear-gradient(135deg, rgba(127,214,232,.25), rgba(232,132,74,.15))', border: '1px solid rgba(127,214,232,.45)', borderRadius: 20, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 40 }}>💎</div>
        <div><div style={{ ...disp, fontSize: 30, lineHeight: 1 }}>{gems}</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>éclats disponibles</div></div>
      </div>
      {msg && <div data-testid="shop-msg" style={{ background: 'rgba(143,195,159,.15)', border: '1px solid rgba(143,195,159,.5)', borderRadius: 12, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>{msg}</div>}

      <div className="section-label">Objets</div>
      <div style={tile}>
        <div style={{ fontSize: 34 }}>🧊</div>
        <div style={{ flex: 1 }}><div style={{ ...disp, fontSize: 15 }}>Gel de série</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>Sauve ta série si tu rates un jour · {freezes}/2</div></div>
        <Btn id="buy-freeze" cost={PRICE.freeze} onClick={buyFreeze} disabled={freezes >= 2} />
      </div>
      <div style={tile}>
        <div style={{ fontSize: 34 }}>🎁</div>
        <div style={{ flex: 1 }}><div style={{ ...disp, fontSize: 15 }}>Coffre mystère</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{locked.length ? 'Un avatar ou un titre rare au hasard' : 'Tu as tout débloqué !'}</div></div>
        <Btn id="buy-chest" cost={PRICE.chest} onClick={buyChest} disabled={!locked.length} />
      </div>

      {locked.length > 0 && <>
        <div className="section-label" style={{ marginTop: 18 }}>Cosmétiques</div>
        <div className="shop-grid">
          {locked.map(c => (
            <div key={c.id} data-testid="shop-item" style={{ ...tile, marginBottom: 0, flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 6 }}>
              <div style={{ fontSize: 34 }}>{c.icon || '🏷️'}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
              <Btn cost={c.icon ? PRICE.avatar : PRICE.title} onClick={() => buyItem(c)} />
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}
