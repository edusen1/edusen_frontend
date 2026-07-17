'use client';

import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAdminParents, useCreateParent, useUpdateParent } from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';
import { formatFirstName, formatLastName } from '@/lib/person-name';

const EMPTY_FORM = { prenom: '', nom: '', telephone: '', email: '' };

function resizeImageFile(file: File, maxSize = 900, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) return Promise.resolve(file);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob ?? file); }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

type ParentItem = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  lienParente?: string | null;
  photoUrl?: string | null;
};

type ChildItem = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  matricule?: string | null;
  telephone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  eleveClasse?: { id: string; nom: string } | null;
  lienParente?: string | null;
  lien?: string | null;
  relation?: string | null;
};

function parentName(parent: ParentItem) {
  return `${parent.prenom} ${parent.nom}`.trim() || 'Parent';
}

function childName(child: ChildItem) {
  return `${child.firstName ?? ''} ${child.lastName ?? ''}`.trim() || 'Élève';
}

function initials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—';
}

const LIEN_LABELS: Record<string, string> = {
  PERE: 'Père', MERE: 'Mère', TUTEUR: 'Tuteur', TUTRICE: 'Tutrice',
  GRAND_PERE: 'Grand-père', GRAND_MERE: 'Grand-mère',
  ONCLE: 'Oncle', TANTE: 'Tante', AUTRE: 'Autre',
};
function lienLabel(val?: string | null) {
  if (!val) return null;
  return LIEN_LABELS[val] ?? val;
}

function normalizeParent(raw: Record<string, unknown>, index: number): ParentItem {
  return {
    id: String(raw.id ?? raw._id ?? index),
    nom: String(raw.nom ?? raw.lastName ?? ''),
    prenom: String(raw.prenom ?? raw.firstName ?? ''),
    telephone: String(raw.telephone ?? raw.phone ?? ''),
    email: String(raw.email ?? ''),
    lienParente: typeof raw.lienParente === 'string' ? raw.lienParente : null,
    photoUrl: typeof raw.photoUrl === 'string' ? raw.photoUrl : null,
  };
}

type ChildTab = 'notes' | 'absences' | 'planning' | 'paiements';
type NoteRow = Record<string, unknown>;
type AbsRow = Record<string, unknown>;
type PlanRow = Record<string, unknown>;
type PaiRow = Record<string, unknown>;

const NOTE_COLORS = [
  { bg: '#eff6ff', stroke: '#2563eb' },
  { bg: '#f5f3ff', stroke: '#7c3aed' },
  { bg: '#ecfdf5', stroke: '#059669' },
  { bg: '#fffbeb', stroke: '#d97706' },
  { bg: '#fef2f2', stroke: '#e11d48' },
];

export default function ParentsPage() {
  const { data } = useAdminParents();
  const createParent = useCreateParent();
  const updateParent = useUpdateParent();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedParent, setSelectedParent] = useState<ParentItem | null>(null);
  const [children, setChildren] = useState<ChildItem[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Child detail panel state
  const [selectedChild, setSelectedChild] = useState<ChildItem | null>(null);
  const [childTab, setChildTab] = useState<ChildTab>('notes');
  const [childNotes, setChildNotes] = useState<NoteRow[]>([]);
  const [childAbsences, setChildAbsences] = useState<AbsRow[]>([]);
  const [childPlanning, setChildPlanning] = useState<PlanRow[]>([]);
  const [childPaiements, setChildPaiements] = useState<PaiRow[]>([]);
  const [childDataLoading, setChildDataLoading] = useState(false);

  const parents = useMemo(() => {
    const raw = Array.isArray(data) ? data : ((data as Record<string, unknown> | undefined)?.content ?? (data as Record<string, unknown> | undefined)?.parents ?? (data as Record<string, unknown> | undefined)?.data ?? []);
    return (raw as Record<string, unknown>[]).map(normalizeParent);
  }, [data]);

  const filtered = parents.filter((parent) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return parent.nom.toLowerCase().includes(query)
      || parent.prenom.toLowerCase().includes(query)
      || parent.telephone.toLowerCase().includes(query)
      || parent.email.toLowerCase().includes(query);
  });

  const resetPhoto = () => { setPhotoFile(null); setPhotoPreview(null); setPhotoChanged(false); };
  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); resetPhoto(); setShowModal(true); };
  const openEdit = (parent: ParentItem) => {
    setEditId(parent.id);
    setForm({ prenom: parent.prenom, nom: parent.nom, telephone: parent.telephone, email: parent.email });
    setPhotoFile(null);
    setPhotoPreview(parent.photoUrl ?? null);
    setPhotoChanged(false);
    setShowModal(true);
  };

  const openDetails = async (parent: ParentItem) => {
    setSelectedParent(parent);
    setChildren([]);
    setChildrenLoading(true);
    try {
      const res = await apiClient.get(`/admin/parents/${parent.id}/enfants`);
      const payload = res.data as ChildItem[] | { content?: ChildItem[]; data?: ChildItem[] };
      setChildren(Array.isArray(payload) ? payload : (payload.content ?? payload.data ?? []));
    } catch {
      toast.error('Erreur chargement des enfants');
    } finally {
      setChildrenLoading(false);
    }
  };

  const openChildDetail = async (child: ChildItem) => {
    setSelectedChild(child);
    setChildTab('notes');
    setChildNotes([]);
    setChildAbsences([]);
    setChildPlanning([]);
    setChildPaiements([]);
    setChildDataLoading(true);
    const id = child.id;
    const classeId = child.eleveClasse?.id ?? '';
    const [notesRes, absRes, planRes, paiRes] = await Promise.allSettled([
      apiClient.get('/admin/notes', { params: { eleveId: id } }),
      apiClient.get('/admin/absences-eleves', { params: { eleveId: id } }),
      classeId ? apiClient.get('/admin/emplois-du-temps', { params: { classeId } }) : Promise.resolve({ data: [] }),
      apiClient.get('/admin/paiements', { params: { eleveId: id } }),
    ]);
    const extract = (res: PromiseSettledResult<{ data: unknown }>) => {
      if (res.status !== 'fulfilled') return [];
      const d = res.value.data as Record<string, unknown>;
      return (Array.isArray(d) ? d : (d?.data ?? d?.content ?? d?.notes ?? d?.absences ?? d?.paiements ?? d?.cours ?? [])) as Record<string, unknown>[];
    };
    setChildNotes(extract(notesRes));
    setChildAbsences(extract(absRes));
    setChildPlanning(extract(planRes));
    setChildPaiements(extract(paiRes));
    setChildDataLoading(false);
  };

  const handleSubmit = () => {
    if (!form.prenom || !form.nom || !form.telephone) return;
    const normalizedForm = { ...form, prenom: formatFirstName(form.prenom.trim()), nom: formatLastName(form.nom.trim()) };
    if (editId) {
      const currentEditId = editId;
      updateParent.mutate({ id: currentEditId, data: normalizedForm }, {
        onSuccess: async () => {
          if (photoChanged && photoFile) {
            try {
              const resized = await resizeImageFile(photoFile);
              const fd = new FormData();
              fd.append('file', resized, 'photo.jpg');
              await apiClient.post(`/admin/users/${currentEditId}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } catch { /* photo upload non bloquant */ }
          }
          setShowModal(false);
        },
      });
    } else {
      createParent.mutate(normalizedForm, { onSuccess: () => { setShowModal(false); } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Parents</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{parents.length} parent{parents.length > 1 ? 's' : ''} inscrit{parents.length > 1 ? 's' : ''}</div>
        </div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Ajouter
        </button>
      </div>

      <div style={{ flexShrink: 0, padding: '14px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', maxWidth: 360 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un parent…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 38, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 160px 1.4fr 150px', gap: 14, padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 640 }}>
            {['Parent', 'Téléphone', 'Email', 'Actions'].map((header) => (
              <span key={header} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{header}</span>
            ))}
          </div>
          {filtered.map((parent, index) => (
            <div key={parent.id} onClick={() => openDetails(parent)} style={{ display: 'grid', gridTemplateColumns: '1.6fr 160px 1.4fr 150px', gap: 14, padding: '12px 18px', borderBottom: index < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 640, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                  {parent.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={parent.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(parent.prenom, parent.nom)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parentName(parent)}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Cliquer pour voir les enfants</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#475569' }}>{parent.telephone || '—'}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{parent.email || '—'}</span>
              <div style={{ display: 'flex', gap: 6 }} onClick={(event) => event.stopPropagation()}>
                <button onClick={() => openDetails(parent)} style={{ height: 28, padding: '0 10px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                  Détails
                </button>
                <button onClick={() => openEdit(parent)} style={{ height: 28, padding: '0 10px', border: '1px solid #e6ebf1', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                  Modifier
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun parent trouvé</div>
          )}
        </div>
      </div>

      {selectedParent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', display: 'flex', justifyContent: 'flex-end', zIndex: 900 }}>
          <div style={{ width: 460, height: '100%', background: '#fff', boxShadow: '-18px 0 50px rgba(15,23,42,.18)', display: 'flex', flexDirection: 'column' }}>
            {/* Header — bascule entre vue parent et vue enfant */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {selectedChild ? (
                <>
                  <button
                    onClick={() => setSelectedChild(null)}
                    title={parentName(selectedParent)}
                    style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#475569', padding: '6px 8px', display: 'flex', alignItems: 'center', borderRadius: 4, flexShrink: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div style={{ width: 36, height: 36, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    {initials(selectedChild.firstName, selectedChild.lastName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{childName(selectedChild)}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{selectedChild.eleveClasse?.nom ?? '—'} · {lienLabel(selectedParent.lienParente) ?? parentName(selectedParent)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
                    {selectedParent.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={selectedParent.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : initials(selectedParent.prenom, selectedParent.nom)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{parentName(selectedParent)}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Parent / Tuteur</div>
                  </div>
                </>
              )}
              <button onClick={() => { setSelectedParent(null); setSelectedChild(null); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 22, lineHeight: 1, flexShrink: 0, padding: '0 2px' }}>×</button>
            </div>

            {!selectedChild && <div style={{ padding: 22, borderBottom: '1px solid #eef2f6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Téléphone', selectedParent.telephone || '—'],
                ['Email', selectedParent.email || '—'],
                ['Enfants', String(children.length)],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
            </div>}

            {/* ── Vue liste enfants ── */}
            {!selectedChild && (
              <>
                <div style={{ padding: '18px 22px 10px', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Enfants élèves</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 22px' }}>
                  {childrenLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
                  ) : children.length === 0 ? (
                    <div style={{ padding: 18, background: '#f8fafc', border: '1px solid #e6ebf1', color: '#94a3b8', fontSize: 13 }}>Aucun enfant associé à ce parent.</div>
                  ) : children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => openChildDetail(child)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #eef2f6', cursor: 'pointer' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {child.photoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={child.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : initials(child.firstName, child.lastName)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{childName(child)}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{child.eleveClasse?.nom || child.matricule || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {lienLabel(selectedParent.lienParente ?? child.lienParente ?? child.lien ?? child.relation) && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 7px', whiteSpace: 'nowrap' }}>
                            {lienLabel(selectedParent.lienParente ?? child.lienParente ?? child.lien ?? child.relation)}
                          </span>
                        )}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Vue détail enfant ── */}
            {selectedChild && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
                  {(['notes', 'absences', 'planning', 'paiements'] as ChildTab[]).map((t) => (
                    <button key={t} onClick={() => setChildTab(t)} style={{ flex: 1, padding: '10px 0', fontSize: 11, fontWeight: childTab === t ? 700 : 500, color: childTab === t ? '#2563eb' : '#94a3b8', border: 'none', borderBottom: childTab === t ? '2px solid #2563eb' : '2px solid transparent', background: 'none', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                      {t === 'notes' ? 'Notes' : t === 'absences' ? 'Absences' : t === 'planning' ? 'Planning' : 'Paiements'}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                  {childDataLoading && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 30 }}>Chargement…</div>}

                  {!childDataLoading && childTab === 'notes' && (
                    childNotes.length === 0
                      ? <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 30 }}>Aucune note.</div>
                      : <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                          {childNotes.map((n, idx) => {
                            const mat = n.matiere as Record<string, unknown> | undefined;
                            const nomMat = (mat?.nom ?? n.nom ?? n.matiereNom ?? 'Matière') as string;
                            const coef = (mat?.coefficient ?? n.coefficient ?? n.coef ?? 1) as number;
                            const val = (n.valeur ?? n.note ?? n.noteValeur ?? 0) as number;
                            const col = NOTE_COLORS[idx % NOTE_COLORS.length];
                            const noteColor = val >= 14 ? '#16a34a' : val >= 10 ? '#0f172a' : '#dc2626';
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: idx < childNotes.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                                <div style={{ width: 28, height: 28, background: col.bg, borderLeft: `3px solid ${col.stroke}`, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{nomMat}</div>
                                  <div style={{ fontSize: 10, color: '#94a3b8' }}>coef. {coef}</div>
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: noteColor }}>{typeof val === 'number' ? val.toFixed(1).replace('.', ',') : val}</div>
                              </div>
                            );
                          })}
                        </div>
                  )}

                  {!childDataLoading && childTab === 'absences' && (
                    childAbsences.length === 0
                      ? <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 30 }}>Aucune absence.</div>
                      : <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                          {childAbsences.map((abs, idx) => {
                            const statut = (abs.statut ?? 'non_justifie') as string;
                            const isJust = statut === 'justifie' || statut === 'JUSTIFIE' || statut === 'APPROUVE';
                            const isRetard = statut === 'retard' || statut === 'RETARD';
                            const bc = isJust ? '#16a34a' : isRetard ? '#d97706' : '#dc2626';
                            const bg = isJust ? '#ecfdf5' : isRetard ? '#fffbeb' : '#fef2f2';
                            const label = isJust ? 'Justifiée' : isRetard ? 'Retard' : 'Non justifiée';
                            const mat = abs.matiere as Record<string, unknown> | string | undefined;
                            const matNom = typeof mat === 'string' ? mat : ((mat as Record<string, unknown>)?.nom ?? 'Cours') as string;
                            const date = (abs.date ?? abs.dateAbsence ?? abs.createdAt ?? '') as string;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderLeft: `3px solid ${bc}`, borderBottom: idx < childAbsences.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{matNom}</div>
                                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{date}</div>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: bc, background: bg, padding: '2px 7px' }}>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                  )}

                  {!childDataLoading && childTab === 'planning' && (
                    childPlanning.length === 0
                      ? <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 30 }}>Emploi du temps non disponible.</div>
                      : (() => {
                          const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
                          const byJour = JOURS.reduce<Record<string, PlanRow[]>>((acc, j) => {
                            const items = childPlanning.filter((c) => (c.jour as string | undefined)?.toLowerCase() === j.toLowerCase());
                            if (items.length) acc[j] = items;
                            return acc;
                          }, {});
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {JOURS.filter((j) => byJour[j]).map((jour) => (
                                <div key={jour}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{jour}</div>
                                  <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                                    {byJour[jour].map((c, ci) => {
                                      const mat = c.matiere as Record<string, unknown> | string | undefined;
                                      const matNom = (typeof mat === 'string' ? mat : (mat as Record<string, unknown>)?.nom as string) ?? 'Cours';
                                      return (
                                        <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: ci < byJour[jour].length - 1 ? '1px solid #eef2f6' : 'none' }}>
                                          <div style={{ width: 3, height: 28, background: '#2563eb', flexShrink: 0 }} />
                                          <div style={{ fontSize: 11, color: '#94a3b8', width: 80, flexShrink: 0 }}>{(c.heureDebut as string | undefined) ?? ''} – {(c.heureFin as string | undefined) ?? ''}</div>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{matNom}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()
                  )}

                  {!childDataLoading && childTab === 'paiements' && (
                    childPaiements.length === 0
                      ? <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 30 }}>Aucune échéance.</div>
                      : <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                          {childPaiements.map((p, idx) => {
                            const isPaid = p.statut === 'paye' || p.statut === 'PAYE' || p.statut === 'VALIDE';
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderLeft: `3px solid ${isPaid ? '#16a34a' : '#dc2626'}`, borderBottom: idx < childPaiements.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{(p.libelle ?? p.description ?? 'Paiement') as string}</div>
                                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{(p.date ?? p.datePaiement ?? '') as string}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{((p.montant as number) ?? 0).toLocaleString('fr-FR')} F</div>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: isPaid ? '#16a34a' : '#dc2626' }}>{isPaid ? 'Payé' : 'À payer'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 440, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editId ? 'Modifier le parent' : 'Nouveau parent'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Prénom *</label>
                <input value={form.prenom} onChange={(event) => setForm((current) => ({ ...current, prenom: formatFirstName(event.target.value) }))} placeholder="Ibrahima" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom *</label>
                <input value={form.nom} onChange={(event) => setForm((current) => ({ ...current, nom: formatLastName(event.target.value) }))} placeholder="Diallo" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Téléphone *</label>
              <input value={form.telephone} onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))} placeholder="+221 77 000 00 00" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: editId ? 14 : 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Email (optionnel)</label>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="email@gmail.com" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {editId && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Photo (optionnel)</label>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFile(file);
                  setPhotoChanged(true);
                  const reader = new FileReader();
                  reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }} />
                <div
                  onClick={() => photoInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1.5px dashed #d9e0e8', cursor: 'pointer', background: '#f8fafc' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {photoPreview
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{photoChanged ? 'Changer la photo' : 'Ajouter une photo'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>JPG, PNG — max 5 Mo</div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSubmit} disabled={(createParent.isPending || updateParent.isPending) || !form.prenom || !form.nom || !form.telephone} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (!form.prenom || !form.nom || !form.telephone) ? 0.5 : 1 }}>
                {(createParent.isPending || updateParent.isPending) ? 'Enregistrement…' : (editId ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
