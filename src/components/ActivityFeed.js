import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ago } from '../utils/activity';
import { avatarIcon } from '../data/cosmetics';

const KEY = 'quizly-feed', TTL = 2 * 60 * 1000;
const cached = uid => { try { const c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return c && c.uid === uid && Date.now() - c.t < TTL ? c.items : null; } catch (e) { return null; } };

// Derniers faits marquants des amis (lus sur leur profil public, max 20 amis)
export default function ActivityFeed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(() => (user ? cached(user.uid) : null));
  const [nFriends, setNFriends] = useState(null);

  useEffect(() => {
    if (!user || items) return;
    let alive = true;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          getDocs(query(collection(db, 'friend_requests'), where('fromUid', '==', user.uid))),
          getDocs(query(collection(db, 'friend_requests'), where('toUid', '==', user.uid))),
        ]);
        const uids = [];
        [...a.docs, ...b.docs].forEach(d => { const x = d.data(); if (x.status === 'accepted') uids.push(x.fromUid === user.uid ? x.toUid : x.fromUid); });
        const uniq = [...new Set(uids)].slice(0, 20);
        const docs = await Promise.all(uniq.map(id => getDoc(doc(db, 'leaderboard', id)).catch(() => null)));
        const out = [];
        docs.forEach(s => { if (s && s.exists()) { const x = s.data(); (x.events || []).forEach(e => out.push({ uid: s.id, name: x.name, avatar: x.avatar, ...e })); } });
        out.sort((p, q) => q.at - p.at);
        const top = out.slice(0, 8);
        if (!alive) return;
        setNFriends(uniq.length); setItems(top);
        try { sessionStorage.setItem(KEY, JSON.stringify({ uid: user.uid, t: Date.now(), items: top })); } catch (e) { /* ignoré */ }
      } catch (e) { if (alive) setItems([]); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [user?.uid]);

  if (!user || items === null) return null;
  return (
    <div data-testid="activity" style={{ marginBottom: 14 }}>
      <div className="section-label">Activité de tes amis</div>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 18, padding: items.length ? '4px 14px' : 14 }}>
        {items.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1 }}>{nFriends === 0 ? 'Ajoute des amis pour voir leurs exploits ici.' : "Rien de nouveau pour l'instant."}</span>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => navigate('/amis')}>Mes amis</button>
          </div>
        ) : items.map((e, i) => (
          <div key={i} data-testid="activity-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? '1px solid var(--s2)' : 'none' }}>
            <div style={{ fontSize: 24, width: 34, textAlign: 'center' }}>{e.avatar ? avatarIcon(e.avatar) : '🙂'}</div>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4 }}><strong>{e.name}</strong> {e.k} {e.t}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ago(e.at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
