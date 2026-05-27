import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, DIFF_LABELS, DIFF_COLORS } from '../data/quizData';
import AuthModal from '../components/AuthModal';

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (!user) {
    return (
      <div className="page">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
          <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Crée ton compte</div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>
            Connecte-toi pour suivre ta progression, ton historique et monter dans les classements.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
            Créer un compte
          </button>
        </div>
      </div>
    );
  }

  const level = profile?.level || 1;
  const xpInLevel = profile?.xpInLevel || 0;
  const totalXP = profile?.totalXP || 0;
  const quizzesPlayed = profile?.quizzesPlayed || 0;
  const correctAnswers = profile?.correctAnswers || 0;
  const totalAnswers = profile?.totalAnswers || 0;
  const successRate = totalAnswers ? Math.round(correctAnswers / totalAnswers * 100) : null;
  const levelName = level < 3 ? 'Novice' : level < 6 ? 'Apprenti' : level < 10 ? 'Expert' : 'Maître';
  const xpBarWidth = (xpInLevel / 200) * 100;

  const history = profile?.history
    ? [...profile.history].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
    : [];

  return (
    <div className="page">
      {/* Header profil */}
      <div style={{
        background: 'linear-gradient(135deg, var(--purple), var(--pink))',
        borderRadius: 16, padding: 20, marginBottom: 14, textAlign: 'center'
      }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 10px', border: '3px solid rgba(255,255,255,.3)' }}>
          {(profile?.displayName || user.displayName)?.[0]?.toUpperCase() || '😊'}
        </div>
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 2 }}>
          {profile?.displayName || user.displayName || 'Joueur'}
        </div>
        <div style={{ fontSize: 12, opacity: .8 }}>{user.email}</div>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.2)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, marginTop: 8 }}>
          Niveau {level} · {levelName}
        </div>
      </div>

      {/* XP bar */}
      <div className="xp-bar-wrap">
        <div className="xp-bar-labels">
          <span>Niveau {level}</span>
          <span>{xpInLevel} / 200 XP</span>
        </div>
        <div className="xp-bar-bg">
          <div className="xp-bar-fill" style={{ width: `${xpBarWidth}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-val">{totalXP}</div>
          <div className="stat-card-label">XP total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-val">{quizzesPlayed}</div>
          <div className="stat-card-label">Quiz joués</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-val">{successRate !== null ? `${successRate}%` : '—'}</div>
          <div className="stat-card-label">Taux de réussite</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-val">{level}</div>
          <div className="stat-card-label">Niveau actuel</div>
        </div>
      </div>

      {/* Historique */}
      <div className="section-label">Historique récent</div>
      {!history.length ? (
        <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
          Joue ton premier quiz !
        </div>
      ) : (
        history.map((h, i) => {
          const cat = CATEGORIES[h.category];
          return (
            <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '11px 12px', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{cat?.icon || '🎮'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.quizName}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {new Date(h.date).toLocaleDateString('fr-FR')}
                    <span className={`diff-badge diff-${h.diff}`}>{DIFF_LABELS[h.diff]}</span>
                    <span style={{ color: 'var(--yellow)' }}>+{h.xp} XP</span>
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--cyan)' }}>
                {h.score}/{h.total}
              </div>
            </div>
          );
        })
      )}

      {/* Déconnexion */}
      <button
        className="btn btn-secondary btn-full"
        style={{ marginTop: 12, fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}
        onClick={logout}
      >
        Se déconnecter
      </button>
    </div>
  );
}
