import React from 'react';
import { DIFF_LABELS } from '../../data/quizData';
import { S } from '../adminStyles';

export default function TabLier({ ctx }) {
  const {
    questions, quizzes, linkQuizId, setLinkQuizId, linkSelected, setLinkSelected, linkFilter, setLinkFilter, linkFilteredQ, toggleLinkSelect, linkQuestionsToQuiz, allCats, allThemes, unlinkedCount,
  } = ctx;
  return (
    <>
        <div>
          <div style={{ background: 'rgba(127,176,122,.08)', border: '1px solid rgba(127,176,122,.3)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🔗 Lier des questions à un quiz</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Sélectionne un quiz cible, filtre les questions sans quiz, coche celles à lier, puis clique sur Lier.
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ ...S.label, fontSize: 12, color: 'var(--text)', fontWeight: 700 }}>① Choisir le quiz cible</label>
            <select style={S.select} value={linkQuizId} onChange={e => { setLinkQuizId(e.target.value); setLinkSelected([]); }}>
              <option value="">Sélectionner un quiz…</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>[{q.catId}/{q.themeId}] {q.name} ({DIFF_LABELS[q.diff]})</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ ...S.label, fontSize: 12, color: 'var(--text)', fontWeight: 700 }}>
              ② Filtrer les questions sans quiz ({unlinkedCount} disponibles)
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <select style={{ ...S.select, width: 'auto', flex: 1 }} value={linkFilter.cat} onChange={e => setLinkFilter(p => ({ ...p, cat: e.target.value, theme: '' }))}>
                <option value="">Toutes catégories</option>
                {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <select style={{ ...S.select, width: 'auto', flex: 1 }} value={linkFilter.diff} onChange={e => setLinkFilter(p => ({ ...p, diff: e.target.value }))}>
                <option value="">Toutes difficultés</option>
                <option value="easy">Facile</option><option value="medium">Moyen</option><option value="hard">Expert</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {allThemes.filter(t => !linkFilter.cat || t.catId === linkFilter.cat).map(t => (
                <button key={t.id} style={S.chip(linkFilter.theme === t.id)} onClick={() => setLinkFilter(p => ({ ...p, theme: p.theme === t.id ? '' : t.id }))}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...S.label, fontSize: 12, color: 'var(--text)', fontWeight: 700, margin: 0 }}>
                ③ Sélectionner les questions ({linkSelected.length} sélectionnée(s))
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...S.iconBtn('var(--cyan)'), fontSize: 11, padding: '4px 8px', border: '1px solid rgba(127,200,192,.3)', borderRadius: 6 }}
                  onClick={() => setLinkSelected(linkFilteredQ.map(q => q.id))}>
                  Tout sélectionner
                </button>
                <button style={{ ...S.iconBtn('var(--muted)'), fontSize: 11, padding: '4px 8px', border: '1px solid var(--s2)', borderRadius: 6 }}
                  onClick={() => setLinkSelected([])}>
                  Désélectionner
                </button>
              </div>
            </div>
            {linkFilteredQ.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: 12 }}>
                {unlinkedCount === 0 ? '✅ Toutes les questions sont déjà liées !' : 'Aucune question correspondant aux filtres.'}
              </div>
            ) : (
              <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid var(--s2)', borderRadius: 10 }}>
                {linkFilteredQ.map(q => {
                  const sel = linkSelected.includes(q.id);
                  return (
                    <div key={q.id} onClick={() => toggleLinkSelect(q.id)} style={{
                      padding: '10px 13px', borderBottom: '1px solid rgba(255,255,255,.04)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      background: sel ? 'rgba(127,176,122,.12)' : 'transparent', transition: 'background .15s',
                    }}>
                      <div style={S.checkbox(sel)}>{sel ? '✓' : ''}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text}</div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                          <span style={S.tag('var(--purple)')}>{q.category}</span>
                          <span style={S.tag(q.diff === 'easy' ? 'var(--cyan)' : q.diff === 'medium' ? 'var(--amber)' : 'var(--pink)')}>{DIFF_LABELS[q.diff]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-full"
            style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700, opacity: (!linkQuizId || linkSelected.length === 0) ? 0.5 : 1 }}
            onClick={linkQuestionsToQuiz} disabled={!linkQuizId || linkSelected.length === 0}
          >
            🔗 Lier {linkSelected.length} question(s) au quiz sélectionné
          </button>
        </div>
    </>
  );
}
