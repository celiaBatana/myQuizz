import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { DIFF_LABELS, DIFF_COLORS } from '../data/quizData';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AVATARS, TITLES, ownedIds, avatarIcon, titleName } from '../data/cosmetics';
import { cleanQuizName } from '../utils/quizName';

const XP_PER_LEVEL = 200;

export default function Profile() {
  const { user, profile, logout, isAdmin, updateProfile } = useAuth();
  const [showCosm, setShowCosm] = useState(false);
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // stats | history

  // ── Non connecté ──────────────────────────────────────────────────────────
  if (!user) return (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>👤</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Mon Profil
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24, maxWidth: 280, margin: '0 auto 24px' }}>
          Connecte-toi pour suivre ta progression, ton XP et ton historique de quiz.
        </p>
        <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
          Se connecter
        </button>
      </div>
    </div>
  );

  // ── Données profil ────────────────────────────────────────────────────────
  const totalXP       = profile?.totalXP       || 0;
  const level         = profile?.level         || 1;
  const xpInLevel     = profile?.xpInLevel     || 0;
  const quizzesPlayed = profile?.quizzesPlayed  || 0;
  const correctAnswers= profile?.correctAnswers || 0;
  const totalAnswers  = profile?.totalAnswers   || 0;
  const perfect       = profile?.perfectQuizzes || 0;
  const lk = profile?.lastStreakDate;
  const dk = (o) => { const d = new Date(); d.setDate(d.getDate() + o); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
  const freezes = profile?.freezes || 0;
  const streak = (lk === dk(0) || lk === dk(-1) || (lk === dk(-2) && freezes > 0)) ? (profile?.streak || 0) : 0;
  const BADGES = [
    { icon: '🎯', name: 'Premier quiz',   ok: quizzesPlayed >= 1,  hint: 'Joue 1 quiz' },
    { icon: '🔟', name: 'Habitué',        ok: quizzesPlayed >= 10, hint: 'Joue 10 quiz' },
    { icon: '💯', name: 'Sans faute',     ok: perfect >= 1,        hint: 'Fais un 100 %' },
    { icon: '🏆', name: 'Perfectionniste',ok: perfect >= 5,        hint: '5 quiz parfaits' },
    { icon: '🔥', name: 'Série de 3',     ok: streak >= 3,         hint: '3 jours d\'affilée' },
    { icon: '🌋', name: 'Série de 7',     ok: streak >= 7,         hint: '7 jours d\'affilée' },
    { icon: '⚡', name: '500 XP',         ok: totalXP >= 500,      hint: 'Atteins 500 XP' },
    { icon: '🚀', name: 'Niveau 5',       ok: level >= 5,          hint: 'Atteins le niveau 5' },
  ];
  const history       = profile?.history        || [];
  const displayName   = profile?.displayName    || user.displayName || user.email?.split('@')[0] || 'Joueur';
  const accuracy      = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const xpPct         = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100));

  // Historique trié du plus récent au plus ancien
  const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Stats par difficulté
  const statsByDiff = { easy: { played: 0, correct: 0 }, medium: { played: 0, correct: 0 }, hard: { played: 0, correct: 0 } };
  history.forEach(h => {
    if (statsByDiff[h.diff]) {
      statsByDiff[h.diff].played  += h.total  || 0;
      statsByDiff[h.diff].correct += h.score   || 0;
    }
  });

  // Emoji niveau
  function levelEmoji(lvl) {
    if (lvl >= 20) return '🏆';
    if (lvl >= 10) return '⭐';
    if (lvl >= 5)  return '🔥';
    return '🌱';
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const owned = ownedIds(profile);
  async function equip(field, id) {
    try {
      await updateProfile({ [field]: id });
      // Visible dans les classements ; échec non bloquant
      await setDoc(doc(db, 'leaderboard', user.uid), { [field]: id }, { merge: true });
      for (const code of (profile?.groups || [])) {
        await setDoc(doc(db, 'group_members', `${code}_${user.uid}`), { [field]: id }, { merge: true });
      }
    } catch (e) { console.warn('Personnalisation non enregistrée partout', e); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page">

      {/* ── Hero profil ── */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 20, padding: '20px 16px', marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 6 }}>{profile?.avatar ? avatarIcon(profile.avatar) : levelEmoji(level)}</div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 2 }}>
          {displayName}
        </div>
        {profile?.title && <div style={{ fontSize: 12, color: 'var(--yellow)', fontWeight: 700, marginBottom: 4 }}>{titleName(profile.title)}</div>}
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
          {user.email}
          {isAdmin && <span style={{ marginLeft: 8, background: 'rgba(217,144,79,.2)', color: 'var(--purple)', borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>ADMIN</span>}
        </div>

        {/* Badge niveau */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,144,79,.15)', border: '1px solid rgba(217,144,79,.3)', borderRadius: 12, padding: '6px 14px', marginBottom: 14 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, color: 'var(--purple)' }}>Niveau {level}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{totalXP} XP total</span>
        </div>

        {/* Barre XP */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
            <span>Niveau {level}</span>
            <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
            <span>Niveau {level + 1}</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: 'var(--yellow)', borderRadius: 10, transition: 'width .6s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textAlign: 'right' }}>
            {XP_PER_LEVEL - xpInLevel} XP pour le niveau suivant
          </div>
        </div>
      </div>

      {/* ── Stats rapides ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Quiz joués',   value: quizzesPlayed, icon: '🎯', color: 'var(--cyan)'   },
          { label: 'Précision',    value: `${accuracy}%`, icon: '✓',  color: 'var(--yellow)' },
          { label: 'XP gagnés',   value: totalXP,       icon: '⚡',  color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Personnalisation ── */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        <div onClick={() => setShowCosm(v => !v)} style={{ fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
          <span>Avatar et titre</span><span style={{ color: 'var(--muted)' }}>{showCosm ? '▲' : '▼'}</span>
        </div>
        {showCosm && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Avatars — les cachés tombent des coffres quotidiens (40 % de chance).</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 12 }}>
              {AVATARS.map(a => {
                const has = owned.has(a.id);
                return (
                  <div key={a.id} title={has ? a.name : (a.hint || 'Coffre quotidien')}
                    onClick={() => has && equip('avatar', a.id)}
                    style={{ textAlign: 'center', fontSize: 24, padding: '6px 0', borderRadius: 10, cursor: has ? 'pointer' : 'default',
                      opacity: has ? 1 : 0.3, filter: has ? 'none' : 'grayscale(1)',
                      border: `2px solid ${profile?.avatar === a.id ? 'var(--purple)' : 'transparent'}`, background: 'var(--s2)' }}>
                    {has ? a.icon : '🔒'}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Titres</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TITLES.map(t => {
                const has = owned.has(t.id);
                return (
                  <div key={t.id} onClick={() => has && equip('title', t.id)}
                    style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 20, cursor: has ? 'pointer' : 'default',
                      background: profile?.title === t.id ? 'var(--purple)' : 'var(--s2)', color: has ? '#fff' : 'var(--muted)', opacity: has ? 1 : 0.5 }}>
                    {has ? t.name : `🔒 ${t.hint || 'Coffre quotidien'}`}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Série + badges ── */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          Série : {streak} jour{streak > 1 ? 's' : ''} · {freezes} gel{freezes > 1 ? 's' : ''}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {BADGES.map(b => (
            <div key={b.name} title={b.hint} style={{ textAlign: 'center', opacity: b.ok ? 1 : 0.35, filter: b.ok ? 'none' : 'grayscale(1)' }}>
              <div style={{ fontSize: 22 }}>{b.icon}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{b.ok ? b.name : b.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--s2)', borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {[['stats', 'Stats'], ['history', 'Historique']].map(([id, label]) => (
          <div key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            background: activeTab === id ? 'var(--yellow)' : 'transparent',
            color: activeTab === id ? 'var(--on-primary)' : 'var(--muted)',
            transition: 'all .2s',
          }}>{label}</div>
        ))}
      </div>

      {/* ── Tab Stats ── */}
      {activeTab === 'stats' && (
        <div>
          {/* Stats par difficulté */}
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Par difficulté</div>
          {Object.entries(statsByDiff).map(([diff, s]) => {
            const acc = s.played > 0 ? Math.round((s.correct / s.played) * 100) : 0;
            return (
              <div key={diff} style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '11px 13px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: DIFF_COLORS[diff] }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{DIFF_LABELS[diff]}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {s.correct}/{s.played} questions
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${acc}%`, background: DIFF_COLORS[diff], borderRadius: 10, transition: 'width .5s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textAlign: 'right' }}>{acc}% de précision</div>
              </div>
            );
          })}

          {/* Stats globales */}
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, margin: '16px 0 10px' }}>Global</div>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '13px 15px' }}>
            {[
              ['Questions répondues', totalAnswers],
              ['Bonnes réponses',     correctAnswers],
              ['Quiz complétés',      quizzesPlayed],
              ['XP total accumulé',   `${totalXP} XP`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--s2)' }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Historique ── */}
      {activeTab === 'history' && (
        <div>
          {sortedHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Aucun quiz joué</div>
              <p style={{ fontSize: 12 }}>Lance ton premier quiz pour voir ton historique ici.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
                Découvrir les quiz
              </button>
            </div>
          ) : (
            sortedHistory.slice(0, 30).map((h, i) => {
              const pct  = h.total > 0 ? Math.round((h.score / h.total) * 100) : 0;
              const emoji = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '👍' : '💪';
              const date  = new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              return (
                <div key={i} style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '11px 13px', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {emoji} {cleanQuizName(h.quizName) || 'Quiz'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{date}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, color: pct >= 60 ? 'var(--cyan)' : 'var(--pink)' }}>
                        {h.score}/{h.total}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--yellow)', fontWeight: 600 }}>+{h.xp} XP</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 60 ? 'var(--cyan)' : 'var(--pink)', borderRadius: 10 }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{pct}%</span>
                    {h.diff && (
                      <span style={{ fontSize: 10, background: DIFF_COLORS[h.diff]+'22', color: DIFF_COLORS[h.diff], borderRadius: 5, padding: '1px 6px', fontWeight: 600, flexShrink: 0 }}>
                        {DIFF_LABELS[h.diff]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Bouton déconnexion ── */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--s2)' }}>
        <button
          className="btn btn-secondary btn-full"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, color: 'var(--muted)' }}
          onClick={handleLogout}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
