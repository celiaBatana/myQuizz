import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { S } from './adminStyles';

const XP_PER_LEVEL = 200;

// Signaux d'alerte (indicatifs : à toi de juger)
export function flagsFor(u) {
  const f = [];
  const played = u.quizzesPlayed || 0;
  if ((u.totalXP || 0) > 1000 && (u.totalXP || 0) / Math.max(1, played) > 250) f.push('XP très élevé par partie');
  if ((u.gemsBonus || 0) > 2000) f.push('éclats bonus élevés');
  if ((u.weekXP || 0) > 8000) f.push('XP de la semaine très élevé');
  if ((u.totalXP || 0) > 40000) f.push('XP total très élevé');
  return f;
}

export default function AdminJoueurs({ ok }) {
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null); // { uid, totalXP, gemsBonus }
  const [onlyFlag, setOnlyFlag] = useState(false);

  async function load() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setRows(snap.docs.map(d => ({ uid: d.id, ...d.data() })).sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0)));
    } catch (e) { console.error(e); setRows([]); ok('⚠️ Impossible de charger les joueurs'); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function save() {
    const xp = Math.max(0, parseInt(edit.totalXP, 10) || 0);
    const gb = Math.max(0, parseInt(edit.gemsBonus, 10) || 0);
    let lvl = 1, rem = xp; while (rem >= XP_PER_LEVEL) { rem -= XP_PER_LEVEL; lvl++; }
    try {
      await updateDoc(doc(db, 'users', edit.uid), { totalXP: xp, level: lvl, xpInLevel: rem, gemsBonus: gb, updatedAt: serverTimestamp() });
      await setDoc(doc(db, 'leaderboard', edit.uid), { totalXP: xp, level: lvl, updatedAt: serverTimestamp() }, { merge: true });
      setEdit(null); ok('✓ Joueur corrigé'); load();
    } catch (e) { console.error(e); ok('⚠️ Correction impossible (règles Firestore à jour ?)'); }
  }

  if (!rows) return <div style={{ color: 'var(--muted)', padding: 14 }}>Chargement des joueurs…</div>;
  const list = rows.map(u => ({ ...u, flags: flagsFor(u) })).filter(u => !onlyFlag || u.flags.length);
  return (
    <div data-testid="admin-joueurs">
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.5 }}>
        {rows.length} joueur(s), triés par XP. Les ⚠️ sont des signaux indicatifs (XP par partie, éclats, XP de la semaine) : regarde le détail avant de corriger.
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10 }}>
        <input type="checkbox" checked={onlyFlag} onChange={e => setOnlyFlag(e.target.checked)} /> Seulement les joueurs à vérifier
      </label>
      {list.map(u => (
        <div key={u.uid} data-testid="aj-row" style={{ background: 'var(--s1)', border: `1px solid ${u.flags.length ? 'var(--amber)' : 'var(--s2)'}`, borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <strong style={{ fontSize: 14 }}>{u.flags.length ? '⚠️ ' : ''}{u.displayName || u.email || u.uid.slice(0, 6)}</strong>
            <span style={{ fontSize: 13, color: 'var(--yellow)', fontWeight: 700 }}>{u.totalXP || 0} XP</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.6 }}>
            Niv. {u.level || 1} · {u.quizzesPlayed || 0} quiz · série {u.streak || 0} · semaine {u.weekXP || 0} XP · éclats bonus {u.gemsBonus || 0} · dépensés {u.gemsSpent || 0}
            {(u.quizzesPlayed || 0) > 0 && <> · {Math.round((u.totalXP || 0) / u.quizzesPlayed)} XP/quiz</>}
          </div>
          {u.flags.length > 0 && <div style={{ fontSize: 11, color: 'var(--amber)', marginTop: 3 }}>{u.flags.join(' · ')}</div>}
          {edit?.uid === u.uid ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <input data-testid="aj-xp" type="number" value={edit.totalXP} onChange={e => setEdit({ ...edit, totalXP: e.target.value })} style={{ ...S.input, width: 110 }} aria-label="XP total" />
              <input data-testid="aj-gems" type="number" value={edit.gemsBonus} onChange={e => setEdit({ ...edit, gemsBonus: e.target.value })} style={{ ...S.input, width: 110 }} aria-label="Éclats bonus" />
              <button className="btn btn-primary" data-testid="aj-save" onClick={save}>Enregistrer</button>
              <button className="btn btn-secondary" onClick={() => setEdit(null)}>Annuler</button>
            </div>
          ) : (
            <button className="btn btn-secondary" data-testid="aj-edit" style={{ marginTop: 8, fontSize: 12 }} onClick={() => setEdit({ uid: u.uid, totalXP: u.totalXP || 0, gemsBonus: u.gemsBonus || 0 })}>Corriger XP / éclats</button>
          )}
        </div>
      ))}
      {list.length === 0 && <div style={{ color: 'var(--muted)', padding: 14, textAlign: 'center' }}>Aucun joueur à vérifier 👍</div>}
    </div>
  );
}
