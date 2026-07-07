'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminClasses } from '@/hooks/use-query-api';

const STATIC_COURS = [
  { id: 'co1', titre: 'Algèbre linéaire — Chapitre 3', classeId: 'cl1', classeNom: '3ème A', enseignantNom: 'M. Sall', dateDebut: '2026-01-10', dateFin: '2026-01-20', heures: 4 },
  { id: 'co2', titre: 'La Révolution française', classeId: 'cl2', classeNom: '4ème B', enseignantNom: 'M. Ndiaye', dateDebut: '2026-01-12', dateFin: '2026-01-22', heures: 3 },
  { id: 'co3', titre: 'Les fonctions en Python', classeId: 'cl3', classeNom: 'Terminale S', enseignantNom: 'M. Diallo', dateDebut: '2026-01-08', dateFin: '2026-01-18', heures: 6 },
  { id: 'co4', titre: 'Grammaire — Le subjonctif', classeId: 'cl1', classeNom: '3ème A', enseignantNom: 'Mme Diop', dateDebut: '2026-01-15', dateFin: '2026-01-25', heures: 2 },
  { id: 'co5', titre: 'Mécanique des fluides', classeId: 'cl4', classeNom: '1ère S', enseignantNom: 'M. Bâ', dateDebut: '2026-01-11', dateFin: '2026-01-21', heures: 5 },
  { id: 'co6', titre: 'Biologie cellulaire', classeId: 'cl2', classeNom: '4ème B', enseignantNom: 'Mme Fall', dateDebut: '2026-01-14', dateFin: '2026-01-24', heures: 3 },
];

const STATIC_CLASSES = [
  { id: 'cl1', nom: '3ème A' },
  { id: 'cl2', nom: '4ème B' },
  { id: 'cl3', nom: 'Terminale S' },
  { id: 'cl4', nom: '1ère S' },
];

type CoursItem = Record<string, unknown>;

export default function CoursPage() {
  const { data: classesData } = useAdminClasses();
  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.content ?? classesData?.data ?? []);
  const classes = rawClasses.length > 0 ? rawClasses : STATIC_CLASSES;

  const [cours] = useState(STATIC_COURS);
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CoursItem | null>(null);
  const [form, setForm] = useState({ titre: '', classeId: '', enseignantNom: '', dateDebut: '', dateFin: '', heures: '' });
  const [saving, setSaving] = useState(false);

  const filtered = cours.filter((c) => {
    const matchSearch = (c.titre as string).toLowerCase().includes(search.toLowerCase()) || (c.enseignantNom as string).toLowerCase().includes(search.toLowerCase());
    const matchClasse = !filterClasse || c.classeId === filterClasse;
    return matchSearch && matchClasse;
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ titre: '', classeId: '', enseignantNom: '', dateDebut: '', dateFin: '', heures: '' });
    setShowModal(true);
  };

  const openEdit = (c: CoursItem) => {
    setEditItem(c);
    setForm({
      titre: (c.titre ?? '') as string,
      classeId: (c.classeId ?? '') as string,
      enseignantNom: (c.enseignantNom ?? '') as string,
      dateDebut: (c.dateDebut ?? '') as string,
      dateFin: (c.dateFin ?? '') as string,
      heures: String(c.heures ?? ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titre || !form.classeId) { toast.error('Titre et classe sont obligatoires'); return; }
    setSaving(true);
    setTimeout(() => {
      toast.success(editItem ? 'Cours modifié' : 'Cours créé');
      setShowModal(false);
      setSaving(false);
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Cours</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} cours</div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Nouveau cours
        </button>
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 340 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un cours ou enseignant…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Toutes les classes</option>
          {(classes as Record<string, unknown>[]).map((c) => (
            <option key={String(c.id)} value={String(c.id)}>{String(c.nom ?? '')}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 110px 110px 60px 80px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
            {['Titre', 'Classe', 'Enseignant', 'Début', 'Fin', 'Heures', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>Aucun cours trouvé</div>
          )}
          {filtered.map((c, idx) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 110px 110px 60px 80px', padding: '11px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre as string}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', display: 'inline-block' }}>{c.classeNom as string}</span>
              <span style={{ fontSize: 12, color: '#475569' }}>{c.enseignantNom as string}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{(c.dateDebut as string).split('-').reverse().join('/')}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{(c.dateFin as string).split('-').reverse().join('/')}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{c.heures as number}h</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(c)} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                </button>
                <button onClick={() => toast.error('Suppression désactivée')} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 500, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {editItem ? 'Modifier le cours' : 'Nouveau cours'}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Titre du cours</label>
              <input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} placeholder="Ex: Algèbre linéaire — Chapitre 3" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Classe</label>
              <select value={form.classeId} onChange={(e) => setForm((f) => ({ ...f, classeId: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Sélectionner une classe…</option>
                {(classes as Record<string, unknown>[]).map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>{String(c.nom ?? '')}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Enseignant</label>
              <input value={form.enseignantNom} onChange={(e) => setForm((f) => ({ ...f, enseignantNom: e.target.value }))} placeholder="Ex: M. Sall" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date début</label>
                <input type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date fin</label>
                <input type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Heures</label>
                <input type="number" value={form.heures} onChange={(e) => setForm((f) => ({ ...f, heures: e.target.value }))} placeholder="0" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} min={0} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : (editItem ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
