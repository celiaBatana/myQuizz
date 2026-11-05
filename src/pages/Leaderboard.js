import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dayKey } from '../hooks/useQuiz';
import { LEAGUES, PROMOTE_XP, DEMOTE_XP, weekKey } from '../utils/league';

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

function LeagueBoard() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState(null);
  const wk = weekKey();
  const myLeague = profile?.weekKey === wk || profile?.league ? (profile?.league || 0) : 0;
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'leaderboard'), where('weekKey', '==', wk), limit(300)));
        setRows(snap.docs.map(d => d.data()));
      } catch (e) { console.error(e); setRows([]); }
    })();
  }, [wk]);
  const nextMonday = new Date(wk + 'T00:00:00'); nextMonday.setDate(nextMonday.getDate() + 7);
  const days = Math.max(1, Math.ceil((nextMonday - new Date()) / 86400000));
  const L = LEAGUES[myLeague];
  const list = (rows || []).filter(r => (r.league || 0) === myLeague).sort((a, b) => (b.weekXP || 0) - (a.weekXP || 0)).slice(0, 50);
  const inList = list.some(r => r.uid === user?.uid);
  return (
    <div>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--purple)', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 800, fontSize: 16 }}>{L.icon} Ligue {L.name}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.6 }}>
          Remise à zéro dans {days} jour{days > 1 ? 's' : ''} (lundi). Fais au moins <strong>{PROMOTE_XP} XP</strong> dans la semaine pour monter d'une ligue ; moins de {DEMOTE_XP} XP et tu descends.
        </div>
      </div>
      {!user && <Empty text="Connecte-toi pour rejoindre une ligue." />}
      {user && !rows && <Empty text="Chargement…" />}
      {user && rows && list.length === 0 && <Empty text="Personne dans ta ligue cette semaine. Lance un quiz pour ouvrir le classement !" />}
      {user && list.map((r, i) => (
        <Row key={r.uid} rank={i} name={r.name} me={r.uid === user.uid} right={`${r.weekXP || 0} XP`} sub={`Niveau ${r.level}`} />
      ))}
      {user && rows && !inList && list.length > 0 && <Empty text="Joue un quiz cette semaine pour apparaître dans le classement." />}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('week');
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
        {[['week', '🏅 Ligue'], ['xp', '⚡ Général'], ['daily', '📅 Défi']].map(([id, label]) => (
          <div key={id} onClick={() => setTab(id)} style={{
            flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: tab === id ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'transparent',
            color: tab === id ? '#fff' : 'var(--muted)',
          }}>{label}</div>
        ))}
      </div>
      <div onClick={() => navigate('/groupes')} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--cyan)', cursor: 'pointer', marginBottom: 10 }}>👥 Mes groupes privés ›</div>
      {tab === 'week' ? <LeagueBoard /> : tab === 'xp' ? (
        !rows ? <Empty text="Chargement…" /> :
        rows.length === 0 ? <Empty text="Le classement se remplit dès qu'un joueur termine un quiz." /> :
        rows.map((r, i) => (
          <Row key={r.uid} rank={i} name={r.name} me={r.uid === user?.uid} right={`${r.totalXP} XP`} sub={`Niveau ${r.level}${r.streak > 1 ? ` · 🔥 ${r.streak} j` : ''}`} />
        ))
      ) : <DailyBoard date={dayKey()} />}
    </div>
  );
}
