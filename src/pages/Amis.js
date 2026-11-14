import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

const box = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 10 };
const input = { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 8 };
const btn = (primary) => ({
  padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: primary ? 'none' : '1px solid var(--s3)',
  background: primary ? 'var(--yellow)' : 'transparent', color: primary ? 'var(--on-primary)' : 'var(--muted)',
});

export default function Amis() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [code, setCode] = useState(profile?.friendCode || '');
  const [rels, setRels] = useState([]);       // demandes (envoyées + reçues)
  const [input_, setInput] = useState('');
  const [matches, setMatches] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const myName = profile?.displayName || user?.displayName || 'Joueur';

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [a, b] = await Promise.all([
        getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', user.uid))),
        getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', user.uid))),
      ]);
      const out = [];
      a.forEach(d => out.push({ id: d.id, ...d.data() }));
      b.forEach(d => out.push({ id: d.id, ...d.data() }));
      setRels(out);
    } catch (e) { console.error(e); setMsg('Lecture impossible (règles Firestore à publier ?).'); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Crée mon code ami la première fois
  useEffect(() => {
    if (!user || code || profile === undefined) return;
    if (profile?.friendCode) { setCode(profile.friendCode); return; }
    (async () => {
      try {
        for (let i = 0; i < 5; i++) {
          const c = newCode();
          const s = await getDoc(doc(db, 'friend_codes', c));
          if (s.exists()) continue;
          await setDoc(doc(db, 'friend_codes', c), { uid: user.uid, name: myName, createdAt: serverTimestamp() });
          await updateProfile({ friendCode: c });
          setCode(c);
          return;
        }
      } catch (e) { console.error(e); }
    })();
    // eslint-disable-next-line
  }, [user, profile?.friendCode]);

  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">Mes amis</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 14 }}>Connecte-toi pour ajouter des amis et les défier en duel.</p>
        <button style={btn(true)} onClick={() => setShowAuth(true)}>Se connecter</button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  const friends = rels.filter(r => r.status === 'accepted');
  const incoming = rels.filter(r => r.status === 'pending' && r.toUid === user.uid);
  const outgoing = rels.filter(r => r.status === 'pending' && r.fromUid === user.uid);
  const other = r => r.fromUid === user.uid ? { uid: r.toUid, name: r.toName } : { uid: r.fromUid, name: r.fromName };
  const knownUids = new Set(rels.map(r => other(r).uid));

  async function sendTo(uid, name) {
    if (uid === user.uid) { setMsg("C'est toi 🙂"); return; }
    if (knownUids.has(uid)) { setMsg('Déjà dans ta liste ou une demande est en cours.'); return; }
    setBusy(true);
    try {
      await setDoc(doc(db, 'friend_requests', `${user.uid}_${uid}`), {
        fromUid: user.uid, toUid: uid, fromName: myName, toName: name || 'Joueur', status: 'pending', createdAt: serverTimestamp(),
      });
      setMsg(`Demande envoyée à ${name || 'ce joueur'}.`); setMatches([]); setInput('');
      await load();
    } catch (e) { console.error(e); setMsg("Envoi impossible (règles Firestore à publier ?)."); }
    setBusy(false);
  }

  async function search() {
    const v = input_.trim();
    if (!v) return;
    setMsg(''); setMatches([]); setBusy(true);
    try {
      const c = v.toUpperCase();
      if (/^[A-Z0-9]{6}$/.test(c)) {
        const s = await getDoc(doc(db, 'friend_codes', c));
        if (s.exists()) { setBusy(false); await sendTo(s.data().uid, s.data().name); return; }
      }
      const r = await getDocs(query(collection(db, 'leaderboard'), where('name', '==', v), limit(5)));
      const found = [];
      r.forEach(d => { const x = d.data(); if (x.uid && x.uid !== user.uid) found.push({ uid: x.uid, name: x.name, level: x.level }); });
      if (!found.length) setMsg('Personne trouvé avec ce pseudo ou ce code (le pseudo doit être exact).');
      else if (found.length === 1) { setBusy(false); await sendTo(found[0].uid, found[0].name); return; }
      else setMatches(found);
    } catch (e) { console.error(e); setMsg('Recherche impossible.'); }
    setBusy(false);
  }

  async function accept(r) {
    try { await updateDoc(doc(db, 'friend_requests', r.id), { status: 'accepted' }); await load(); }
    catch (e) { console.error(e); setMsg('Action impossible.'); }
  }
  async function remove(r) {
    try { await deleteDoc(doc(db, 'friend_requests', r.id)); await load(); }
    catch (e) { console.error(e); setMsg('Action impossible.'); }
  }

  return (
    <div className="page">
      <h1 className="page-title">Mes amis</h1>

      <div style={box}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Ton code ami (à donner à tes amis)</div>
        <div data-testid="my-code" style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 26, fontWeight: 800, letterSpacing: '.15em', color: 'var(--yellow)' }}>{code || '…'}</div>
      </div>

      <div style={box}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ajouter un ami</div>
        <input data-testid="friend-input" style={input} placeholder="Code ami ou pseudo exact" value={input_}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
        <button data-testid="friend-add" style={btn(true)} disabled={busy} onClick={search}>Envoyer la demande</button>
        {msg && <div data-testid="friend-msg" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{msg}</div>}
        {matches.map(m => (
          <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ flex: 1, fontSize: 14 }}>{m.name} <span style={{ color: 'var(--muted)', fontSize: 12 }}>· niv. {m.level || 1}</span></div>
            <button style={btn(true)} onClick={() => sendTo(m.uid, m.name)}>Ajouter</button>
          </div>
        ))}
      </div>

      {incoming.length > 0 && (
        <>
          <div className="section-label">Demandes reçues</div>
          {incoming.map(r => (
            <div key={r.id} data-testid="friend-incoming" style={{ ...box, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{r.fromName}</div>
              <button data-testid="friend-accept" style={btn(true)} onClick={() => accept(r)}>Accepter</button>
              <button style={btn(false)} onClick={() => remove(r)}>Refuser</button>
            </div>
          ))}
        </>
      )}

      <div className="section-label">Mes amis{friends.length ? ` · ${friends.length}` : ''}</div>
      {friends.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>Pas encore d'amis. Partage ton code !</div>}
      {friends.map(r => {
        const o = other(r);
        return (
          <div key={r.id} data-testid="friend-row" style={{ ...box, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{o.name}</div>
            <button data-testid="friend-challenge" style={btn(true)} onClick={() => navigate(`/jouer?duel=${o.uid}&name=${encodeURIComponent(o.name || '')}`)}>⚔️ Défier</button>
            <button style={btn(false)} aria-label="Retirer" onClick={() => { if (window.confirm(`Retirer ${o.name} de tes amis ?`)) remove(r); }}>✕</button>
          </div>
        );
      })}

      {outgoing.length > 0 && (
        <>
          <div className="section-label">Demandes envoyées</div>
          {outgoing.map(r => (
            <div key={r.id} style={{ ...box, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, fontSize: 14 }}>{r.toName} <span style={{ color: 'var(--muted)', fontSize: 12 }}>· en attente</span></div>
              <button style={btn(false)} onClick={() => remove(r)}>Annuler</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
