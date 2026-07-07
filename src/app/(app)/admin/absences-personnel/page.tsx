'use client';

import { useState } from 'react';
import { useAdminAbsencesPersonnel, useUpdateAbsence, useAdminPersonnel, useCreateAbsencePersonnel } from '@/hooks/use-query-api';

const STATIC_ABSENCES = [
  { id: 'a1', personnel: 'Mamadou Diallo', poste: 'Professeur', date: '27/01/2026', motif: 'Maladie', statut: 'justifié', duree: '1 jour' },
  { id: 'a2', personnel: 'Cheikh Bâ', poste: 'Professeur', date: '29/01/2026', motif: 'Personnel', statut: 'non_justifié', duree: '1 jour' },
  { id: 'a3', personnel: 'Ibrahima Ndiaye', poste: 'Surveillant', date: '31/01/2026', motif: 'Deuil', statut: 'justifié', duree: '3 jours' },
  { id: 'a4', personnel: 'Aminata Sarr', poste: 'Professeur', date: '02/02/2026', motif: '—', statut: 'en_attente', duree: '1 jour' },
  { id: 'a5', personnel: 'Fatou Fall', poste: 'Caissière', date: '05/02/2026', motif: 'Maladie', statut: 'justifié', duree: '2 jours' },
];

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  justifié: { label: 'Justifiée', bg: '#dcfce7', color: '#16a34a' },
  non_justifié: { label: 'Non justifiée', bg: '#fee2e2', color: '#dc2626' },
  en_attente: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
};

const STATIC_PERSONNEL = [
  { id: 'pe1', prenom: 'Mamadou', nom: 'Diallo' },
  { id: 'pe2', prenom: 'Aminata', nom: 'Sarr' },
  { id: 'pe3', prenom: 'Ibrahima', nom: 'Ndiaye' },
  { id: 'pe4', prenom: 'Fatou', nom: 'Fall' },
  { id: 'pe5', prenom: 'Cheikh', nom: 'Bâ' },
];

export default function AbsencesPersonnelPage() {
  const { data } = useAdminAbsencesPersonnel();
  const rawList = Array.isArray(data) ? data : (data?.absences ?? data?.data ?? []);
  const absences = rawList.length > 0 ? rawList : STATIC_ABSENCES;
  const updateAbsence = useUpdateAbsence();
  const createAbsence = useCreateAbsencePersonnel();

  const { data: personnelData } = useAdminPersonnel();
  const rawPersonnel = Array.isArray(personnelData) ? personnelData : (personnelData?.personnel ?? personnelData?.data ?? []);
  const personnelList = rawPersonnel.length > 0 ? rawPersonnel : STATIC_PERSONNEL;

  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ personnelId: '', type: 'maladie', dateDebut: '', dateFin: '', motif: '' });

  const filtered = (absences as Record<string, unknown>[]).filter((a) => {
    const statut = (a.statut ?? '') as string;
    return !filterStatut || statut === filterStatut;
  });

  const handleDeclarer = async () => {
    if (!form.personnelId || !form.dateDebut) { toast.error('Personnel et date début requis'); return; }
    try {
      await createAbsence.mutateAsync({
        personnelId: form.personnelId,
        type: form.type,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined,
        motif: form.motif || undefined,
      });
      setShowModal(false);
      setForm({ personnelId: '', type: 'maladie', dateDebut: '', dateFin: '', motif: '' });
    } catch { /* hook handles toast */ }
  };

  const handleUpdateStatut = async (id: string, statut: string) => {
    try {
      await updateAbsence.mutateAsync({ id, data: { statut } });
      toast.success('Statut mis à jour');
    } catch {
      toast.error('Erreur');
    }
  };

  const nbJustif = filtered.filter((a) => a.statut === 'justifié').length;
  const nbNonJustif = filtered.filter((a) => a.statut === 'non_justifié').length;
  const nbAttente = filtered.filter((a) => a.statut === 'en_attente').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Absences du personnel</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} absences</div>
        <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Déclarer une absence
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Justifiées', count: nbJustif, bg: '#dcfce7', color: '#16a34a' },
          { label: 'Non justifiées', count: nbNonJustif, bg: '#fee2e2', color: '#dc2626' },
          { label: 'En attente', count: nbAttente, bg: '#fef3c7', color: '#d97706' },
          { label: 'Total', count: filtered.length, bg: '#eff6ff', color: '#2563eb' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#fff', border: '1px solid #e6ebf1', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</span>
            </span>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0' }}>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="justifié">Justifiées</option>
          <option value="non_justifié">Non justifiées</option>
          <option value="en_attente">En attente</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 90px 110px 100px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 760 }}>
            {['Personnel', 'Poste', 'Date', 'Durée', 'Motif', 'Statut', 'Action'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((a, idx) => {
            const statut = (a.statut ?? 'en_attente') as string;
            const st = STATUT_MAP[statut] ?? STATUT_MAP.en_attente;
            return (
              <div key={String(a.id ?? idx)} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 90px 110px 100px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 760 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{(a.personnel ?? '') as string}</div>
                <span style={{ fontSize: 12, color: '#475569' }}>{(a.poste ?? '') as string}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{(a.date ?? '') as string}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{(a.duree ?? '') as string}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{(a.motif ?? '—') as string}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                {statut === 'en_attente' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleUpdateStatut(String(a.id), 'justifié')} style={{ height: 26, padding: '0 8px', border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                    <button onClick={() => handleUpdateStatut(String(a.id), 'non_justifié')} style={{ height: 26, padding: '0 8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                  </div>
                )}
                {statut !== 'en_attente' && <div />}
              </div>
            );
          })}
        </div>
      </div>
      {/* Modal déclarer */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Déclarer une absence</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Membre du personnel *</label>
              <select value={form.personnelId} onChange={(e) => setForm((f) => ({ ...f, personnelId: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Sélectionner…</option>
                {(personnelList as Record<string, unknown>[]).map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>{String(p.prenom ?? '')} {String(p.nom ?? '')}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Type d'absence</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                <option value="maladie">Maladie</option>
                <option value="personnel">Personnel</option>
                <option value="deuil">Deuil</option>
                <option value="formation">Formation</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date début *</label>
                <input type="date" value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date fin</label>
                <input type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Motif</label>
              <input value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} placeholder="Précisez le motif…" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDeclarer} disabled={createAbsence.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: createAbsence.isPending ? 0.7 : 1 }}>
                {createAbsence.isPending ? 'Enregistrement…' : 'Déclarer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
