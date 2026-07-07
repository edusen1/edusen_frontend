'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminAnnonces, useCreateAnnonce, useUpdateAnnonce, useDeleteAnnonce } from '@/hooks/use-query-api';

const STATIC_ANNONCES = [
  { id: 'a1', titre: 'Réunion parents d\'élèves — 3ème B', contenu: 'Une réunion est organisée le vendredi 30 juin à 16h en salle B04.', dateDebut: '2026-06-20', dateFin: '2026-06-30', actif: true },
  { id: 'a2', titre: 'Examens de fin d\'année', contenu: 'Les examens de fin d\'année débuteront le 7 juillet. Consultez le planning sur le portail.', dateDebut: '2026-06-25', dateFin: '2026-07-07', actif: true },
  { id: 'a3', titre: 'Journée de sport scolaire', contenu: 'Une journée sportive est prévue le 5 juillet. Tenue de sport obligatoire.', dateDebut: '2026-06-28', dateFin: '2026-07-05', actif: true },
  { id: 'a4', titre: 'Remise des bulletins T1', contenu: 'Les bulletins du premier trimestre sont disponibles sur le portail.', dateDebut: '2025-12-15', dateFin: '2025-12-20', actif: false },
];

type Annonce = { id: string; titre: string; contenu: string; dateDebut?: string | null; dateFin?: string | null; actif: boolean };

const EMPTY_FORM = { titre: '', contenu: '', dateDebut: '', dateFin: '', actif: true };

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}

export default function AnnoncesPage() {
  const { data } = useAdminAnnonces();
  const rawList = Array.isArray(data) ? data : (data?.annonces ?? data?.data ?? []);
  const annonces: Annonce[] = rawList.length > 0 ? rawList : STATIC_ANNONCES;

  const createAnnonce = useCreateAnnonce();
  const updateAnnonce = useUpdateAnnonce();
  const deleteAnnonce = useDeleteAnnonce();

  const [search, setSearch] = useState('');
  const [filterActif, setFilterActif] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = annonces.filter((a) => {
    const matchSearch = !search || a.titre.toLowerCase().includes(search.toLowerCase()) || a.contenu.toLowerCase().includes(search.toLowerCase());
    const matchActif = filterActif === '' || (filterActif === 'actif' ? a.actif : !a.actif);
    return matchSearch && matchActif;
  });

  const nbActives = annonces.filter((a) => a.actif).length;
  const nbInactives = annonces.filter((a) => !a.actif).length;

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (a: Annonce) => {
    setEditId(a.id);
    setForm({ titre: a.titre, contenu: a.contenu, dateDebut: a.dateDebut?.slice(0, 10) ?? '', dateFin: a.dateFin?.slice(0, 10) ?? '', actif: a.actif });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titre.trim() || !form.contenu.trim() || !form.dateDebut) {
      toast.error('Titre, contenu et date de début sont requis');
      return;
    }
    setSaving(true);
    try {
      const payload = { titre: form.titre.trim(), contenu: form.contenu.trim(), dateDebut: form.dateDebut || null, dateFin: form.dateFin || null, actif: form.actif };
      if (editId) {
        await updateAnnonce.mutateAsync({ id: editId, data: payload });
        toast.success('Annonce modifiée');
      } else {
        await createAnnonce.mutateAsync(payload);
        toast.success('Annonce publiée');
      }
      setShowModal(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActif = async (a: Annonce) => {
    try {
      await updateAnnonce.mutateAsync({ id: a.id, data: { actif: !a.actif } });
      toast.success(a.actif ? 'Annonce désactivée' : 'Annonce activée');
    } catch {
      toast.error('Erreur');
    }
  };

  const handleDelete = async (a: Annonce) => {
    if (!confirm(`Supprimer "${a.titre}" ?`)) return;
    try {
      await deleteAnnonce.mutateAsync(a.id);
      toast.success('Annonce supprimée');
    } catch {
      toast.error('Suppression impossible');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Annonces</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{annonces.length} annonce(s)</div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Nouvelle annonce
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'Total', count: annonces.length, bg: '#eff6ff', color: '#2563eb' },
          { label: 'Actives', count: nbActives, bg: '#dcfce7', color: '#16a34a' },
          { label: 'Inactives', count: nbInactives, bg: '#f1f5f9', color: '#64748b' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</span>
            </span>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 360 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une annonce…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterActif} onChange={(e) => setFilterActif(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actives</option>
          <option value="inactif">Inactives</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 110px 100px 120px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
            {['Annonce', 'Statut', 'Date début', 'Date fin', 'Actif', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune annonce trouvée</div>
          )}
          {filtered.map((a, idx) => (
            <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 110px 100px 120px', padding: '14px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{a.titre}</div>
                <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 340 }}>{a.contenu}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: a.actif ? '#16a34a' : '#64748b', background: a.actif ? '#dcfce7' : '#f1f5f9', padding: '3px 8px', display: 'inline-block' }}>
                {a.actif ? 'Active' : 'Inactive'}
              </span>
              <span style={{ fontSize: 12, color: '#475569' }}>{fmtDate(a.dateDebut)}</span>
              <span style={{ fontSize: 12, color: '#475569' }}>{fmtDate(a.dateFin)}</span>
              <button onClick={() => handleToggleActif(a)} style={{ height: 28, padding: '0 10px', border: `1px solid ${a.actif ? '#fee2e2' : '#dcfce7'}`, background: '#fff', color: a.actif ? '#dc2626' : '#16a34a', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {a.actif ? 'Désactiver' : 'Activer'}
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(a)} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                </button>
                <button onClick={() => handleDelete(a)} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 560, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}</div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Titre *</label>
              <input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} style={inp()} placeholder="Titre de l'annonce" autoFocus />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Contenu *</label>
              <textarea value={form.contenu} onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))} rows={4} style={{ ...inp(), height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="Message de l'annonce…" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Date de début *</label>
                <input type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={lbl()}>Date de fin</label>
                <input type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} style={inp()} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.actif} onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))} />
              Annonce active (visible immédiatement)
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
