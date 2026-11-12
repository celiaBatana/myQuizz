import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import Toast from './Toast';
import { streakInfo } from '../utils/retention';
import SoundToggle from './SoundToggle';

export default function Layout() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  const xp = profile?.totalXP || 0;
  const level = profile?.level || 1;
  const st = streakInfo(profile);
  const prevXp = useRef(xp);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (xp > prevXp.current) { setBump(true); const t = setTimeout(() => setBump(false), 900); prevXp.current = xp; return () => clearTimeout(t); }
    prevXp.current = xp;
  }, [xp]);

  return (
    <div className="app">
      {/* Background blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-logo" onClick={() => navigate('/')}>Quizly</span>
        <div className="navbar-right">
          {user && (
            <div title={st.danger ? 'Joue avant minuit pour garder ta série !' : 'Série de jours'}
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer', fontSize: 12, fontWeight: 800, padding: '4px 9px', borderRadius: 20, background: 'var(--s1)',
                border: `1px solid ${st.danger ? 'var(--yellow)' : 'var(--s2)'}`, color: st.danger ? 'var(--yellow)' : 'inherit',
                opacity: st.count ? 1 : 0.6 }}>
              🔥 {st.count}{st.danger ? ' ⚠️' : ''}
            </div>
          )}
          <div className="xp-badge" style={bump ? { animation: 'qz-bump .9s ease' } : undefined}>⚡ {xp} XP</div>
          <style>{`@media (max-width: 420px) { .navbar-right .level-pill { display: none } .navbar-right { gap: 6px !important } } @keyframes qz-bump { 0% { transform: scale(1) } 30% { transform: scale(1.25); box-shadow: 0 0 14px var(--yellow) } 100% { transform: scale(1) } }`}</style>
          <SoundToggle />
          <div className="level-pill">Niv. {level}</div>
          {user ? (
            <NavLink to="/profile">
              <button className="btn btn-secondary" style={{ padding: '5px 13px', fontSize: 12 }}>
                {profile?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Profil'}
              </button>
            </NavLink>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ padding: '5px 13px', fontSize: 12 }}
              onClick={() => setShowAuth(true)}
            >
              Connexion
            </button>
          )}
        </div>
      </nav>

      {!online && (
        <div role="status" style={{ position: 'relative', zIndex: 1, background: '#3a2a10', color: '#FFD84D', fontSize: 12, textAlign: 'center', padding: '6px 12px' }}>
          📡 Hors-ligne : tu peux jouer les quiz déjà ouverts, ta progression sera envoyée au retour du réseau.
        </div>
      )}

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`} end>
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Accueil
        </NavLink>
        <NavLink to="/jouer" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Jouer
        </NavLink>
        <NavLink to="/classement" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24"><path d="M6 9H4a2 2 0 01-2-2V5h4M18 9h2a2 2 0 002-2V5h-4M6 3h12v6a6 6 0 01-12 0zM12 15v4M8 21h8"/></svg>
          Classement
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Profil
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            Admin
          </NavLink>
        )}
      </nav>

      {/* Auth modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Toast global */}
      <Toast />
    </div>
  );
}
