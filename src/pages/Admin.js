import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, DIFF_LABELS } from '../data/quizData';
import AuthModal from '../components/AuthModal';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulaire manuel
  const [cat, setCat] = useState('culture');
  const [theme, setTheme] = useState('classique');
  const [diff, setDiff] = useState('medium');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = useState(0);
  const [explanation, setExplanation] = useState('');

  // CSV
  const [csvParsed, setCsvParsed] = useState([]);
  const [csvPreview, setCsvPreview] = useState(false);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  }

  const themes = CATEGORIES[cat]?.themes || {};

  async function handleAddQuestion(e) {
    e.preventDefault();
    if (!question.trim() || options.some((o) => !o.trim())) {
      showSuccess('⚠️ Remplis tous les champs');
      return;
    }
    try {
      await addDoc(collection(db, 'questions'), {
        category: cat,
        theme,
        diff,
        text: question.trim(),
        options: options.map((o) => o.trim()),
        answer: correctIdx,
        explanation: explanation.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrectIdx(0);
      setExplanation('');
      showSuccess('✓ Question ajoutée en base Firebase');
    } catch (err) {
      showSuccess('❌ Erreur : ' + err.message);
    }
  }

  function handleCSVFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter((l) => l.trim() && !l.startsWith('categorie'));
      const parsed = lines.map((line) => {
        const p = line.split(',');
        if (p.length < 8) return null;
        return {
          category: p[0].trim(),
          theme: p[1].trim(),
          diff: p[2].trim(),
          text: p[3].replace(/"/g, '').trim(),
          options: [p[4], p[5], p[6], p[7]].map((s) => s?.trim() || ''),
          answer: parseInt(p[8]) || 0,
          explanation: (p[9] || '').replace(/"/g, '').trim(),
        };
      }).filter(Boolean);
      setCsvParsed(parsed);
      setCsvPreview(true);
    };
    reader.readAsText(file);
  }

  async function handleImportCSV() {
    let count = 0;
    for (const q of csvParsed) {
      try {
        await addDoc(collection(db, 'questions'), {
          ...q,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        });
        count++;
      } catch (err) {
        console.error('Import error:', err);
      }
    }
    setCsvParsed([]);
    setCsvPreview(false);
    showSuccess(`✓ ${count} questions importées en Firebase`);
  }

  // Non connecté
  if (!user) {
    return (
      <div className="page">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Accès restreint</div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Connecte-toi avec un compte admin.</p>
          <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Se connecter</button>
        </div>
      </div>
    );
  }

  // Connecté mais pas admin
  if (!isAdmin) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', padding: '40px 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Accès refusé</div>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Tu n'as pas les droits admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Success toast */}
      <div className={`toast-success ${successMsg ? 'show' : ''}`}>{successMsg}</div>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1040, #2d1a5e)', border: '1px solid #4a3580', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>⚙️ Interface Admin</div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Gestion des questions Quizly — Firebase Firestore</div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {['manual', 'csv', 'help'].map((t, i) => (
          <div key={t} className={`admin-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {['Ajout manuel', 'Import CSV', 'Aide'][i]}
          </div>
        ))}
      </div>

      {/* ── MANUEL ── */}
      {activeTab === 'manual' && (
        <form onSubmit={handleAddQuestion}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Catégorie</label>
              <select value={cat} onChange={(e) => { setCat(e.target.value); setTheme(Object.keys(CATEGORIES[e.target.value]?.themes || {})[0] || ''); }}>
                {Object.values(CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Thème</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                {Object.values(themes).map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Difficulté</label>
            <select value={diff} onChange={(e) => setDiff(e.target.value)}>
              <option value="easy">Facile (+5 XP)</option>
              <option value="medium">Moyen (+10 XP)</option>
              <option value="hard">Expert (+20 XP)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Question</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Saisir la question..." required />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 6, display: 'block' }}>
              Options — clique ✓ pour la bonne réponse
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {options.map((opt, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                    placeholder={`Option ${['A','B','C','D'][i]}`}
                    style={{ width: '100%', background: 'var(--s2)', border: `1px solid ${correctIdx === i ? 'var(--cyan)' : 'var(--s3)'}`, borderRadius: 9, padding: '9px 32px 9px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 12, outline: 'none' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCorrectIdx(i)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', opacity: correctIdx === i ? 1 : 0.35, color: 'var(--cyan)' }}
                  >✓</button>
                </div>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>Explication (optionnel)</label>
            <input type="text" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="La bonne réponse est... parce que..." />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
            Ajouter la question → Firebase
          </button>
        </form>
      )}

      {/* ── CSV ── */}
      {activeTab === 'csv' && (
        <div>
          <div
            onClick={() => document.getElementById('csv-input').click()}
            style={{ border: '2px dashed var(--s3)', borderRadius: 12, padding: 28, textAlign: 'center', cursor: 'pointer', marginBottom: 12 }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--purple)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--s3)'}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Glisse ton fichier CSV ici</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>ou clique pour parcourir</div>
            <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVFile} />
          </div>

          {/* Format attendu */}
          <div style={{ background: 'var(--s2)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', marginBottom: 6 }}>Format CSV attendu :</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)', lineHeight: 1.8 }}>
              categorie,theme,difficulte,question,optA,optB,optC,optD,reponse(0-3),explication<br />
              cinema,classiques,medium,"Qui a réalisé...","Nolan","Lucas","Spielberg","Scott",0,"Explication"
            </div>
          </div>

          {/* Prévisualisation CSV */}
          {csvPreview && csvParsed.length > 0 && (
            <div style={{ background: 'var(--s2)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', marginBottom: 8 }}>
                {csvParsed.length} questions détectées
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Cat.', 'Thème', 'Diff.', 'Question'].map((h) => (
                        <th key={h} style={{ color: 'var(--purple)', padding: '3px 5px', textAlign: 'left', borderBottom: '1px solid var(--s3)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvParsed.slice(0, 5).map((q, i) => (
                      <tr key={i}>
                        <td style={{ padding: '3px 5px', color: 'var(--muted)' }}>{q.category}</td>
                        <td style={{ padding: '3px 5px', color: 'var(--muted)' }}>{q.theme}</td>
                        <td style={{ padding: '3px 5px' }}><span className={`diff-badge diff-${q.diff}`}>{DIFF_LABELS[q.diff]}</span></td>
                        <td style={{ padding: '3px 5px', color: 'var(--muted)' }}>{q.text.slice(0, 35)}…</td>
                      </tr>
                    ))}
                    {csvParsed.length > 5 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 6, fontSize: 10 }}>+{csvParsed.length - 5} autres</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary btn-full" style={{ marginTop: 10, fontFamily: "'Syne', sans-serif", fontWeight: 700 }} onClick={handleImportCSV}>
                Importer {csvParsed.length} questions → Firebase
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── AIDE ── */}
      {activeTab === 'help' && (
        <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'var(--text)', marginBottom: 12, fontSize: 16 }}>Guide Admin Quizly</div>

          <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, color: 'var(--purple)', marginBottom: 6 }}>Structure Firebase</div>
            <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
              /users/{'{uid}'} → profil utilisateur<br />
              /questions/{'{id}'} → questions ajoutées<br />
              /subscriptions/{'{uid}'} → abonnements Stripe
            </div>
          </div>

          <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, color: 'var(--cyan)', marginBottom: 6 }}>Rendre un utilisateur admin</div>
            Dans Firebase Console → Firestore → users → {'{uid}'} → modifier <code style={{ background: 'var(--s2)', padding: '1px 5px', borderRadius: 4 }}>isAdmin</code> à <code style={{ background: 'var(--s2)', padding: '1px 5px', borderRadius: 4 }}>true</code>
          </div>

          <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, color: 'var(--yellow)', marginBottom: 6 }}>Activer le premium</div>
            Modifier <code style={{ background: 'var(--s2)', padding: '1px 5px', borderRadius: 4 }}>isPremium: true</code> dans Firestore ou via Stripe Webhook automatique.
          </div>

          <div style={{ background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--pink)', marginBottom: 6 }}>Firestore Rules (à configurer)</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, lineHeight: 1.7 }}>
              rules_version = '2';<br />
              service cloud.firestore {'{'}<br />
              &nbsp;&nbsp;match /databases/{'{db}'}/documents {'{'}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;match /users/{'{uid}'} {'{'}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if request.auth.uid == uid;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;match /questions/{'{id}'} {'{'}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if true;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow write: if get(/users/$(request.auth.uid)).data.isAdmin;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br />
              &nbsp;&nbsp;{'}'}<br />
              {'}'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
