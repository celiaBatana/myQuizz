import React from 'react';
import { CATEGORIES } from '../../data/quizData';
import { S } from '../adminStyles';
import { normText } from '../../utils/csv';

export default function TabAjouter({ ctx }) {
  const {
    questions, themes, qCat, setQCat, qTheme, setQTheme, qDiff, setQDiff, qText, setQText, qOpts, setQOpts, qAns, setQAns, qExpl, setQExpl, csvRows, addQuestion, importCSVQuestions, parseCSVQuestions, allCats, allThemes,
  } = ctx;
  return (
    <>
        <div>
          <form onSubmit={addQuestion}>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Catégorie</label>
                <select style={S.select} value={qCat} onChange={e => { setQCat(e.target.value); setQTheme(Object.keys(CATEGORIES[e.target.value]?.themes || {})[0] || ''); }}>
                  {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Thème</label>
                <select style={S.select} value={qTheme} onChange={e => setQTheme(e.target.value)}>
                  {allThemes.filter(t => t.catId === qCat).map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Difficulté</label>
              <select style={S.select} value={qDiff} onChange={e => setQDiff(e.target.value)}>
                <option value="easy">Facile (+5 XP)</option><option value="medium">Moyen (+10 XP)</option><option value="hard">Expert (+20 XP)</option>
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Question</label>
              <textarea style={{ ...S.input, minHeight: 64, resize: 'vertical' }} value={qText} onChange={e => setQText(e.target.value)} placeholder="Saisir la question..." required />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Options — ✓ pour la bonne réponse</label>
              <div style={S.grid2}>
                {qOpts.map((opt, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <input type="text" value={opt} onChange={e => { const o = [...qOpts]; o[i] = e.target.value; setQOpts(o); }}
                      placeholder={`Option ${['A', 'B', 'C', 'D'][i]}`}
                      style={{ ...S.input, paddingRight: 32, borderColor: qAns === i ? 'var(--cyan)' : 'var(--s3)' }} required />
                    <button type="button" onClick={() => setQAns(i)}
                      style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: 'var(--cyan)', opacity: qAns === i ? 1 : 0.3 }}>✓</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Explication</label>
              <input type="text" style={S.input} value={qExpl} onChange={e => setQExpl(e.target.value)} placeholder="Explication de la bonne réponse..." />
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Raleway'", fontWeight: 700 }}>Ajouter la question</button>
          </form>

          <div style={S.divider} />
          <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Import CSV questions</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, fontFamily: 'monospace', background: 'var(--s2)', borderRadius: 8, padding: '8px 10px' }}>
            categorie,theme,difficulte,question,optA,optB,optC,optD,reponse(0-3),explication,quiz (optionnel : nom du quiz, créé automatiquement s'il n'existe pas)
          </div>
          <div onClick={() => document.getElementById('csv-q-in').click()}
            style={{ border: '2px dashed var(--s3)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', marginBottom: 10 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--s3)'}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Glisse ton CSV de questions ici</div>
            <input id="csv-q-in" type="file" accept=".csv" style={{ display: 'none' }} onChange={parseCSVQuestions} />
          </div>
          {csvRows.length > 0 && (
            <div style={{ background: 'var(--s2)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', marginBottom: 8 }}>{csvRows.length} questions détectées</div>
              {(() => {
                const ex = new Set(questions.map(q => normText(q.text)));
                const n = csvRows.filter(r => ex.has(normText(r.text))).length;
                return n > 0 ? <div style={{ fontSize: 11, color: 'var(--yellow)', marginBottom: 8 }}>⚠️ {n} déjà en base : elles seront ignorées à l'import</div> : null;
              })()}
              {csvRows.slice(0, 3).map((q, i) => <div key={i} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>• {q.text?.slice(0, 60)}…</div>)}
              {csvRows.length > 3 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>+{csvRows.length - 3} autres</div>}
              <button className="btn btn-primary btn-full" style={{ marginTop: 10, fontFamily: "'Raleway'", fontWeight: 700 }} onClick={importCSVQuestions}>
                Importer {csvRows.length} questions
              </button>
            </div>
          )}
        </div>
    </>
  );
}
