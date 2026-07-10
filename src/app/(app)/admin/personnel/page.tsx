'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import {
  useAdminPersonnel,
  useCreatePersonnel,
  useUpdatePersonnel,
  useDeletePersonnel,
  useResetPersonnelCredentials,
  useAdminAbsencesPersonnel,
  useCreateAbsencePersonnel,
  useValiderAbsencePersonnel,
  useRefuserAbsencePersonnel,
} from '@/hooks/use-query-api';

type PersonnelItem = {
  id: string;
  numeroMatricule?: string;
  utilisateurId?: string;
  photoUrl?: string;
  typeContrat?: string;
  dateEmbauche?: string;
  dureeMois?: number;
  dateFinContrat?: string;
  utilisateur?: {
    id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    telephone?: string;
    adresse?: string;
    role?: string;
    actif?: boolean;
    specialite?: string;
    photoUrl?: string;
    surveillantCycles?: { cycle: { id: string; code: string; libelle: string } }[];
  };
  niveauAffectations?: { niveau: { id: string; code: string; libelle: string; ordre: number; cycle: { id: string; code: string; libelle: string } }; type: string; ordre: number }[];
};

type Section = { id: string; code?: string; libelle?: string; nom?: string };
type AbsencePersonnelItem = {
  id: string;
  personnelId?: string;
  dateDebut?: string;
  dateFin?: string;
  motif?: string;
  typeAbsence?: string;
  statut?: string;
  motifRefus?: string;
};

const TYPES_PERSONNEL: { value: string; label: string; color: string; bg: string; needsSection: boolean }[] = [
  { value: 'SURVEILLANT_GENERAL', label: 'Surveillant Général', color: '#d97706', bg: '#fef3c7', needsSection: false },
  { value: 'SURVEILLANT', label: 'Surveillant', color: '#b45309', bg: '#fef9c3', needsSection: true },
  { value: 'SECRETAIRE_SURVEILLANT', label: 'Secrétaire Surv.', color: '#92400e', bg: '#fef3c7', needsSection: true },
  { value: 'SECURITE', label: 'Sécurité / Gardien', color: '#475569', bg: '#f1f5f9', needsSection: false },
  { value: 'COMPTABLE', label: 'Comptable', color: '#16a34a', bg: '#dcfce7', needsSection: false },
  { value: 'RH', label: 'Ressources Humaines', color: '#7c3aed', bg: '#ede9fe', needsSection: false },
  { value: 'SECRETAIRE', label: 'Secrétaire', color: '#0891b2', bg: '#e0f2fe', needsSection: false },
];

const CONTRATS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'VACATAIRE', label: 'Vacataire' },
  { value: 'STAGIAIRE', label: 'Stagiaire' },
  { value: 'BENEVOLE', label: 'Bénévole' },
];

function typeInfo(role?: string) {
  return TYPES_PERSONNEL.find((t) => t.value === role) ?? { label: role ?? '?', color: '#64748b', bg: '#f1f5f9', needsSection: false };
}

function personnelName(p: PersonnelItem) {
  return `${p.utilisateur?.firstName ?? ''} ${p.utilisateur?.lastName ?? ''}`.trim() || '—';
}

function personnelInitials(p: PersonnelItem) {
  const f = p.utilisateur?.firstName?.[0] ?? '';
  const l = p.utilisateur?.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function personnelPhotoUrl(p?: PersonnelItem | null) {
  return p?.utilisateur?.photoUrl ?? p?.photoUrl ?? '';
}

function personnelUserId(p?: PersonnelItem | null) {
  return p?.utilisateur?.id ?? p?.utilisateurId ?? '';
}

function formatDate(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
}

function resizeImageFile(file: File, maxSize = 900, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) return Promise.resolve(file);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob ?? file);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

const PAGE_SIZE = 15;

const EMPTY_FORM = {
  prenom: '', nom: '', email: '', telephone: '', adresse: '',
  type: 'SURVEILLANT', sectionId: '',
  typeContrat: 'CDI', dateEmbauche: '', dureeMois: '',
};

const EMPTY_ABSENCE_FORM = { typeAbsence: 'MALADIE', dateDebut: '', dateFin: '', motif: '', motifRefus: '' };

const ABSENCE_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
  APPROUVEE: { label: 'Validée', bg: '#dcfce7', color: '#16a34a' },
  JUSTIFIEE: { label: 'Justifiée', bg: '#dcfce7', color: '#16a34a' },
  REJETEE: { label: 'Refusée', bg: '#fee2e2', color: '#dc2626' },
  NON_JUSTIFIEE: { label: 'Non justifiée', bg: '#fee2e2', color: '#dc2626' },
};

function absenceStatusInfo(statut?: string) {
  return ABSENCE_STATUS[String(statut ?? 'EN_ATTENTE').toUpperCase()] ?? ABSENCE_STATUS.EN_ATTENTE;
}

function absenceTypeLabel(type?: string) {
  const value = String(type ?? 'AUTRE').toUpperCase();
  if (value === 'MALADIE') return 'Maladie';
  if (value === 'CONGE') return 'Congé';
  if (value === 'SANS_SOLDE') return 'Sans solde';
  return 'Autre';
}

function absenceDuration(a: AbsencePersonnelItem) {
  if (!a.dateDebut) return '—';
  const start = new Date(a.dateDebut);
  const end = a.dateFin ? new Date(a.dateFin) : start;
  const diff = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  return `${diff} jour${diff > 1 ? 's' : ''}`;
}

export default function PersonnelPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminPersonnel();
  const list: PersonnelItem[] = (() => {
    const d = data as unknown;
    if (Array.isArray(d)) return d as PersonnelItem[];
    if (d && typeof d === 'object') {
      const o = d as Record<string, unknown>;
      return (Array.isArray(o.content) ? o.content : Array.isArray(o.data) ? o.data : []) as PersonnelItem[];
    }
    return [];
  })();

  const createPersonnel = useCreatePersonnel();
  const updatePersonnel = useUpdatePersonnel();
  const deletePersonnel = useDeletePersonnel();
  const resetCredentials = useResetPersonnelCredentials();
  const createAbsencePersonnel = useCreateAbsencePersonnel();
  const validerAbsencePersonnel = useValiderAbsencePersonnel();
  const refuserAbsencePersonnel = useRefuserAbsencePersonnel();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PersonnelItem | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'profil' | 'absences'>('profil');
  const { data: absencesData, isLoading: absencesLoading } = useAdminAbsencesPersonnel({ personnelId: selected?.id ?? '', size: 200 });

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<PersonnelItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceForm, setAbsenceForm] = useState(EMPTY_ABSENCE_FORM);
  const [rejectAbsenceId, setRejectAbsenceId] = useState<string | null>(null);

  const [sections, setSections] = useState<Section[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoChanged, setPhotoChanged] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadSections = useCallback(async () => {
    if (sections.length > 0) return;
    try {
      const r = await apiClient.get('/admin/configuration/sections');
      const d = r.data;
      const items = Array.isArray(d) ? d : (d?.content ?? d?.data ?? []);
      setSections(items);
    } catch { /* ignore */ }
  }, [sections.length]);

  const currentTypeInfo = TYPES_PERSONNEL.find((t) => t.value === form.type);
  const needsSection = currentTypeInfo?.needsSection ?? false;

  const filtered = list.filter((p) => {
    const name = personnelName(p).toLowerCase();
    const role = p.utilisateur?.role ?? '';
    return name.includes(search.toLowerCase()) && (!filterType || role === filterType);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedAbsences: AbsencePersonnelItem[] = (() => {
    const d = absencesData as unknown;
    const rows = Array.isArray(d)
      ? d
      : d && typeof d === 'object'
        ? ((d as Record<string, unknown>).content ?? (d as Record<string, unknown>).data ?? [])
        : [];
    return (Array.isArray(rows) ? rows : []) as AbsencePersonnelItem[];
  })();
  const absenceStats = {
    total: selectedAbsences.length,
    attente: selectedAbsences.filter((a) => String(a.statut ?? '').toUpperCase() === 'EN_ATTENTE').length,
    validees: selectedAbsences.filter((a) => ['APPROUVEE', 'JUSTIFIEE'].includes(String(a.statut ?? '').toUpperCase())).length,
    refusees: selectedAbsences.filter((a) => ['REJETEE', 'NON_JUSTIFIEE'].includes(String(a.statut ?? '').toUpperCase())).length,
  };

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoChanged(false);
    void loadSections();
    setShowModal(true);
  }

  function openEdit(p: PersonnelItem) {
    setEditItem(p);
    const role = p.utilisateur?.role ?? 'SURVEILLANT';
    const sectionId = p.utilisateur?.surveillantCycles?.[0]?.cycle?.id ?? '';
    setForm({
      prenom: p.utilisateur?.firstName ?? '',
      nom: p.utilisateur?.lastName ?? '',
      email: p.utilisateur?.email ?? '',
      telephone: p.utilisateur?.telephone ?? '',
      adresse: p.utilisateur?.adresse ?? '',
      type: role,
      sectionId,
      typeContrat: p.typeContrat ?? 'CDI',
      dateEmbauche: p.dateEmbauche ? p.dateEmbauche.slice(0, 10) : '',
      dureeMois: String(p.dureeMois ?? ''),
    });
    setPhotoFile(null);
    setPhotoPreview(personnelPhotoUrl(p));
    setPhotoChanged(false);
    if (TYPES_PERSONNEL.find((t) => t.value === role)?.needsSection) void loadSections();
    setShowModal(true);
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoChanged(true);
    if (!file) {
      setPhotoPreview('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(String(ev.target?.result ?? ''));
    reader.readAsDataURL(file);
  }

  async function uploadPhoto(userId?: string) {
    if (!photoChanged || !photoFile) return '';
    if (!userId) throw new Error('Utilisateur introuvable pour l\'upload de la photo');
    const resized = await resizeImageFile(photoFile);
    const data = new FormData();
    data.append('file', resized, `${photoFile.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`);
    const response = await apiClient.post(`/admin/users/${userId}/photo`, data);
    return String(response.data?.photoUrl ?? '');
  }

  async function refreshPersonnelAfterPhoto(personnel?: PersonnelItem | null, photoUrl?: string) {
    if (personnel && photoUrl) {
      setSelected((current) => {
        if (!current || current.id !== personnel.id) return current;
        return {
          ...current,
          photoUrl,
          utilisateur: current.utilisateur ? { ...current.utilisateur, photoUrl } : current.utilisateur,
        };
      });
    }
    await queryClient.invalidateQueries({ queryKey: ['admin', 'personnel'] });
    await queryClient.refetchQueries({ queryKey: ['admin', 'personnel'], type: 'active' });
  }

  async function handleSave() {
    if (!form.prenom.trim() || !form.nom.trim()) { toast.error('Prénom et nom requis'); return; }
    if (needsSection && !form.sectionId) { toast.error('Section requise pour ce type'); return; }
    const payload: Record<string, unknown> = {
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      email: form.email.trim() || undefined,
      telephone: form.telephone.trim() || undefined,
      adresse: form.adresse.trim() || undefined,
      type: form.type,
      affectationType: form.type,
      sectionId: needsSection ? form.sectionId : undefined,
      typeContrat: form.typeContrat || undefined,
      dateEmbauche: form.dateEmbauche || undefined,
      dureeMois: form.dureeMois ? Number(form.dureeMois) : undefined,
    };
    try {
      if (editItem) {
        await updatePersonnel.mutateAsync({ id: editItem.id, data: payload });
        const photoUrl = await uploadPhoto(personnelUserId(editItem));
        await refreshPersonnelAfterPhoto(editItem, photoUrl);
      } else {
        const result = await createPersonnel.mutateAsync(payload);
        const res = ((result as Record<string, unknown>)?.data ?? result) as Record<string, unknown>;
        const utilisateur = res?.utilisateur as Record<string, unknown> | undefined;
        const createdPersonnel = res as unknown as PersonnelItem;
        const userId = String(utilisateur?.id ?? res?.utilisateurId ?? '');
        await uploadPhoto(userId);
        await refreshPersonnelAfterPhoto(createdPersonnel);
      }
      setShowModal(false);
      setSelected(null);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePersonnel.mutateAsync(id);
      setConfirmDeleteId(null);
      if (selected?.id === id) setSelected(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  async function handleResetCredentials(p: PersonnelItem) {
    await resetCredentials.mutateAsync(p.id);
  }

  async function handleDeclareAbsence() {
    if (!selected) return;
    if (!absenceForm.dateDebut) { toast.error('Date début requise'); return; }
    try {
      await createAbsencePersonnel.mutateAsync({
        personnelId: selected.id,
        typeAbsence: absenceForm.typeAbsence,
        dateDebut: absenceForm.dateDebut,
        dateFin: absenceForm.dateFin || absenceForm.dateDebut,
        motif: absenceForm.motif.trim() || undefined,
      });
      setShowAbsenceModal(false);
      setAbsenceForm(EMPTY_ABSENCE_FORM);
    } catch {
      /* hook handles toast */
    }
  }

  async function handleRefuseAbsence() {
    if (!rejectAbsenceId) return;
    await refuserAbsencePersonnel.mutateAsync({ id: rejectAbsenceId, motifRefus: absenceForm.motifRefus.trim() || undefined });
    setRejectAbsenceId(null);
    setAbsenceForm((f) => ({ ...f, motifRefus: '' }));
  }

  const isSaving = createPersonnel.isPending || updatePersonnel.isPending;
  const isDeleting = deletePersonnel.isPending;

  return (
    <div style={{ display: 'flex', height: '100%', background: '#f5f7fa', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Personnel</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} membre(s)</div>
          <button onClick={openCreate} style={{ marginLeft: 'auto', height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            + Ajouter
          </button>
        </div>

        {/* Filters */}
        <div style={{ flexShrink: 0, padding: '14px 24px 0', display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 280 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
          </div>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0f172a', fontFamily: 'inherit' }}>
            <option value="">Tous les types</option>
            {TYPES_PERSONNEL.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px' }}>
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 100px 80px 124px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 760 }}>
              {['Membre', 'Fonction', 'Téléphone', 'Matricule', 'Contrat', 'Actions'].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
              ))}
            </div>
            {isLoading && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
            )}
            {!isLoading && paged.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun membre du personnel</div>
            )}
            {paged.map((p, idx) => {
              const ti = typeInfo(p.utilisateur?.role);
              const isSelected = selected?.id === p.id;
              const photoUrl = personnelPhotoUrl(p);
              return (
                <div key={p.id} onClick={() => { setSelected(p); setSidebarTab('profil'); }} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 100px 80px 124px', padding: '10px 16px', borderBottom: idx < paged.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 760, cursor: 'pointer', background: isSelected ? '#f0f7ff' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: isSelected ? '#2563eb' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                      {photoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : personnelInitials(p)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{personnelName(p)}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.utilisateur?.username ?? ''}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ti.color, background: ti.bg, padding: '3px 8px', display: 'inline-block' }}>{ti.label}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{p.utilisateur?.telephone ?? '—'}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{p.numeroMatricule ?? '—'}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{p.typeContrat ?? '—'}</span>
                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setSelected(p); setSidebarTab('absences'); }} title="Absences" style={{ height: 26, padding: '0 8px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                      Abs.
                    </button>
                    <button onClick={() => openEdit(p)} title="Modifier" style={{ width: 26, height: 26, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    </button>
                    <button onClick={() => setConfirmDeleteId(p.id)} title="Supprimer" style={{ width: 26, height: 26, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(filtered.length, page * PAGE_SIZE)} sur {filtered.length}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1, fontFamily: 'inherit' }}>Préc.</button>
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: '28px' }}>{page}/{totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, fontFamily: 'inherit' }}>Suiv.</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {selected && (
        <div style={{ width: 520, maxWidth: '46vw', minWidth: 440, flexShrink: 0, borderLeft: '1px solid #e6ebf1', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Sidebar header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #eef2f6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                {personnelPhotoUrl(selected)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={personnelPhotoUrl(selected)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : personnelInitials(selected)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{personnelName(selected)}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{selected.numeroMatricule ?? '—'}</div>
                {(() => { const ti = typeInfo(selected.utilisateur?.role); return <span style={{ fontSize: 11, fontWeight: 700, color: ti.color, background: ti.bg, padding: '2px 8px', display: 'inline-block', marginTop: 4 }}>{ti.label}</span>; })()}
              </div>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => openEdit(selected)} style={{ height: 30, padding: '0 12px', border: '1px solid #2563eb', background: '#fff', color: '#2563eb', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Modifier</button>
              <button onClick={() => setSidebarTab('absences')} style={{ height: 30, padding: '0 12px', border: '1px solid #dbeafe', background: sidebarTab === 'absences' ? '#eff6ff' : '#fff', color: '#2563eb', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Absences</button>
              <button onClick={() => handleResetCredentials(selected)} disabled={resetCredentials.isPending} style={{ height: 30, padding: '0 12px', border: '1px solid #d97706', background: '#fff', color: '#d97706', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: resetCredentials.isPending ? 0.7 : 1 }}>
                {resetCredentials.isPending ? 'Envoi…' : 'Réinitialiser MDP'}
              </button>
              <button onClick={() => setConfirmDeleteId(selected.id)} style={{ height: 30, padding: '0 12px', border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #eef2f6', flexShrink: 0, background: '#f8fafc' }}>
            {(['profil', 'absences'] as const).map((tab) => (
              <button key={tab} onClick={() => setSidebarTab(tab)} style={{ flex: 1, height: 46, border: 'none', background: sidebarTab === tab ? '#fff' : 'transparent', borderBottom: sidebarTab === tab ? '3px solid #2563eb' : '3px solid transparent', color: sidebarTab === tab ? '#2563eb' : '#475569', fontSize: 13, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>
                {tab === 'profil' ? 'Profil' : `Absences (${absenceStats.total})`}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {sidebarTab === 'profil' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Identifiant', value: selected.utilisateur?.username },
                  { label: 'Email', value: selected.utilisateur?.email },
                  { label: 'Téléphone', value: selected.utilisateur?.telephone },
                  { label: 'Adresse', value: selected.utilisateur?.adresse },
                  { label: 'Type de contrat', value: selected.typeContrat },
                  { label: 'Date d\'embauche', value: formatDate(selected.dateEmbauche) },
                  { label: 'Durée (mois)', value: selected.dureeMois ? String(selected.dureeMois) : undefined },
                  { label: 'Fin de contrat', value: selected.dateFinContrat ? formatDate(selected.dateFinContrat) : undefined },
                  { label: 'Statut', value: selected.utilisateur?.actif ? 'Actif' : 'Inactif' },
                ].map(({ label, value }) => value && (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#0f172a' }}>{value}</span>
                  </div>
                ))}
                {(selected.utilisateur?.surveillantCycles?.length ?? 0) > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Cycles affectés</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selected.utilisateur?.surveillantCycles?.map((sc) => (
                        <span key={sc.cycle.id} style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 8px', fontWeight: 600 }}>{sc.cycle.libelle}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {sidebarTab === 'absences' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Historique des absences signalées</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Demandes et absences déclarées pour ce membre</div>
                  </div>
                  <button
                    onClick={() => { setAbsenceForm(EMPTY_ABSENCE_FORM); setShowAbsenceModal(true); }}
                    style={{ height: 34, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 }}
                  >
                    + Déclarer
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Total', value: absenceStats.total, color: '#2563eb', bg: '#eff6ff' },
                    { label: 'Attente', value: absenceStats.attente, color: '#d97706', bg: '#fef3c7' },
                    { label: 'Validées', value: absenceStats.validees, color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Refusées', value: absenceStats.refusees, color: '#dc2626', bg: '#fee2e2' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: stat.bg, border: '1px solid #e6ebf1', padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                {absencesLoading && <div style={{ color: '#94a3b8', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>Chargement…</div>}
                {!absencesLoading && selectedAbsences.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '24px 0' }}>Aucune absence enregistrée</div>
                )}
                {!absencesLoading && selectedAbsences.map((absence) => {
                  const status = absenceStatusInfo(absence.statut);
                  const pending = String(absence.statut ?? '').toUpperCase() === 'EN_ATTENTE';
                  return (
                    <div key={absence.id} style={{ border: '1px solid #e6ebf1', background: '#fff', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{absenceTypeLabel(absence.typeAbsence)}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: status.color, background: status.bg, padding: '2px 7px' }}>{status.label}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Début</div>
                          <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{formatDate(absence.dateDebut)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Fin</div>
                          <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{formatDate(absence.dateFin || absence.dateDebut)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Durée</div>
                          <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{absenceDuration(absence)}</div>
                        </div>
                      </div>
                      {absence.motif && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{absence.motif}</div>}
                      {absence.motifRefus && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>Refus : {absence.motifRefus}</div>}
                      {pending && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => validerAbsencePersonnel.mutateAsync(absence.id)} disabled={validerAbsencePersonnel.isPending || refuserAbsencePersonnel.isPending} style={{ flex: 1, height: 28, border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Valider</button>
                          <button onClick={() => { setRejectAbsenceId(absence.id); setAbsenceForm((f) => ({ ...f, motifRefus: '' })); }} disabled={validerAbsencePersonnel.isPending || refuserAbsencePersonnel.isPending} style={{ flex: 1, height: 28, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Refuser</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showAbsenceModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ background: '#fff', width: 440, padding: 26, boxShadow: '0 12px 40px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Déclarer une absence</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18 }}>{personnelName(selected)}</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Type d&apos;absence</label>
              <select value={absenceForm.typeAbsence} onChange={(e) => setAbsenceForm((f) => ({ ...f, typeAbsence: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#0f172a' }}>
                <option value="MALADIE">Maladie</option>
                <option value="CONGE">Congé</option>
                <option value="SANS_SOLDE">Sans solde</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date début *</label>
                <input type="date" value={absenceForm.dateDebut} onChange={(e) => setAbsenceForm((f) => ({ ...f, dateDebut: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date fin</label>
                <input type="date" value={absenceForm.dateFin} onChange={(e) => setAbsenceForm((f) => ({ ...f, dateFin: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Motif</label>
              <input value={absenceForm.motif} onChange={(e) => setAbsenceForm((f) => ({ ...f, motif: e.target.value }))} placeholder="Précisez le motif…" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAbsenceModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDeclareAbsence} disabled={createAbsencePersonnel.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: createAbsencePersonnel.isPending ? 'not-allowed' : 'pointer', opacity: createAbsencePersonnel.isPending ? 0.7 : 1 }}>
                {createAbsencePersonnel.isPending ? 'Enregistrement…' : 'Déclarer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectAbsenceId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ background: '#fff', width: 380, padding: 26, boxShadow: '0 12px 40px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Refuser cette absence</div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Motif du refus</label>
            <input value={absenceForm.motifRefus} onChange={(e) => setAbsenceForm((f) => ({ ...f, motifRefus: e.target.value }))} placeholder="Optionnel" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectAbsenceId(null)} style={{ height: 36, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleRefuseAbsence} disabled={refuserAbsencePersonnel.isPending} style={{ height: 36, padding: '0 16px', border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: refuserAbsencePersonnel.isPending ? 'not-allowed' : 'pointer', opacity: refuserAbsencePersonnel.isPending ? 0.7 : 1 }}>
                {refuserAbsencePersonnel.isPending ? 'Refus…' : 'Refuser'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 540, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,.18)', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {editItem ? 'Modifier le membre' : 'Ajouter un membre du personnel'}
            </div>

            {/* Type selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>Fonction *</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TYPES_PERSONNEL.map((t) => (
                  <button key={t.value} onClick={() => { setForm((f) => ({ ...f, type: t.value, sectionId: '' })); if (t.needsSection) void loadSections(); }}
                    style={{ height: 32, padding: '0 12px', border: `2px solid ${form.type === t.value ? t.color : '#d9e0e8'}`, background: form.type === t.value ? t.bg : '#fff', color: form.type === t.value ? t.color : '#64748b', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                style={{ width: 62, height: 62, border: '2px dashed #cbd5e1', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}
                aria-label="Choisir une photo"
              >
                {photoPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
              </button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Photo</div>
                <button type="button" onClick={() => photoInputRef.current?.click()} style={{ height: 30, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
                </button>
                {photoFile && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{photoFile.name}</div>}
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhotoChange} />
            </div>

            {/* Section (si applicable) */}
            {needsSection && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Section / Cycle *</label>
                <select value={form.sectionId} onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#0f172a' }}>
                  <option value="">-- Sélectionner une section --</option>
                  {sections.map((s) => {
                    const label = s.libelle || s.nom || s.code || 'Section sans nom';
                    return <option key={s.id} value={s.id} style={{ color: '#0f172a', background: '#fff' }}>{label}</option>;
                  })}
                </select>
              </div>
            )}

            {/* Identity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {([
                { label: 'Prénom *', key: 'prenom', placeholder: 'Mamadou' },
                { label: 'Nom *', key: 'nom', placeholder: 'Diallo' },
                { label: 'Téléphone', key: 'telephone', placeholder: '77 000 00 00' },
                { label: 'Email', key: 'email', placeholder: 'email@school.sn', type: 'email' },
                { label: 'Adresse', key: 'adresse', placeholder: 'Dakar' },
              ] as { label: string; key: string; placeholder: string; type?: string }[]).map(({ label, key, placeholder, type }) => (
                <div key={key} style={key === 'adresse' ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input type={type ?? 'text'} value={(form as Record<string, unknown>)[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            {/* Contract info */}
            <div style={{ borderTop: '1px solid #eef2f6', paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>Contrat (optionnel)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Type de contrat</label>
                  <select value={form.typeContrat} onChange={(e) => setForm((f) => ({ ...f, typeContrat: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
                    {CONTRATS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date d&apos;embauche</label>
                  <input type="date" value={form.dateEmbauche} onChange={(e) => setForm((f) => ({ ...f, dateEmbauche: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {form.typeContrat === 'CDD' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Durée (mois)</label>
                    <input type="number" min="1" value={form.dureeMois} onChange={(e) => setForm((f) => ({ ...f, dureeMois: e.target.value }))} placeholder="12"
                      style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={isSaving} style={{ height: 38, padding: '0 22px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                {isSaving ? 'Enregistrement…' : (editItem ? 'Enregistrer' : 'Créer le membre')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDeleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Supprimer ce membre ?</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Cette action supprimera le membre du personnel et son compte utilisateur.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ height: 36, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={isDeleting} style={{ height: 36, padding: '0 16px', border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
                {isDeleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
