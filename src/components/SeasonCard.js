import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { seasonInfo, seasonPts, claimedTiers, TIERS, tierLabel, tierIcon } from '../utils/season';

const display = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };

export default function SeasonCard() {
  const { user, profile, updateProfile } = useAuth();
  const info = seasonInfo();
  const [busy, setBusy] = useState(false);

  // Nouvelle saison : on fixe le point de départ (XP total à ce moment)
  useEffect(() => {
    if (user && profile && profile.season?.id !== info.id) {
      updateProfile({ season: { id: info.id, base: profile.totalXP || 0, claimed: [] } }).catch(() => {});
    }
    // eslint-disable-next-line
  }, [user?.uid, profile?.season?.id]);

  if (!user || !profile) return null;
  const pts = seasonPts(profile, info);
  const claimed = claimedTiers(profile, info);
  // Paliers espacés régulièrement ; la barre se remplit entre deux paliers
  const n = TIERS.length;
  const nI = TIERS.findIndex(t => pts < t.pts);
  const fillPct = nI < 0 ? 100 : (() => { const lo = nI === 0 ? 0 : TIERS[nI - 1].pts; return ((nI + (pts - lo) / (TIERS[nI].pts - lo)) / n) * 100; })();
  const reached = TIERS.map((t, i) => (pts >= t.pts ? i : -1)).filter(i => i >= 0);
  const claimable = reached.filter(i => !claimed.includes(i));
  const nextI = TIERS.findIndex(t => pts < t.pts);
  const next = nextI >= 0 ? TIERS[nextI] : null;

  async function claim() {
    if (busy || !claimable.length) return;
    setBusy(true);
    let gems = 0; const unlocked = new Set(profile.unlocked || []);
    claimable.forEach(i => { const t = TIERS[i]; gems += t.gems || 0; [t.frame, t.title, t.avatar].forEach(x => x && unlocked.add(x)); });
    try {
      await updateProfile({ gemsBonus: (profile.gemsBonus || 0) + gems, unlocked: [...unlocked], season: { ...profile.season, claimed: [...claimed, ...claimable] } });
    } catch (e) { console.warn('Récompenses de saison non enregistrées', e); }
    setBusy(false);
  }

  return (
    <div data-testid="season" style={{ background: 'linear-gradient(135deg, rgba(230,179,90,.14), var(--s1) 65%)', border: '1px solid var(--s2)', borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ ...display, fontSize: 16, flex: 1 }}>🏆 Saison {info.id}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{info.daysLeft} j restants</div>
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'var(--s2)', margin: '6px 0 30px' }}>
        <div data-testid="season-bar" style={{ width: `${fillPct}%`, height: '100%', borderRadius: 5, background: 'linear-gradient(90deg, var(--yellow), var(--amber))', transition: 'width .6s' }} />
        {TIERS.map((t, i) => (
          <div key={i} data-testid="season-tier" data-reached={pts >= t.pts ? '1' : '0'} title={tierLabel(t)} style={{ position: 'absolute', left: `${((i + 1) / n) * 100}%`, top: -7, transform: 'translateX(-100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: claimed.includes(i) ? 'var(--cyan)' : pts >= t.pts ? 'var(--amber)' : 'var(--s3)', border: '2px solid var(--s1)', opacity: pts >= t.pts ? 1 : .8 }}>{claimed.includes(i) ? '✓' : tierIcon(t)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--text, #fff)' }}>{pts} XP</strong> cette saison
          {next ? <> · prochain palier à {next.pts} XP : <strong>{tierLabel(next)}</strong></> : ' · tous les paliers atteints, bravo !'}
        </div>
        {claimable.length > 0 && <button className="btn btn-primary" data-testid="season-claim" disabled={busy} style={{ padding: '8px 14px', fontSize: 13 }} onClick={claim}>Récupérer ({claimable.length})</button>}
      </div>
    </div>
  );
}
