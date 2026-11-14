import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { getCategoryList, DIFF_LABELS } from '../data/quizData';
import { fetchVaried } from '../utils/questions';

const MODES = [
  { id: 'mix',    icon: '🎲', name: 'Quiz mixte',   desc: '10 questions au hasard' },
  { id: 'sudden', icon: '💥', name: 'Mort subite',  desc: 'Une erreur et c\'est fini' },
  { id: 'duel',   icon: '⚔️', name: 'Duel',         desc: 'Défie un ami par lien' },
];

export default function Jouer() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const invitedUid = sp.get('duel') || '';
  const invitedName = sp.get('name') || '';
  const { user, profile } = useAuth();
  const cats = getCategoryList();
  const [mode, setMode] = useState(invitedUid ? 'duel' : 'mix');
  const [sel, setSel]   = useState([]); // catégories choisies ; vide = toutes
  const cat = sel.length ? sel.join(',') : 'all';
  const tooFew = sel.length === 1; // une seule catégorie : jouer plutôt ses quiz depuis l'accueil
  const [diffs, setDiffs] = useState([]); // niveaux cochés ; vide = tous
  const diff = diffs.length ? diffs.join(',') : 'all';
  const toggleDiff = id => setDiffs(s => id === 'all' ? [] : mode === 'sudden' ? (s.includes(id) ? [] : [id]) : (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [showAuth, setShowAuth] = useState(false);

  const chip = (active) => ({
    padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--purple)' : 'var(--s2)'}`,
    background: active ? 'rgba(207,122,69,.2)' : 'var(--s1)', color: active ? '#fff' : 'var(--muted)',
  });

  async function go() {
    setErr('');
    if (mode === 'duel') {
      if (!user) { setShowAuth(true); return; }
      setBusy(true);
      try {
        const qs = await fetchVaried(cat, diff, 10);
        if (qs.length < 5) { setErr('Pas assez de questions pour cette sélection.'); setBusy(false); return; }
        const ref = await addDoc(collection(db, 'duels'), {
          questionIds: qs.map(q => q.id), cat, diff,
          creatorUid: user.uid, creatorName: profile?.displayName || user.displayName || 'Un joueur',
          createdAt: serverTimestamp(),
          ...(invitedUid ? { invitedUid, invitedName } : {}),
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
      <div className="page-title">Jouer</div>
      <div className="page-sub">Modes spéciaux</div>

      {tooFew && (
        <div role="alert" style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 700, marginBottom: 12, textAlign: 'center', position: 'sticky', top: 66, zIndex: 50, backdropFilter: 'blur(8px)', backgroundColor: '#2a2210' }}>
          Choisis au moins 2 catégories (ou « Toutes ») pour lancer.
        </div>
      )}

      <div onClick={() => navigate('/daily')} style={{ background: 'var(--yellow)', color: 'var(--on-primary)', borderRadius: 16, padding: 16, marginBottom: 14, cursor: 'pointer' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .85 }}>Chaque jour</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18 }}>Défi du jour</div>
        <div style={{ fontSize: 12, opacity: .85 }}>5 questions, un seul essai, classement du jour</div>
      </div>

      <div className="section-label">Mode</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {MODES.map(m => (
          <div key={m.id} onClick={() => { setMode(m.id); if (m.id === 'sudden') setDiffs(d => d.slice(0, 1)); }} style={{
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
        <div style={chip(sel.length === 0)} onClick={() => setSel([])}>Toutes (varié)</div>
        {cats.map(c => <div key={c.id} data-cat={c.id} style={chip(sel.includes(c.id))} onClick={() => setSel(s => s.includes(c.id) ? s.filter(x => x !== c.id) : [...s, c.id])}>{c.icon} {c.label}</div>)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', margin: '-8px 0 14px' }}>
        {sel.length === 0 ? 'Toutes les catégories, ou touche-en plusieurs (au moins 2).' : `${sel.length} catégorie${sel.length > 1 ? 's' : ''} choisie${sel.length > 1 ? 's' : ''}.`}
      </div>

      <div className="section-label">Niveau</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        {[['all', 'Tous'], ['easy', DIFF_LABELS.easy], ['medium', DIFF_LABELS.medium], ['hard', DIFF_LABELS.hard]].map(([id, label]) => (
          <div key={id} data-diff={id} style={chip(id === 'all' ? diffs.length === 0 : diffs.includes(id))} onClick={() => toggleDiff(id)}>{label}</div>
        ))}
      </div>
      {mode !== 'sudden' && (
        <div style={{ fontSize: 11, color: 'var(--muted)', margin: '-12px 0 14px' }}>Tu peux cocher 1, 2 ou 3 niveaux.</div>
      )}

      <div data-testid="bt-link" onClick={() => navigate('/blindtest')} style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 14, cursor: 'pointer', fontSize: 13 }}>
        <div style={{ fontWeight: 700 }}>🎵 Blind test <span style={{ color: 'var(--yellow)', fontSize: 11 }}>NOUVEAU · test</span></div>
        <div style={{ color: 'var(--muted)', marginTop: 2 }}>Devine le morceau à partir d'un extrait de 30 secondes.</div>
      </div>

      {mode === 'duel' && (
        <div data-testid="duel-friends" onClick={() => navigate('/amis')} style={{ background: 'var(--s1)', border: '1px solid var(--yellow)', borderRadius: 14, padding: '12px 14px', marginBottom: 14, cursor: 'pointer', fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: 'var(--yellow)' }}>{invitedUid ? `Défi pour ${invitedName || 'ton ami'}` : '👥 Défier un ami directement'}</div>
          <div style={{ color: 'var(--muted)', marginTop: 2 }}>{invitedUid ? 'Le duel lui sera proposé sur son accueil.' : 'Ajoute-le par code ou pseudo, puis défie-le (sinon, partage le lien du duel).'}</div>
        </div>
      )}

      {mode === 'sudden' && profile?.suddenBest > 0 && (
        <div style={{ fontSize: 12, color: 'var(--yellow)', marginBottom: 10 }}>Ton record : {profile.suddenBest} bonnes réponses d'affilée</div>
      )}
      {err && <div style={{ color: 'var(--pink)', fontSize: 12, marginBottom: 10 }}>{err}</div>}
      <button className="btn btn-primary btn-full" disabled={busy || tooFew} onClick={go} style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, opacity: tooFew ? 0.5 : 1 }}>
        {busy ? '…' : tooFew ? 'Choisis une 2ᵉ catégorie' : mode === 'duel' ? 'Créer le duel' : 'Lancer'}
      </button>
    </div>
  );
}
