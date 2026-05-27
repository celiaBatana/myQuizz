import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Entre un pseudo'); setLoading(false); return; }
        await register(email, password, name.trim());
      }
      onClose();
    } catch (err) {
      const messages = {
        'auth/user-not-found': 'Aucun compte avec cet email.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/weak-password': 'Mot de passe trop court (6 caractères min).',
        'auth/invalid-email': 'Email invalide.',
      };
      setError(messages[err.code] || 'Une erreur est survenue.');
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">Bienvenue 👋</div>
        <div className="modal-sub">Sauvegarde ta progression et monte en niveau</div>

        <div className="modal-tabs">
          <div className={`modal-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Connexion</div>
          <div className={`modal-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Inscription</div>
        </div>

        <div className="divider-or">ou</div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-group">
              <label>Pseudo</label>
              <input type="text" placeholder="Ton pseudo Quizly" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <p style={{ color: 'var(--pink)', fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
