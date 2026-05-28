import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp, query, where
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, DIFF_LABELS } from '../data/quizData';
import AuthModal from '../components/AuthModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAllStaticQuestions() {
  const all = [];
  Object.values(CATEGORIES).forEach((cat) => {
    Object.values(cat.themes).forEach((theme) => {
      theme.quizzes.forEach((quiz) => {
        quiz.questions.forEach((q, idx) => {
          all.push({
            id: `static_${quiz.id}_${idx}`,
            isStatic: true,
            category: cat.id,
            categoryLabel: cat.label,
            theme: theme.id,
            themeLabel: theme.label,
            quizId: quiz.id,
            quizName: quiz.name,
            diff: quiz.diff,
            text: q.t,
            options: q.o,
            answer: q.a,
            explanation: q.e || '',
          });
        });
      });
    });
  });
  return all;
}

function getAllStaticCategories() {
  return Object.values(CATEGORIES).map((cat) => ({
    id: cat.id, label: cat.label, icon: cat.icon, isStatic: true,
    themeCount: Object.keys(cat.themes).length,
    quizCount: Object.values(cat.themes).reduce((s, t) => s + t.quizzes.length, 0),
    questionCount: Object.values(cat.themes).reduce((s, t) =>
      s + t.quizzes.reduce((s2, q) => s2 + q.questions.length, 0), 0),
  }));
}

// ── Styles communs ────────────────────────────────────────────────────────────

const S = {
  card: { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '11px 13px', marginBottom: 7 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tag: (color) => ({ background: `${color}22`, color, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }),
  iconBtn: (color = 'var(--muted)') => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: 5, transition: 'color .2s' }),
  input: { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'Josefin Sans, sans-serif', fontSize: 12, outline: 'none' },
  select: { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'Josefin Sans, sans-serif', fontSize: 12, outline: 'none' },
  label: { fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4, display: 'block' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 },
  confirmBox: { background: 'rgba(255,77,77,.08)', border: '1px solid rgba(255,77,77,.3)', borderRadius: 10, padding: 12, marginTop: 8 },
};

// ── Composant principal ───────────────────────────────────────────────────────

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [successMsg, setSuccessMsg] = useState('');

  // Questions
  const [staticQuestions, setStaticQuestions] = useState([]);
  const [firestoreQuestions, setFirestoreQuestions] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Catégories / Thèmes / Quiz (Firestore)
  const [firestoreCategories, setFirestoreCategories] = useState([]);
  const [firestoreThemes, setFirestoreThemes] = useState([]);
  const [firestoreQuizzes, setFirestoreQuizzes] = useState([]);

  // Formulaires
  const [newCat, setNewCat] = useState({ label: '', icon: '📚' });
  const [newTheme, setNewTheme] = useState({ catId: '', label: '', icon: '📖' });
  const [newQuiz, setNewQuiz] = useState({ catId: '', themeId: '', name: '', diff: 'medium' });
  const [editItem, setEditItem] = useState(null); // { type, id, data }

  // Ajout question manuel
  const [qCat, setQCat] = useState('culture');
  const [qTheme, setQTheme] = useState('classique');
  const [qDiff, setQDiff] = useState('medium');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExpl, setQExpl] = useState('');

  // CSV
  const [csvParsed, setCsvParsed] = useState([]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  }

  // ── Chargement ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !isAdmin) return;
    setStaticQuestions(getAllStaticQuestions());
    loadFirestoreData();
  }, [user, isAdmin]);

  async function loadFirestoreData() {
    try {
      const [qSnap, catSnap, themeSnap, quizSnap] = await Promise.all([
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'themes')),
        getDocs(collection(db, 'quizzes')),
      ]);
      setFirestoreQuestions(qSnap.docs.map((d) => ({ id: d.id, isStatic: false, ...d.data() })));
      setFirestoreCategories(catSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFirestoreThemes(themeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFirestoreQuizzes(quizSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Erreur chargement Firestore:', err);
    }
  }

  // ── Questions ───────────────────────────────────────────────────────────────

  const allQuestions = [...staticQuestions, ...firestoreQuestions];
  const filteredQuestions = allQuestions.filter((q) => {
    if (filterCat && q.category !== filterCat) return false;
    if (filterDiff && q.diff !== filterDiff) return false;
    if (filterSource === 'static' && !q.isStatic) return false;
    if (filterSource === 'firestore' && q.isStatic) return false;
    return true;
  });

  async function deleteQuestion(q) {
    if (q.isStatic) {
      showSuccess('⚠️ Les questions statiques ne peuvent pas être supprimées ici — modifie quizData.js');
      setConfirmDelete(null);
      return;
    }
    await deleteDoc(doc(db, 'questions', q.id));
    setFirestoreQuestions((prev) => prev.filter((x) => x.id !== q.id));
    setConfirmDelete(null);
    showSuccess('✓ Question supprimée');
  }

  async function addQuestion(e) {
    e.preventDefault();
    if (!qText.trim() || qOptions.some((o) => !o.trim())) {
      showSuccess('⚠️ Remplis tous les champs'); return;
    }
    const ref = await addDoc(collection(db, 'questions'), {
      category: qCat, theme: qTheme, diff: qDiff,
      text: qText.trim(), options: qOptions.map((o) => o.trim()),
      answer: qCorrect, explanation: qExpl.trim(),
      createdAt: serverTimestamp(), createdBy: user.uid, active: true,
    });
    setFirestoreQuestions((prev) => [...prev, {
      id: ref.id, isStatic: false, category: qCat, theme: qTheme,
      diff: qDiff, text: qText, options: qOptions, answer: qCorrect, explanation: qExpl,
    }]);
    setQText(''); setQOptions(['', '', '', '']); setQCorrect(0); setQExpl('');
    showSuccess('✓ Question ajoutée');
  }

  async function handleImportCSV() {
    let count = 0;
    for (const q of csvParsed) {
      const ref = await addDoc(collection(db, 'questions'), {
        ...q, createdAt: serverTimestamp(), createdBy: user.uid, active: true,
      });
      setFirestoreQuestions((prev) => [...prev, { id: ref.id, isStatic: false, ...q }]);
      count++;
    }
    setCsvParsed([]);
    showSuccess(`✓ ${count} questions importées`);
  }

  function handleCSVFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter((l) => l.trim() && !l.startsWith('categorie'));
      const parsed = lines.map((line) => {
        const p = line.split(','); if (p.length < 8) return null;
        return {
          category: p[0].trim(), theme: p[1].trim(), diff: p[2].trim(),
          text: p[3].replace(/"/g, '').trim(),
          options: [p[4], p[5], p[6], p[7]].map((s) => s?.trim() || ''),
          answer: parseInt(p[8]) || 0,
          explanation: (p[9] || '').replace(/"/g, '').trim(),
        };
      }).filter(Boolean);
      setCsvParsed(parsed);
    };
    reader.readAsText(file);
  }

  // ── Catégories ──────────────────────────────────────────────────────────────

  async function addCategory(e) {
    e.preventDefault();
    if (!newCat.label.trim()) return;
    const id = newCat.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const ref = await addDoc(collection(db, 'categories'), {
      id, label: newCat.label.trim(), icon: newCat.icon,
      createdAt: serverTimestamp(),
    });
    setFirestoreCategories((prev) => [...prev, { id: ref.id, label: newCat.label, icon: newCat.icon }]);
    setNewCat({ label: '', icon: '📚' });
    showSuccess('✓ Catégorie ajoutée');
  }

  async function deleteCategory(cat) {
    // Vérifie qu'il n'y a pas de thèmes/questions dedans
    const hasThemes = firestoreThemes.some((t) => t.catId === cat.id);
    const hasQuestions = firestoreQuestions.some((q) => q.category === cat.id);
    if (hasThemes || hasQuestions) {
      showSuccess('⚠️ Supprime d\'abord les thèmes et questions de cette catégorie');
      return;
    }
    await deleteDoc(doc(db, 'categories', cat.id));
    setFirestoreCategories((prev) => prev.filter((c) => c.id !== cat.id));
    showSuccess('✓ Catégorie supprimée');
  }

  async function updateCategory(id, data) {
    await updateDoc(doc(db, 'categories', id), data);
    setFirestoreCategories((prev) => prev.map((c) => c.id === id ? { ...c, ...data } : c));
    setEditItem(null);
    showSuccess('✓ Catégorie modifiée');
  }

  // ── Thèmes ──────────────────────────────────────────────────────────────────

  async function addTheme(e) {
    e.preventDefault();
    if (!newTheme.label.trim() || !newTheme.catId) return;
    const ref = await addDoc(collection(db, 'themes'), {
      label: newTheme.label.trim(), icon: newTheme.icon,
      catId: newTheme.catId, createdAt: serverTimestamp(),
    });
    setFirestoreThemes((prev) => [...prev, { id: ref.id, ...newTheme }]);
    setNewTheme({ catId: '', label: '', icon: '📖' });
    showSuccess('✓ Thème ajouté');
  }

  async function deleteTheme(theme) {
    const hasQuizzes = firestoreQuizzes.some((q) => q.themeId === theme.id);
    const hasQuestions = firestoreQuestions.some((q) => q.theme === theme.id);
    if (hasQuizzes || hasQuestions) {
      showSuccess('⚠️ Supprime d\'abord les quiz et questions de ce thème');
      return;
    }
    await deleteDoc(doc(db, 'themes', theme.id));
    setFirestoreThemes((prev) => prev.filter((t) => t.id !== theme.id));
    showSuccess('✓ Thème supprimé');
  }

  async function updateTheme(id, data) {
    await updateDoc(doc(db, 'themes', id), data);
    setFirestoreThemes((prev) => prev.map((t) => t.id === id ? { ...t, ...data } : t));
    setEditItem(null);
    showSuccess('✓ Thème modifié');
  }

  // ── Quiz ────────────────────────────────────────────────────────────────────

  async function addQuiz(e) {
    e.preventDefault();
    if (!newQuiz.name.trim() || !newQuiz.catId || !newQuiz.themeId) return;
    const ref = await addDoc(collection(db, 'quizzes'), {
      name: newQuiz.name.trim(), diff: newQuiz.diff,
      catId: newQuiz.catId, themeId: newQuiz.themeId,
      createdAt: serverTimestamp(),
    });
    setFirestoreQuizzes((prev) => [...prev, { id: ref.id, ...newQuiz }]);
    setNewQuiz({ catId: '', themeId: '', name: '', diff: 'medium' });
    showSuccess('✓ Quiz ajouté');
  }

  async function deleteQuiz(quiz) {
    const hasQuestions = firestoreQuestions.some((q) => q.quizId === quiz.id);
    if (hasQuestions) {
      showSuccess('⚠️ Supprime d\'abord les questions de ce quiz');
      return;
    }
    await deleteDoc(doc(db, 'quizzes', quiz.id));
    setFirestoreQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
    showSuccess('✓ Quiz supprimé');
  }

  async function updateQuiz(id, data) {
    await updateDoc(doc(db, 'quizzes', id), data);
    setFirestoreQuizzes((prev) => prev.map((q) => q.id === id ? { ...q, ...data } : q));
    setEditItem(null);
    showSuccess('✓ Quiz modifié');
  }

  // ── Render guards ────────────────────────────────────────────────────────────

  if (!user) return (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Accès restreint</div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Connecte-toi avec un compte admin.</p>
        <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Se connecter</button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="page">
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 20, fontWeight: 800 }}>Accès refusé</div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>Tu n'as pas les droits admin.</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'questions', label: `Questions (${allQuestions.length})` },
    { id: 'add', label: 'Ajouter' },
    { id: 'categories', label: 'Catégories' },
    { id: 'themes', label: 'Thèmes' },
    { id: 'quizzes', label: 'Quiz' },
  ];

  return (
    <div className="page">
      <div className={`toast-success ${successMsg ? 'show' : ''}`}>{successMsg}</div>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1040, #2d1a5e)', border: '1px solid #4a3580', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>⚙️ Admin Quizly</div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          {allQuestions.length} questions · {Object.keys(CATEGORIES).length + firestoreCategories.length} catégories
        </div>
      </div>

      {/* Tabs scrollables */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {tabs.map((t) => (
          <div key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '7px 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 11, fontWeight: 600, transition: 'all .2s', flexShrink: 0,
              background: activeTab === t.id ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'var(--s2)',
              color: activeTab === t.id ? '#fff' : 'var(--muted)',
            }}
          >{t.label}</div>
        ))}
      </div>

      {/* ── QUESTIONS ── */}
      {activeTab === 'questions' && (
        <div>
          {/* Filtres */}
          <div style={S.grid2}>
            <select style={S.select} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">Toutes catégories</option>
              {Object.values(CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <select style={S.select} value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)}>
              <option value="">Toutes difficultés</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Expert</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <select style={S.select} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">Toutes sources</option>
              <option value="static">Code statique (quizData.js)</option>
              <option value="firestore">Firebase uniquement</option>
            </select>
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            {filteredQuestions.length} question(s) affichée(s)
          </div>

          {filteredQuestions.slice(0, 50).map((q) => (
            <div key={q.id} style={S.card}>
              <div style={S.row}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {q.text}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span style={S.tag('var(--purple)')}>{q.category}</span>
                    <span style={S.tag(q.diff === 'easy' ? 'var(--cyan)' : q.diff === 'medium' ? 'var(--yellow)' : 'var(--pink)')}>
                      {DIFF_LABELS[q.diff]}
                    </span>
                    <span style={S.tag(q.isStatic ? 'var(--muted)' : 'var(--orange)')}>
                      {q.isStatic ? 'statique' : 'firebase'}
                    </span>
                  </div>
                </div>
                <button
                  style={S.iconBtn('var(--muted)')}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                  onClick={() => setConfirmDelete(confirmDelete?.id === q.id ? null : q)}
                >×</button>
              </div>

              {/* Confirmation suppression */}
              {confirmDelete?.id === q.id && (
                <div style={S.confirmBox}>
                  {q.isStatic
                    ? <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>⚠️ Question statique — modifie <code>quizData.js</code> pour la supprimer.</p>
                    : <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>Supprimer définitivement cette question de Firebase ?</p>
                  }
                  <div style={{ display: 'flex', gap: 6 }}>
                    {!q.isStatic && (
                      <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11, background: 'var(--red)' }}
                        onClick={() => deleteQuestion(q)}>Supprimer</button>
                    )}
                    <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }}
                      onClick={() => setConfirmDelete(null)}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredQuestions.length > 50 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 12 }}>
              Affichage limité à 50 — utilise les filtres pour affiner
            </div>
          )}
        </div>
      )}

      {/* ── AJOUTER ── */}
      {activeTab === 'add' && (
        <div>
          {/* Tabs internes */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--s2)', borderRadius: 10, padding: 3, marginBottom: 14 }}>
            {['Manuel', 'CSV'].map((t, i) => {
              const active = i === 0 ? !csvParsed.length : !!csvParsed.length;
              return null; // juste visuel, géré par csvParsed
            })}
          </div>

          {/* Formulaire manuel */}
          <form onSubmit={addQuestion}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Catégorie</label>
                <select style={S.select} value={qCat} onChange={(e) => { setQCat(e.target.value); setQTheme(Object.keys(CATEGORIES[e.target.value]?.themes || {})[0] || ''); }}>
                  {Object.values(CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Thème</label>
                <select style={S.select} value={qTheme} onChange={(e) => setQTheme(e.target.value)}>
                  {Object.values(CATEGORIES[qCat]?.themes || {}).map((t) => (
                    <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Difficulté</label>
              <select style={S.select} value={qDiff} onChange={(e) => setQDiff(e.target.value)}>
                <option value="easy">Facile (+5 XP)</option>
                <option value="medium">Moyen (+10 XP)</option>
                <option value="hard">Expert (+20 XP)</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Question</label>
              <textarea style={{ ...S.input, minHeight: 64, resize: 'vertical' }} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Saisir la question..." required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Options — ✓ pour marquer la bonne réponse</label>
              <div style={S.grid2}>
                {qOptions.map((opt, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <input type="text" value={opt} onChange={(e) => { const o = [...qOptions]; o[i] = e.target.value; setQOptions(o); }}
                      placeholder={`Option ${['A','B','C','D'][i]}`}
                      style={{ ...S.input, paddingRight: 32, borderColor: qCorrect === i ? 'var(--cyan)' : 'var(--s3)' }} required />
                    <button type="button" onClick={() => setQCorrect(i)}
                      style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: 'var(--cyan)', opacity: qCorrect === i ? 1 : 0.3 }}>✓</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Explication</label>
              <input type="text" style={S.input} value={qExpl} onChange={(e) => setQExpl(e.target.value)} placeholder="Explication de la bonne réponse..." />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>
              Ajouter la question
            </button>
          </form>

          {/* Séparateur CSV */}
          <div style={{ margin: '20px 0', borderTop: '1px solid var(--s2)', paddingTop: 20 }}>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Import CSV</div>
            <div onClick={() => document.getElementById('csv-input').click()}
              style={{ border: '2px dashed var(--s3)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', marginBottom: 10 }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--purple)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--s3)'}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Glisse ton fichier CSV ici</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>categorie,theme,difficulte,question,optA,optB,optC,optD,reponse(0-3),explication</div>
              <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVFile} />
            </div>
            {csvParsed.length > 0 && (
              <div style={{ background: 'var(--s2)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', marginBottom: 8 }}>{csvParsed.length} questions détectées</div>
                {csvParsed.slice(0, 3).map((q, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>• {q.text?.slice(0, 50)}…</div>
                ))}
                {csvParsed.length > 3 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>+{csvParsed.length - 3} autres</div>}
                <button className="btn btn-primary btn-full" style={{ marginTop: 10, fontFamily: "'Raleway', sans-serif", fontWeight: 700 }} onClick={handleImportCSV}>
                  Importer {csvParsed.length} questions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CATÉGORIES ── */}
      {activeTab === 'categories' && (
        <div>
          {/* Statiques */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
            Catégories statiques (code)
          </div>
          {getAllStaticCategories().map((cat) => (
            <div key={cat.id} style={S.card}>
              <div style={S.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cat.themeCount} thèmes · {cat.quizCount} quiz · {cat.questionCount} questions</div>
                  </div>
                </div>
                <span style={S.tag('var(--muted)')}>statique</span>
              </div>
            </div>
          ))}

          {/* Firebase */}
          {firestoreCategories.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '14px 0 8px' }}>
                Catégories Firebase
              </div>
              {firestoreCategories.map((cat) => (
                <div key={cat.id} style={S.card}>
                  {editItem?.id === cat.id ? (
                    <EditForm
                      data={editItem.data}
                      fields={['icon', 'label']}
                      onSave={(d) => updateCategory(cat.id, d)}
                      onCancel={() => setEditItem(null)}
                    />
                  ) : (
                    <div style={S.row}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditItem({ id: cat.id, data: cat })}>✏️</button>
                        <button style={S.iconBtn('var(--pink)')} onClick={() => deleteCategory(cat)}>×</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Ajouter */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--s2)', paddingTop: 16 }}>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouvelle catégorie</div>
            <form onSubmit={addCategory}>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Icône</label>
                  <input style={S.input} value={newCat.icon} onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })} placeholder="🎯" />
                </div>
                <div>
                  <label style={S.label}>Nom</label>
                  <input style={S.input} value={newCat.label} onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} placeholder="Ma catégorie" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>Ajouter la catégorie</button>
            </form>
          </div>
        </div>
      )}

      {/* ── THÈMES ── */}
      {activeTab === 'themes' && (
        <div>
          {/* Statiques */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Thèmes statiques</div>
          {Object.values(CATEGORIES).flatMap((cat) =>
            Object.values(cat.themes).map((theme) => (
              <div key={`${cat.id}_${theme.id}`} style={S.card}>
                <div style={S.row}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{theme.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{theme.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{cat.icon} {cat.label} · {theme.quizzes.length} quiz</div>
                    </div>
                  </div>
                  <span style={S.tag('var(--muted)')}>statique</span>
                </div>
              </div>
            ))
          )}

          {/* Firebase */}
          {firestoreThemes.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '14px 0 8px' }}>Thèmes Firebase</div>
              {firestoreThemes.map((theme) => (
                <div key={theme.id} style={S.card}>
                  {editItem?.id === theme.id ? (
                    <EditForm data={editItem.data} fields={['icon', 'label']} onSave={(d) => updateTheme(theme.id, d)} onCancel={() => setEditItem(null)} />
                  ) : (
                    <div style={S.row}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{theme.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{theme.label}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>cat: {theme.catId}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditItem({ id: theme.id, data: theme })}>✏️</button>
                        <button style={S.iconBtn('var(--pink)')} onClick={() => deleteTheme(theme)}>×</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Ajouter */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--s2)', paddingTop: 16 }}>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouveau thème</div>
            <form onSubmit={addTheme}>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Catégorie parente</label>
                <select style={S.select} value={newTheme.catId} onChange={(e) => setNewTheme({ ...newTheme, catId: e.target.value })} required>
                  <option value="">Choisir une catégorie</option>
                  {Object.values(CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  {firestoreCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Icône</label>
                  <input style={S.input} value={newTheme.icon} onChange={(e) => setNewTheme({ ...newTheme, icon: e.target.value })} placeholder="📖" />
                </div>
                <div>
                  <label style={S.label}>Nom</label>
                  <input style={S.input} value={newTheme.label} onChange={(e) => setNewTheme({ ...newTheme, label: e.target.value })} placeholder="Mon thème" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>Ajouter le thème</button>
            </form>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {activeTab === 'quizzes' && (
        <div>
          {/* Statiques */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Quiz statiques</div>
          {Object.values(CATEGORIES).flatMap((cat) =>
            Object.values(cat.themes).flatMap((theme) =>
              theme.quizzes.map((quiz) => (
                <div key={quiz.id} style={S.card}>
                  <div style={S.row}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{quiz.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 6, marginTop: 2 }}>
                        <span>{cat.icon} {cat.label}</span>
                        <span>·</span>
                        <span>{theme.label}</span>
                        <span>·</span>
                        <span className={`diff-badge diff-${quiz.diff}`}>{DIFF_LABELS[quiz.diff]}</span>
                        <span>· {quiz.questions.length} q.</span>
                      </div>
                    </div>
                    <span style={S.tag('var(--muted)')}>statique</span>
                  </div>
                </div>
              ))
            )
          )}

          {/* Firebase */}
          {firestoreQuizzes.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '14px 0 8px' }}>Quiz Firebase</div>
              {firestoreQuizzes.map((quiz) => (
                <div key={quiz.id} style={S.card}>
                  {editItem?.id === quiz.id ? (
                    <EditForm data={editItem.data} fields={['name', 'diff']} onSave={(d) => updateQuiz(quiz.id, d)} onCancel={() => setEditItem(null)} />
                  ) : (
                    <div style={S.row}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{quiz.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                          <span className={`diff-badge diff-${quiz.diff}`}>{DIFF_LABELS[quiz.diff]}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditItem({ id: quiz.id, data: quiz })}>✏️</button>
                        <button style={S.iconBtn('var(--pink)')} onClick={() => deleteQuiz(quiz)}>×</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Ajouter */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--s2)', paddingTop: 16 }}>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouveau quiz</div>
            <form onSubmit={addQuiz}>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>Catégorie</label>
                  <select style={S.select} value={newQuiz.catId} onChange={(e) => setNewQuiz({ ...newQuiz, catId: e.target.value, themeId: '' })} required>
                    <option value="">Catégorie</option>
                    {Object.values(CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Thème</label>
                  <select style={S.select} value={newQuiz.themeId} onChange={(e) => setNewQuiz({ ...newQuiz, themeId: e.target.value })} required>
                    <option value="">Thème</option>
                    {newQuiz.catId && Object.values(CATEGORIES[newQuiz.catId]?.themes || {}).map((t) => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                    {firestoreThemes.filter((t) => t.catId === newQuiz.catId).map((t) => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>Nom du quiz</label>
                <input style={S.input} value={newQuiz.name} onChange={(e) => setNewQuiz({ ...newQuiz, name: e.target.value })} placeholder="Quiz #3 — Nouveau thème" required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Difficulté</label>
                <select style={S.select} value={newQuiz.diff} onChange={(e) => setNewQuiz({ ...newQuiz, diff: e.target.value })}>
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Expert</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>Ajouter le quiz</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant d'édition inline ────────────────────────────────────────────────
function EditForm({ data, fields, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data });
  return (
    <div>
      {fields.map((f) => (
        <div key={f} style={{ marginBottom: 7 }}>
          <input
            style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--purple)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'Josefin Sans', fontSize: 12, outline: 'none' }}
            value={form[f] || ''}
            onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            placeholder={f}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => onSave(form)}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
