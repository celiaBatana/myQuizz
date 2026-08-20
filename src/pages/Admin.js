import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, DIFF_LABELS } from '../data/quizData';
import AuthModal from '../components/AuthModal';

const S = {
  card: { background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, padding: '11px 13px', marginBottom: 7 },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tag: (c) => ({ background: `${c}22`, color: c, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }),
  iconBtn: (c='var(--muted)') => ({ background: 'none', border: 'none', color: c, cursor: 'pointer', fontSize: 15, padding: '3px 7px', borderRadius: 5, transition: 'color .2s', fontFamily: 'inherit' }),
  input: { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'Josefin Sans, sans-serif', fontSize: 12, outline: 'none' },
  select: { width: '100%', background: 'var(--s2)', border: '1px solid var(--s3)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontFamily: 'Josefin Sans, sans-serif', fontSize: 12, outline: 'none' },
  label: { fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 4, display: 'block' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 },
  confirm: { background: 'rgba(255,77,77,.08)', border: '1px solid rgba(255,77,77,.3)', borderRadius: 10, padding: 12, marginTop: 8 },
  divider: { borderTop: '1px solid var(--s2)', margin: '16px 0' },
  secLabel: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', margin: '14px 0 8px' },
  chip: (active) => ({
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
    background: active ? 'var(--purple)' : 'var(--s2)', color: active ? '#fff' : 'var(--muted)',
    transition: 'all .15s',
  }),
};

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
  const [loading,   setLoading]   = useState(true);

  // UI questions
  const [filterCat,  setFilterCat]  = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [editQ,      setEditQ]      = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

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

  // CSV questions
  const [csvRows,     setCsvRows]     = useState([]);
  // CSV quiz
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
      setLoading(false);
    })();
  }, [user, isAdmin]);

  // ── Questions ────────────────────────────────────────────────────────────────
  const filtered = questions.filter(q => {
    if (filterCat  && q.category !== filterCat)  return false;
    if (filterDiff && q.diff     !== filterDiff) return false;
    return true;
  });

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
    setConfirmDel(null); ok('✓ Question supprimée');
  }

  async function saveQuestion(q, data) {
    await updateDoc(doc(db, 'questions', q.id), data);
    setQuestions(p => p.map(x => x.id === q.id ? { ...x, ...data } : x));
    setEditQ(null); ok('✓ Question modifiée');
  }

 async function importCSVQuestions() {
  let n = 0;
  let linked = 0;
  let notFound = [];
 
  for (const row of csvRows) {
    // Cherche le quiz correspondant : même catégorie + même thème + même difficulté
    const matchingQuiz = quizzes.find(q =>
      q.catId    === row.category &&
      q.themeId  === row.theme    &&
      q.diff     === row.diff
    );
 
    const questionData = {
      ...row,
      quizId:    matchingQuiz ? matchingQuiz.id    : null,
      category:  row.category,
      theme:     row.theme,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      active:    true,
    };
 
    const ref = await addDoc(collection(db, 'questions'), questionData);
    setQuestions(p => [...p, { id: ref.id, ...questionData }]);
    n++;
 
    if (matchingQuiz) {
      linked++;
    } else {
      // Garde une trace des questions non liées pour afficher un avertissement
      if (!notFound.find(x => x.category === row.category && x.theme === row.theme && x.diff === row.diff)) {
        notFound.push({ category: row.category, theme: row.theme, diff: row.diff });
      }
    }
  }
 
  setCsvRows([]);
 
  if (notFound.length > 0) {
    const details = notFound.map(x => `${x.category}/${x.theme}/${x.diff}`).join(', ');
    ok(`✓ ${n} questions importées · ${linked} liées automatiquement · ⚠️ ${n - linked} sans quiz (${details})`);
  } else {
    ok(`✓ ${n} questions importées et liées automatiquement à ${[...new Set(csvRows.map(r => r.category + '/' + r.theme))].length} quiz !`);
  }
}

  function parseCSVQuestions(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const rows = ev.target.result.split('\n')
        .filter(l => l.trim() && !l.startsWith('categorie'))
        .map(line => {
          const p = line.split(','); if (p.length < 8) return null;
          return {
            category: p[0].trim(), theme: p[1].trim(), diff: p[2].trim(),
            text: p[3].replace(/"/g,'').trim(),
            options: [p[4],p[5],p[6],p[7]].map(s => s?.trim()||''),
            answer: parseInt(p[8])||0,
            explanation: (p[9]||'').replace(/"/g,'').trim(),
          };
        }).filter(Boolean);
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
    setNewQuiz({ catId:'', themeId:'', name:'', diff:'medium' });
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
      const rows = ev.target.result.split('\n')
        .filter(l => l.trim() && !l.startsWith('catId'))
        .map(line => {
          const p = line.split(','); if (p.length < 4) return null;
          return { catId: p[0].trim(), themeId: p[1].trim(), name: p[2].replace(/"/g,'').trim(), diff: p[3].trim() };
        }).filter(Boolean);
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
      batch.update(doc(db, 'questions', qId), {
        quizId: linkQuizId,
        category: quiz.catId,
        theme: quiz.themeId,
      });
    });
    await batch.commit();
    setQuestions(p => p.map(q =>
      linkSelected.includes(q.id) ? { ...q, quizId: linkQuizId, category: quiz.catId, theme: quiz.themeId } : q
    ));
    setLinkSelected([]);
    ok(`✓ ${linkSelected.length} questions liées au quiz "${quiz.name}"`);
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
    setNewCat({ label:'', icon:'📚' }); ok('✓ Catégorie ajoutée');
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
    setNewTheme({ catId:'', label:'', icon:'📖' }); ok('✓ Thème ajouté');
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

  // ── Guards ────────────────────────────────────────────────────────────────────
  if (!user) return (
    <div className="page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <div style={{ textAlign:'center', padding:'40px 16px' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
        <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:20, fontWeight:800, marginBottom:8 }}>Accès restreint</div>
        <p style={{ color:'var(--muted)', fontSize:13, marginBottom:20 }}>Connecte-toi avec un compte admin.</p>
        <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Se connecter</button>
      </div>
    </div>
  );
  if (!isAdmin) return (
    <div className="page">
      <div style={{ textAlign:'center', padding:'40px 16px' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🚫</div>
        <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:20, fontWeight:800 }}>Accès refusé</div>
      </div>
    </div>
  );

  const unlinkedCount = questions.filter(q => !q.quizId).length;
  const TABS = [
    { id:'quizzes',   label:`Quiz (${quizzes.length})` },
    { id:'lier',      label:`Lier questions${unlinkedCount > 0 ? ` (${unlinkedCount} sans quiz)` : ''}` },
    { id:'questions', label:`Questions (${questions.length})` },
    { id:'ajouter',   label:'Ajouter' },
    { id:'categories',label:'Catégories' },
    { id:'themes',    label:'Thèmes' },
  ];

  return (
    <div className="page">
      <div className={`toast-success ${toast ? 'show' : ''}`}>{toast}</div>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, #1a1040, #2d1a5e)', border:'1px solid #4a3580', borderRadius:16, padding:16, marginBottom:14 }}>
        <div style={{ fontFamily:"'Raleway', sans-serif", fontSize:18, fontWeight:800, marginBottom:2 }}>⚙️ Admin Quizly</div>
        <div style={{ color:'var(--muted)', fontSize:12, display:'flex', gap:14, flexWrap:'wrap' }}>
          <span>{questions.length} questions</span>
          <span>{questions.filter(q=>q.quizId).length} liées à un quiz</span>
          {unlinkedCount > 0 && <span style={{ color:'var(--yellow)' }}>⚠️ {unlinkedCount} sans quiz</span>}
          <span>{quizzes.length} quiz</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:4, marginBottom:14 }}>
        {TABS.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'7px 12px', borderRadius:8, cursor:'pointer', whiteSpace:'nowrap', fontSize:11, fontWeight:600, flexShrink:0,
            background: tab===t.id ? 'linear-gradient(135deg, var(--purple), var(--pink))' : 'var(--s2)',
            color: tab===t.id ? '#fff' : 'var(--muted)',
          }}>{t.label}</div>
        ))}
      </div>

      {loading && <div style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>Chargement…</div>}

      {/* ══ QUIZ ══ */}
      {!loading && tab === 'quizzes' && (
        <div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>
            {quizzes.length} quiz · {questions.filter(q=>q.quizId).length} questions liées
          </div>

          {quizzes.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px 16px', background:'var(--s1)', border:'1px solid var(--s2)', borderRadius:12, marginBottom:14 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Aucun quiz en base</div>
              <p style={{ fontSize:11, color:'var(--muted)', marginBottom:12 }}>Importe le CSV des quiz ou crée-les manuellement ci-dessous.</p>
            </div>
          )}

          {quizzes.map(quiz => {
            const quizQ = questions.filter(q => q.quizId === quiz.id);
            return (
              <div key={quiz.id} style={{ ...S.card, padding:0, overflow:'hidden' }}>
                <div style={{ padding:'12px 13px' }}>
                  {editQuiz?.id === quiz.id ? (
                    <QuizForm quiz={editQuiz} cats={allCats} themes={allThemes} onSave={data => saveQuiz(quiz,data)} onCancel={() => setEditQuiz(null)} />
                  ) : (
                    <div style={S.row}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{quiz.name}</div>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                          <span style={S.tag('var(--purple)')}>{quiz.catId}</span>
                          {quiz.themeId && <span style={S.tag('var(--cyan)')}>{quiz.themeId}</span>}
                          <span style={S.tag(quiz.diff==='easy'?'var(--cyan)':quiz.diff==='medium'?'var(--yellow)':'var(--pink)')}>{DIFF_LABELS[quiz.diff]}</span>
                          <span style={{ fontSize:11, color: quizQ.length===0 ? 'var(--pink)' : 'var(--muted)' }}>
                            {quizQ.length===0 ? '⚠️ 0 question' : `${quizQ.length} questions`}
                          </span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQuiz(quiz)}>✏️</button>
                        <button style={{ ...S.iconBtn('var(--muted)'), fontSize:13 }} onClick={() => setExpandedQuiz(expandedQuiz===quiz.id ? null : quiz.id)}>
                          {expandedQuiz===quiz.id ? '▲' : '▼'}
                        </button>
                        <button style={S.iconBtn('var(--muted)')}
                          onMouseEnter={e => e.currentTarget.style.color='var(--pink)'}
                          onMouseLeave={e => e.currentTarget.style.color='var(--muted)'}
                          onClick={() => setConfirmDel(confirmDel?.id===quiz.id ? null : quiz)}>×</button>
                      </div>
                    </div>
                  )}
                  {confirmDel?.id === quiz.id && (
                    <div style={S.confirm}>
                      <p style={{ fontSize:11, color:'var(--pink)', marginBottom:8 }}>Supprimer ce quiz ?</p>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:11, background:'#FF4D4D' }} onClick={() => deleteQuiz(quiz)}>Supprimer</button>
                        <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:11 }} onClick={() => setConfirmDel(null)}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
                {expandedQuiz === quiz.id && (
                  <div style={{ borderTop:'1px solid var(--s2)', background:'rgba(0,0,0,.15)' }}>
                    {quizQ.length === 0
                      ? <div style={{ padding:'12px 13px', fontSize:12, color:'var(--pink)' }}>
                          Aucune question liée.{' '}
                          <span style={{ color:'var(--cyan)', cursor:'pointer', textDecoration:'underline' }} onClick={() => setTab('lier')}>
                            Lier des questions →
                          </span>
                        </div>
                      : quizQ.map((q, i) => (
                          <div key={q.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)', padding:'10px 13px' }}>
                            {editQ?.id === q.id ? (
                              <QuestionForm q={editQ} onSave={data => saveQuestion(q,data)} onCancel={() => setEditQ(null)} />
                            ) : (
                              <div style={S.row}>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:11, color:'var(--muted)', marginBottom:2 }}>Q{i+1}</div>
                                  <div style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{q.text}</div>
                                  <div style={{ fontSize:11, color:'var(--cyan)', marginTop:2 }}>✓ {q.options?.[q.answer]}</div>
                                </div>
                                <div style={{ display:'flex', gap:2 }}>
                                  <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQ(q)}>✏️</button>
                                  <button style={S.iconBtn('var(--muted)')} title="Délier" onClick={() => unlinkQuestion(q)}>⛓️</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
            );
          })}

          {/* Import CSV quiz */}
          <div style={S.divider} />
          <div style={{ fontFamily:"'Raleway', sans-serif", fontWeight:700, fontSize:14, marginBottom:8 }}>📥 Importer des quiz (CSV)</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:10, fontFamily:'monospace', background:'var(--s2)', borderRadius:8, padding:'8px 10px' }}>
            catId,themeId,name,diff<br/>culture,classique,Quiz #1 — Capitales du monde,easy
          </div>
          <div onClick={() => document.getElementById('csv-quiz-in').click()}
            style={{ border:'2px dashed var(--s3)', borderRadius:12, padding:20, textAlign:'center', cursor:'pointer', marginBottom:10 }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--purple)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--s3)'}
          >
            <div style={{ fontSize:24, marginBottom:4 }}>📂</div>
            <div style={{ fontSize:12, fontWeight:500 }}>Clique pour importer un CSV de quiz</div>
            <input id="csv-quiz-in" type="file" accept=".csv" style={{ display:'none' }} onChange={parseCSVQuiz} />
          </div>
          {csvQuizRows.length > 0 && (
            <div style={{ background:'var(--s2)', borderRadius:10, padding:12, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--cyan)', marginBottom:8 }}>{csvQuizRows.length} quiz détectés</div>
              {csvQuizRows.slice(0,4).map((q,i) => (
                <div key={i} style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>• [{q.catId}/{q.themeId}] {q.name} — {DIFF_LABELS[q.diff]||q.diff}</div>
              ))}
              {csvQuizRows.length > 4 && <div style={{ fontSize:11, color:'var(--muted)' }}>+{csvQuizRows.length-4} autres</div>}
              <button className="btn btn-primary btn-full" style={{ marginTop:10, fontFamily:"'Raleway'", fontWeight:700 }} onClick={importCSVQuiz}>
                Importer {csvQuizRows.length} quiz
              </button>
            </div>
          )}

          {/* Ajouter quiz manuellement */}
          <div style={S.divider} />
          <div style={{ fontFamily:"'Raleway', sans-serif", fontWeight:700, fontSize:14, marginBottom:12 }}>+ Nouveau quiz</div>
          <form onSubmit={addQuiz}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Catégorie</label>
                <select style={S.select} value={newQuiz.catId} onChange={e => setNewQuiz({...newQuiz, catId:e.target.value, themeId:''})} required>
                  <option value="">Choisir</option>
                  {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Thème</label>
                <select style={S.select} value={newQuiz.themeId} onChange={e => setNewQuiz({...newQuiz, themeId:e.target.value})} required>
                  <option value="">Choisir</option>
                  {allThemes.filter(t => t.catId===newQuiz.catId).map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:8 }}>
              <label style={S.label}>Nom</label>
              <input style={S.input} value={newQuiz.name} onChange={e => setNewQuiz({...newQuiz, name:e.target.value})} placeholder="Quiz #1 — Mon thème" required />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>Difficulté</label>
              <select style={S.select} value={newQuiz.diff} onChange={e => setNewQuiz({...newQuiz, diff:e.target.value})}>
                <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily:"'Raleway'", fontWeight:700 }}>Ajouter le quiz</button>
          </form>
        </div>
      )}

      {/* ══ LIER QUESTIONS → QUIZ ══ */}
      {!loading && tab === 'lier' && (
        <div>
          <div style={{ background:'rgba(155,109,255,.08)', border:'1px solid rgba(155,109,255,.3)', borderRadius:12, padding:14, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>🔗 Lier des questions à un quiz</div>
            <div style={{ fontSize:12, color:'var(--muted)' }}>
              Sélectionne un quiz cible, filtre les questions sans quiz, coche celles à lier, puis clique sur Lier.
            </div>
          </div>

          {/* Étape 1 — Choisir le quiz cible */}
          <div style={{ marginBottom:14 }}>
            <label style={{ ...S.label, fontSize:12, color:'var(--text)', fontWeight:700 }}>① Choisir le quiz cible</label>
            <select style={S.select} value={linkQuizId} onChange={e => { setLinkQuizId(e.target.value); setLinkSelected([]); }}>
              <option value="">Sélectionner un quiz…</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>[{q.catId}/{q.themeId}] {q.name} ({DIFF_LABELS[q.diff]})</option>
              ))}
            </select>
          </div>

          {/* Étape 2 — Filtrer les questions sans quiz */}
          <div style={{ marginBottom:10 }}>
            <label style={{ ...S.label, fontSize:12, color:'var(--text)', fontWeight:700 }}>
              ② Filtrer les questions sans quiz ({unlinkedCount} disponibles)
            </label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              <select style={{ ...S.select, width:'auto', flex:1 }} value={linkFilter.cat} onChange={e => setLinkFilter(p => ({...p, cat:e.target.value, theme:''}))}>
                <option value="">Toutes catégories</option>
                {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <select style={{ ...S.select, width:'auto', flex:1 }} value={linkFilter.diff} onChange={e => setLinkFilter(p => ({...p, diff:e.target.value}))}>
                <option value="">Toutes difficultés</option>
                <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              {allThemes.filter(t => !linkFilter.cat || t.catId===linkFilter.cat).map(t => (
                <button key={t.id} style={S.chip(linkFilter.theme===t.id)} onClick={() => setLinkFilter(p => ({...p, theme: p.theme===t.id ? '' : t.id}))}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Étape 3 — Sélectionner les questions */}
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <label style={{ ...S.label, fontSize:12, color:'var(--text)', fontWeight:700, margin:0 }}>
                ③ Sélectionner les questions ({linkSelected.length} sélectionnée(s))
              </label>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{ ...S.iconBtn('var(--cyan)'), fontSize:11, padding:'4px 8px', border:'1px solid rgba(61,255,208,.3)', borderRadius:6 }}
                  onClick={() => setLinkSelected(linkFilteredQ.map(q => q.id))}>
                  Tout sélectionner
                </button>
                <button style={{ ...S.iconBtn('var(--muted)'), fontSize:11, padding:'4px 8px', border:'1px solid var(--s2)', borderRadius:6 }}
                  onClick={() => setLinkSelected([])}>
                  Désélectionner
                </button>
              </div>
            </div>

            {linkFilteredQ.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px', color:'var(--muted)', fontSize:12 }}>
                {unlinkedCount === 0 ? '✅ Toutes les questions sont déjà liées à un quiz !' : 'Aucune question correspondant aux filtres.'}
              </div>
            ) : (
              <div style={{ maxHeight:360, overflowY:'auto', border:'1px solid var(--s2)', borderRadius:10 }}>
                {linkFilteredQ.map(q => {
                  const selected = linkSelected.includes(q.id);
                  return (
                    <div key={q.id} onClick={() => toggleLinkSelect(q.id)} style={{
                      padding:'10px 13px', borderBottom:'1px solid rgba(255,255,255,.04)',
                      cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                      background: selected ? 'rgba(155,109,255,.12)' : 'transparent',
                      transition:'background .15s',
                    }}>
                      <div style={{
                        width:18, height:18, borderRadius:4, border:`2px solid ${selected?'var(--purple)':'var(--s3)'}`,
                        background: selected?'var(--purple)':'transparent', flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff',
                      }}>{selected?'✓':''}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{q.text}</div>
                        <div style={{ display:'flex', gap:5, marginTop:2 }}>
                          <span style={S.tag('var(--purple)')}>{q.category}</span>
                          <span style={S.tag(q.diff==='easy'?'var(--cyan)':q.diff==='medium'?'var(--yellow)':'var(--pink)')}>{DIFF_LABELS[q.diff]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bouton lier */}
          <button
            className="btn btn-primary btn-full"
            style={{ fontFamily:"'Raleway'", fontWeight:700, opacity: (!linkQuizId||linkSelected.length===0)?0.5:1 }}
            onClick={linkQuestionsToQuiz}
            disabled={!linkQuizId || linkSelected.length===0}
          >
            🔗 Lier {linkSelected.length} question(s) au quiz sélectionné
          </button>
        </div>
      )}

      {/* ══ QUESTIONS ══ */}
      {!loading && tab === 'questions' && (
        <div>
          <div style={S.grid2}>
            <select style={S.select} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Toutes catégories</option>
              {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <select style={S.select} value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
              <option value="">Toutes difficultés</option>
              <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
            </select>
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>{filtered.length} question(s)</div>

          {filtered.slice(0,60).map(q => (
            <div key={q.id} style={S.card}>
              {editQ?.id === q.id ? (
                <QuestionForm q={editQ} onSave={data => saveQuestion(q,data)} onCancel={() => setEditQ(null)} />
              ) : (
                <>
                  <div style={S.row}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{q.text}</div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <span style={S.tag('var(--purple)')}>{q.category}</span>
                        <span style={S.tag(q.diff==='easy'?'var(--cyan)':q.diff==='medium'?'var(--yellow)':'var(--pink)')}>{DIFF_LABELS[q.diff]}</span>
                        {q.quizId
                          ? <span style={S.tag('var(--cyan)')}>lié</span>
                          : <span style={S.tag('var(--pink)')}>sans quiz</span>
                        }
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:2, flexShrink:0 }}>
                      <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQ(q)}>✏️</button>
                      {q.quizId && <button style={S.iconBtn('var(--muted)')} title="Délier" onClick={() => unlinkQuestion(q)}>⛓️</button>}
                      <button style={S.iconBtn('var(--muted)')}
                        onMouseEnter={e => e.currentTarget.style.color='var(--pink)'}
                        onMouseLeave={e => e.currentTarget.style.color='var(--muted)'}
                        onClick={() => setConfirmDel(confirmDel?.id===q.id ? null : q)}>×</button>
                    </div>
                  </div>
                  {confirmDel?.id === q.id && (
                    <div style={S.confirm}>
                      <p style={{ fontSize:11, color:'var(--pink)', marginBottom:8 }}>Supprimer cette question ?</p>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:11, background:'#FF4D4D' }} onClick={() => deleteQuestion(q)}>Supprimer</button>
                        <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:11 }} onClick={() => setConfirmDel(null)}>Annuler</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {filtered.length > 60 && <div style={{ textAlign:'center', color:'var(--muted)', fontSize:12, padding:12 }}>Affichage limité à 60 — utilise les filtres</div>}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'var(--muted)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
              <p style={{ fontSize:12 }}>Va dans <strong>Ajouter</strong> pour importer ton CSV.</p>
            </div>
          )}
        </div>
      )}

      {/* ══ AJOUTER ══ */}
      {!loading && tab === 'ajouter' && (
        <div>
          <form onSubmit={addQuestion}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Catégorie</label>
                <select style={S.select} value={qCat} onChange={e => { setQCat(e.target.value); setQTheme(Object.keys(CATEGORIES[e.target.value]?.themes||{})[0]||''); }}>
                  {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Thème</label>
                <select style={S.select} value={qTheme} onChange={e => setQTheme(e.target.value)}>
                  {allThemes.filter(t => t.catId===qCat).map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>Difficulté</label>
              <select style={S.select} value={qDiff} onChange={e => setQDiff(e.target.value)}>
                <option value="easy">Facile (+5 XP)</option><option value="medium">Moyen (+10 XP)</option><option value="hard">Expert (+20 XP)</option>
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>Question</label>
              <textarea style={{ ...S.input, minHeight:64, resize:'vertical' }} value={qText} onChange={e => setQText(e.target.value)} placeholder="Saisir la question..." required />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>Options — ✓ pour la bonne réponse</label>
              <div style={S.grid2}>
                {qOpts.map((opt,i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <input type="text" value={opt} onChange={e => { const o=[...qOpts]; o[i]=e.target.value; setQOpts(o); }}
                      placeholder={`Option ${['A','B','C','D'][i]}`}
                      style={{ ...S.input, paddingRight:32, borderColor:qAns===i?'var(--cyan)':'var(--s3)' }} required />
                    <button type="button" onClick={() => setQAns(i)}
                      style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', fontSize:12, cursor:'pointer', color:'var(--cyan)', opacity:qAns===i?1:0.3 }}>✓</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={S.label}>Explication</label>
              <input type="text" style={S.input} value={qExpl} onChange={e => setQExpl(e.target.value)} placeholder="Explication de la bonne réponse..." />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily:"'Raleway'", fontWeight:700 }}>Ajouter la question</button>
          </form>

          <div style={S.divider} />
          <div style={{ fontFamily:"'Raleway', sans-serif", fontWeight:700, fontSize:14, marginBottom:6 }}>Import CSV questions</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginBottom:12, fontFamily:'monospace', background:'var(--s2)', borderRadius:8, padding:'8px 10px' }}>
            categorie,theme,difficulte,question,optA,optB,optC,optD,reponse(0-3),explication
          </div>
          <div onClick={() => document.getElementById('csv-q-in').click()}
            style={{ border:'2px dashed var(--s3)', borderRadius:12, padding:24, textAlign:'center', cursor:'pointer', marginBottom:10 }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--purple)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--s3)'}
          >
            <div style={{ fontSize:28, marginBottom:6 }}>📂</div>
            <div style={{ fontSize:13, fontWeight:500 }}>Glisse ton CSV de questions ici</div>
            <input id="csv-q-in" type="file" accept=".csv" style={{ display:'none' }} onChange={parseCSVQuestions} />
          </div>
          {csvRows.length > 0 && (
            <div style={{ background:'var(--s2)', borderRadius:10, padding:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--cyan)', marginBottom:8 }}>{csvRows.length} questions détectées</div>
              {csvRows.slice(0,3).map((q,i) => <div key={i} style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>• {q.text?.slice(0,60)}…</div>)}
              {csvRows.length > 3 && <div style={{ fontSize:11, color:'var(--muted)' }}>+{csvRows.length-3} autres</div>}
              <button className="btn btn-primary btn-full" style={{ marginTop:10, fontFamily:"'Raleway'", fontWeight:700 }} onClick={importCSVQuestions}>
                Importer {csvRows.length} questions
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ CATÉGORIES ══ */}
      {!loading && tab === 'categories' && (
        <div>
          <div style={S.secLabel}>Catégories intégrées</div>
          {Object.values(CATEGORIES).map(cat => (
            <div key={cat.id} style={S.card}>
              <div style={S.row}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{cat.label}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{Object.keys(cat.themes).length} thèmes</div>
                  </div>
                </div>
                <span style={S.tag('var(--muted)')}>intégré</span>
              </div>
            </div>
          ))}
          {cats.length > 0 && <>
            <div style={S.secLabel}>Catégories Firebase</div>
            {cats.map(cat => (
              <div key={cat.id} style={S.card}>
                {editItem?.id === cat.id
                  ? <InlineEdit data={editItem.data} fields={['icon','label']} onSave={d => saveCat(cat.id,d)} onCancel={() => setEditItem(null)} />
                  : <div style={S.row}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:20 }}>{cat.icon}</span>
                        <div style={{ fontSize:13, fontWeight:600 }}>{cat.label}</div>
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditItem({ id:cat.id, data:cat })}>✏️</button>
                        <button style={S.iconBtn('var(--pink)')} onClick={() => deleteCat(cat)}>×</button>
                      </div>
                    </div>
                }
              </div>
            ))}
          </>}
          <div style={S.divider} />
          <div style={{ fontFamily:"'Raleway', sans-serif", fontWeight:700, fontSize:14, marginBottom:12 }}>+ Nouvelle catégorie</div>
          <form onSubmit={addCat}>
            <div style={S.grid2}>
              <div><label style={S.label}>Icône</label><input style={S.input} value={newCat.icon} onChange={e => setNewCat({...newCat,icon:e.target.value})} /></div>
              <div><label style={S.label}>Nom</label><input style={S.input} value={newCat.label} onChange={e => setNewCat({...newCat,label:e.target.value})} required /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily:"'Raleway'", fontWeight:700 }}>Ajouter</button>
          </form>
        </div>
      )}

      {/* ══ THÈMES ══ */}
      {!loading && tab === 'themes' && (
        <div>
          <div style={S.secLabel}>Thèmes intégrés</div>
          {Object.values(CATEGORIES).flatMap(cat =>
            Object.values(cat.themes).map(theme => (
              <div key={`${cat.id}_${theme.id}`} style={S.card}>
                <div style={S.row}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{theme.icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600 }}>{theme.label}</div>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>{cat.icon} {cat.label}</div>
                    </div>
                  </div>
                  <span style={S.tag('var(--muted)')}>intégré</span>
                </div>
              </div>
            ))
          )}
          {themes.length > 0 && <>
            <div style={S.secLabel}>Thèmes Firebase</div>
            {themes.map(theme => (
              <div key={theme.id} style={S.card}>
                {editItem?.id === theme.id
                  ? <InlineEdit data={editItem.data} fields={['icon','label']} onSave={d => saveTheme(theme.id,d)} onCancel={() => setEditItem(null)} />
                  : <div style={S.row}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:18 }}>{theme.icon}</span>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600 }}>{theme.label}</div>
                          <div style={{ fontSize:10, color:'var(--muted)' }}>cat: {theme.catId}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditItem({ id:theme.id, data:theme })}>✏️</button>
                        <button style={S.iconBtn('var(--pink)')} onClick={() => deleteTheme(theme)}>×</button>
                      </div>
                    </div>
                }
              </div>
            ))}
          </>}
          <div style={S.divider} />
          <div style={{ fontFamily:"'Raleway', sans-serif", fontWeight:700, fontSize:14, marginBottom:12 }}>+ Nouveau thème</div>
          <form onSubmit={addTheme}>
            <div style={{ marginBottom:8 }}>
              <label style={S.label}>Catégorie parente</label>
              <select style={S.select} value={newTheme.catId} onChange={e => setNewTheme({...newTheme,catId:e.target.value})} required>
                <option value="">Choisir</option>
                {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>Icône</label><input style={S.input} value={newTheme.icon} onChange={e => setNewTheme({...newTheme,icon:e.target.value})} /></div>
              <div><label style={S.label}>Nom</label><input style={S.input} value={newTheme.label} onChange={e => setNewTheme({...newTheme,label:e.target.value})} required /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily:"'Raleway'", fontWeight:700 }}>Ajouter</button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Formulaire édition question ───────────────────────────────────────────────
function QuestionForm({ q, onSave, onCancel }) {
  const [text, setText] = useState(q.text);
  const [opts, setOpts] = useState([...q.options]);
  const [ans,  setAns]  = useState(q.answer);
  const [expl, setExpl] = useState(q.explanation||'');
  const [diff, setDiff] = useState(q.diff);
  const inp = { width:'100%', background:'var(--s2)', border:'1px solid var(--purple)', borderRadius:8, padding:'7px 10px', color:'var(--text)', fontFamily:'Josefin Sans', fontSize:12, outline:'none', marginBottom:7 };
  return (
    <div>
      <textarea style={{ ...inp, minHeight:56, resize:'vertical' }} value={text} onChange={e => setText(e.target.value)} />
      <select style={inp} value={diff} onChange={e => setDiff(e.target.value)}>
        <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
      </select>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:7 }}>
        {opts.map((o,i) => (
          <div key={i} style={{ position:'relative' }}>
            <input value={o} onChange={e => { const a=[...opts]; a[i]=e.target.value; setOpts(a); }}
              style={{ ...inp, marginBottom:0, paddingRight:28, borderColor:ans===i?'var(--cyan)':'var(--purple)' }} />
            <button type="button" onClick={() => setAns(i)} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', fontSize:11, cursor:'pointer', color:'var(--cyan)', opacity:ans===i?1:0.3 }}>✓</button>
          </div>
        ))}
      </div>
      <input style={inp} value={expl} onChange={e => setExpl(e.target.value)} placeholder="Explication..." />
      <div style={{ display:'flex', gap:6 }}>
        <button className="btn btn-primary" style={{ padding:'6px 14px', fontSize:12 }} onClick={() => onSave({ text, options:opts, answer:ans, explanation:expl, diff })}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding:'6px 14px', fontSize:12 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Formulaire édition quiz ───────────────────────────────────────────────────
function QuizForm({ quiz, cats, themes, onSave, onCancel }) {
  const [name,    setName]    = useState(quiz.name);
  const [diff,    setDiff]    = useState(quiz.diff);
  const [catId,   setCatId]   = useState(quiz.catId);
  const [themeId, setThemeId] = useState(quiz.themeId);
  const inp = { width:'100%', background:'var(--s2)', border:'1px solid var(--purple)', borderRadius:8, padding:'7px 10px', color:'var(--text)', fontFamily:'Josefin Sans', fontSize:12, outline:'none', marginBottom:7 };
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        <select style={inp} value={catId} onChange={e => { setCatId(e.target.value); setThemeId(''); }}>
          {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={inp} value={themeId} onChange={e => setThemeId(e.target.value)}>
          <option value="">Thème</option>
          {themes.filter(t => t.catId===catId).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Nom du quiz" />
      <select style={inp} value={diff} onChange={e => setDiff(e.target.value)}>
        <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
      </select>
      <div style={{ display:'flex', gap:6 }}>
        <button className="btn btn-primary" style={{ padding:'6px 14px', fontSize:12 }} onClick={() => onSave({ name, diff, catId, themeId })}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding:'6px 14px', fontSize:12 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── Édition inline ────────────────────────────────────────────────────────────
function InlineEdit({ data, fields, onSave, onCancel }) {
  const [form, setForm] = useState({ ...data });
  const inp = { width:'100%', background:'var(--s2)', border:'1px solid var(--purple)', borderRadius:8, padding:'7px 10px', color:'var(--text)', fontFamily:'Josefin Sans', fontSize:12, outline:'none', marginBottom:6 };
  return (
    <div>
      {fields.map(f => <input key={f} style={inp} value={form[f]||''} onChange={e => setForm({...form,[f]:e.target.value})} placeholder={f} />)}
      <div style={{ display:'flex', gap:6 }}>
        <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:11 }} onClick={() => onSave(form)}>Enregistrer</button>
        <button className="btn btn-secondary" style={{ padding:'5px 12px', fontSize:11 }} onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}
