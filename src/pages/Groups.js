import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, limit, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { weekKey } from '../utils/league';
import { avatarIcon, titleName } from '../data/cosmetics';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
const MEDALS = ['🥇', '🥈', '🥉'];

const box = { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 10 };
const input = { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 8 };

function useMemberJoin() {
  const { user, profile, updateProfile } = useAuth();
  return async function join(code) {
    const name = profile?.displayName || user.displayName || 'Joueur';
    const wk = weekKey();
    await setDoc(doc(db, 'group_members', `${code}_${user.uid}`), {
      code, uid: user.uid, name, totalXP: profile?.totalXP || 0, level: profile?.level || 1,
      avatar: profile?.avatar || '', title: profile?.title || '',
      weekKey: profile?.weekKey === wk ? wk : '', weekXP: profile?.weekKey === wk ? (profile?.weekXP || 0) : 0,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    const groups = Array.from(new Set([...(profile?.groups || []), code]));
    await updateProfile({ groups });
  };
}

export function GroupsList() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const join = useMemberJoin();
  const [names, setNames] = useState({});
  const [newName, setNewName] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const groups = profile?.groups || [];

  useEffect(() => {
    (async () => {
      const m = {};
      for (const c of groups) {
        try { const s = await getDoc(doc(db, 'groups', c)); if (s.exists()) m[c] = s.data().name; } catch (e) { /* règles */ }
      }
      setNames(m);
    })();
    // eslint-disable-next-line
  }, [groups.join(',')]);

  async function create() {
    if (!user) { setShowAuth(true); return; }
    if (!newName.trim()) return;
    setBusy(true); setMsg('');
    try {
      let c = newCode();
      for (let i = 0; i < 5 && (await getDoc(doc(db, 'groups', c))).exists(); i++) c = newCode();
      await setDoc(doc(db, 'groups', c), {
        name: newName.trim().slice(0, 40), code: c, ownerUid: user.uid,
        ownerName: profile?.displayName || user.displayName || 'Joueur', createdAt: serverTimestamp(),
      });
      await join(c);
      navigate(`/groupes/${c}`);
    } catch (e) { console.error(e); setMsg("Impossible de créer le groupe (règles Firestore à publier ?)."); }
    setBusy(false);
  }

  async function joinByCode() {
    if (!user) { setShowAuth(true); return; }
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    setBusy(true); setMsg('');
    try {
      const s = await getDoc(doc(db, 'groups', c));
      if (!s.exists()) { setMsg('Aucun groupe avec ce code.'); setBusy(false); return; }
      await join(c);
      navigate(`/groupes/${c}`);
    } catch (e) { console.error(e); setMsg('Impossible de rejoindre le groupe.'); }
    setBusy(false);
  }

  return (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div className="page-title">👥 Groupes privés</div>
      <div className="page-sub">Un classement rien que pour vous : famille, amis, classe…</div>

      {groups.length > 0 && <div className="section-label">Mes groupes</div>}
      {groups.map(c => (
        <div key={c} onClick={() => navigate(`/groupes/${c}`)} style={{ ...box, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>{names[c] || 'Groupe'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c} ›</div>
        </div>
      ))}

      <div className="section-label">Créer un groupe</div>
      <div style={box}>
        <input style={input} placeholder="Nom du groupe" value={newName} maxLength={40} onChange={e => setNewName(e.target.value)} />
        <button className="btn btn-primary btn-full" disabled={busy} onClick={create}>Créer et obtenir un code</button>
      </div>

      <div className="section-label">Rejoindre avec un code</div>
      <div style={box}>
        <input style={{ ...input, textTransform: 'uppercase', letterSpacing: 3 }} placeholder="CODE" value={code} maxLength={6} onChange={e => setCode(e.target.value)} />
        <button className="btn btn-secondary btn-full" disabled={busy} onClick={joinByCode}>Rejoindre</button>
      </div>
      {msg && <div style={{ color: 'var(--yellow)', fontSize: 12, textAlign: 'center' }}>{msg}</div>}
    </div>
  );
}

export function GroupDetail() {
  const { code: raw } = useParams();
  const code = (raw || '').toUpperCase();
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const join = useMemberJoin();
  const [group, setGroup] = useState(undefined);
  const [members, setMembers] = useState(null);
  const [tab, setTab] = useState('week');
  const [msg, setMsg] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const isMember = (profile?.groups || []).includes(code);
  const wk = weekKey();

  async function load() {
    try {
      const g = await getDoc(doc(db, 'groups', code));
      setGroup(g.exists() ? g.data() : null);
      if (g.exists() && user) {
        const snap = await getDocs(query(collection(db, 'group_members'), where('code', '==', code), limit(100)));
        setMembers(snap.docs.map(d => d.data()));
      }
    } catch (e) { console.error(e); setGroup(null); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [code, user?.uid, isMember]);

  async function doJoin() {
    if (!user) { setShowAuth(true); return; }
    try { await join(code); } catch (e) { setMsg('Impossible de rejoindre.'); }
  }
  async function leave() {
    if (!window.confirm('Quitter ce groupe ?')) return;
    try {
      await deleteDoc(doc(db, 'group_members', `${code}_${user.uid}`));
      await updateProfile({ groups: (profile?.groups || []).filter(c => c !== code) });
      navigate('/groupes');
    } catch (e) { setMsg('Impossible de quitter.'); }
  }
  async function invite() {
    const url = `${window.location.origin}/groupes/${code}`;
    const text = `Rejoins mon groupe « ${group.name} » sur Quizly (code ${code})`;
    try {
      if (navigator.share) { await navigator.share({ text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`); setMsg('Lien d\'invitation copié ✓');
    } catch (e) { /* annulé */ }
  }

  if (group === undefined) return <div className="page" style={{ textAlign: 'center', paddingTop: 60, color: 'var(--muted)' }}>⏳ Chargement…</div>;
  if (group === null) return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 60 }}>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div style={{ fontSize: 36 }}>😕</div>
      <div style={{ color: 'var(--muted)', margin: '10px 0 18px', fontSize: 13 }}>{user ? 'Groupe introuvable.' : 'Connecte-toi pour voir ce groupe.'}</div>
      {user ? <button className="btn btn-primary" onClick={() => navigate('/groupes')}>← Mes groupes</button>
            : <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Se connecter</button>}
    </div>
  );

  const rows = (members || [])
    .map(m => ({ ...m, score: tab === 'week' ? (m.weekKey === wk ? (m.weekXP || 0) : 0) : (m.totalXP || 0) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div className="page-title">👥 {group.name}</div>
      <div className="page-sub">Code : <strong style={{ letterSpacing: 3 }}>{code}</strong> · {members ? members.length : '…'} membre{members?.length > 1 ? 's' : ''}</div>

      <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={invite}>📨 Inviter</button>
        {!isMember && <button className="btn btn-secondary" style={{ flex: 1 }} onClick={doJoin}>Rejoindre</button>}
      </div>
      {msg && <div style={{ color: 'var(--cyan)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{msg}</div>}

      <div style={{ display: 'flex', gap: 4, background: 'var(--s2)', borderRadius: 10, padding: 3, margin: '8px 0 12px' }}>
        {[['week', 'Cette semaine'], ['total', 'Total']].map(([id, label]) => (
          <div key={id} onClick={() => setTab(id)} style={{
            flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: tab === id ? 'var(--yellow)' : 'transparent', color: tab === id ? 'var(--on-primary)' : 'var(--muted)',
          }}>{label}</div>
        ))}
      </div>

      {!user && <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 20 }}>Connecte-toi pour voir le classement.</div>}
      {user && rows.map((r, i) => (
        <div key={r.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, background: r.uid === user.uid ? 'rgba(155,109,255,.15)' : 'var(--s1)', border: `1px solid ${r.uid === user.uid ? 'var(--purple)' : 'var(--s2)'}`, borderRadius: 12, padding: '10px 13px', marginBottom: 6 }}>
          <div style={{ width: 28, textAlign: 'center', fontWeight: 800, color: 'var(--muted)' }}>{MEDALS[i] || i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{r.avatar ? avatarIcon(r.avatar) + ' ' : ''}{r.name}{r.uid === user.uid && ' (toi)'}</div>
            {r.title && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{titleName(r.title)}</div>}
          </div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, color: 'var(--yellow)' }}>{r.score} XP</div>
        </div>
      ))}
      {isMember && <div onClick={leave} style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 11, marginTop: 18, cursor: 'pointer', textDecoration: 'underline' }}>Quitter le groupe</div>}
    </div>
  );
}
