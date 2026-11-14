import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategoryList } from '../data/quizData';
import { DAILY_GOALS } from '../utils/retention';

const GOAL_TXT = { 20: ['Tranquille', '≈ 2 quiz par jour'], 50: ['Régulier', '≈ 4 à 5 quiz par jour'], 100: ['Intense', '≈ 8 à 10 quiz par jour'] };

// Premier lancement : 3 écrans (bienvenue, objectif quotidien, premier quiz)
export default function Onboarding() {
  const { updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(50);
  const [cat, setCat] = useState('all');
  const [busy, setBusy] = useState(false);
  const cats = getCategoryList();

  async function finish(start) {
    setBusy(true);
    try { await updateProfile({ onboarded: true, dailyGoal: goal }); } catch (e) { console.warn(e); }
    if (start) navigate(`/play?mode=mix&cat=${cat}&diff=easy`);
  }

  const btn = { fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800 };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,5,30,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div style={{ background: 'var(--s1)', border: '1px solid var(--purple)', borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 8, background: i <= step ? 'var(--purple)' : 'var(--s2)', transition: 'all .3s' }} />)}
        </div>

        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>👋</div>
            <div style={{ ...btn, fontSize: 22, margin: '6px 0 12px' }}>Bienvenue sur Quizly !</div>
            <div style={{ textAlign: 'left', fontSize: 14, lineHeight: 1.9, marginBottom: 18 }}>
              Réponds à des quiz sur plein de thèmes<br />
              Gagne de l'XP et monte de niveau<br />
              Joue chaque jour pour garder ta série<br />
              Grimpe en ligue et défie tes amis
            </div>
            <button className="btn btn-primary btn-full" style={btn} onClick={() => setStep(1)}>Suivant</button>
          </div>
        )}

        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 46 }}>🎯</div>
            <div style={{ ...btn, fontSize: 20, margin: '6px 0 4px' }}>Ton objectif quotidien</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>Combien d'XP veux-tu gagner par jour ? Tu pourras changer plus tard.</div>
            {DAILY_GOALS.map(n => (
              <div key={n} onClick={() => setGoal(n)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', marginBottom: 8, borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${goal === n ? 'var(--purple)' : 'var(--s2)'}`, background: goal === n ? 'rgba(127,176,122,.12)' : 'var(--s2)', textAlign: 'left',
              }}>
                <div><div style={{ fontWeight: 800 }}>{GOAL_TXT[n][0]}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{GOAL_TXT[n][1]}</div></div>
                <div style={{ fontWeight: 800, color: 'var(--yellow)' }}>{n} XP</div>
              </div>
            ))}
            <button className="btn btn-primary btn-full" style={{ ...btn, marginTop: 6 }} onClick={() => setStep(2)}>Suivant</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 46 }}>🚀</div>
            <div style={{ ...btn, fontSize: 20, margin: '6px 0 4px' }}>Ton premier quiz</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Choisis un sujet : 10 questions faciles pour démarrer.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 16 }}>
              {[{ id: 'all', icon: '🌍', label: 'Un peu de tout' }, ...cats].map(c => (
                <div key={c.id} onClick={() => setCat(c.id)} style={{
                  fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 20, cursor: 'pointer',
                  background: cat === c.id ? 'var(--purple)' : 'var(--s2)', color: cat === c.id ? '#fff' : 'inherit',
                }}>{c.icon} {c.label}</div>
              ))}
            </div>
            <button className="btn btn-primary btn-full" style={btn} disabled={busy} onClick={() => finish(true)}>C'est parti !</button>
          </div>
        )}

        <div onClick={() => !busy && finish(false)} style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}>Passer</div>
      </div>
    </div>
  );
}
