import React from 'react';
import { CATEGORIES } from '../../data/quizData';
import { InlineEdit } from '../AdminForms';
import { S } from '../adminStyles';

export default function TabCategories({ ctx }) {
  const {
    cats, themes, editItem, setEditItem, newCat, setNewCat, addCat, deleteCat, saveCat,
  } = ctx;
  return (
    <>
        <div>
          <div style={S.secLabel}>Catégories intégrées</div>
          {Object.values(CATEGORIES).map(cat => (
            <div key={cat.id} style={S.card}>
              <div style={S.row}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{Object.keys(cat.themes).length} thèmes</div>
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
                  ? <InlineEdit data={editItem.data} fields={['icon', 'label']} onSave={d => saveCat(cat.id, d)} onCancel={() => setEditItem(null)} />
                  : <div style={S.row}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.label}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={S.iconBtn('var(--cyan)')} onClick={() => setEditItem({ id: cat.id, data: cat })}>✏️</button>
                      <button style={S.iconBtn('var(--pink)')} onClick={() => deleteCat(cat)}>×</button>
                    </div>
                  </div>
                }
              </div>
            ))}
          </>}
          <div style={S.divider} />
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>+ Nouvelle catégorie</div>
          <form onSubmit={addCat}>
            <div style={S.grid2}>
              <div><label style={S.label}>Icône</label><input style={S.input} value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} /></div>
              <div><label style={S.label}>Nom</label><input style={S.input} value={newCat.label} onChange={e => setNewCat({ ...newCat, label: e.target.value })} required /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" style={{ fontFamily: "'Bricolage Grotesque'", fontWeight: 700 }}>Ajouter</button>
          </form>
        </div>
    </>
  );
}
