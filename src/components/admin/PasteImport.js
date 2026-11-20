import React, { useState } from 'react';
import { S } from '../adminStyles';
import { normText, rowsFromCSVText, rowProblem, prepareRows } from '../../utils/csv';

const DIFFS = ['easy', 'medium', 'hard'];

// Import par copier-coller + aperçu ligne par ligne (ignorer / remplacer / modifier)
export default function PasteImport({ ctx }) {
  const { questions, csvRows, setCsvRows, allThemes, importCSVQuestions } = ctx;
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(-1);

  const analyse = () => {
    const rows = rowsFromCSVText(text);
    setCsvRows(prepareRows(rows, allThemes));
    setEditing(-1);
    if (rows.length) setText('');
  };
  const patch = (i, d) => setCsvRows(csvRows.map((r, k) => {
    if (k !== i) return r;
    const n = { ...r, ...d };
    n.problem = rowProblem(n, allThemes);
    if (n.problem) n.skip = true;
    return n;
  }));

  const existing = new Map(questions.map(q => [normText(q.text), q]));
  const seen = new Set();
  const info = csvRows.map(r => {
    if (r.problem) return { kind: 'err', label: '⛔ ' + r.problem };
    if (r.id || r.oldText) return { kind: 'fix', label: '🔁 corrige une question existante' };
    const k = normText(r.text);
    const ex = existing.get(k);
    if (ex) return { kind: 'dup', ex, label: '⚠️ déjà en base' };
    if (seen.has(k)) return { kind: 'dup2', label: '⚠️ en double dans ce lot' };
    seen.add(k);
    return { kind: 'new', label: '✅ nouvelle' };
  });
  const todo = csvRows.filter((r, i) => !r.skip && info[i].kind !== 'dup' && info[i].kind !== 'dup2').length;
  const nb = { new: 0, fix: 0, dup: 0, err: 0 };
  info.forEach(x => { nb[x.kind === 'dup2' ? 'dup' : x.kind]++; });

  const btn = { fontSize: 11, padding: '3px 8px', borderRadius: 8, border: '1px solid var(--s3)', background: 'var(--s1)', color: 'var(--fg, #fff)', cursor: 'pointer' };

  return (
    <>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Coller des questions</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
        Colle ici tes lignes (CSV, ou copiées depuis un tableur). Colonnes : <span style={{ fontFamily: 'monospace' }}>categorie, theme, difficulte, question, optA, optB, optC, optD, reponse (A-D ou 0-3), explication, quiz</span>. Tu vérifies ensuite chaque ligne avant d'importer.
      </div>
      <textarea data-testid="paste-area" style={{ ...S.input, minHeight: 110, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }}
        value={text} onChange={e => setText(e.target.value)} placeholder={'culture,geographie,easy,Capitale de la France ?,Paris,Lyon,Nice,Lille,A,Paris est la capitale.,Quiz Europe'} />
      <button type="button" data-testid="paste-go" className="btn btn-secondary btn-full" style={{ margin: '8px 0 14px' }} disabled={!text.trim()} onClick={analyse}>🔍 Analyser</button>

      {csvRows.length > 0 && (
        <div data-testid="paste-preview" style={{ background: 'var(--s2)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', marginBottom: 4 }}>{csvRows.length} questions détectées</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
            ✅ {nb.new} nouvelles · 🔁 {nb.fix} corrections · ⚠️ {nb.dup} doublons · ⛔ {nb.err} à corriger
          </div>
          {csvRows.map((r, i) => {
            const x = info[i];
            const off = r.skip || x.kind === 'dup' || x.kind === 'dup2';
            return (
              <div key={i} data-testid="paste-row" data-kind={x.kind} style={{ borderTop: '1px solid var(--s3)', padding: '8px 0', opacity: off && editing !== i ? 0.6 : 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.text || '(vide)'}</div>
                <div style={{ fontSize: 11, color: x.kind === 'err' ? 'var(--red)' : 'var(--muted)', margin: '2px 0 6px' }}>
                  {x.label}{r.skip && x.kind !== 'err' ? ' · ignorée' : ''} · {r.category}/{r.theme}/{r.diff}
                </div>
                {editing === i && (
                  <div style={{ display: 'grid', gap: 6, marginBottom: 6 }}>
                    <textarea style={{ ...S.input, minHeight: 50 }} value={r.text} onChange={e => patch(i, { text: e.target.value })} />
                    {r.options.map((o, k) => (
                      <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button type="button" onClick={() => patch(i, { answer: k })} style={{ ...btn, color: r.answer === k ? 'var(--cyan)' : 'var(--muted)' }}>{r.answer === k ? '✓' : 'ABCD'[k]}</button>
                        <input style={S.input} value={o} onChange={e => patch(i, { options: r.options.map((v, j) => j === k ? e.target.value : v) })} />
                      </div>
                    ))}
                    <input style={S.input} value={r.explanation} placeholder="Explication" onChange={e => patch(i, { explanation: e.target.value })} />
                    <div style={S.grid2}>
                      <select style={S.select} value={r.diff} onChange={e => patch(i, { diff: e.target.value })}>{DIFFS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                      <select style={S.select} value={`${r.category}/${r.theme}`} onChange={e => { const [c, t] = e.target.value.split('/'); patch(i, { category: c, theme: t }); }}>
                        {!allThemes.some(t => t.catId === r.category && t.id === r.theme) && <option value={`${r.category}/${r.theme}`}>{r.category}/{r.theme} (inconnu)</option>}
                        {allThemes.map(t => <option key={t.catId + t.id} value={`${t.catId}/${t.id}`}>{t.icon} {t.catId} / {t.label}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button type="button" data-testid="row-edit" style={btn} onClick={() => setEditing(editing === i ? -1 : i)}>{editing === i ? 'Fermer' : '✏️ Modifier'}</button>
                  {(x.kind === 'dup') && !r.id && <button type="button" data-testid="row-replace" style={btn} onClick={() => patch(i, { id: x.ex.id, skip: false })}>🔁 Remplacer l'existante</button>}
                  {x.kind !== 'err' && x.kind !== 'dup' && x.kind !== 'dup2' && (
                    <button type="button" data-testid="row-skip" style={btn} onClick={() => patch(i, { skip: !r.skip })}>{r.skip ? '↩︎ Réintégrer' : '🚫 Ignorer'}</button>
                  )}
                  {x.kind === 'fix' && r.id && !r.oldText && <button type="button" style={btn} onClick={() => patch(i, { id: '' })}>Ne plus remplacer</button>}
                </div>
              </div>
            );
          })}
          <button className="btn btn-primary btn-full" disabled={todo === 0} style={{ marginTop: 10, fontFamily: "'Bricolage Grotesque'", fontWeight: 700 }} onClick={importCSVQuestions}>
            Importer {todo} questions
          </button>
          <button type="button" className="btn btn-secondary btn-full" style={{ marginTop: 6 }} onClick={() => setCsvRows([])}>Tout annuler</button>
        </div>
      )}
    </>
  );
}
