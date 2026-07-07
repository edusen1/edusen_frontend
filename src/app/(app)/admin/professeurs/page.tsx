'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminProfesseurs, useCreateProfesseur, useUpdateProfesseur, useDeleteProfesseur } from '@/hooks/use-query-api';

const STATIC_PROFESSEURS = [
  { id: 'p1', prenom: 'Abdoulaye', nom: 'Sall', email: 'a.sall@noura.sn', telephone: '+221 77 123 45 67', username: 'a.sall', matricule: 'ENS-2022-001', specialite: 'Mathématiques', adresse: 'Dakar, Plateau', statut: 'actif' },
  { id: 'p2', prenom: 'Mariama', nom: 'Diop', email: 'm.diop@noura.sn', telephone: '+221 76 234 56 78', username: 'm.diop', matricule: 'ENS-2021-002', specialite: 'Français', adresse: 'Dakar, Médina', statut: 'actif' },
  { id: 'p3', prenom: 'Seydou', nom: 'Ba', email: 's.ba@noura.sn', telephone: '+221 70 345 67 89', username: 's.ba', matricule: 'ENS-2023-003', specialite: 'Sciences Physiques', adresse: 'Pikine', statut: 'actif' },
  { id: 'p4', prenom: 'Khadija', nom: 'Fall', email: 'k.fall@noura.sn', telephone: '+221 77 456 78 90', username: 'k.fall', matricule: 'ENS-2020-004', specialite: 'SVT', adresse: 'Dakar, Grand-Yoff', statut: 'actif' },
  { id: 'p5', prenom: 'Cheikh', nom: 'Ndiaye', email: 'c.ndiaye@noura.sn', telephone: '+221 76 567 89 01', username: 'c.ndiaye', matricule: 'ENS-2022-005', specialite: 'Histoire-Géographie', adresse: 'Guédiawaye', statut: 'actif' },
  { id: 'p6', prenom: 'Ousmane', nom: 'Cissé', email: 'o.cisse@noura.sn', telephone: '+221 77 678 90 12', username: 'o.cisse', matricule: 'ENS-2024-006', specialite: 'Anglais', adresse: 'Dakar, Parcelles', statut: 'inactif' },
];

type ProfItem = Record<string, unknown>;

export default function ProfesseursPage() {
  const { data } = useAdminProfesseurs();
  const rawList = Array.isArray(data) ? data : (data?.professeurs ?? data?.content ?? data?.data ?? []);
  const professeurs = rawList.length > 0 ? rawList : STATIC_PROFESSEURS;

  const createProfesseur = useCreateProfesseur();
  const updateProfesseur = useUpdateProfesseur();
  const deleteProfesseur = useDeleteProfesseur();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ProfItem | null>(null);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', username: '', matricule: '', specialite: '', adresse: '' });

  const filtered = (professeurs as ProfItem[]).filter((p) => {
    const q = search.toLowerCase();
    const fullName = ((p.prenom ?? '') + ' ' + (p.nom ?? '')) as string;
    const spec = (p.specialite ?? '') as string;
    return fullName.toLowerCase().includes(q) || spec.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ prenom: '', nom: '', email: '', telephone: '', username: '', matricule: '', specialite: '', adresse: '' });
    setShowModal(true);
  };

  const openEdit = (p: ProfItem) => {
    setEditItem(p);
    setForm({
      prenom: (p.prenom ?? '') as string,
      nom: (p.nom ?? '') as string,
      email: (p.email ?? '') as string,
      telephone: (p.telephone ?? '') as string,
      username: (p.username ?? '') as string,
      matricule: (p.matricule ?? '') as string,
      specialite: (p.specialite ?? '') as string,
      adresse: (p.adresse ?? '') as string,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.prenom || !form.nom || !form.email) { toast.error('Prénom, nom et email requis'); return; }
    try {
      if (editItem) {
        await updateProfesseur.mutateAsync({ id: String(editItem.id), data: form });
      } else {
        await createProfesseur.mutateAsync(form);
      }
      setShowModal(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (p: ProfItem) => {
    if (!confirm(`Supprimer ${p.prenom} ${p.nom} ?`)) return;
    try {
      await deleteProfesseur.mutateAsync(String(p.id));
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Professeurs</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} enseignant(s)</div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Ajouter
        </button>
      </div>

      {/* Search */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', width: 340 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou spécialité…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((p) => {
            const id = String(p.id);
            const prenom = (p.prenom ?? '') as string;
            const nom = (p.nom ?? '') as string;
            const email = (p.email ?? '') as string;
            const telephone = (p.telephone ?? '') as string;
            const specialite = (p.specialite ?? '') as string;
            const matricule = (p.matricule ?? '') as string;
            const adresse = (p.adresse ?? '') as string;
            const statut = (p.statut ?? 'actif') as string;
            const initials = ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase();

            return (
              <div key={id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prenom} {nom}</div>
                    {specialite && <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', display: 'inline-block', marginTop: 3 }}>{specialite}</div>}
                    <span style={{ fontSize: 11, fontWeight: 700, color: statut === 'actif' ? '#16a34a' : '#94a3b8', background: statut === 'actif' ? '#dcfce7' : '#f1f5f9', padding: '2px 7px', display: 'inline-block', marginLeft: specialite ? 6 : 0 }}>{statut === 'actif' ? 'Actif' : 'Inactif'}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>✉</span> {email}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>📞</span> {telephone}
                </div>
                {matricule && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Matricule : {matricule}</div>
                )}
                {adresse && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 0 }}>📍 {adresse}</div>
                )}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 14 }}>
                  <button onClick={() => openEdit(p)} style={{ flex: 1, height: 30, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(p)} style={{ width: 30, height: 30, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
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
          <div style={{ background: '#fff', width: 540, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {editItem ? 'Modifier le professeur' : 'Nouveau professeur'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Prénom *', key: 'prenom', placeholder: 'Abdoulaye' },
                { label: 'Nom *', key: 'nom', placeholder: 'Sall' },
                { label: 'Email *', key: 'email', placeholder: 'a.sall@noura.sn' },
                { label: 'Téléphone', key: 'telephone', placeholder: '+221 77 000 00 00' },
                { label: 'Nom d\'utilisateur', key: 'username', placeholder: 'a.sall' },
                { label: 'Matricule', key: 'matricule', placeholder: 'ENS-2024-001' },
                { label: 'Spécialité', key: 'specialite', placeholder: 'Mathématiques' },
                { label: 'Adresse', key: 'adresse', placeholder: 'Dakar' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={createProfesseur.isPending || updateProfesseur.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (createProfesseur.isPending || updateProfesseur.isPending) ? 0.7 : 1 }}>
                {(createProfesseur.isPending || updateProfesseur.isPending) ? 'Enregistrement…' : (editItem ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
