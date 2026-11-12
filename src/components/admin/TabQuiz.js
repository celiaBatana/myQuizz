import React from 'react';
import { DIFF_LABELS } from '../../data/quizData';
import { QuestionForm, QuizForm } from '../AdminForms';
import { S } from '../adminStyles';

export default function TabQuiz({ ctx }) {
  const {
    setTab, questions, quizzes, cats, themes, editQ, setEditQ, confirmDel, setConfirmDel, expandedQuiz, setExpandedQuiz, editQuiz, setEditQuiz, newQuiz, setNewQuiz, csvQuizRows, saveQuestion, addQuiz, saveQuiz, deleteQuiz, parseCSVQuiz, importCSVQuiz, duplicateQuiz, moveQuestion, unlinkQuestion, allCats, allThemes, groupedQuizzes,
  } = ctx;
  return (
    <>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            {quizzes.length} quiz · {questions.filter(q => q.quizId).length} questions liées
          </div>

          {quizzes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--s1)', border: '1px solid var(--s2)', borderRadius: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Aucun quiz en base</div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>Importe le CSV des quiz ou crée-les manuellement ci-dessous.</p>
            </div>
          )}

          {/* Quiz groupés par catégorie → thème → difficulté */}
          {groupedQuizzes.map(({ cat, themeGroups }) => (
            <div key={cat.id} style={{ marginBottom: 20 }}>
              {/* Header catégorie */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 6, borderBottom: '1px solid var(--s2)' }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: 14 }}>{cat.label}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
                  {themeGroups.reduce((s, t) => s + t.quizzes.length, 0)} quiz
                </span>
              </div>

              {themeGroups.map(({ theme, quizzes: themeQuizzes }) => (
                <div key={theme.id} style={{ marginBottom: 12, paddingLeft: 8 }}>
                  {/* Header thème */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 14 }}>{theme.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{theme.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>({themeQuizzes.length})</span>
                  </div>

                  {/* Quiz du thème triés par difficulté */}
                  {themeQuizzes.map(quiz => {
                    const quizQ = questions.filter(q => q.quizId === quiz.id);
                    return (
                      <div key={quiz.id} style={{ ...S.card, padding: 0, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ padding: '10px 13px' }}>
                          {editQuiz?.id === quiz.id ? (
                            <QuizForm quiz={editQuiz} cats={allCats} themes={allThemes} onSave={data => saveQuiz(quiz, data)} onCancel={() => setEditQuiz(null)} />
                          ) : (
                            <div style={S.row}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                                  {/* Badge difficulté en premier */}
                                  <span style={S.tag(quiz.diff === 'easy' ? 'var(--cyan)' : quiz.diff === 'medium' ? 'var(--yellow)' : 'var(--pink)')}>
                                    {DIFF_LABELS[quiz.diff]}
                                  </span>
                                  <span style={{ fontWeight: 700, fontSize: 13 }}>{quiz.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <span style={{ fontSize: 11, color: quizQ.length === 0 ? 'var(--pink)' : quizQ.length < 10 ? 'var(--yellow)' : 'var(--cyan)' }}>
                                    {quizQ.length === 0 ? '⚠️ 0 question' : quizQ.length < 10 ? `⚠️ ${quizQ.length}/10 questions` : `✓ ${quizQ.length} questions`}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQuiz(quiz)}>✏️</button>
                                <button style={S.iconBtn('var(--muted)')} title="Dupliquer ce quiz" onClick={() => duplicateQuiz(quiz)}>📑</button>
                                <button style={{ ...S.iconBtn('var(--muted)'), fontSize: 13 }} onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}>
                                  {expandedQuiz === quiz.id ? '▲' : '▼'}
                                </button>
                                <button style={S.iconBtn('var(--muted)')}
                                  onMouseEnter={e => e.currentTarget.style.color = 'var(--pink)'}
                                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                                  onClick={() => setConfirmDel(confirmDel?.id === quiz.id ? null : quiz)}>×</button>
                              </div>
                            </div>
                          )}
                          {confirmDel?.id === quiz.id && (
                            <div style={S.confirm}>
                              <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>Supprimer ce quiz ?</p>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11, background: '#FF4D4D' }} onClick={() => deleteQuiz(quiz)}>Supprimer</button>
                                <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setConfirmDel(null)}>Annuler</button>
                              </div>
                            </div>
                          )}
                        </div>
                        {expandedQuiz === quiz.id && (
                          <div style={{ borderTop: '1px solid var(--s2)', background: 'rgba(0,0,0,.15)' }}>
                            {quizQ.length === 0
                              ? <div style={{ padding: '12px 13px', fontSize: 12, color: 'var(--pink)' }}>
                                  Aucune question liée.{' '}
                                  <span style={{ color: 'var(--cyan)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setTab('lier')}>
                                    Lier des questions →
                                  </span>
                                </div>
                              : quizQ.map((q, i) => (
                                <div key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', padding: '10px 13px' }}>
                                  {editQ?.id === q.id ? (
                                    <QuestionForm q={editQ} onSave={data => saveQuestion(q, data)} onCancel={() => setEditQ(null)} />
                                  ) : (
                                    <div style={S.row}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Q{i + 1}</div>
                                        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</div>
                                        <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 2 }}>✓ {q.options?.[q.answer]}</div>
                                      </div>
                                      <div style={{ display: 'flex', gap: 2 }}>
                                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQ(q)}>✏️</button>
                                        <select title="Déplacer vers un autre quiz" value="" onChange={e => e.target.value && moveQuestion(q, e.target.value)}
                                          style={{ ...S.select, width: 34, padding: '2px 0', fontSize: 11 }}>
                                          <option value="">➡️</option>
                                          {quizzes.filter(x => x.id !== quiz.id).sort((a, b) => (a.catId + a.themeId + a.name).localeCompare(b.catId + b.themeId + b.name))
                                            .map(x => <option key={x.id} value={x.id}>[{x.catId}/{x.themeId}] {x.name}</option>)}
                                        </select>
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
                </div>
              ))}
            </div>
          ))}

          {/* Import CSV quiz */}
          <div style={S.divider} />
          <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📥 Importer des quiz (CSV)</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, fontFamily: 'monospace', background: 'var(--s2)', borderRadius: 8, padding: '8px 10px' }}>
            catId,themeId,name,diff<br />culture,classique,Quiz #1 — Capitales du monde,easy
          </div>
          <div onClick={() => document.getElementById('csv-quiz-in').click()}
            style={{ border: '2px dashed var(--s3)', borderRadius: 12, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 10 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--s3)'}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>📂</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Clique pour importer un CSV de quiz</div>
            <input id="csv-quiz-in" type="file" accept=".csv" style={{ display: 'none' }} onChange={parseCSVQuiz} />
          </div>
          {csvQuizRows.length > 0 && (
            <div style={{ background: 'var(--s2)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', marginBottom: 8 }}>{csvQuizRows.length} quiz détectés</div>
              {csvQuizRows.slice(0, 4).map((q, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>• [{q.catId}/{q.themeId}] {q.name} — {DIFF_LABELS[q.diff] || q.diff}</div>
              ))}
              {csvQuizRows.length > 4 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>+{csvQuizRows.length - 4} autres</div>}
              <button className="btn btn-primary btn-full" style={{ marginTop: 10, fontFamily: "'Raleway'", fontWeight: 700 }} onClick={importCSVQuiz}>
                Importer {csvQuizRows.length} quiz
              </button>
            </div>
          )}

          {/* Ajouter quiz manuellement */}
          <div style={S.divider} />
          <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouveau quiz</div>
          <form onSubmit={addQuiz}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Catégorie</label>
                <select style={S.select} value={newQuiz.catId} onChange={e => setNewQuiz({ ...newQuiz, catId: e.target.value, themeId: '' })} required>
                  <option value="">Choisir</option>
                  {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Thème</label>
                <select style={S.select} value={newQuiz.themeId} onChange={e => setNewQuiz({ ...newQuiz, themeId: e.target.value })} required>
                  <option value="">Choisir</option>
                  {allThemes.filter(t => t.catId === newQuiz.catId).map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>Nom</label>
              <input style={S.input} value={newQuiz.name} onChange={e => setNewQuiz({ ...newQuiz, name: e.target.value })} placeholder="Quiz #1 — Mon thème" required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Difficulté</label>
              <select style={S.select} value={newQuiz.diff} onChange={e => setNewQuiz({ ...newQuiz, diff: e.target.value })}>
                <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway'", fontWeight: 700 }}>Ajouter le quiz</button>
          </form>
        </div>
    </>
  );
}
