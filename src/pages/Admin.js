import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, DIFF_LABELS } from '../data/quizData';
import AuthModal from '../components/AuthModal';
import { S } from '../components/adminStyles';
import { QuestionForm, QuizForm, InlineEdit } from '../components/AdminForms';
import AdminReports from '../components/AdminReports';
import AdminSante from '../components/AdminSante';
import TabQuiz from '../components/admin/TabQuiz';
import TabLier from '../components/admin/TabLier';
import TabQuestions from '../components/admin/TabQuestions';
import TabAjouter from '../components/admin/TabAjouter';
import TabCategories from '../components/admin/TabCategories';
import TabThemes from '../components/admin/TabThemes';
import { parseCSV, normText } from '../utils/csv';


// Parseur CSV robuste : gère les guillemets, les virgules dans les champs et les "" échappés

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab]           = useState('quizzes');
  const [toast, setToast]       = useState('');

  // Data Firestore
  const [questions, setQuestions] = useState([]);
  const [quizzes,   setQuizzes]   = useState([]);
  const [cats,      setCats]      = useState([]);
  const [themes,    setThemes]    = useState([]);
  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  // UI questions
  const [filterCat,    setFilterCat]    = useState('');
  const [filterDiff,   setFilterDiff]   = useState('');
  const [filterLinked, setFilterLinked] = useState(''); // '' | 'linked' | 'unlinked'
  const [editQ,        setEditQ]        = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);
  const [selectedQ,    setSelectedQ]    = useState([]); // ids sélectionnés pour suppression en masse
  const [confirmBulk,  setConfirmBulk]  = useState(false);

  // UI quiz
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [editQuiz,     setEditQuiz]     = useState(null);
  const [linkQuizId,   setLinkQuizId]   = useState('');
  const [linkSelected, setLinkSelected] = useState([]);
  const [linkFilter,   setLinkFilter]   = useState({ cat:'', theme:'', diff:'' });

  // UI catégories / thèmes
  const [editItem, setEditItem] = useState(null);

  // Formulaire question manuelle
  const [qCat,  setQCat]  = useState('culture');
  const [qTheme,setQTheme]= useState('classique');
  const [qDiff, setQDiff] = useState('medium');
  const [qText, setQText] = useState('');
  const [qOpts, setQOpts] = useState(['','','','']);
  const [qAns,  setQAns]  = useState(0);
  const [qExpl, setQExpl] = useState('');

  // Formulaire nouveaux
  const [newCat,   setNewCat]   = useState({ label:'', icon:'📚' });
  const [newTheme, setNewTheme] = useState({ catId:'', label:'', icon:'📖' });
  const [newQuiz,  setNewQuiz]  = useState({ catId:'', themeId:'', name:'', diff:'medium' });

  // CSV
  const [csvRows,     setCsvRows]     = useState([]);
  const [qStats,      setQStats]      = useState({});
  const [statsOk,     setStatsOk]     = useState(false);
  const [csvQuizRows, setCsvQuizRows] = useState([]);

  function ok(msg) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  // ── Chargement ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      const [qS, quizS, catS, thS] = await Promise.all([
        getDocs(collection(db, 'questions')),
        getDocs(collection(db, 'quizzes')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'themes')),
      ]);
      setQuestions(qS.docs.map(d => ({ id: d.id, ...d.data() })));
      setQuizzes(quizS.docs.map(d => ({ id: d.id, ...d.data() })));
      setCats(catS.docs.map(d => ({ id: d.id, ...d.data() })));
      setThemes(thS.docs.map(d => ({ id: d.id, ...d.data() })));
      try {
        const rS = await getDocs(collection(db, 'reports'));
        setReports(rS.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.warn('Signalements indisponibles (règles Firestore à publier ?)', e); }
      try {
        const stS = await getDocs(collection(db, 'question_stats'));
        const m = {}; stS.docs.forEach(d => { m[d.id] = d.data(); });
        setQStats(m); setStatsOk(true);
      } catch (e) { console.warn('Stats indisponibles (règles Firestore à publier ?)', e); }
      setLoading(false);
    })();
  }, [user, isAdmin]);

  // ── Questions ────────────────────────────────────────────────────────────────
  const filtered = questions.filter(q => {
    if (filterCat    && q.category !== filterCat)   return false;
    if (filterDiff   && q.diff     !== filterDiff)  return false;
    if (filterLinked === 'linked'   && !q.quizId)   return false;
    if (filterLinked === 'unlinked' &&  q.quizId)   return false;
    return true;
  });

  function toggleSelectQ(id) {
    setSelectedQ(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function selectAllFiltered() { setSelectedQ(filtered.slice(0, 60).map(q => q.id)); }
  function deselectAll() { setSelectedQ([]); }

  async function addQuestion(e) {
    e.preventDefault();
    if (!qText.trim() || qOpts.some(o => !o.trim())) { ok('⚠️ Remplis tous les champs'); return; }
    const ref = await addDoc(collection(db, 'questions'), {
      category: qCat, theme: qTheme, diff: qDiff,
      text: qText.trim(), options: qOpts.map(o => o.trim()),
      answer: qAns, explanation: qExpl.trim(),
      createdAt: serverTimestamp(), createdBy: user.uid, active: true,
    });
    setQuestions(p => [...p, { id: ref.id, category: qCat, theme: qTheme, diff: qDiff, text: qText, options: qOpts, answer: qAns, explanation: qExpl }]);
    setQText(''); setQOpts(['','','','']); setQAns(0); setQExpl('');
    ok('✓ Question ajoutée');
  }

  async function deleteQuestion(q) {
    await deleteDoc(doc(db, 'questions', q.id));
    setQuestions(p => p.filter(x => x.id !== q.id));
    setConfirmDel(null); setSelectedQ([]); ok('✓ Question supprimée');
  }

  // Mise à jour groupée de plusieurs questions (par paquets de 400)
  async function bulkUpdateQuestions(list) {
    for (let i = 0; i < list.length; i += 400) {
      const batch = writeBatch(db);
      list.slice(i, i + 400).forEach(({ id, data }) => batch.update(doc(db, 'questions', id), data));
      await batch.commit();
    }
    const map = Object.fromEntries(list.map(x => [x.id, x.data]));
    setQuestions(p => p.map(q => map[q.id] ? { ...q, ...map[q.id] } : q));
  }

  async function deleteBulk() {
    const batch = writeBatch(db);
    selectedQ.forEach(id => batch.delete(doc(db, 'questions', id)));
    await batch.commit();
    const n = selectedQ.length;
    setQuestions(p => p.filter(x => !selectedQ.includes(x.id)));
    setSelectedQ([]); setConfirmBulk(false);
    ok(`✓ ${n} questions supprimées`);
  }

  async function saveQuestion(q, data) {
    await updateDoc(doc(db, 'questions', q.id), data);
    setQuestions(p => p.map(x => x.id === q.id ? { ...x, ...data } : x));
    setEditQ(null); ok('✓ Question modifiée');
  }

  async function importCSVQuestions() {
    let n = 0; let linked = 0; let created = 0; const notFound = [];
    const known = [...quizzes]; // quiz connus, enrichis au fil des créations
    const seen = new Set(questions.map(q => normText(q.text)));
    let dups = 0;
    for (const { quizName, ...row } of csvRows) {
      const key = normText(row.text);
      if (seen.has(key)) { dups++; continue; } // doublon : déjà en base ou déjà vu dans ce CSV
      seen.add(key);
      let matchingQuiz = known.find(q =>
        q.catId === row.category && q.themeId === row.theme && q.diff === row.diff &&
        (!quizName || q.name === quizName)
      );
      // Quiz nommé dans le CSV mais inexistant : on le crée
      if (!matchingQuiz && quizName) {
        const qd = { catId: row.category, themeId: row.theme, name: quizName, diff: row.diff };
        const qref = await addDoc(collection(db, 'quizzes'), { ...qd, createdAt: serverTimestamp() });
        matchingQuiz = { id: qref.id, ...qd };
        known.push(matchingQuiz);
        setQuizzes(p => [...p, matchingQuiz]);
        created++;
      }
      const data = {
        ...row,
        quizId: matchingQuiz ? matchingQuiz.id : null,
        createdAt: serverTimestamp(), createdBy: user.uid, active: true,
      };
      const ref = await addDoc(collection(db, 'questions'), data);
      setQuestions(p => [...p, { id: ref.id, ...data }]);
      n++; if (matchingQuiz) linked++;
      else if (!notFound.find(x => x.category === row.category && x.theme === row.theme && x.diff === row.diff))
        notFound.push({ category: row.category, theme: row.theme, diff: row.diff });
    }
    setCsvRows([]);
    const dupTxt = dups ? ` · ${dups} doublon${dups > 1 ? 's' : ''} ignoré${dups > 1 ? 's' : ''}` : '';
    if (notFound.length > 0)
      ok(`✓ ${n} importées · ${linked} liées · ⚠️ ${n - linked} sans quiz (${notFound.map(x => x.category + '/' + x.theme).join(', ')})${dupTxt}`);
    else
      ok(`✓ ${n} questions importées et liées${created ? ` · ${created} quiz créé${created > 1 ? 's' : ''}` : ''}${dupTxt} !`);
  }

  function parseCSVQuestions(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const rows = parseCSV(ev.target.result)
        .filter(p => !p[0].trim().toLowerCase().startsWith('categorie') && p.length >= 8)
        .map(p => ({
          category: p[0].trim(), theme: p[1].trim(), diff: p[2].trim(),
          text: p[3].trim(),
          options: [p[4], p[5], p[6], p[7]].map(x => x?.trim() || ''),
          answer: parseInt(p[8]) || 0,
          explanation: (p[9] || '').trim(),
          quizName: (p[10] || '').trim(), // optionnel : nom du quiz cible
        }));
      setCsvRows(rows);
    };
    r.readAsText(file);
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  async function addQuiz(e) {
    e.preventDefault();
    if (!newQuiz.name.trim() || !newQuiz.catId) return;
    const ref = await addDoc(collection(db, 'quizzes'), { ...newQuiz, name: newQuiz.name.trim(), createdAt: serverTimestamp() });
    setQuizzes(p => [...p, { id: ref.id, ...newQuiz }]);
    setNewQuiz({ catId: '', themeId: '', name: '', diff: 'medium' });
    ok('✓ Quiz ajouté');
  }

  async function saveQuiz(quiz, data) {
    await updateDoc(doc(db, 'quizzes', quiz.id), data);
    setQuizzes(p => p.map(q => q.id === quiz.id ? { ...q, ...data } : q));
    setEditQuiz(null); ok('✓ Quiz modifié');
  }

  async function deleteQuiz(quiz) {
    const hasQ = questions.some(q => q.quizId === quiz.id);
    if (hasQ) { ok('⚠️ Supprime d\'abord les questions liées ou délie-les'); return; }
    await deleteDoc(doc(db, 'quizzes', quiz.id));
    setQuizzes(p => p.filter(q => q.id !== quiz.id));
    setConfirmDel(null); ok('✓ Quiz supprimé');
  }

  function parseCSVQuiz(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const rows = parseCSV(ev.target.result)
        .filter(p => !p[0].trim().toLowerCase().startsWith('catid') && p.length >= 4)
        .map(p => ({ catId: p[0].trim(), themeId: p[1].trim(), name: p[2].trim(), diff: p[3].trim() }));
      setCsvQuizRows(rows);
    };
    r.readAsText(file);
  }

  async function importCSVQuiz() {
    let n = 0;
    for (const row of csvQuizRows) {
      const ref = await addDoc(collection(db, 'quizzes'), { ...row, createdAt: serverTimestamp() });
      setQuizzes(p => [...p, { id: ref.id, ...row }]);
      n++;
    }
    setCsvQuizRows([]); ok(`✓ ${n} quiz importés`);
  }

  // ── Liaison questions → quiz ──────────────────────────────────────────────────
  const unlinkedQuestions = questions.filter(q => !q.quizId);
  const linkFilteredQ = unlinkedQuestions.filter(q => {
    if (linkFilter.cat   && q.category !== linkFilter.cat)   return false;
    if (linkFilter.theme && q.theme     !== linkFilter.theme) return false;
    if (linkFilter.diff  && q.diff      !== linkFilter.diff)  return false;
    return true;
  });

  function toggleLinkSelect(id) {
    setLinkSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function linkQuestionsToQuiz() {
    if (!linkQuizId || linkSelected.length === 0) { ok('⚠️ Choisis un quiz et des questions'); return; }
    const quiz = quizzes.find(q => q.id === linkQuizId);
    if (!quiz) return;
    const batch = writeBatch(db);
    linkSelected.forEach(qId => {
      batch.update(doc(db, 'questions', qId), { quizId: linkQuizId, category: quiz.catId, theme: quiz.themeId });
    });
    await batch.commit();
    setQuestions(p => p.map(q =>
      linkSelected.includes(q.id) ? { ...q, quizId: linkQuizId, category: quiz.catId, theme: quiz.themeId } : q
    ));
    setLinkSelected([]);
    ok(`✓ ${linkSelected.length} questions liées au quiz "${quiz.name}"`);
  }

  async function duplicateQuiz(quiz) {
    const qs = questions.filter(q => q.quizId === quiz.id);
    const qd = { catId: quiz.catId, themeId: quiz.themeId, diff: quiz.diff, name: `${quiz.name} (copie)` };
    const ref = await addDoc(collection(db, 'quizzes'), { ...qd, createdAt: serverTimestamp() });
    const batch = writeBatch(db);
    const copies = qs.map(q => {
      const { id, ...data } = q;
      const nd = { ...data, quizId: ref.id, createdAt: serverTimestamp(), createdBy: user.uid };
      const r = doc(collection(db, 'questions'));
      batch.set(r, nd);
      return { id: r.id, ...nd };
    });
    if (copies.length) await batch.commit();
    setQuizzes(p => [...p, { id: ref.id, ...qd }]);
    setQuestions(p => [...p, ...copies]);
    ok(`✓ Quiz dupliqué (${copies.length} questions)`);
  }

  async function moveQuestion(q, quizId) {
    const quiz = quizzes.find(x => x.id === quizId);
    if (!quiz) return;
    const data = { quizId, category: quiz.catId, theme: quiz.themeId };
    await updateDoc(doc(db, 'questions', q.id), data);
    setQuestions(p => p.map(x => x.id === q.id ? { ...x, ...data } : x));
    ok(`✓ Question déplacée vers "${quiz.name}"`);
  }

  async function unlinkQuestion(q) {
    await updateDoc(doc(db, 'questions', q.id), { quizId: null });
    setQuestions(p => p.map(x => x.id === q.id ? { ...x, quizId: null } : x));
    ok('✓ Question déliée');
  }

  // ── Catégories ────────────────────────────────────────────────────────────────
  async function addCat(e) {
    e.preventDefault();
    if (!newCat.label.trim()) return;
    const ref = await addDoc(collection(db, 'categories'), { ...newCat, label: newCat.label.trim(), createdAt: serverTimestamp() });
    setCats(p => [...p, { id: ref.id, ...newCat }]);
    setNewCat({ label: '', icon: '📚' }); ok('✓ Catégorie ajoutée');
  }

  async function deleteCat(cat) {
    if (themes.some(t => t.catId === cat.id) || questions.some(q => q.category === cat.id)) { ok('⚠️ Supprime d\'abord les thèmes et questions'); return; }
    await deleteDoc(doc(db, 'categories', cat.id));
    setCats(p => p.filter(c => c.id !== cat.id)); ok('✓ Catégorie supprimée');
  }

  async function saveCat(id, data) {
    await updateDoc(doc(db, 'categories', id), data);
    setCats(p => p.map(c => c.id === id ? { ...c, ...data } : c));
    setEditItem(null); ok('✓ Modifié');
  }

  // ── Thèmes ────────────────────────────────────────────────────────────────────
  async function addTheme(e) {
    e.preventDefault();
    if (!newTheme.label.trim() || !newTheme.catId) return;
    const ref = await addDoc(collection(db, 'themes'), { ...newTheme, label: newTheme.label.trim(), createdAt: serverTimestamp() });
    setThemes(p => [...p, { id: ref.id, ...newTheme }]);
    setNewTheme({ catId: '', label: '', icon: '📖' }); ok('✓ Thème ajouté');
  }

  async function deleteTheme(theme) {
    if (quizzes.some(q => q.themeId === theme.id) || questions.some(q => q.theme === theme.id)) { ok('⚠️ Supprime d\'abord les quiz et questions'); return; }
    await deleteDoc(doc(db, 'themes', theme.id));
    setThemes(p => p.filter(t => t.id !== theme.id)); ok('✓ Thème supprimé');
  }

  async function saveTheme(id, data) {
    await updateDoc(doc(db, 'themes', id), data);
    setThemes(p => p.map(t => t.id === id ? { ...t, ...data } : t));
    setEditItem(null); ok('✓ Modifié');
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const allCats = [
    ...Object.values(CATEGORIES).map(c => ({ id: c.id, label: c.label, icon: c.icon })),
    ...cats,
  ];
  const allThemes = [
    ...Object.values(CATEGORIES).flatMap(cat =>
      Object.values(cat.themes).map(t => ({ id: t.id, label: t.label, icon: t.icon, catId: cat.id }))
    ),
    ...themes,
  ];

  // ── Quizzes groupés par catégorie → thème → difficulté ──────────────────────
  const DIFF_ORDER = { easy: 0, medium: 1, hard: 2 };

  const groupedQuizzes = allCats.map(cat => {
    const catThemes = allThemes.filter(t => t.catId === cat.id);
    const catQuizzes = quizzes.filter(q => q.catId === cat.id);
    if (catQuizzes.length === 0) return null;

    const themeGroups = catThemes.map(theme => {
      const themeQuizzes = catQuizzes
        .filter(q => q.themeId === theme.id)
        .sort((a, b) => (DIFF_ORDER[a.diff] ?? 3) - (DIFF_ORDER[b.diff] ?? 3));
      if (themeQuizzes.length === 0) return null;
      return { theme, quizzes: themeQuizzes };
    }).filter(Boolean);

    // Quiz sans thème connu
    const knownThemeIds = catThemes.map(t => t.id);
    const orphanQuizzes = catQuizzes
      .filter(q => !knownThemeIds.includes(q.themeId))
      .sort((a, b) => (DIFF_ORDER[a.diff] ?? 3) - (DIFF_ORDER[b.diff] ?? 3));
    if (orphanQuizzes.length > 0) {
      themeGroups.push({ theme: { id: '__other', label: 'Autres', icon: '📂' }, quizzes: orphanQuizzes });
    }

    return { cat, themeGroups };
  }).filter(Boolean);

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

  const unlinkedCount = questions.filter(q => !q.quizId).length;
  const TABS = [
    { id: 'quizzes',    label: `Quiz (${quizzes.length})` },
    { id: 'lier',       label: `Lier questions${unlinkedCount > 0 ? ` (${unlinkedCount} sans quiz)` : ''}` },
    { id: 'questions',  label: `Questions (${questions.length})` },
    { id: 'ajouter',    label: 'Ajouter' },
    { id: 'sante',      label: '🩺 Santé' },
    { id: 'reports',    label: `🚩 Signalements${reports.length ? ` (${reports.length})` : ''}` },
    { id: 'categories', label: 'Catégories' },
    { id: 'themes',     label: 'Thèmes' },
  ];

  const ctx = {
    user, isAdmin, showAuth, setShowAuth, tab, setTab, toast, setToast, questions, setQuestions, quizzes, setQuizzes, cats, setCats, themes, setThemes, reports, setReports, loading, setLoading, filterCat, setFilterCat, filterDiff, setFilterDiff, filterLinked, setFilterLinked, editQ, setEditQ, confirmDel, setConfirmDel, selectedQ, setSelectedQ, confirmBulk, setConfirmBulk, expandedQuiz, setExpandedQuiz, editQuiz, setEditQuiz, linkQuizId, setLinkQuizId, linkSelected, setLinkSelected, linkFilter, setLinkFilter, editItem, setEditItem, qCat, setQCat, qTheme, setQTheme, qDiff, setQDiff, qText, setQText, qOpts, setQOpts, qAns, setQAns, qExpl, setQExpl, newCat, setNewCat, newTheme, setNewTheme, newQuiz, setNewQuiz, csvRows, setCsvRows, qStats, setQStats, statsOk, setStatsOk, csvQuizRows, setCsvQuizRows, ok, filtered, toggleSelectQ, selectAllFiltered, deselectAll, addQuestion, deleteQuestion, bulkUpdateQuestions, deleteBulk, saveQuestion, importCSVQuestions, parseCSVQuestions, addQuiz, saveQuiz, deleteQuiz, parseCSVQuiz, importCSVQuiz, unlinkedQuestions, linkFilteredQ, toggleLinkSelect, linkQuestionsToQuiz, duplicateQuiz, moveQuestion, unlinkQuestion, addCat, deleteCat, saveCat, addTheme, deleteTheme, saveTheme, allCats, allThemes, DIFF_ORDER, groupedQuizzes, unlinkedCount, TABS,
  };

  return (
    <div className="page">
      <div className={`toast-success ${toast ? 'show' : ''}`}>{toast}</div>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1040, #2d1a5e)', border: '1px solid #4a3580', borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: "'Raleway', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 2 }}>⚙️ Admin Quizly</div>
        <div style={{ color: 'var(--muted)', fontSize: 12, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <span>{questions.length} questions</span>
          <span>{questions.filter(q => q.quizId).length} liées à un quiz</span>
          {unlinkedCount > 0 && <span style={{ color: 'var(--yellow)' }}>⚠️ {unlinkedCount} sans quiz</span>}
          <span>{quizzes.length} quiz</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '7px 12px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, flexShrink: 0,
            background: tab === t.id ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'var(--s2)',
            color: tab === t.id ? '#fff' : 'var(--muted)',
          }}>{t.label}</div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>Chargement…</div>}

      {/* ══ QUIZ ══ */}
      {!loading && tab === 'quizzes' && <TabQuiz ctx={ctx} />}

      {/* ══ LIER QUESTIONS → QUIZ ══ */}
      {!loading && tab === 'lier' && <TabLier ctx={ctx} />}

      {/* ══ QUESTIONS ══ */}
      {!loading && tab === 'questions' && <TabQuestions ctx={ctx} />}

      {/* ══ AJOUTER ══ */}
      {!loading && tab === 'ajouter' && <TabAjouter ctx={ctx} />}

      {/* ══ CATÉGORIES ══ */}
      {!loading && tab === 'sante' && (
        <AdminSante questions={questions} quizzes={quizzes} cats={cats} themes={themes} reports={reports}
          stats={qStats} statsOk={statsOk} onSaveQuestion={saveQuestion} onDeleteQuestion={deleteQuestion} onBulkUpdate={bulkUpdateQuestions} setTab={setTab} ok={ok} />
      )}

      {!loading && tab === 'reports' && (
        <AdminReports reports={reports} setReports={setReports} questions={questions} cats={cats} themes={themes} quizzes={quizzes}
          onSaveQuestion={saveQuestion} onDeleteQuestion={deleteQuestion} ok={ok} />
      )}

      {!loading && tab === 'categories' && <TabCategories ctx={ctx} />}

      {/* ══ THÈMES ══ */}
      {!loading && tab === 'themes' && <TabThemes ctx={ctx} />}
    </div>
  );
}
