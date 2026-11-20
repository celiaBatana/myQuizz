import React, { useState } from 'react';
import { doc, setDoc, updateDoc, deleteDoc, addDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { S } from '../adminStyles';
import { getAdminTree, slugify, nextColor } from '../../data/taxonomy';
import { DIFF_LABELS } from '../../data/quizData';
import { normText } from '../../utils/csv';

const btn = { fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '1px solid var(--s3)', background: 'var(--s1)', color: 'var(--text)', cursor: 'pointer' };
const DIFFS = ['easy', 'medium', 'hard'];

const Row = ({ children, depth, k }) => (
  <div data-testid={k} style={{ marginLeft: depth * 14, borderLeft: depth ? '2px solid var(--s2)' : 'none', paddingLeft: depth ? 8 : 0, marginBottom: 6 }}>{children}</div>
);
const Arrows = ({ onMove, count, i }) => (
  <>
    <button type="button" style={btn} disabled={i === 0} onClick={() => onMove(i, -1)}>↑</button>
    <button type="button" style={btn} disabled={i === count - 1} onClick={() => onMove(i, 1)}>↓</button>
  </>
);
const EditBox = ({ edit, setEdit, onSave, withName }) => (
  <div style={{ display: 'flex', gap: 6, margin: '6px 0', flexWrap: 'wrap' }}>
    {!withName && <input style={{ ...S.input, width: 56 }} value={edit.icon} onChange={e => setEdit({ ...edit, icon: e.target.value })} />}
    <input data-testid="org-edit-input" style={{ ...S.input, flex: 1, minWidth: 140 }} value={withName ? edit.name : edit.label} onChange={e => setEdit({ ...edit, [withName ? 'name' : 'label']: e.target.value })} />
    {withName && <select style={{ ...S.select, width: 110 }} value={edit.diff} onChange={e => setEdit({ ...edit, diff: e.target.value })}>{DIFFS.map(d => <option key={d} value={d}>{DIFF_LABELS[d]}</option>)}</select>}
    <button type="button" data-testid="org-edit-save" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onSave}>OK</button>
    <button type="button" style={btn} onClick={() => setEdit(null)}>Annuler</button>
  </div>
);
const AddBox = ({ kind, add, setAdd, withIcon = true, onAdd }) => (
  <div style={{ display: 'flex', gap: 6, margin: '6px 0', flexWrap: 'wrap' }}>
    {withIcon && <input style={{ ...S.input, width: 56 }} value={add.icon} onChange={e => setAdd({ ...add, icon: e.target.value })} />}
    <input data-testid="org-add-input" autoFocus style={{ ...S.input, flex: 1, minWidth: 140 }} placeholder="Nom" value={kind === 'quiz' ? add.name : add.label} onChange={e => setAdd({ ...add, [kind === 'quiz' ? 'name' : 'label']: e.target.value })} />
    {kind === 'quiz' && <select style={{ ...S.select, width: 110 }} value={add.diff} onChange={e => setAdd({ ...add, diff: e.target.value })}>{DIFFS.map(d => <option key={d} value={d}>{DIFF_LABELS[d]}</option>)}</select>}
    <button type="button" data-testid="org-add-ok" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onAdd}>Ajouter</button>
    <button type="button" style={btn} onClick={() => setAdd(null)}>Annuler</button>
  </div>
);

// Arbre Catégorie → Thème → Quiz → Questions : renommer, déplacer, ajouter, masquer, réordonner
export default function TabOrganisation({ ctx }) {
  const { questions, setQuestions, quizzes, setQuizzes, setCats, setThemes, ok } = ctx;
  const tree = getAdminTree();
  const [open, setOpen] = useState({});          // clé → ouvert
  const [edit, setEdit] = useState(null);        // { key, label, icon, name, diff }
  const [add, setAdd] = useState(null);          // { kind, parent, label, icon, name, diff }
  const [ask, setAsk] = useState(null);          // { msg, run }
  const [moveTo, setMoveTo] = useState('');      // cible d'un déplacement de thème / quiz / questions
  const [sel, setSel] = useState([]);            // questions sélectionnées
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const tog = k => setOpen(o => ({ ...o, [k]: !o[k] }));
  const allThemes = tree.flatMap(c => c.themes.map(t => ({ ...t, catLabel: c.label })));

  async function run(fn, done) {
    setBusy(true);
    try { await fn(); if (done) ok(done); } catch (e) { console.error(e); ok('⚠️ Échec de l\'enregistrement (droits admin / règles ?)'); }
    setBusy(false); setAsk(null);
  }
  const col = kind => (kind === 'cat' ? 'categories' : 'themes');
  async function saveDoc(kind, id, data) {
    await setDoc(doc(db, col(kind), id), data, { merge: true });
    (kind === 'cat' ? setCats : setThemes)(p => (p.some(x => x.id === id) ? p.map(x => (x.id === id ? { ...x, ...data } : x)) : [...p, { id, ...data }]));
  }
  async function commit(ops) {
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(f => f(b));
      await b.commit();
    }
  }
  const uniqueId = (base, taken) => { let id = base, n = 2; while (taken.includes(id)) id = `${base}_${n++}`; return id; };

  // ── Catégories & thèmes ───────────────────────────────────────────────────────
  async function reorder(kind, siblings, i, dir) {
    const arr = [...siblings]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    for (let k = 0; k < arr.length; k++) if (arr[k].order !== (k + 1) * 10) await saveDoc(kind, arr[k].id, { order: (k + 1) * 10 });
  }
  async function createCat() {
    const label = add.label.trim(); if (!label) return;
    const id = uniqueId(slugify(label), tree.map(c => c.id));
    await saveDoc('cat', id, { label, icon: add.icon || '📚', color: nextColor(), createdAt: serverTimestamp() });
    setAdd(null);
  }
  async function createTheme() {
    const label = add.label.trim(); if (!label) return;
    const id = uniqueId(slugify(label), allThemes.map(t => t.id));
    await saveDoc('theme', id, { catId: add.parent, cardCat: add.parent, label, icon: add.icon || '📖', createdAt: serverTimestamp() });
    setAdd(null); setOpen(o => ({ ...o, ['c' + add.parent]: true }));
  }
  async function moveTheme(t, newCat) {
    const qz = quizzes.filter(z => z.themeId === t.id);
    const qs = questions.filter(q => q.theme === t.id);
    await saveDoc('theme', t.id, { catId: newCat, cardCat: t.cardCat });
    await commit([
      ...qz.map(z => b => b.update(doc(db, 'quizzes', z.id), { catId: newCat })),
      ...qs.map(q => b => b.update(doc(db, 'questions', q.id), { category: newCat })),
    ]);
    setQuizzes(p => p.map(z => (z.themeId === t.id ? { ...z, catId: newCat } : z)));
    setQuestions(p => p.map(q => (q.theme === t.id ? { ...q, category: newCat } : q)));
  }
  async function deleteTaxo(kind, item) {
    await deleteDoc(doc(db, col(kind), item.id));
    (kind === 'cat' ? setCats : setThemes)(p => p.filter(x => x.id !== item.id));
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────────
  async function createQuiz() {
    const name = add.name.trim(); if (!name) return;
    const t = allThemes.find(x => x.id === add.parent);
    const data = { catId: t.catId, themeId: t.id, name, diff: add.diff || 'medium' };
    const ref = await addDoc(collection(db, 'quizzes'), { ...data, createdAt: serverTimestamp() });
    setQuizzes(p => [...p, { id: ref.id, ...data }]);
    setAdd(null); setOpen(o => ({ ...o, ['t' + t.id]: true }));
  }
  async function saveQuiz(z, data) {
    await updateDoc(doc(db, 'quizzes', z.id), data);
    setQuizzes(p => p.map(x => (x.id === z.id ? { ...x, ...data } : x)));
  }
  async function moveQuiz(z, themeId) {
    const t = allThemes.find(x => x.id === themeId); if (!t) return;
    const qs = questions.filter(q => q.quizId === z.id);
    await saveQuiz(z, { catId: t.catId, themeId: t.id });
    await commit(qs.map(q => b => b.update(doc(db, 'questions', q.id), { category: t.catId, theme: t.id })));
    setQuestions(p => p.map(q => (q.quizId === z.id ? { ...q, category: t.catId, theme: t.id } : q)));
  }
  async function deleteQuiz(z) {
    await deleteDoc(doc(db, 'quizzes', z.id));
    setQuizzes(p => p.filter(x => x.id !== z.id));
  }

  // ── Questions ─────────────────────────────────────────────────────────────────
  async function moveQuestions(ids, quizId) {
    const z = quizzes.find(x => x.id === quizId); if (!z) return;
    const data = { quizId: z.id, category: z.catId, theme: z.themeId };
    await commit(ids.map(id => b => b.update(doc(db, 'questions', id), data)));
    setQuestions(p => p.map(q => (ids.includes(q.id) ? { ...q, ...data } : q)));
    setSel([]); setMoveTo('');
  }
  async function unlink(ids) {
    await commit(ids.map(id => b => b.update(doc(db, 'questions', id), { quizId: null })));
    setQuestions(p => p.map(q => (ids.includes(q.id) ? { ...q, quizId: null } : q)));
    setSel([]);
  }
  async function deleteQs(ids) {
    await commit(ids.map(id => b => b.delete(doc(db, 'questions', id))));
    setQuestions(p => p.filter(q => !ids.includes(q.id)));
    setSel([]);
  }

  const f = normText(filter);
  const matchTheme = (t, c) => !f || normText(`${t.label} ${c.label}`).includes(f) || quizzes.some(z => z.themeId === t.id && normText(z.name).includes(f));
  const themeOptions = (exceptTheme) => tree.map(c => (
    <optgroup key={c.id} label={`${c.icon} ${c.label}`}>
      {c.themes.filter(t => t.id !== exceptTheme).map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
    </optgroup>
  ));
  const quizOptions = tree.map(c => (
    <optgroup key={c.id} label={`${c.icon} ${c.label}`}>
      {c.themes.flatMap(t => quizzes.filter(z => z.themeId === t.id).map(z => <option key={z.id} value={z.id}>{t.label} › {z.name} ({DIFF_LABELS[z.diff] || z.diff})</option>))}
    </optgroup>
  ));

  return (
    <div data-testid="org-tab">
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
        Tout est ici : ouvre une catégorie pour voir ses thèmes, un thème pour ses quiz, un quiz pour ses questions. Les <strong>id</strong> en gris sont ceux à utiliser dans les CSV.
        Les éléments intégrés peuvent être renommés, déplacés ou masqués (pas supprimés) ; ceux que tu crées peuvent être supprimés quand ils sont vides.
      </div>
      <input style={{ ...S.input, marginBottom: 10 }} placeholder="🔎 Filtrer (thème, catégorie, quiz)…" value={filter} onChange={e => setFilter(e.target.value)} />

      {ask && (
        <div data-testid="org-confirm" style={S.confirm}>
          <div style={{ fontSize: 12, marginBottom: 8 }}>{ask.msg}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" data-testid="org-confirm-ok" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} disabled={busy} onClick={() => run(ask.run, ask.done)}>Confirmer</button>
            <button type="button" style={btn} onClick={() => setAsk(null)}>Annuler</button>
          </div>
        </div>
      )}

      {tree.map((c, ci) => {
        const catThemes = c.themes.filter(t => matchTheme(t, c));
        if (f && !catThemes.length && !normText(c.label).includes(f)) return null;
        const isOpen = open['c' + c.id] || (f && catThemes.length);
        const nQ = questions.filter(q => q.category === c.id).length;
        return (
          <Row key={c.id} depth={0} k={'org-cat-' + c.id}>
            <div style={{ ...S.card, opacity: c.hidden ? 0.55 : 1 }}>
              <div style={S.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }} onClick={() => tog('c' + c.id)}>
                  <span>{isOpen ? '▾' : '▸'}</span><span style={{ fontSize: 18 }}>{c.icon}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}{c.hidden ? ' · masquée' : ''}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{c.id} · {c.themes.length} thèmes · {nQ} questions</div></div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Arrows onMove={(i, d) => run(() => reorder('cat', tree, i, d))} count={tree.length} i={ci} />
                  <button type="button" data-testid="org-cat-edit" style={btn} onClick={() => setEdit({ key: 'c' + c.id, label: c.label, icon: c.icon })}>✏️</button>
                  <button type="button" style={btn} onClick={() => run(() => saveDoc('cat', c.id, { hidden: !c.hidden }), c.hidden ? '✓ Visible' : '✓ Masquée aux joueurs')}>{c.hidden ? '👁' : '🙈'}</button>
                  {!c.builtin && <button type="button" style={{ ...btn, color: 'var(--red)' }} onClick={() => (c.themes.length || nQ || quizzes.some(z => z.catId === c.id)) ? ok('⚠️ Vide d\'abord cette catégorie (thèmes, quiz, questions)') : setAsk({ msg: `Supprimer la catégorie « ${c.label} » ?`, run: () => deleteTaxo('cat', c), done: '✓ Supprimée' })}>🗑</button>}
                </div>
              </div>
              {edit?.key === 'c' + c.id && <EditBox edit={edit} setEdit={setEdit} onSave={() => run(() => saveDoc('cat', c.id, { label: edit.label.trim() || c.label, icon: edit.icon || c.icon }).then(() => setEdit(null)), '✓ Modifié')} />}
            </div>
            {isOpen && (
              <>
                {catThemes.map(t => {
                  const ti = c.themes.findIndex(x => x.id === t.id);
                  const tq = quizzes.filter(z => z.themeId === t.id);
                  const tN = questions.filter(q => q.theme === t.id).length;
                  const tOpen = open['t' + t.id] || (f && tq.some(z => normText(z.name).includes(f)));
                  return (
                    <Row key={t.id} depth={1} k={'org-theme-' + t.id}>
                      <div style={{ ...S.card, opacity: t.hidden ? 0.55 : 1 }}>
                        <div style={S.row}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }} onClick={() => tog('t' + t.id)}>
                            <span>{tOpen ? '▾' : '▸'}</span><span style={{ fontSize: 16 }}>{t.icon}</span>
                            <div><div style={{ fontSize: 12, fontWeight: 600 }}>{t.label}{t.hidden ? ' · masqué' : ''}</div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{t.id} · {tq.length} quiz · {tN} questions</div></div>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <Arrows onMove={(i, d) => run(() => reorder('theme', c.themes, i, d))} count={c.themes.length} i={ti} />
                            <button type="button" data-testid="org-theme-edit" style={btn} onClick={() => setEdit({ key: 't' + t.id, label: t.label, icon: t.icon })}>✏️</button>
                            <button type="button" style={btn} onClick={() => run(() => saveDoc('theme', t.id, { hidden: !t.hidden }), t.hidden ? '✓ Visible' : '✓ Masqué aux joueurs')}>{t.hidden ? '👁' : '🙈'}</button>
                            <button type="button" data-testid="org-theme-move" style={btn} onClick={() => { setMoveTo(''); setEdit({ key: 'mt' + t.id }); }}>➡️</button>
                            {!t.builtin && <button type="button" style={{ ...btn, color: 'var(--red)' }} onClick={() => (tq.length || tN) ? ok('⚠️ Vide d\'abord ce thème (quiz, questions)') : setAsk({ msg: `Supprimer le thème « ${t.label} » ?`, run: () => deleteTaxo('theme', t), done: '✓ Supprimé' })}>🗑</button>}
                          </div>
                        </div>
                        {edit?.key === 't' + t.id && <EditBox edit={edit} setEdit={setEdit} onSave={() => run(() => saveDoc('theme', t.id, { label: edit.label.trim() || t.label, icon: edit.icon || t.icon }).then(() => setEdit(null)), '✓ Modifié')} />}
                        {edit?.key === 'mt' + t.id && (
                          <div style={{ display: 'flex', gap: 6, margin: '6px 0', flexWrap: 'wrap' }}>
                            <select data-testid="org-theme-target" style={{ ...S.select, flex: 1 }} value={moveTo} onChange={e => setMoveTo(e.target.value)}>
                              <option value="">Déplacer vers la catégorie…</option>
                              {tree.filter(x => x.id !== c.id).map(x => <option key={x.id} value={x.id}>{x.icon} {x.label}</option>)}
                            </select>
                            <button type="button" data-testid="org-theme-move-ok" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} disabled={!moveTo}
                              onClick={() => { const dest = tree.find(x => x.id === moveTo); setEdit(null); setAsk({ msg: `Déplacer « ${t.label} » vers « ${dest.label} » ? ${tq.length} quiz et ${tN} questions suivent. Les cartes déjà gagnées sont conservées.`, run: () => moveTheme(t, moveTo), done: '✓ Thème déplacé' }); }}>Déplacer</button>
                            <button type="button" style={btn} onClick={() => setEdit(null)}>Annuler</button>
                          </div>
                        )}
                      </div>
                      {tOpen && (
                        <>
                          {tq.filter(z => !f || normText(z.name).includes(f) || normText(t.label).includes(f) || normText(c.label).includes(f)).map(z => {
                            const zq = questions.filter(q => q.quizId === z.id);
                            const zOpen = open['z' + z.id];
                            return (
                              <Row key={z.id} depth={2} k={'org-quiz-' + z.id}>
                                <div style={S.card}>
                                  <div style={S.row}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }} onClick={() => tog('z' + z.id)}>
                                      <span>{zOpen ? '▾' : '▸'}</span>
                                      <div><div style={{ fontSize: 12, fontWeight: 600 }}>{z.name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{DIFF_LABELS[z.diff] || z.diff} · {zq.length} questions</div></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                      <button type="button" data-testid="org-quiz-edit" style={btn} onClick={() => setEdit({ key: 'z' + z.id, name: z.name, diff: z.diff })}>✏️</button>
                                      <button type="button" data-testid="org-quiz-move" style={btn} onClick={() => { setMoveTo(''); setEdit({ key: 'mz' + z.id }); }}>➡️</button>
                                      <button type="button" style={{ ...btn, color: 'var(--red)' }} onClick={() => zq.length ? ok('⚠️ Déplace ou délie d\'abord ses questions') : setAsk({ msg: `Supprimer le quiz « ${z.name} » ?`, run: () => deleteQuiz(z), done: '✓ Quiz supprimé' })}>🗑</button>
                                    </div>
                                  </div>
                                  {edit?.key === 'z' + z.id && <EditBox withName edit={edit} setEdit={setEdit} onSave={() => run(() => saveQuiz(z, { name: edit.name.trim() || z.name, diff: edit.diff }).then(() => setEdit(null)), '✓ Modifié')} />}
                                  {edit?.key === 'mz' + z.id && (
                                    <div style={{ display: 'flex', gap: 6, margin: '6px 0', flexWrap: 'wrap' }}>
                                      <select data-testid="org-quiz-target" style={{ ...S.select, flex: 1 }} value={moveTo} onChange={e => setMoveTo(e.target.value)}>
                                        <option value="">Déplacer vers le thème…</option>{themeOptions(t.id)}
                                      </select>
                                      <button type="button" data-testid="org-quiz-move-ok" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} disabled={!moveTo} onClick={() => run(() => moveQuiz(z, moveTo).then(() => setEdit(null)), '✓ Quiz déplacé')}>Déplacer</button>
                                      <button type="button" style={btn} onClick={() => setEdit(null)}>Annuler</button>
                                    </div>
                                  )}
                                </div>
                                {zOpen && (
                                  <div style={{ marginLeft: 14, marginBottom: 6 }}>
                                    {zq.length === 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Aucune question.</div>}
                                    {zq.map(q => (
                                      <div key={q.id} data-testid="org-q" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, padding: '4px 0', borderBottom: '1px solid var(--s2)' }}>
                                        <input type="checkbox" checked={sel.includes(q.id)} onChange={() => setSel(s => (s.includes(q.id) ? s.filter(x => x !== q.id) : [...s, q.id]))} />
                                        <span style={{ flex: 1 }}>{q.text}</span>
                                      </div>
                                    ))}
                                    {sel.some(id => zq.some(q => q.id === id)) && (
                                      <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
                                        <select data-testid="org-q-target" style={{ ...S.select, flex: 1 }} value={moveTo} onChange={e => setMoveTo(e.target.value)}>
                                          <option value="">Déplacer la sélection vers le quiz…</option>{quizOptions}
                                        </select>
                                        <button type="button" data-testid="org-q-move" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} disabled={!moveTo} onClick={() => run(() => moveQuestions(sel, moveTo), `✓ ${sel.length} question(s) déplacée(s)`)}>Déplacer ({sel.length})</button>
                                        <button type="button" style={btn} onClick={() => run(() => unlink(sel), '✓ Déliée(s)')}>Délier</button>
                                        <button type="button" style={{ ...btn, color: 'var(--red)' }} onClick={() => setAsk({ msg: `Supprimer définitivement ${sel.length} question(s) ?`, run: () => deleteQs(sel), done: '✓ Supprimée(s)' })}>🗑</button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Row>
                            );
                          })}
                          {add?.kind === 'quiz' && add.parent === t.id
                            ? <Row depth={2}><AddBox kind="quiz" withIcon={false} add={add} setAdd={setAdd} onAdd={() => run(createQuiz, '✓ Ajouté')} /></Row>
                            : <Row depth={2}><button type="button" data-testid="org-add-quiz" style={btn} onClick={() => setAdd({ kind: 'quiz', parent: t.id, name: '', diff: 'medium' })}>+ Quiz</button></Row>}
                        </>
                      )}
                    </Row>
                  );
                })}
                {add?.kind === 'theme' && add.parent === c.id
                  ? <Row depth={1}><AddBox kind="theme" add={add} setAdd={setAdd} onAdd={() => run(createTheme, '✓ Ajouté')} /></Row>
                  : <Row depth={1}><button type="button" data-testid="org-add-theme" style={btn} onClick={() => setAdd({ kind: 'theme', parent: c.id, label: '', icon: '📖' })}>+ Thème</button></Row>}
              </>
            )}
          </Row>
        );
      })}
      {add?.kind === 'cat'
        ? <AddBox kind="cat" add={add} setAdd={setAdd} onAdd={() => run(createCat, '✓ Ajouté')} />
        : <button type="button" data-testid="org-add-cat" className="btn btn-secondary btn-full" style={{ marginTop: 8 }} onClick={() => setAdd({ kind: 'cat', label: '', icon: '📚' })}>+ Nouvelle catégorie</button>}
    </div>
  );
}
