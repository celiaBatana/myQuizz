import React from 'react';
import { CATEGORIES } from '../../data/quizData';
import { InlineEdit } from '../AdminForms';
import { S } from '../adminStyles';

export default function TabThemes({ ctx }) {
  const {
    themes, editItem, setEditItem, newTheme, setNewTheme, addTheme, deleteTheme, saveTheme, allCats,
  } = ctx;
  return (
    <>
        <div>
          <div style={S.secLabel}>Thèmes intégrés</div>
          {Object.values(CATEGORIES).flatMap(cat =>
            Object.values(cat.themes).map(theme => (
              <div key={`${cat.id}_${theme.id}`} style={S.card}>
                <div style={S.row}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{theme.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{theme.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{cat.icon} {cat.label}</div>
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
                  ? <InlineEdit data={editItem.data} fields={['icon', 'label']} onSave={d => saveTheme(theme.id, d)} onCancel={() => setEditItem(null)} />
                  : <div style={S.row}>
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
                }
              </div>
            ))}
          </>}
          <div style={S.divider} />
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouveau thème</div>
          <form onSubmit={addTheme}>
            <div style={{ marginBottom: 8 }}>
              <label style={S.label}>Catégorie parente</label>
              <select style={S.select} value={newTheme.catId} onChange={e => setNewTheme({ ...newTheme, catId: e.target.value })} required>
                <option value="">Choisir</option>
                {allCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>Icône</label><input style={S.input} value={newTheme.icon} onChange={e => setNewTheme({ ...newTheme, icon: e.target.value })} /></div>
              <div><label style={S.label}>Nom</label><input style={S.input} value={newTheme.label} onChange={e => setNewTheme({ ...newTheme, label: e.target.value })} required /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700 }}>Ajouter</button>
          </form>
        </div>
    </>
  );
}
