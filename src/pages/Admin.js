import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, DIFF_LABELS } from '../data/quizData';
import AuthModal from '../components/AuthModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAllStaticQuestions() {
  const all = [];
  Object.values(CATEGORIES).forEach((cat) => {
    Object.values(cat.themes).forEach((theme) => {
      theme.quizzes.forEach((quiz) => {
        quiz.questions.forEach((q, idx) => {
          all.push({
            id: `static_${quiz.id}_${idx}`,
            isStatic: true,
            category: cat.id, categoryLabel: cat.label,
            theme: theme.id, themeLabel: theme.label,
            quizId: quiz.id, quizName: quiz.name,
            diff: quiz.diff, text: q.t,
            options: q.o, answer: q.a, explanation: q.e || '',
          });
        });
      });
    });
  });
  return all;
}

function getAllStaticQuizzes() {
  const all = [];
  Object.values(CATEGORIES).forEach((cat) => {
    Object.values(cat.themes).forEach((theme) => {
      theme.quizzes.forEach((quiz) => {
        all.push({
          id: quiz.id, isStatic: true,
          name: quiz.name, diff: quiz.diff,
          catId: cat.id, catLabel: cat.label, catIcon: cat.icon,
          themeId: theme.id, themeLabel: theme.label,
          questionCount: quiz.questions.length,
          questions: quiz.questions.map((q, i) => ({
            id: `static_${quiz.id}_${i}`, isStatic: true,
            text: q.t, options: q.o, answer: q.a, explanation: q.e || '',
            diff: quiz.diff,
          })),
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

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  card: { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '11px 13px', marginBottom: 7 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tag: (color) => ({ background: `${color}22`, color, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }),
  iconBtn: (color = 'var(--muted)') => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: 15, padding: '3px 7px', borderRadius: 5, transition: 'color .2s', fontFamily: 'inherit' }),
  input: { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'Josefin Sans, sans-serif', fontSize: 12, outline: 'none' },
  select: { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'Josefin Sans, sans-serif', fontSize: 12, outline: 'none' },
  label: { fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4, display: 'block' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 },
  confirmBox: { background: 'rgba(255,77,77,.08)', border: '1px solid rgba(255,77,77,.3)', borderRadius: 10, padding: 12, marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '16px 0 8px' },
  divider: { borderTop: '1px solid var(--s2)', margin: '16px 0' },
};

// ── Composant principal ───────────────────────────────────────────────────────

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [successMsg, setSuccessMsg] = useState('');

  // Data
  const [staticQuestions] = useState(getAllStaticQuestions());
  const [staticQuizzes] = useState(getAllStaticQuizzes());
  const [firestoreQuestions, setFsQuestions] = useState([]);
  const [firestoreCategories, setFsCats] = useState([]);
  const [firestoreThemes, setFsThemes] = useState([]);
  const [firestoreQuizzes, setFsQuizzes] = useState([]);

  // UI état
  const [filterCat, setFilterCat] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editQuiz, setEditQuiz] = useState(null);
  const [editItem, setEditItem] = useState(null);

  // Formulaire ajout question
  const [qCat, setQCat] = useState('culture');
  const [qTheme, setQTheme] = useState('classique');
  const [qDiff, setQDiff] = useState('medium');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExpl, setQExpl] = useState('');

  // Formulaire catégorie / thème / quiz
  const [newCat, setNewCat] = useState({ label: '', icon: '📚' });
  const [newTheme, setNewTheme] = useState({ catId: '', label: '', icon: '📖' });
  const [newQuiz, setNewQuiz] = useState({ catId: '', themeId: '', name: '', diff: 'medium' });

  // CSV
  const [csvParsed, setCsvParsed] = useState([]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  }

  useEffect(() => {
    if (!user || !isAdmin) return;
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
      setFsQuestions(qSnap.docs.map((d) => ({ id: d.id, isStatic: false, ...d.data() })));
      setFsCats(catSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFsThemes(themeSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setFsQuizzes(quizSnap.docs.map((d) => ({ id: d.id, isStatic: false, ...d.data() })));
    } catch (err) { console.error(err); }
  }

  // ── Questions ────────────────────────────────────────────────────────────────

  const allQuestions = [...staticQuestions, ...firestoreQuestions];
  const filteredQuestions = allQuestions.filter((q) => {
    if (filterCat && q.category !== filterCat) return false;
    if (filterDiff && q.diff !== filterDiff) return false;
    if (filterSource === 'static' && !q.isStatic) return false;
    if (filterSource === 'firestore' && q.isStatic) return false;
    return true;
  });

  async function deleteQuestion(q) {
    if (q.isStatic) { showSuccess('⚠️ Question statique — modifie quizData.js'); setConfirmDelete(null); return; }
    await deleteDoc(doc(db, 'questions', q.id));
    setFsQuestions((p) => p.filter((x) => x.id !== q.id));
    setConfirmDelete(null);
    showSuccess('✓ Question supprimée');
  }

  async function saveEditQuestion(q, data) {
    if (q.isStatic) { showSuccess('⚠️ Question statique — modifie quizData.js'); setEditQuestion(null); return; }
    await updateDoc(doc(db, 'questions', q.id), data);
    setFsQuestions((p) => p.map((x) => x.id === q.id ? { ...x, ...data } : x));
    setEditQuestion(null);
    showSuccess('✓ Question modifiée');
  }

  async function addQuestion(e) {
    e.preventDefault();
    if (!qText.trim() || qOptions.some((o) => !o.trim())) { showSuccess('⚠️ Remplis tous les champs'); return; }
    const ref = await addDoc(collection(db, 'questions'), {
      category: qCat, theme: qTheme, diff: qDiff,
      text: qText.trim(), options: qOptions.map((o) => o.trim()),
      answer: qCorrect, explanation: qExpl.trim(),
      createdAt: serverTimestamp(), createdBy: user.uid, active: true,
    });
    setFsQuestions((p) => [...p, { id: ref.id, isStatic: false, category: qCat, theme: qTheme, diff: qDiff, text: qText, options: qOptions, answer: qCorrect, explanation: qExpl }]);
    setQText(''); setQOptions(['', '', '', '']); setQCorrect(0); setQExpl('');
    showSuccess('✓ Question ajoutée');
  }

  async function handleImportCSV() {
    let count = 0;
    for (const q of csvParsed) {
      const ref = await addDoc(collection(db, 'questions'), { ...q, createdAt: serverTimestamp(), createdBy: user.uid, active: true });
      setFsQuestions((p) => [...p, { id: ref.id, isStatic: false, ...q }]);
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
        return { category: p[0].trim(), theme: p[1].trim(), diff: p[2].trim(), text: p[3].replace(/"/g, '').trim(), options: [p[4], p[5], p[6], p[7]].map((s) => s?.trim() || ''), answer: parseInt(p[8]) || 0, explanation: (p[9] || '').replace(/"/g, '').trim() };
      }).filter(Boolean);
      setCsvParsed(parsed);
    };
    reader.readAsText(file);
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────────

  const allQuizzes = [
    ...staticQuizzes,
    ...firestoreQuizzes.map((q) => ({
      ...q,
      catLabel: firestoreCategories.find((c) => c.id === q.catId)?.label || q.catId,
      catIcon: firestoreCategories.find((c) => c.id === q.catId)?.icon || '📂',
      themeLabel: firestoreThemes.find((t) => t.id === q.themeId)?.label || q.themeId,
      questions: firestoreQuestions.filter((fq) => fq.quizId === q.id),
      questionCount: firestoreQuestions.filter((fq) => fq.quizId === q.id).length,
    })),
  ];

  async function saveEditQuiz(quiz, data) {
    if (quiz.isStatic) { showSuccess('⚠️ Quiz statique — modifie quizData.js'); setEditQuiz(null); return; }
    await updateDoc(doc(db, 'quizzes', quiz.id), data);
    setFsQuizzes((p) => p.map((q) => q.id === quiz.id ? { ...q, ...data } : q));
    setEditQuiz(null);
    showSuccess('✓ Quiz modifié');
  }

  async function deleteQuiz(quiz) {
    if (quiz.isStatic) { showSuccess('⚠️ Quiz statique — modifie quizData.js'); return; }
    const hasQ = firestoreQuestions.some((q) => q.quizId === quiz.id);
    if (hasQ) { showSuccess('⚠️ Supprime d\'abord les questions de ce quiz'); return; }
    await deleteDoc(doc(db, 'quizzes', quiz.id));
    setFsQuizzes((p) => p.filter((q) => q.id !== quiz.id));
    showSuccess('✓ Quiz supprimé');
  }

  async function addQuiz(e) {
    e.preventDefault();
    if (!newQuiz.name.trim() || !newQuiz.catId) return;
    const ref = await addDoc(collection(db, 'quizzes'), { ...newQuiz, name: newQuiz.name.trim(), createdAt: serverTimestamp() });
    setFsQuizzes((p) => [...p, { id: ref.id, isStatic: false, ...newQuiz }]);
    setNewQuiz({ catId: '', themeId: '', name: '', diff: 'medium' });
    showSuccess('✓ Quiz ajouté');
  }

  // ── Catégories ────────────────────────────────────────────────────────────────

  async function addCategory(e) {
    e.preventDefault();
    if (!newCat.label.trim()) return;
    const ref = await addDoc(collection(db, 'categories'), { label: newCat.label.trim(), icon: newCat.icon, createdAt: serverTimestamp() });
    setFsCats((p) => [...p, { id: ref.id, ...newCat }]);
    setNewCat({ label: '', icon: '📚' });
    showSuccess('✓ Catégorie ajoutée');
  }

  async function deleteCategory(cat) {
    const hasThemes = firestoreThemes.some((t) => t.catId === cat.id);
    const hasQ = firestoreQuestions.some((q) => q.category === cat.id);
    if (hasThemes || hasQ) { showSuccess('⚠️ Supprime d\'abord les thèmes et questions'); return; }
    await deleteDoc(doc(db, 'categories', cat.id));
    setFsCats((p) => p.filter((c) => c.id !== cat.id));
    showSuccess('✓ Catégorie supprimée');
  }

  async function updateCategory(id, data) {
    await updateDoc(doc(db, 'categories', id), data);
    setFsCats((p) => p.map((c) => c.id === id ? { ...c, ...data } : c));
    setEditItem(null); showSuccess('✓ Catégorie modifiée');
  }

  // ── Thèmes ────────────────────────────────────────────────────────────────────

  async function addTheme(e) {
    e.preventDefault();
    if (!newTheme.label.trim() || !newTheme.catId) return;
    const ref = await addDoc(collection(db, 'themes'), { ...newTheme, label: newTheme.label.trim(), createdAt: serverTimestamp() });
    setFsThemes((p) => [...p, { id: ref.id, ...newTheme }]);
    setNewTheme({ catId: '', label: '', icon: '📖' });
    showSuccess('✓ Thème ajouté');
  }

  async function deleteTheme(theme) {
    const hasQ = firestoreQuizzes.some((q) => q.themeId === theme.id) || firestoreQuestions.some((q) => q.theme === theme.id);
    if (hasQ) { showSuccess('⚠️ Supprime d\'abord les quiz et questions de ce thème'); return; }
    await deleteDoc(doc(db, 'themes', theme.id));
    setFsThemes((p) => p.filter((t) => t.id !== theme.id));
    showSuccess('✓ Thème supprimé');
  }

  async function updateTheme(id, data) {
    await updateDoc(doc(db, 'themes', id), data);
    setFsThemes((p) => p.map((t) => t.id === id ? { ...t, ...data } : t));
    setEditItem(null); showSuccess('✓ Thème modifié');
  }

  // ── Guards ────────────────────────────────────────────────────────────────────

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
      </div>
    </div>
  );

  const tabs = [
    { id: 'questions', label: `Questions (${allQuestions.length})` },
    { id: 'quizzes', label: `Quiz (${allQuizzes.length})` },
    { id: 'ajouter', label: 'Ajouter' },
    { id: 'categories', label: 'Catégories' },
    { id: 'themes', label: 'Thèmes' },
  ];

  return (
    <div className="page">
      <div className={`toast-success ${successMsg ? 'show' : ''}`}>{successMsg}</div>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1040, #2d1a5e)', border: '1px solid #4a3580', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>⚙️ Admin Quizly</div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          {allQuestions.length} questions · {allQuizzes.length} quiz · {Object.keys(CATEGORIES).length + firestoreCategories.length} catégories
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {tabs.map((t) => (
          <div key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '7px 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
            fontSize: 11, fontWeight: 600, transition: 'all .2s', flexShrink: 0,
            background: activeTab === t.id ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'var(--s2)',
            color: activeTab === t.id ? '#fff' : 'var(--muted)',
          }}>{t.label}</div>
        ))}
      </div>

      {/* ══ QUESTIONS ══ */}
      {activeTab === 'questions' && (
        <div>
          <div style={S.grid2}>
            <select style={S.select} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="">Toutes catégories</option>
              {Object.values(CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <select style={S.select} value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)}>
              <option value="">Toutes difficultés</option>
              <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <select style={S.select} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">Toutes sources</option>
              <option value="static">Statique (code)</option>
              <option value="firestore">Firebase</option>
            </select>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{filteredQuestions.length} question(s)</div>

          {filteredQuestions.slice(0, 60).map((q) => (
            <div key={q.id} style={S.card}>
              {/* Mode édition */}
              {editQuestion?.id === q.id ? (
                <QuestionEditForm
                  question={editQuestion}
                  onSave={(data) => saveEditQuestion(q, data)}
                  onCancel={() => setEditQuestion(null)}
                  isStatic={q.isStatic}
                />
              ) : (
                <>
                  <div style={S.row}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={S.tag('var(--purple)')}>{q.categoryLabel || q.category}</span>
                        <span style={S.tag(q.diff === 'easy' ? 'var(--cyan)' : q.diff === 'medium' ? 'var(--yellow)' : 'var(--pink)')}>{DIFF_LABELS[q.diff]}</span>
                        <span style={S.tag(q.isStatic ? 'var(--muted)' : 'var(--orange)')}>{q.isStatic ? 'statique' : 'firebase'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQuestion(q)} title="Modifier">✏️</button>
                      <button style={S.iconBtn('var(--muted)')}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                        onClick={() => setConfirmDelete(confirmDelete?.id === q.id ? null : q)}>×</button>
                    </div>
                  </div>
                  {/* Confirmation suppression */}
                  {confirmDelete?.id === q.id && (
                    <div style={S.confirmBox}>
                      {q.isStatic
                        ? <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>⚠️ Question statique — modifie <code>quizData.js</code></p>
                        : <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>Supprimer cette question de Firebase ?</p>
                      }
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!q.isStatic && <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11, background: '#FF4D4D' }} onClick={() => deleteQuestion(q)}>Supprimer</button>}
                        <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setConfirmDelete(null)}>Annuler</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {filteredQuestions.length > 60 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 12 }}>Affichage limité à 60 — utilise les filtres</div>
          )}
        </div>
      )}

      {/* ══ QUIZ ══ */}
      {activeTab === 'quizzes' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{allQuizzes.length} quiz au total</div>
          {allQuizzes.map((quiz) => (
            <div key={quiz.id} style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              {/* Header quiz */}
              <div style={{ padding: '12px 13px' }}>
                {editQuiz?.id === quiz.id ? (
                  <QuizEditForm
                    quiz={editQuiz}
                    categories={[...Object.values(CATEGORIES).map((c) => ({ id: c.id, label: c.label, icon: c.icon })), ...firestoreCategories]}
                    themes={[...Object.values(CATEGORIES).flatMap((c) => Object.values(c.themes).map((t) => ({ id: t.id, label: t.label, catId: c.id }))), ...firestoreThemes]}
                    onSave={(data) => saveEditQuiz(quiz, data)}
                    onCancel={() => setEditQuiz(null)}
                    isStatic={quiz.isStatic}
                  />
                ) : (
                  <div style={S.row}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{quiz.name}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={S.tag('var(--purple)')}>{quiz.catIcon} {quiz.catLabel}</span>
                        <span style={S.tag('var(--cyan)')}>{quiz.themeLabel}</span>
                        <span style={S.tag(quiz.diff === 'easy' ? 'var(--cyan)' : quiz.diff === 'medium' ? 'var(--yellow)' : 'var(--pink)')}>{DIFF_LABELS[quiz.diff]}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{quiz.questionCount} q.</span>
                        <span style={S.tag(quiz.isStatic ? 'var(--muted)' : 'var(--orange)')}>{quiz.isStatic ? 'statique' : 'firebase'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQuiz(quiz)} title="Modifier">✏️</button>
                      <button
                        style={{ ...S.iconBtn('var(--muted)'), fontSize: 13 }}
                        onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                        title="Voir les questions"
                      >{expandedQuiz === quiz.id ? '▲' : '▼'}</button>
                      {!quiz.isStatic && (
                        <button style={S.iconBtn('var(--muted)')}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pink)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                          onClick={() => setConfirmDelete(confirmDelete?.id === quiz.id ? null : quiz)}>×</button>
                      )}
                    </div>
                  </div>
                )}
                {/* Confirmation suppression quiz */}
                {confirmDelete?.id === quiz.id && (
                  <div style={S.confirmBox}>
                    <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>Supprimer ce quiz de Firebase ?</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11, background: '#FF4D4D' }} onClick={() => deleteQuiz(quiz)}>Supprimer</button>
                      <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setConfirmDelete(null)}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions du quiz (expandable) */}
              {expandedQuiz === quiz.id && (
                <div style={{ borderTop: '1px solid var(--s2)', background: 'rgba(0,0,0,.15)' }}>
                  {(quiz.questions || []).length === 0 ? (
                    <div style={{ padding: '12px 13px', fontSize: 12, color: 'var(--muted)' }}>Aucune question dans ce quiz.</div>
                  ) : (
                    (quiz.questions || []).map((q, i) => (
                      <div key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', padding: '10px 13px' }}>
                        {editQuestion?.id === q.id ? (
                          <QuestionEditForm
                            question={editQuestion}
                            onSave={(data) => saveEditQuestion(q, data)}
                            onCancel={() => setEditQuestion(null)}
                            isStatic={q.isStatic}
                          />
                        ) : (
                          <div style={S.row}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Q{i + 1}</div>
                              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</div>
                              <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 3 }}>✓ {q.options?.[q.answer]}</div>
                            </div>
                            <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQuestion(q)} title="Modifier">✏️</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Ajouter quiz */}
          <div style={S.divider} />
          <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouveau quiz</div>
          <form onSubmit={addQuiz}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Catégorie</label>
                <select style={S.select} value={newQuiz.catId} onChange={(e) => setNewQuiz({ ...newQuiz, catId: e.target.value, themeId: '' })} required>
                  <option value="">Catégorie</option>
                  {Object.values(CATEGORIES).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  {firestoreCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Thème</label>
                <select style={S.select} value={newQuiz.themeId} onChange={(e) => setNewQuiz({ ...newQuiz, themeId: e.target.value })} required>
                  <option value="">Thème</option>
                  {newQuiz.catId && Object.values(CATEGORIES[newQuiz.catId]?.themes || {}).map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                  {firestoreThemes.filter((t) => t.catId === newQuiz.catId).map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>Nom du quiz</label>
              <input style={S.input} value={newQuiz.name} onChange={(e) => setNewQuiz({ ...newQuiz, name: e.target.value })} placeholder="Quiz #3 — Mon thème" required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Difficulté</label>
              <select style={S.select} value={newQuiz.diff} onChange={(e) => setNewQuiz({ ...newQuiz, diff: e.target.value })}>
                <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>Ajouter le quiz</button>
          </form>
        </div>
      )}

      {/* ══ AJOUTER ══ */}
      {activeTab === 'ajouter' && (
        <div>
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
                  {Object.values(CATEGORIES[qCat]?.themes || {}).map((t) => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Difficulté</label>
              <select style={S.select} value={qDiff} onChange={(e) => setQDiff(e.target.value)}>
                <option value="easy">Facile (+5 XP)</option><option value="medium">Moyen (+10 XP)</option><option value="hard">Expert (+20 XP)</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Question</label>
              <textarea style={{ ...S.input, minHeight: 64, resize: 'vertical' }} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Saisir la question..." required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Options — ✓ pour la bonne réponse</label>
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
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>Ajouter la question</button>
          </form>

          {/* CSV */}
          <div style={S.divider} />
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
              {csvParsed.slice(0, 3).map((q, i) => <div key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>• {q.text?.slice(0, 60)}…</div>)}
              {csvParsed.length > 3 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>+{csvParsed.length - 3} autres</div>}
              <button className="btn btn-primary btn-full" style={{ marginTop: 10, fontFamily: "'Raleway', sans-serif", fontWeight: 700 }} onClick={handleImportCSV}>
                Importer {csvParsed.length} questions
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ CATÉGORIES ══ */}
      {activeTab === 'categories' && (
        <div>
          <div style={S.sectionLabel}>Statiques (code)</div>
          {getAllStaticCategories().map((cat) => (
            <div key={cat.id} style={S.card}>
              <div style={S.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cat.themeCount} thèmes · {cat.quizCount} quiz · {cat.questionCount} q.</div>
                  </div>
                </div>
                <span style={S.tag('var(--muted)')}>statique</span>
              </div>
            </div>
          ))}

          {firestoreCategories.length > 0 && (
            <>
              <div style={S.sectionLabel}>Firebase</div>
              {firestoreCategories.map((cat) => (
                <div key={cat.id} style={S.card}>
                  {editItem?.id === cat.id ? (
                    <InlineEdit data={editItem.data} fields={['icon', 'label']} onSave={(d) => updateCategory(cat.id, d)} onCancel={() => setEditItem(null)} />
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

          <div style={S.divider} />
          <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouvelle catégorie</div>
          <form onSubmit={addCategory}>
            <div style={S.grid2}>
              <div><label style={S.label}>Icône</label><input style={S.input} value={newCat.icon} onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })} placeholder="🎯" /></div>
              <div><label style={S.label}>Nom</label><input style={S.input} value={newCat.label} onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} placeholder="Ma catégorie" required /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>Ajouter</button>
          </form>
        </div>
      )}

      {/* ══ THÈMES ══ */}
      {activeTab === 'themes' && (
        <div>
          <div style={S.sectionLabel}>Statiques (code)</div>
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

          {firestoreThemes.length > 0 && (
            <>
              <div style={S.sectionLabel}>Firebase</div>
              {firestoreThemes.map((theme) => (
                <div key={theme.id} style={S.card}>
                  {editItem?.id === theme.id ? (
                    <InlineEdit data={editItem.data} fields={['icon', 'label']} onSave={(d) => updateTheme(theme.id, d)} onCancel={() => setEditItem(null)} />
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

          <div style={S.divider} />
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
              <div><label style={S.label}>Icône</label><input style={S.input} value={newTheme.icon} onChange={(e) => setNewTheme({ ...newTheme, icon: e.target.value })} placeholder="📖" /></div>
              <div><label style={S.label}>Nom</label><input style={S.input} value={newTheme.label} onChange={(e) => setNewTheme({ ...newTheme, label: e.target.value })} placeholder="Mon thème" required /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700 }}>Ajouter</button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Formulaire d'édition de question ─────────────────────────────────────────

function QuestionEditForm({ question, onSave, onCancel, isStatic }) {
  const [text, setText] = useState(question.text);
  const [options, setOptions] = useState([...question.options]);
  const [answer, setAnswer] = useState(question.answer);
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [diff, setDiff] = useState(question.diff);

  const S2 = {
    input: { width: '100%', background: 'var(--s2)', border: '1px solid var(--purple)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'Josefin Sans', fontSize: 12, outline: 'none', marginBottom: 7 },
    label: { fontSize: 10, color: 'var(--muted)', marginBottom: 3, display: 'block' },
  };

  if (isStatic) return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>⚠️ Question statique — modifie <code>quizData.js</code> pour l'éditer.</p>
      <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={onCancel}>Fermer</button>
    </div>
  );

  return (
    <div>
      <label style={S2.label}>Question</label>
      <textarea style={{ ...S2.input, minHeight: 56, resize: 'vertical' }} value={text} onChange={(e) => setText(e.target.value)} />

      <label style={S2.label}>Difficulté</label>
      <select style={{ ...S2.input }} value={diff} onChange={(e) => setDiff(e.target.value)}>
        <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
      </select>

      <label style={S2.label}>Options — ✓ bonne réponse</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 7 }}>
        {options.map((opt, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <input type="text" value={opt} onChange={(e) => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
              style={{ ...S2.input, marginBottom: 0, paddingRight: 28, borderColor: answer === i ? 'var(--cyan)' : 'var(--purple)' }} />
            <button type="button" onClick={() => setAnswer(i)}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', color: 'var(--cyan)', opacity: answer === i ? 1 : 0.3 }}>✓</button>
          </div>
        ))}
      </div>

      <label style={S2.label}>Explication</label>
      <input style={S2.input} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explication..." />

      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}
          onClick={() => onSave({ text, options, answer, explanation, diff })}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Formulaire d'édition de quiz ──────────────────────────────────────────────

function QuizEditForm({ quiz, categories, themes, onSave, onCancel, isStatic }) {
  const [name, setName] = useState(quiz.name);
  const [diff, setDiff] = useState(quiz.diff);
  const [catId, setCatId] = useState(quiz.catId);
  const [themeId, setThemeId] = useState(quiz.themeId);

  const S2 = {
    input: { width: '100%', background: 'var(--s2)', border: '1px solid var(--purple)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'Josefin Sans', fontSize: 12, outline: 'none', marginBottom: 7 },
  };

  if (isStatic) return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>⚠️ Quiz statique — modifie <code>quizData.js</code> pour l'éditer.</p>
      <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={onCancel}>Fermer</button>
    </div>
  );

  const filteredThemes = themes.filter((t) => t.catId === catId);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 0 }}>
        <select style={S2.input} value={catId} onChange={(e) => { setCatId(e.target.value); setThemeId(''); }}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={S2.input} value={themeId} onChange={(e) => setThemeId(e.target.value)}>
          <option value="">Thème</option>
          {filteredThemes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <input style={S2.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du quiz" />
      <select style={S2.input} value={diff} onChange={(e) => setDiff(e.target.value)}>
        <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
      </select>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}
          onClick={() => onSave({ name, diff, catId, themeId })}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Édition inline (catégories/thèmes) ───────────────────────────────────────

function InlineEdit({ data, fields, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data });
  return (
    <div>
      {fields.map((f) => (
        <input key={f} style={{ width: '100%', background: 'var(--s2)', border: '1px solid var(--purple)', borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontFamily: 'Josefin Sans', fontSize: 12, outline: 'none', marginBottom: 6 }}
          value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} placeholder={f} />
      ))}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => onSave(form)}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
