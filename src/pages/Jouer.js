import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { getCategoryList, DIFF_LABELS } from '../data/quizData';
import { fetchByCatDiff, shuffle } from '../utils/questions';

const MODES = [
  { id: 'mix',    icon: '🎲', name: 'Quiz mixte',   desc: '10 questions au hasard' },
  { id: 'sudden', icon: '💥', name: 'Mort subite',  desc: 'Une erreur et c\'est fini' },
  { id: 'duel',   icon: '⚔️', name: 'Duel',         desc: 'Défie un ami par lien' },
];

export default function Jouer() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const cats = getCategoryList();
  const [mode, setMode] = useState('mix');
  const [cat, setCat]   = useState(cats[0]?.id);
  const [diff, setDiff] = useState('all');
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [showAuth, setShowAuth] = useState(false);

  const chip = (active) => ({
    padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--purple)' : 'var(--s2)'}`,
    background: active ? 'rgba(155,109,255,.2)' : 'var(--s1)', color: active ? '#fff' : 'var(--muted)',
  });

  async function go() {
    setErr('');
    if (mode === 'duel') {
      if (!user) { setShowAuth(true); return; }
      setBusy(true);
      try {
        const qs = shuffle(await fetchByCatDiff(cat, diff)).slice(0, 10);
        if (qs.length < 5) { setErr('Pas assez de questions pour cette sélection.'); setBusy(false); return; }
        const ref = await addDoc(collection(db, 'duels'), {
          questionIds: qs.map(q => q.id), cat, diff,
          creatorUid: user.uid, creatorName: profile?.displayName || user.displayName || 'Un joueur',
          createdAt: serverTimestamp(),
        });
        navigate(`/duel/${ref.id}`);
      } catch (e) {
        console.error(e);
        setErr("Impossible de créer le duel (les règles Firestore sont-elles publiées ?).");
        setBusy(false);
      }
      return;
    }
    navigate(`/play?mode=${mode}&cat=${cat}&diff=${diff}`);
  }

  return (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div className="page-title">🎮 Jouer</div>
      <div className="page-sub">Modes spéciaux</div>

      <div onClick={() => navigate('/daily')} style={{ background: 'linear-gradient(135deg, #9B6DFF, #FF5FA0)', borderRadius: 16, padding: 16, marginBottom: 14, cursor: 'pointer' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .85 }}>📅 Chaque jour</div>
        <div style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 800, fontSize: 18 }}>Défi du jour</div>
        <div style={{ fontSize: 12, opacity: .85 }}>5 questions, un seul essai, classement du jour</div>
      </div>

      <div className="section-label">Mode</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {MODES.map(m => (
          <div key={m.id} onClick={() => setMode(m.id)} style={{
            textAlign: 'center', padding: '12px 6px', borderRadius: 14, cursor: 'pointer',
            background: 'var(--s1)', border: `2px solid ${mode === m.id ? 'var(--purple)' : 'var(--s2)'}`,
          }}>
            <div style={{ fontSize: 24 }}>{m.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{m.name}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Catégorie</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {cats.map(c => <div key={c.id} style={chip(cat === c.id)} onClick={() => setCat(c.id)}>{c.icon} {c.label}</div>)}
      </div>

      <div className="section-label">Niveau</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {[['all', 'Tous'], ['easy', DIFF_LABELS.easy], ['medium', DIFF_LABELS.medium], ['hard', DIFF_LABELS.hard]].map(([id, label]) => (
          <div key={id} style={chip(diff === id)} onClick={() => setDiff(id)}>{label}</div>
        ))}
      </div>

      {mode === 'sudden' && profile?.suddenBest > 0 && (
        <div style={{ fontSize: 12, color: 'var(--yellow)', marginBottom: 10 }}>🏅 Ton record : {profile.suddenBest} bonnes réponses d'affilée</div>
      )}
      {err && <div style={{ color: 'var(--pink)', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <button className="btn btn-primary btn-full" disabled={busy} onClick={go} style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 700 }}>
        {busy ? '…' : mode === 'duel' ? 'Créer le duel' : 'Lancer'}
      </button>
    </div>
  );
}
