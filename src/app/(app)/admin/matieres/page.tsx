'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminMatieres, useCreateMatiere, useUpdateMatiere, useDeleteMatiere } from '@/hooks/use-query-api';

const CATEGORIES = [
  'Mathématiques',
  'Sciences',
  'Lettres',
  'Langues',
  'Sciences Humaines',
  'Arts',
  'Technologie',
  'Sport',
  'Religion',
  'Autre',
];

type MatiereItem = Record<string, unknown>;

export default function MatieresPage() {
  const { data } = useAdminMatieres();
  const matieres: MatiereItem[] = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);

  const createMatiere = useCreateMatiere();
  const updateMatiere = useUpdateMatiere();
  const deleteMatiere = useDeleteMatiere();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MatiereItem | null>(null);
  const [form, setForm] = useState({ libelle: '', code: '', categorie: '', description: '' });

  const filtered = matieres.filter((m) =>
    ((m.libelle ?? '') as string).toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditItem(null);
    setForm({ libelle: '', code: '', categorie: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (m: MatiereItem) => {
    setEditItem(m);
    setForm({
      libelle: (m.libelle ?? '') as string,
      code: (m.code ?? '') as string,
      categorie: (m.categorie ?? '') as string,
      description: (m.description ?? '') as string,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await updateMatiere.mutateAsync({ id: String(editItem.id), data: form });
      } else {
        await createMatiere.mutateAsync(form);
      }
      setShowModal(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (m: MatiereItem) => {
    if (!confirm(`Supprimer la matière "${m.libelle}" ?`)) return;
    try {
      await deleteMatiere.mutateAsync(String(m.id));
    } catch {
      // toast handled by hook
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Matières</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} matière(s)</div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Nouvelle matière
        </button>
      </div>

      {/* Search */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', width: 320 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une matière…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((m) => {
            const libelle = (m.libelle ?? '') as string;
            const code = (m.code ?? '') as string;
            const cat = (m.categorie ?? '') as string;
            const desc = (m.description ?? '') as string;
            return (
              <div key={String(m.id)} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{libelle}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{cat}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px' }}>{code}</span>
                  </div>
                </div>
                {desc && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.4 }}>{desc}</div>}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <button onClick={() => openEdit(m)} style={{ flex: 1, height: 30, border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(m)} disabled={deleteMatiere.isPending} style={{ width: 30, height: 30, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleteMatiere.isPending ? 0.5 : 1 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {editItem ? 'Modifier la matière' : 'Nouvelle matière'}
            </div>
            {[
              { label: 'Libellé', key: 'libelle', placeholder: 'Ex: Mathématiques', required: true },
              { label: 'Code', key: 'code', placeholder: 'Ex: MATH', required: true },
              { label: 'Description', key: 'description', placeholder: 'Brève description…', required: false },
            ].map(({ label, key, placeholder, required }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
                  {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
                </label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Catégorie</label>
              <select value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">— Sélectionner —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={createMatiere.isPending || updateMatiere.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (createMatiere.isPending || updateMatiere.isPending) ? 0.7 : 1 }}>
                {(createMatiere.isPending || updateMatiere.isPending) ? 'Enregistrement…' : (editItem ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
