import React from 'react';
import { DIFF_LABELS } from '../../data/quizData';
import { QuestionForm } from '../AdminForms';
import { S } from '../adminStyles';

export default function TabQuestions({ ctx }) {
  const {
    filterCat, setFilterCat, filterDiff, setFilterDiff, filterLinked, setFilterLinked, editQ, setEditQ, confirmDel, setConfirmDel, selectedQ, setSelectedQ, confirmBulk, setConfirmBulk, filtered, toggleSelectQ, selectAllFiltered, deselectAll, deleteQuestion, deleteBulk, saveQuestion, unlinkQuestion, allCats,
  } = ctx;
  return (
    <>
        <div>
          {/* Filtres */}
          <div style={S.grid2}>
            <select style={S.select} value={filterCat} onChange={e => { setFilterCat(e.target.value); setSelectedQ([]); }}>
              <option value="">Toutes catégories</option>
              {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <select style={S.select} value={filterDiff} onChange={e => { setFilterDiff(e.target.value); setSelectedQ([]); }}>
              <option value="">Toutes difficultés</option>
              <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <select style={S.select} value={filterLinked} onChange={e => { setFilterLinked(e.target.value); setSelectedQ([]); }}>
              <option value="">Toutes (liées + sans quiz)</option>
              <option value="linked">Liées à un quiz uniquement</option>
              <option value="unlinked">Sans quiz uniquement</option>
            </select>
          </div>

          {/* Barre sélection / suppression en masse */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {filtered.length} question(s)
              {selectedQ.length > 0 && <span style={{ color: 'var(--yellow)', fontWeight: 700, marginLeft: 8 }}>{selectedQ.length} sélectionnée(s)</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(61,255,208,.3)', background: 'none', color: 'var(--cyan)', cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={selectAllFiltered}
              >☑ Tout ({Math.min(filtered.length, 60)})</button>
              {selectedQ.length > 0 && (
                <>
                  <button
                    style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--s2)', background: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={deselectAll}
                  >✕ Désélectionner</button>
                  <button
                    style={{ fontSize: 11, padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, background: 'rgba(255,77,77,.15)', color: '#FF4D4D' }}
                    onClick={() => setConfirmBulk(true)}
                  >🗑 Supprimer ({selectedQ.length})</button>
                </>
              )}
            </div>
          </div>

          {/* Confirmation suppression en masse */}
          {confirmBulk && (
            <div style={{ ...S.confirm, marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--pink)', marginBottom: 10, fontWeight: 600 }}>
                ⚠️ Supprimer définitivement {selectedQ.length} question(s) ? Cette action est irréversible.
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12, background: '#FF4D4D' }} onClick={deleteBulk}>
                  Oui, supprimer {selectedQ.length}
                </button>
                <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setConfirmBulk(false)}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste */}
          {filtered.slice(0, 60).map(q => {
            const isSel = selectedQ.includes(q.id);
            return (
              <div key={q.id} style={{ ...S.card, borderColor: isSel ? 'var(--purple)' : 'var(--s2)', background: isSel ? 'rgba(155,109,255,.07)' : 'var(--s1)' }}>
                {editQ?.id === q.id ? (
                  <QuestionForm q={editQ} onSave={data => saveQuestion(q, data)} onCancel={() => setEditQ(null)} />
                ) : (
                  <>
                    <div style={S.row}>
                      {/* Checkbox */}
                      <div onClick={() => toggleSelectQ(q.id)} style={{ ...S.checkbox(isSel), marginRight: 6 }}>
                        {isSel ? '✓' : ''}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={S.tag('var(--purple)')}>{q.category}</span>
                          <span style={S.tag(q.diff === 'easy' ? 'var(--cyan)' : q.diff === 'medium' ? 'var(--yellow)' : 'var(--pink)')}>{DIFF_LABELS[q.diff]}</span>
                          {q.quizId ? <span style={S.tag('var(--cyan)')}>lié</span> : <span style={S.tag('var(--pink)')}>sans quiz</span>}
                          {q.theme && <span style={S.tag('var(--muted)')}>{q.theme}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                        <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditQ(q)}>✏️</button>
                        {q.quizId && <button style={S.iconBtn('var(--muted)')} title="Délier" onClick={() => unlinkQuestion(q)}>⛓️</button>}
                        <button style={S.iconBtn('var(--muted)')}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--pink)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
                          onClick={() => setConfirmDel(confirmDel?.id === q.id ? null : q)}>×</button>
                      </div>
                    </div>
                    {confirmDel?.id === q.id && (
                      <div style={S.confirm}>
                        <p style={{ fontSize: 11, color: 'var(--pink)', marginBottom: 8 }}>Supprimer cette question ?</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11, background: '#FF4D4D' }} onClick={() => deleteQuestion(q)}>Supprimer</button>
                          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => setConfirmDel(null)}>Annuler</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {filtered.length > 60 && <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 12 }}>Affichage limité à 60 — utilise les filtres</div>}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <p style={{ fontSize: 12 }}>Va dans <strong>Ajouter</strong> pour importer ton CSV.</p>
            </div>
          )}
        </div>
    </>
  );
}
