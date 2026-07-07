'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminPersonnel, useCreatePersonnel, useUpdatePersonnel, useAdminMatieres } from '@/hooks/use-query-api';

const STATIC_PERSONNEL = [
  { id: 'pe1', prenom: 'Mamadou', nom: 'Diallo', type: 'PROFESSEUR', specialite: 'Mathématiques', telephone: '77 123 45 67', salaire: 350000, statut: 'actif', dateEmbauche: '01/09/2022', adresse: 'Dakar, Plateau' },
  { id: 'pe2', prenom: 'Aminata', nom: 'Sarr', type: 'PROFESSEUR', specialite: 'Français', telephone: '76 234 56 78', salaire: 300000, statut: 'actif', dateEmbauche: '01/09/2021', adresse: 'Dakar, Médina' },
  { id: 'pe3', prenom: 'Ibrahima', nom: 'Ndiaye', type: 'SURVEILLANT', specialite: '—', telephone: '78 345 67 89', salaire: 180000, statut: 'actif', dateEmbauche: '15/01/2023', adresse: 'Pikine' },
  { id: 'pe4', prenom: 'Fatou', nom: 'Fall', type: 'COMPTABLE', specialite: '—', telephone: '70 456 78 90', salaire: 250000, statut: 'actif', dateEmbauche: '01/09/2020', adresse: 'Dakar, HLM' },
  { id: 'pe5', prenom: 'Cheikh', nom: 'Bâ', type: 'PROFESSEUR', specialite: 'Physique-Chimie', telephone: '77 567 89 01', salaire: 320000, statut: 'congé', dateEmbauche: '01/09/2023', adresse: 'Guédiawaye' },
];

const STATIC_MATIERES = [
  { id: 'm1', nom: 'Mathématiques' }, { id: 'm2', nom: 'Français' }, { id: 'm3', nom: 'Histoire-Géo' },
  { id: 'm4', nom: 'Sciences Physiques' }, { id: 'm5', nom: 'SVT' }, { id: 'm6', nom: 'Anglais' }, { id: 'm7', nom: 'EPS' },
];

const TYPES_PERSONNEL = ['PROFESSEUR', 'SURVEILLANT', 'COMPTABLE', 'ASSISTANT', 'DIRECTION'];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  PROFESSEUR: { bg: '#eff6ff', color: '#2563eb' },
  SURVEILLANT: { bg: '#fef3c7', color: '#d97706' },
  COMPTABLE: { bg: '#f0fdf4', color: '#16a34a' },
  ASSISTANT: { bg: '#fdf4ff', color: '#9333ea' },
  DIRECTION: { bg: '#fff1f2', color: '#e11d48' },
};

type PersonnelItem = Record<string, unknown>;

export default function PersonnelPage() {
  const { data } = useAdminPersonnel();
  const rawList = Array.isArray(data) ? data : (data?.personnel ?? data?.data ?? []);
  const personnel = rawList.length > 0 ? rawList : STATIC_PERSONNEL;

  const { data: matieresData } = useAdminMatieres();
  const rawMatieres = Array.isArray(matieresData) ? matieresData : (matieresData?.content ?? matieresData?.data ?? []);
  const matieres = rawMatieres.length > 0 ? rawMatieres : STATIC_MATIERES;

  const createPersonnel = useCreatePersonnel();
  const updatePersonnel = useUpdatePersonnel();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PersonnelItem | null>(null);
  const [form, setForm] = useState({
    prenom: '', nom: '', type: 'PROFESSEUR', telephone: '', email: '',
    salaire: '', dateEmbauche: '', adresse: '', specialite: '',
    matieres: [] as string[], cycleId: '',
  });

  const filtered = (personnel as PersonnelItem[]).filter((p) => {
    const fullName = ((p.prenom ?? '') + ' ' + (p.nom ?? '')) as string;
    const type = (p.type ?? p.poste ?? '') as string;
    return fullName.toLowerCase().includes(search.toLowerCase()) &&
      (!filterType || type === filterType);
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ prenom: '', nom: '', type: 'PROFESSEUR', telephone: '', email: '', salaire: '', dateEmbauche: '', adresse: '', specialite: '', matieres: [], cycleId: '' });
    setShowModal(true);
  };

  const openEdit = (p: PersonnelItem) => {
    setEditItem(p);
    setForm({
      prenom: (p.prenom ?? '') as string,
      nom: (p.nom ?? '') as string,
      type: ((p.type ?? p.poste ?? 'PROFESSEUR') as string).toUpperCase(),
      telephone: (p.telephone ?? '') as string,
      email: (p.email ?? '') as string,
      salaire: String(p.salaire ?? ''),
      dateEmbauche: (p.dateEmbauche ?? '') as string,
      adresse: (p.adresse ?? '') as string,
      specialite: (p.specialite ?? '') as string,
      matieres: (p.matieres as string[] | undefined) ?? [],
      cycleId: (p.cycleId ?? '') as string,
    });
    setShowModal(true);
  };

  const toggleMatiere = (id: string) => {
    setForm((f) => ({
      ...f,
      matieres: f.matieres.includes(id) ? f.matieres.filter((m) => m !== id) : [...f.matieres, id],
    }));
  };

  const handleSave = async () => {
    if (!form.prenom || !form.nom || !form.type) { toast.error('Prénom, nom et type requis'); return; }
    try {
      if (editItem) {
        await updatePersonnel.mutateAsync({ id: String(editItem.id), data: form });
        toast.success('Personnel mis à jour');
      } else {
        await createPersonnel.mutateAsync(form);
        toast.success('Personnel créé');
      }
      setShowModal(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Personnel</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} membre(s)</div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Ajouter un membre
        </button>
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 320 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les types</option>
          {TYPES_PERSONNEL.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 160px 130px 120px 110px 110px 80px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 900 }}>
            {['Nom', 'Type', 'Spécialité', 'Téléphone', 'Salaire', 'Statut', 'Embauche', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((p, idx) => {
            const prenom = (p.prenom ?? '') as string;
            const nom = (p.nom ?? '') as string;
            const type = ((p.type ?? p.poste ?? '') as string).toUpperCase();
            const specialite = (p.specialite ?? p.matiere ?? '—') as string;
            const tel = (p.telephone ?? '—') as string;
            const salaire = (p.salaire ?? 0) as number;
            const statut = (p.statut ?? 'actif') as string;
            const date = (p.dateEmbauche ?? '—') as string;
            const initials = ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase();
            const typeStyle = TYPE_COLORS[type] ?? { bg: '#f1f5f9', color: '#64748b' };
            return (
              <div key={String(p.id ?? idx)} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 160px 130px 120px 110px 110px 80px', padding: '11px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 900 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{prenom} {nom}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: typeStyle.color, background: typeStyle.bg, padding: '3px 8px', display: 'inline-block' }}>{type}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{specialite}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{tel}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: salaire > 0 ? '#0f172a' : '#94a3b8' }}>
                  {salaire > 0 ? `${salaire.toLocaleString('fr-FR')} F` : '—'}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: statut === 'actif' ? '#16a34a' : '#d97706', background: statut === 'actif' ? '#dcfce7' : '#fef3c7', padding: '3px 8px', display: 'inline-block' }}>
                  {statut === 'actif' ? 'Actif' : 'Congé'}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{date}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(p)} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
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
          <div style={{ background: '#fff', width: 560, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {editItem ? 'Modifier le membre' : 'Ajouter un membre'}
            </div>

            {/* Type */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>Type *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TYPES_PERSONNEL.map((t) => {
                  const ts = TYPE_COLORS[t] ?? { bg: '#f1f5f9', color: '#64748b' };
                  return (
                    <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))} style={{ height: 34, padding: '0 14px', border: `2px solid ${form.type === t ? ts.color : '#d9e0e8'}`, background: form.type === t ? ts.bg : '#fff', color: form.type === t ? ts.color : '#64748b', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Prénom *', key: 'prenom', placeholder: 'Mamadou' },
                { label: 'Nom *', key: 'nom', placeholder: 'Diallo' },
                { label: 'Téléphone', key: 'telephone', placeholder: '77 000 00 00' },
                { label: 'Email', key: 'email', placeholder: 'email@school.sn' },
                { label: 'Salaire (FCFA)', key: 'salaire', placeholder: '300000' },
                { label: 'Date d\'embauche', key: 'dateEmbauche', placeholder: '01/09/2024', type: 'date' },
                { label: 'Adresse', key: 'adresse', placeholder: 'Dakar' },
                ...(form.type === 'PROFESSEUR' ? [{ label: 'Spécialité', key: 'specialite', placeholder: 'Mathématiques' }] : []),
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input
                    type={type ?? 'text'}
                    value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            {/* Matières checkboxes pour PROFESSEUR */}
            {form.type === 'PROFESSEUR' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>Matières enseignées</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(matieres as Record<string, unknown>[]).map((m) => {
                    const mId = String(m.id);
                    const mNom = (m.nom ?? '') as string;
                    const checked = form.matieres.includes(mId);
                    return (
                      <button key={mId} onClick={() => toggleMatiere(mId)} style={{ height: 30, padding: '0 12px', border: `1px solid ${checked ? '#2563eb' : '#d9e0e8'}`, background: checked ? '#eff6ff' : '#fff', color: checked ? '#2563eb' : '#64748b', fontSize: 12, fontWeight: checked ? 700 : 400, fontFamily: 'inherit', cursor: 'pointer' }}>
                        {checked ? '✓ ' : ''}{mNom}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={createPersonnel.isPending || updatePersonnel.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (createPersonnel.isPending || updatePersonnel.isPending) ? 0.7 : 1 }}>
                {(createPersonnel.isPending || updatePersonnel.isPending) ? 'Enregistrement…' : (editItem ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
