import React, { useEffect, useState } from 'react';

const KEY = 'quizly-install-dismissed';
const isStandalone = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

// Invite à installer l'appli : bouton direct (Android / ordinateur) ou mode d'emploi (iPhone)
export default function InstallPrompt() {
  const [evt, setEvt] = useState(null);
  const [hidden, setHidden] = useState(() => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } });
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const on = e => { e.preventDefault(); setEvt(e); };
    const done = () => { setEvt(null); setHidden(true); };
    window.addEventListener('beforeinstallprompt', on);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done); };
  }, []);

  if (hidden || isStandalone()) return null;
  const ios = isIOS();
  if (!evt && !ios) return null;

  const dismiss = () => { try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignoré */ } setHidden(true); };
  const install = async () => {
    if (evt) { evt.prompt(); try { await evt.userChoice; } catch (e) { /* ignoré */ } setEvt(null); }
    else setHelp(h => !h);
  };

  return (
    <div data-testid="install-prompt" style={{ background: 'linear-gradient(135deg, rgba(232,132,74,.28), rgba(230,179,90,.12))', border: '1px solid rgba(232,132,74,.55)', borderRadius: 18, padding: '12px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/icon-192.png" alt="" width="44" height="44" style={{ borderRadius: 12 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15 }}>Installe Quizly</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Plein écran, accès direct depuis ton écran d'accueil.</div>
        </div>
        <button className="btn btn-primary" data-testid="install-btn" style={{ padding: '8px 14px', fontSize: 13 }} onClick={install}>{evt ? 'Installer' : 'Comment ?'}</button>
        <button aria-label="Fermer" onClick={dismiss} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      {help && <div style={{ fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>Dans Safari : touche <strong>Partager</strong> (le carré avec la flèche) puis <strong>« Sur l'écran d'accueil »</strong>.</div>}
    </div>
  );
}
