import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 15000;
const btn = (primary) => ({
  padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: primary ? 'none' : '1px solid var(--s3)',
  background: primary ? 'var(--yellow)' : 'transparent', color: primary ? 'var(--on-primary)' : 'var(--muted)',
});
const seenKey = 'quizly_invites_dismissed';
const readDismissed = () => { try { return JSON.parse(sessionStorage.getItem(seenKey) || '[]'); } catch (e) { return []; } };

// Demandes d'amis (bandeau en haut) + défis reçus (popup) : interrogés régulièrement
export default function Notifs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [requests, setRequests] = useState([]);
  const [invites, setInvites] = useState([]);
  const [dismissed, setDismissed] = useState(readDismissed);

  const load = useCallback(async () => {
    if (!user) { setRequests([]); setInvites([]); return; }
    try {
      const r = await getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', user.uid)));
      setRequests(r.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => x.status === 'pending'));
    } catch (e) { /* règles pas encore publiées */ }
    try {
      const r = await getDocs(query(collection(db, 'duels'), where('invitedUid', '==', user.uid), limit(10)));
      const out = [];
      for (const d of r.docs) {
        const x = d.data();
        if (x.nextId) continue;
        const done = await getDoc(doc(db, 'duel_results', `${d.id}_${user.uid}`));
        if (!done.exists()) out.push({ id: d.id, from: x.creatorName || 'Un ami', round: x.round || 1 });
      }
      setInvites(out);
    } catch (e) { /* réseau */ }
  }, [user]);

  useEffect(() => {
    load();
    if (!user) return undefined;
    const t = setInterval(load, POLL_MS);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [load, user]);

  async function accept(r) {
    try { await updateDoc(doc(db, 'friend_requests', r.id), { status: 'accepted' }); } catch (e) { console.error(e); }
    load();
  }
  async function refuse(r) {
    try { await deleteDoc(doc(db, 'friend_requests', r.id)); } catch (e) { console.error(e); }
    load();
  }
  function later() {
    const all = Array.from(new Set([...dismissed, ...invites.map(i => i.id)]));
    setDismissed(all);
    try { sessionStorage.setItem(seenKey, JSON.stringify(all)); } catch (e) { /* ignore */ }
  }

  const onDuel = loc.pathname.startsWith('/duel/');
  const popup = onDuel ? [] : invites.filter(i => !dismissed.includes(i.id));

  return (
    <>
      {requests.length > 0 && (
        <div role="alert" data-testid="friend-banner" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 120, background: 'var(--yellow)', color: 'var(--on-primary)', padding: '10px 14px', boxShadow: '0 4px 14px rgba(0,0,0,.35)' }}>
          {requests.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>👋 {r.fromName} veut t'ajouter en ami</div>
              <button data-testid="banner-accept" onClick={() => accept(r)} style={{ ...btn(false), background: 'var(--on-primary)', color: 'var(--yellow)', border: 'none' }}>Accepter</button>
              <button onClick={() => refuse(r)} style={{ ...btn(false), color: 'var(--on-primary)', borderColor: 'var(--on-primary)' }}>Refuser</button>
            </div>
          ))}
        </div>
      )}
      {popup.length > 0 && (
        <div data-testid="duel-popup" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--yellow)', borderRadius: 18, padding: 18, width: '100%', maxWidth: 380 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 19, marginBottom: 4 }}>⚔️ {popup.length > 1 ? `${popup.length} défis t'attendent` : 'Tu es défié !'}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Un seul essai par duel.</div>
            {popup.map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--s2)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{i.from}{i.round > 1 ? ` · manche ${i.round}` : ''}</div>
                <button data-testid="popup-accept" style={btn(true)} onClick={() => { later(); navigate(`/duel/${i.id}`); }}>Relever</button>
              </div>
            ))}
            <button style={{ ...btn(false), width: '100%', marginTop: 4 }} onClick={later}>Plus tard</button>
          </div>
        </div>
      )}
    </>
  );
}
