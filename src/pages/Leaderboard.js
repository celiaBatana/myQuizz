import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { dayKey } from '../hooks/useQuiz';

const MEDALS = ['🥇', '🥈', '🥉'];

function Row({ rank, name, right, sub, me }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: me ? 'rgba(155,109,255,.15)' : 'var(--s1)', border: `1px solid ${me ? 'var(--purple)' : 'var(--s2)'}`, borderRadius: 12, padding: '10px 13px', marginBottom: 6 }}>
      <div style={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: rank < 3 ? 18 : 13, color: 'var(--muted)' }}>{MEDALS[rank] || rank + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}{me && ' (toi)'}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--muted)' }}>{sub}</div>}
      </div>
      <div style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 800, color: 'var(--yellow)' }}>{right}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 28, fontSize: 13 }}>{text}</div>;
}

export function DailyBoard({ date }) {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'daily_scores'), where('date', '==', date), limit(200)));
        setRows(snap.docs.map(d => d.data()).sort((a, b) => b.score - a.score || b.xp - a.xp));
      } catch (e) { console.error(e); setRows([]); }
    })();
  }, [date]);
  if (!rows) return <Empty text="Chargement…" />;
  if (!rows.length) return <Empty text="Personne n'a encore joué le défi du jour. Sois le premier !" />;
  return rows.slice(0, 50).map((r, i) => (
    <Row key={r.uid} rank={i} name={r.name} me={r.uid === user?.uid} right={`${r.score}/${r.total}`} sub={`+${r.xp} XP`} />
  ));
}

export function DuelBoard({ duelId }) {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'duel_results'), where('duelId', '==', duelId), limit(100)));
        setRows(snap.docs.map(d => d.data()).sort((a, b) => b.score - a.score));
      } catch (e) { console.error(e); setRows([]); }
    })();
  }, [duelId]);
  if (!rows) return <Empty text="Chargement…" />;
  if (!rows.length) return <Empty text="Pas encore de résultat." />;
  return rows.map((r, i) => (
    <Row key={r.uid} rank={i} name={r.name} me={r.uid === user?.uid} right={`${r.score}/${r.total}`} />
  ));
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('xp');
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (tab !== 'xp') return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'leaderboard'), orderBy('totalXP', 'desc'), limit(50)));
        setRows(snap.docs.map(d => d.data()));
      } catch (e) { console.error(e); setRows([]); }
    })();
  }, [tab]);

  return (
    <div className="page">
      <div className="page-title">🏆 Classement</div>
      <div style={{ display: 'flex', gap: 4, background: 'var(--s2)', borderRadius: 10, padding: 3, margin: '12px 0' }}>
        {[['xp', '⚡ Général'], ['daily', '📅 Défi du jour']].map(([id, label]) => (
          <div key={id} onClick={() => setTab(id)} style={{
            flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: tab === id ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'transparent',
            color: tab === id ? '#fff' : 'var(--muted)',
          }}>{label}</div>
        ))}
      </div>
      {tab === 'xp' ? (
        !rows ? <Empty text="Chargement…" /> :
        rows.length === 0 ? <Empty text="Le classement se remplit dès qu'un joueur termine un quiz." /> :
        rows.map((r, i) => (
          <Row key={r.uid} rank={i} name={r.name} me={r.uid === user?.uid} right={`${r.totalXP} XP`} sub={`Niveau ${r.level}${r.streak > 1 ? ` · 🔥 ${r.streak} j` : ''}`} />
        ))
      ) : <DailyBoard date={dayKey()} />}
    </div>
  );
}
