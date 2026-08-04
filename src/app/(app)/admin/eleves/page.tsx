'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { AxiosError } from 'axios';
import { formatFirstName, formatLastName } from '@/lib/person-name';
import { useCreateEleve, useUpdateEleve } from '@/hooks/use-query-api';

type EleveItem = Record<string, unknown>;
type ClasseItem = { id: string; nom: string };
type ParentItem = { id: string; firstName?: string; lastName?: string; prenom?: string; nom?: string; telephone?: string; email?: string };
type Credentials = { username: string; password: string } | null;

type EleveForm = {
  prenom: string; nom: string; dateNaissance: string; lieuNaissance: string;
  genre: string; telephone: string;
  numeroUrgence: string; email: string; adresse: string;
  parentIds: string[];
};

type FormErrors = Partial<Record<keyof EleveForm, string>>;
const DEFAULT_PAGE_SIZE = 10;

function pageItems<T>(items: T[], page: number) {
  return items.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);
}
function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
}
function PaginationControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = pageCount(total);
  const start = total === 0 ? 0 : (page - 1) * DEFAULT_PAGE_SIZE + 1;
  const end = Math.min(total, page * DEFAULT_PAGE_SIZE);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{start}-{end} sur {total}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Préc.</button>
        <span style={{ fontSize: 12, color: '#64748b' }}>{page}/{totalPages}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Suiv.</button>
      </div>
    </div>
  );
}

const EMPTY_FORM: EleveForm = {
  prenom: '', nom: '', dateNaissance: '', lieuNaissance: '',
  genre: 'M', telephone: '',
  numeroUrgence: '', email: '', adresse: '', parentIds: [],
};

const PHONE_RE = /^[+\d][\d\s\-().]{6,19}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(form: EleveForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.prenom.trim()) errors.prenom = 'Le prénom est requis';
  if (!form.nom.trim())    errors.nom    = 'Le nom est requis';
  if (form.dateNaissance) {
    const d = new Date(form.dateNaissance);
    if (isNaN(d.getTime())) errors.dateNaissance = 'Date invalide';
    else if (d > new Date()) errors.dateNaissance = 'Date dans le futur';
  }
  if (form.telephone.trim() && !PHONE_RE.test(form.telephone.trim()))
    errors.telephone = 'Numéro de téléphone invalide';
  if (form.numeroUrgence.trim() && !PHONE_RE.test(form.numeroUrgence.trim()))
    errors.numeroUrgence = 'Numéro invalide';
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim()))
    errors.email = 'Adresse email invalide';
  return errors;
}

const STATUT_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  actif:    { color: '#16a34a', bg: '#dcfce7', label: 'Actif' },
  suspendu: { color: '#d97706', bg: '#fef3c7', label: 'Suspendu' },
  inactif:  { color: '#94a3b8', bg: '#f1f5f9', label: 'Inactif' },
};

function parentLabel(p: ParentItem): string {
  const first = p.firstName ?? p.prenom ?? '';
  const last  = p.lastName  ?? p.nom   ?? '';
  return `${first} ${last}`.trim();
}

function dateInputValue(value: unknown): string {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

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

function inp(extra?: React.CSSProperties): React.CSSProperties {
  return { height: 38, width: '100%', border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff', ...extra };
}
function lbl(): React.CSSProperties {
  return { display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5 };
}

export default function ElevesAdminPage() {
  const router = useRouter();

  // ── Data ──────────────────────────────────────────────────────────
  const [eleves, setEleves]       = useState<EleveItem[]>([]);
  const [totalCount, setTotal]    = useState(0);
  const [classes, setClasses]     = useState<ClasseItem[]>([]);

  // ── Filters ───────────────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterStatut, setFilterStatut] = useState('actif');
  const [elevesPage, setElevesPage] = useState(1);

  // ── Modal ─────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]   = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials>(null);
  const [saving, setSaving]         = useState(false);
  const [cardModal, setCardModal] = useState<{ eleve: EleveItem; rectoUrl: string } | null>(null);
  const [cardLoadingId, setCardLoadingId] = useState<string | null>(null);

  // ── Inscription modal ──────────────────────────────────────────────
  const [inscriModal, setInscriModal] = useState<EleveItem | null>(null);
  const [inscriClasseId, setInscriClasseId] = useState('');
  const [inscriSaving, setInscriSaving] = useState(false);
  const [anneeCouranteId, setAnneeCouranteId] = useState('');

  // ── Detail drawer ─────────────────────────────────────────────────
  type DocItem = { id: string; type: string; typeLabel: string; nom: string; mimeType: string; taille: number; createdAt: string };
  const [detailEleve, setDetailEleve]   = useState<EleveItem | null>(null);
  const [detailTab, setDetailTab]       = useState<'profil' | 'documents'>('profil');
  const [docs, setDocs]                 = useState<DocItem[]>([]);
  const [docsLoading, setDocsLoading]   = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadType, setDocUploadType] = useState('EXTRAIT_NAISSANCE');
  const docInputRef = useRef<HTMLInputElement>(null);

  const DOC_TYPES = [
    { value: 'EXTRAIT_NAISSANCE', label: 'Extrait de naissance' },
    { value: 'PHOTO_CNI',         label: 'Photo / CNI' },
    { value: 'VISITE_MEDICALE',   label: 'Visite médicale' },
    { value: 'CARNET_SANTE',      label: 'Carnet de santé' },
    { value: 'VACCINATION',       label: 'Carnet de vaccination' },
    { value: 'DIPLOME',           label: 'Diplôme / Attestation' },
    { value: 'PHOTO',             label: 'Photo' },
    { value: 'AUTRE',             label: 'Autre document' },
  ];

  const fetchDocs = useCallback((eleveId: string) => {
    setDocsLoading(true);
    apiClient.get(`/admin/eleves/${eleveId}/documents`)
      .then((r) => setDocs((r.data?.data ?? r.data) as DocItem[]))
      .catch(() => {})
      .finally(() => setDocsLoading(false));
  }, []);

  const openDetail = useCallback((e: EleveItem) => {
    setDetailEleve(e);
    setDetailTab('profil');
    setDocs([]);
    fetchDocs(String(e.id ?? e.eleveId ?? ''));
  }, [fetchDocs]);

  const uploadOneDocument = useCallback((file: File) => {
    if (!detailEleve) return;
    const eleveId = String(detailEleve.id ?? detailEleve.eleveId ?? '');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) { toast.error('Fichier invalide'); return; }
      const [, mimeType, fileBase64] = match;
      setDocUploading(true);
      apiClient.post(`/admin/eleves/${eleveId}/documents`, {
        type: docUploadType, nom: file.name.replace(/\.[^.]+$/, ''), fileBase64, mimeType,
      }).then((r) => {
        const doc = (r.data?.data ?? r.data) as DocItem;
        setDocs((prev) => [doc, ...prev]);
        toast.success('Document ajouté');
      }).catch(() => toast.error('Erreur lors de l\'upload'))
        .finally(() => setDocUploading(false));
    };
    reader.readAsDataURL(file);
  }, [detailEleve, docUploadType]);

  const handleDocUpload = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    if (list.length === 1) {
      uploadOneDocument(list[0]);
      return;
    }
    setDocUploading(true);
    (async () => {
      for (const file of list) {
        await new Promise<void>((resolve) => {
          if (!detailEleve) { resolve(); return; }
          const eleveId = String(detailEleve.id ?? detailEleve.eleveId ?? '');
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const dataUrl = reader.result as string;
              const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
              if (!match) throw new Error('Fichier invalide');
              const [, mimeType, fileBase64] = match;
              const r = await apiClient.post(`/admin/eleves/${eleveId}/documents`, {
                type: docUploadType, nom: file.name.replace(/\.[^.]+$/, ''), fileBase64, mimeType,
              });
              const doc = (r.data?.data ?? r.data) as DocItem;
              setDocs((prev) => [doc, ...prev]);
            } catch {
              toast.error(`Erreur upload : ${file.name}`);
            } finally {
              resolve();
            }
          };
          reader.onerror = () => { toast.error(`Fichier illisible : ${file.name}`); resolve(); };
          reader.readAsDataURL(file);
        });
      }
      toast.success(`${list.length} document(s) ajouté(s)`);
      setDocUploading(false);
    })();
  }, [detailEleve, docUploadType, uploadOneDocument]);

  const handleDocView = useCallback(async (doc: DocItem) => {
    if (!detailEleve) return;
    const eleveId = String(detailEleve.id ?? detailEleve.eleveId ?? '');
    try {
      const r = await apiClient.get(`/admin/eleves/${eleveId}/documents/${doc.id}/url`);
      const url = (r.data?.data ?? r.data)?.url ?? r.data?.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch { toast.error('Impossible d\'ouvrir le document'); }
  }, [detailEleve]);

  const handleDocDelete = useCallback(async (doc: DocItem) => {
    if (!detailEleve || !confirm(`Supprimer "${doc.nom}" ?`)) return;
    const eleveId = String(detailEleve.id ?? detailEleve.eleveId ?? '');
    try {
      await apiClient.delete(`/admin/eleves/${eleveId}/documents/${doc.id}`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Document supprimé');
    } catch { toast.error('Erreur lors de la suppression'); }
  }, [detailEleve]);

  // ── Action menu (table row dropdown) ─────────────────────────────
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const toggleActionMenu = (key: string, event: React.MouseEvent<HTMLButtonElement>, width = 150) => {
    event.stopPropagation();
    (event.nativeEvent as MouseEvent & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
    if (openActionMenu === key) { setOpenActionMenu(null); setActionMenuPos(null); return; }
    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = 180;
    const below = rect.bottom + 4;
    const top = below + estimatedHeight > window.innerHeight ? Math.max(8, rect.top - estimatedHeight - 4) : below;
    setActionMenuPos({ width, left: Math.max(8, rect.right - width), top });
    setOpenActionMenu(key);
  };

  const actionMenuStyle = (): React.CSSProperties => ({
    position: 'fixed',
    left: actionMenuPos?.left ?? 0,
    top: actionMenuPos?.top ?? 0,
    width: actionMenuPos?.width ?? 150,
    background: '#fff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 12px 30px rgba(15,23,42,.16)',
    zIndex: 5000,
    padding: 4,
    textAlign: 'left',
  });

  const handleExclureEleve = async (e: EleveItem) => {
    const prenom = String(e.prenom ?? e.firstName ?? '');
    const nom = String(e.nom ?? e.lastName ?? '');
    const nbAnneesRaw = prompt(`Exclure ${prenom} ${nom} pour combien d'années scolaires ?`, '1');
    if (!nbAnneesRaw) return;
    const nbAnnees = Math.max(1, Math.min(10, Number(nbAnneesRaw) || 1));
    if (!confirm(`Confirmer l'exclusion de ${prenom} ${nom} pour ${nbAnnees} année(s) ?`)) return;
    try {
      await apiClient.patch(`/admin/eleves/${String(e.id ?? e.eleveId)}/exclure`, { nbAnnees });
      toast.success('Élève exclu');
      fetchEleves();
    } catch { toast.error('Erreur lors de l\'exclusion'); }
  };

  const handleDesactiverEleve = async (e: EleveItem) => {
    const prenom = String(e.prenom ?? e.firstName ?? '');
    const nom = String(e.nom ?? e.lastName ?? '');
    if (!confirm(`Désactiver l'inscription de ${prenom} ${nom} ?`)) return;
    try {
      await apiClient.patch(`/admin/eleves/${String(e.id ?? e.eleveId)}/desactiver`);
      toast.success('Inscription désactivée');
      fetchEleves();
    } catch { toast.error('Erreur lors de la désactivation'); }
  };

  // ── Form ──────────────────────────────────────────────────────────
  const [form, setForm]         = useState<EleveForm>(EMPTY_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [photoFile, setPhotoFile]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoChanged, setPhotoChanged] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── Parent search ─────────────────────────────────────────────────
  const [parentSearch, setParentSearch]       = useState('');
  const [parentResults, setParentResults]     = useState<ParentItem[]>([]);
  const [parentLoading, setParentLoading]     = useState(false);
  const [parentDropOpen, setParentDropOpen]   = useState(false);
  const [selectedParent, setSelectedParent]   = useState<ParentItem | null>(null);
  const [lienParente, setLienParente]         = useState('');
  const [showParentForm, setShowParentForm]   = useState(false);
  const [parentForm, setParentForm]           = useState({ prenom: '', nom: '', telephone: '', email: '' });
  const [creatingParent, setCreatingParent]   = useState(false);
  const parentSearchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createEleve = useCreateEleve();
  const updateEleve = useUpdateEleve();

  // ── Fetch helpers ─────────────────────────────────────────────────
  const fetchEleves = useCallback(() => {
    const params: Record<string, string> = {};
    if (filterClasse) params['classeId'] = filterClasse;
    if (filterStatut) params['statut']   = filterStatut;
    if (search)       params['search']   = search;
    apiClient.get('/admin/eleves', { params }).then((r) => {
      const d = r.data as Record<string, unknown>;
      const list = Array.isArray(d) ? d : ((d?.data ?? d?.content ?? d?.eleves ?? []) as EleveItem[]);
      setEleves(list as EleveItem[]);
      setTotal(Number(d?.total ?? d?.count ?? list.length));
    }).catch(() => {});
  }, [filterClasse, filterStatut, search]);

  useEffect(() => { fetchEleves(); }, [fetchEleves]);

  useEffect(() => {
    apiClient.get('/admin/classes').then((r) => {
      const d = r.data as Record<string, unknown>;
      const list = Array.isArray(d) ? d : ((d?.data ?? d?.content ?? []) as ClasseItem[]);
      setClasses(list as ClasseItem[]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    apiClient.get('/v1/annees-academiques/courante')
      .then((r) => { const d = r.data?.data ?? r.data; setAnneeCouranteId(String(d?.id ?? '')); })
      .catch(() => {});
  }, []);

  const handleInscrire = async () => {
    if (!inscriModal || !inscriClasseId) { toast.error('Veuillez sélectionner une classe'); return; }
    if (!anneeCouranteId) { toast.error('Aucune année académique active'); return; }
    setInscriSaving(true);
    try {
      await apiClient.post('/v1/inscriptions', {
        eleveId: String(inscriModal.id ?? inscriModal.eleveId),
        classeId: inscriClasseId,
        anneeAcademiqueId: anneeCouranteId,
      });
      toast.success('Élève inscrit avec succès');
      setInscriModal(null);
      setInscriClasseId('');
      fetchEleves();
    } catch {
      toast.error('Erreur lors de l\'inscription');
    } finally {
      setInscriSaving(false);
    }
  };

  const goToInscription = (e: EleveItem) => {
    const params = new URLSearchParams({
      inscrire: String(e.id ?? e.eleveId ?? ''),
      prenom: String(e.prenom ?? e.firstName ?? ''),
      nom: String(e.nom ?? e.lastName ?? ''),
    });
    const matricule = String(e.matricule ?? '');
    if (matricule) params.set('matricule', matricule);
    router.push(`/admin/inscriptions?${params.toString()}`);
  };

  // ── Parent search debounce ────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!parentSearch.trim()) { setParentResults([]); setParentDropOpen(false); return; }
    debounceRef.current = setTimeout(() => {
      setParentLoading(true);
      apiClient.get('/admin/parents', { params: { search: parentSearch } }).then((r) => {
        const d = r.data as Record<string, unknown>;
        const list = Array.isArray(d) ? d : ((d?.data ?? d?.content ?? []) as ParentItem[]);
        setParentResults(list as ParentItem[]);
        setParentDropOpen(true);
      }).catch(() => {}).finally(() => setParentLoading(false));
    }, 300);
  }, [parentSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (parentSearchRef.current && !parentSearchRef.current.contains(e.target as Node)) {
        setParentDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!openActionMenu) return;
    const handler = () => { setOpenActionMenu(null); setActionMenuPos(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openActionMenu]);

  // ── Open modal ────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null); setCredentials(null); setErrors({});
    setForm(EMPTY_FORM);
    setPhotoFile(null); setPhotoPreview(''); setPhotoChanged(false);
    setParentSearch(''); setSelectedParent(null); setLienParente(''); setParentResults([]);
    setShowParentForm(false); setParentForm({ prenom: '', nom: '', telephone: '', email: '' });
    setModalOpen(true);
  };

  const openEdit = (e: EleveItem) => {
    setEditId(String(e.id ?? e.eleveId));
    setCredentials(null); setErrors({});
    setPhotoFile(null); setPhotoPreview(String(e.photoUrl ?? '')); setPhotoChanged(false);
    const elevParents = e.elevParents as Array<{ parent: ParentItem; lienParente?: string }> | undefined;
    const parentEntry = elevParents?.[0];
    const parentRaw = parentEntry?.parent ?? (e.parent as ParentItem | undefined);
    let sp: ParentItem | null = null;
    let pid = '';
    if (parentRaw && typeof parentRaw === 'object') {
      const p = parentRaw as ParentItem;
      sp = p; pid = String(p.id ?? '');
    }
    setSelectedParent(sp);
    setLienParente(parentEntry?.lienParente ?? (e.lienParente as string | undefined) ?? '');
    setParentSearch(sp ? parentLabel(sp) : '');
    setParentResults([]); setParentDropOpen(false);
    setShowParentForm(false); setParentForm({ prenom: '', nom: '', telephone: '', email: '' });
    setForm({
      prenom:        String(e.prenom ?? e.firstName ?? ''),
      nom:           String(e.nom    ?? e.lastName  ?? ''),
      dateNaissance: dateInputValue(e.dateNaissance),
      lieuNaissance: String(e.lieuNaissance ?? ''),
      genre:         String(e.genre ?? 'M'),
      telephone:     String(e.telephone ?? ''),
      numeroUrgence: String(e.numeroUrgence ?? ''),
      email:         String(e.email ?? ''),
      adresse:       String(e.adresse ?? ''),
      parentIds:     pid ? [pid] : [],
    });
    setModalOpen(true);
  };

  // ── Photo ─────────────────────────────────────────────────────────
  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoChanged(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(String(ev.target?.result ?? ''));
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview('');
    }
  };

  const uploadStudentPhoto = async (eleveId: string) => {
    if (!photoChanged) return false;
    if (photoFile) {
      const resized = await resizeImageFile(photoFile);
      const data = new FormData();
      data.append('file', resized, `${photoFile.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`);
      await apiClient.post(`/admin/users/${eleveId}/photo`, data);
      return true;
    }
    if (!photoPreview.startsWith('data:image/')) return false;
    await apiClient.post(`/admin/users/${eleveId}/photo`, { photoUrl: photoPreview });
    return true;
  };


  // ── Parent inline create ──────────────────────────────────────────
  const handleCreateParent = async () => {
    if (!parentForm.prenom.trim() || !parentForm.nom.trim()) {
      toast.error('Prénom et nom du parent requis'); return;
    }
    setCreatingParent(true);
    try {
      const r = await apiClient.post('/admin/parents', {
        firstName: formatFirstName(parentForm.prenom.trim()),
        lastName:  formatLastName(parentForm.nom.trim()),
        telephone: parentForm.telephone.trim() || undefined,
        email:     parentForm.email.trim()     || undefined,
      });
      const created = (r.data?.data ?? r.data) as ParentItem;
      setSelectedParent(created);
      setForm((f) => ({ ...f, parentIds: [String(created.id)] }));
      setParentSearch(parentLabel(created));
      setShowParentForm(false);
      setParentForm({ prenom: '', nom: '', telephone: '', email: '' });
      toast.success('Parent créé et sélectionné');
    } catch {
      toast.error('Erreur lors de la création du parent');
    } finally {
      setCreatingParent(false);
    }
  };

  // ── Save eleve ────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName:     formatFirstName(form.prenom.trim()),
        lastName:      formatLastName(form.nom.trim()),
        dateNaissance: form.dateNaissance || undefined,
        lieuNaissance: form.lieuNaissance.trim() || undefined,
        genre:         form.genre,
        telephone:     form.telephone.trim() || undefined,
        numeroUrgence: form.numeroUrgence.trim() || undefined,
        email:         form.email.trim() || undefined,
        adresse:       form.adresse.trim() || undefined,
        parentIds:     form.parentIds.length > 0 ? form.parentIds : undefined,
      };

      if (editId) {
        await updateEleve.mutateAsync({ id: editId, data: payload });
        try { await uploadStudentPhoto(editId); } catch (photoErr) {
          const photoMsg = photoErr instanceof AxiosError && typeof photoErr.response?.data?.message === 'string'
            ? photoErr.response.data.message : 'Impossible d\'enregistrer la photo';
          toast.error(photoMsg);
        }
        if (selectedParent && lienParente) {
          await apiClient.put(`/admin/parents/${selectedParent.id}`, { lienParente }).catch(() => {});
        }
        setModalOpen(false);
        fetchEleves();
      } else {
        const result = await createEleve.mutateAsync(payload);
        const resultRecord = result as unknown as Record<string, unknown>;
        const res = (resultRecord.data ?? resultRecord) as Record<string, unknown>;
        const newId = String((res as Record<string, unknown>)?.id ?? (res as Record<string, unknown>)?.eleveId ?? '');
        let cardUrl = String((res as Record<string, unknown>)?.cardUrl ?? (res as Record<string, unknown>)?.cardImageUrl ?? '');
        if (newId) {
          try { await uploadStudentPhoto(newId); } catch (photoErr) {
            const photoMsg = photoErr instanceof AxiosError && typeof photoErr.response?.data?.message === 'string'
              ? photoErr.response.data.message : 'Impossible d\'enregistrer la photo';
            toast.error(photoMsg);
          }
          try {
            const cardRes = await apiClient.post(`/admin/users/${newId}/carte-scolaire`);
            const cardData = (cardRes.data?.data ?? cardRes.data) as Record<string, unknown>;
            cardUrl = String(cardData.cardUrl ?? cardData.cardImageUrl ?? cardUrl);
          } catch {
            // la carte initiale reste disponible si la régénération échoue
          }
        }
        const creds = (res as Record<string, unknown>)?.credentials as Record<string, unknown> | undefined;
        if (creds?.username) {
          setCredentials({ username: String(creds.username), password: String(creds.password ?? '') });
        }
        if (cardUrl) window.open(cardUrl, '_blank', 'noopener,noreferrer');
        if (selectedParent && lienParente) {
          await apiClient.put(`/admin/parents/${selectedParent.id}`, { lienParente }).catch(() => {});
        }
        setModalOpen(false);
        fetchEleves();
      }
    } catch (err) {
      const msg = err instanceof AxiosError && typeof err.response?.data?.message === 'string'
        ? err.response.data.message
        : 'Erreur lors de l\'enregistrement';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openStudentCard = async (e: EleveItem) => {
    const id = String(e.id ?? e.eleveId ?? '');
    if (!id) { toast.error('Élève introuvable'); return; }
    setCardLoadingId(id);
    try {
      const r = await apiClient.post(`/admin/users/${id}/carte-scolaire`);
      const data = (r.data?.data ?? r.data) as { cardUrl?: string | null; cardImageUrl?: string | null; cardPdfUrl?: string | null };
      const rectoUrl = data.cardUrl ?? data.cardImageUrl ?? data.cardPdfUrl;
      if (!rectoUrl) throw new Error('Carte introuvable');
      setCardModal({ eleve: e, rectoUrl });
    } catch {
      toast.error('Impossible de charger la carte scolaire');
    } finally {
      setCardLoadingId(null);
    }
  };

  const setField = (key: keyof EleveForm, val: string) => setForm((f) => ({ ...f, [key]: val }));
  useEffect(() => { setElevesPage(1); }, [search, filterClasse, filterStatut]);
  useEffect(() => { setElevesPage((page) => Math.min(page, pageCount(eleves.length))); }, [eleves.length]);
  const pagedEleves = pageItems(eleves, elevesPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
          Élèves <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>· {totalCount}</span>
        </div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 40, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Ajouter un élève
        </button>
      </div>

      {/* Credentials Banner */}
      {credentials && (
        <div style={{ flexShrink: 0, margin: '14px 28px 0', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>Élève créé — Identifiants générés</div>
              <div style={{ fontSize: 13, color: '#166534', display: 'flex', gap: 20 }}>
                <span>Identifiant : <strong style={{ background: '#dcfce7', padding: '1px 8px' }}>{credentials.username}</strong></span>
                <span>Mot de passe : <strong style={{ background: '#dcfce7', padding: '1px 8px' }}>{credentials.password}</strong></span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Communiquez ces identifiants à l'élève. Le mot de passe devra être changé à la première connexion.</div>
            </div>
            <button onClick={() => setCredentials(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', padding: '0 13px', background: '#fff', maxWidth: 380 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, matricule…" style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', outline: 'none', width: '100%', height: 38, fontFamily: 'inherit' }} />
        </div>
        <select value={filterClasse} onChange={(e) => setFilterClasse(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Toutes les classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="suspendu">Suspendus</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 28px 0' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 110px 90px', gap: 14, padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', flexShrink: 0, alignItems: 'center', textAlign: 'left' }}>
            {['Élève', 'Classe', 'Genre', 'Parent', 'Statut', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {eleves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Aucun élève trouvé</div>
            ) : pagedEleves.map((e, idx) => {
              const prenom  = String(e.prenom  ?? e.firstName ?? '');
              const nom     = String(e.nom     ?? e.lastName  ?? '');
              const matricule = String(e.matricule ?? '');
              const classeRaw = e.classe as Record<string, unknown> | undefined;
              const classeNom = classeRaw ? String(classeRaw.nom ?? '') : String(e.classeNom ?? '—');
              const elevParents = e.elevParents as Array<{ parent: ParentItem }> | undefined;
              const parentRaw = elevParents?.[0]?.parent ?? (e.parent as ParentItem | undefined);
              const parentNom = parentRaw ? parentLabel(parentRaw) : '—';
              const statut = String(e.statut ?? (e.actif === false ? 'inactif' : 'actif'));
              const genre  = String(e.genre ?? '');
              const ss     = STATUT_STYLES[statut] ?? STATUT_STYLES.actif;
              const initials = ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase();
              const photoUrl = String(e.photoUrl ?? '');
              return (
                <div key={String(e.id ?? idx)} onClick={() => openDetail(e)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 110px 90px', gap: 14, alignItems: 'center', textAlign: 'left', padding: '11px 18px', borderBottom: idx < pagedEleves.length - 1 ? '1px solid #eef2f6' : 'none', cursor: 'pointer', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    {photoUrl ? (
                      <img src={photoUrl} style={{ width: 36, height: 36, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} alt="" />
                    ) : (
                      <div style={{ width: 36, height: 36, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                    )}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{prenom} {nom}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{matricule}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: '#475569' }}>{classeNom}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{genre === 'M' ? 'Masculin' : genre === 'F' ? 'Féminin' : '—'}</span>
                  <span style={{ fontSize: 13, color: '#475569' }}>{parentNom}</span>
                  <span><span style={{ fontSize: 11, fontWeight: 600, color: ss.color, background: ss.bg, padding: '3px 9px' }}>{ss.label}</span></span>
                  <div onClick={(ev) => ev.stopPropagation()} style={{ position: 'relative' }}>
                    <button
                      onMouseDown={(ev) => { ev.stopPropagation(); (ev.nativeEvent as MouseEvent & { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.(); }}
                      onClick={(ev) => toggleActionMenu(`elv-${String(e.id ?? idx)}`, ev, 140)}
                      style={{ height: 28, minWidth: 34, border: '1px solid #dbe4ef', background: '#fff', color: '#475569', fontSize: 16, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }}
                    >⋯</button>
                    {openActionMenu === `elv-${String(e.id ?? idx)}` && (
                      <div style={actionMenuStyle()} onMouseDown={(ev) => { ev.stopPropagation(); ev.nativeEvent.stopImmediatePropagation(); }} onClick={(ev) => ev.stopPropagation()}>
                        <button onMouseDown={() => { setOpenActionMenu(null); openEdit(e); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff', color: '#334155', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Modifier</button>
                        <button onMouseDown={() => { setOpenActionMenu(null); goToInscription(e); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff', color: '#2563eb', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Inscrire</button>
                        <button onMouseDown={() => { setOpenActionMenu(null); openStudentCard(e); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff', color: '#7c3aed', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Carte scolaire</button>
                        <button onMouseDown={() => { setOpenActionMenu(null); handleDesactiverEleve(e); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff', color: '#d97706', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Désactiver</button>
                        <button onMouseDown={() => { setOpenActionMenu(null); handleExclureEleve(e); }} style={{ width: '100%', height: 30, border: 'none', background: '#fff5f5', color: '#991b1b', textAlign: 'left', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>Exclure</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid #eef2f6' }}>
            <PaginationControls page={elevesPage} total={eleves.length} onPageChange={setElevesPage} />
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 700, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{editId ? 'Modifier l\'élève' : 'Nouvel élève'}</div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Photo */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  onClick={() => photoInputRef.current?.click()}
                  style={{ width: 72, height: 72, background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="photo" />
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Photo de l'élève</div>
                  <button onClick={() => photoInputRef.current?.click()} style={{ height: 30, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                    {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
                  </button>
                  {photoFile && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{photoFile.name}</div>}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhotoChange} />
              </div>

              {/* Identité */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Identité</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

                {/* Prénom */}
                <div>
                  <label style={lbl()}>Prénom <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={form.prenom} onChange={(e) => { setField('prenom', formatFirstName(e.target.value)); setErrors((er) => ({ ...er, prenom: undefined })); }} placeholder="Awa" style={inp(errors.prenom ? { borderColor: '#dc2626' } : {})} />
                  {errors.prenom && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.prenom}</div>}
                </div>

                {/* Nom */}
                <div>
                  <label style={lbl()}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={form.nom} onChange={(e) => { setField('nom', formatLastName(e.target.value)); setErrors((er) => ({ ...er, nom: undefined })); }} placeholder="NDIAYE" style={inp(errors.nom ? { borderColor: '#dc2626' } : {})} />
                  {errors.nom && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.nom}</div>}
                </div>

                {/* Date de naissance */}
                <div>
                  <label style={lbl()}>Date de naissance</label>
                  <input type="date" value={form.dateNaissance} onChange={(e) => { setField('dateNaissance', e.target.value); setErrors((er) => ({ ...er, dateNaissance: undefined })); }} style={inp(errors.dateNaissance ? { borderColor: '#dc2626' } : {})} />
                  {errors.dateNaissance && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors.dateNaissance}</div>}
                </div>

                {/* Lieu de naissance */}
                <div>
                  <label style={lbl()}>Lieu de naissance</label>
                  <input value={form.lieuNaissance} onChange={(e) => setField('lieuNaissance', e.target.value.toUpperCase())} placeholder="DAKAR" style={inp()} />
                </div>

                {/* Genre */}
                <div>
                  <label style={lbl()}>Genre <span style={{ color: '#dc2626' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: 'M', l: 'Masculin' }, { v: 'F', l: 'Féminin' }].map(({ v, l }) => (
                      <button key={v} onClick={() => setField('genre', v)} style={{ height: 38, flex: 1, border: `2px solid ${form.genre === v ? '#2563eb' : '#d9e0e8'}`, background: form.genre === v ? '#eff6ff' : '#fff', color: form.genre === v ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Contact */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, marginTop: 4 }}>Contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Téléphone',     key: 'telephone'     as keyof EleveForm, placeholder: '+221 77 000 00 00' },
                  { label: 'N° d\'urgence', key: 'numeroUrgence' as keyof EleveForm, placeholder: '+221 77 000 00 00' },
                  { label: 'Email',         key: 'email'         as keyof EleveForm, placeholder: 'eleve@ecole.sn' },
                  { label: 'Adresse',       key: 'adresse'       as keyof EleveForm, placeholder: 'DAKAR' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={lbl()}>{label}</label>
                    <input
                      value={form[key] as string}
                      onChange={(e) => { const v = key === 'adresse' ? e.target.value.toUpperCase() : e.target.value; setField(key, v); setErrors((er) => ({ ...er, [key]: undefined })); }}
                      placeholder={placeholder}
                      style={inp(errors[key] ? { borderColor: '#dc2626' } : {})}
                    />
                    {errors[key] && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{errors[key]}</div>}
                  </div>
                ))}
              </div>

              {/* Parent / Tuteur */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, marginTop: 4 }}>Parent / Tuteur</div>
              <div style={{ marginBottom: 14 }}>
                {/* Parent search */}
                <div ref={parentSearchRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>Parent / Tuteur</label>
                    <button
                      onClick={() => { setShowParentForm((v) => !v); setParentDropOpen(false); }}
                      style={{ height: 22, padding: '0 10px', border: '1px solid #2563eb', background: showParentForm ? '#2563eb' : '#eff6ff', color: showParentForm ? '#fff' : '#2563eb', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      {showParentForm ? '✕ Fermer' : '+ Ajouter parent'}
                    </button>
                  </div>
                  {selectedParent ? (
                    <div style={{ display: 'flex', alignItems: 'center', height: 38, border: '1px solid #d9e0e8', background: '#f8fafc', padding: '0 10px', gap: 8 }}>
                      <div style={{ flex: 1, fontSize: 13, color: '#0f172a' }}>
                        <strong>{parentLabel(selectedParent)}</strong>
                        {selectedParent.telephone && <span style={{ color: '#64748b', fontSize: 12 }}> · {selectedParent.telephone}</span>}
                      </div>
                      <button
                        onClick={() => { setSelectedParent(null); setForm((f) => ({ ...f, parentIds: [] })); setParentSearch(''); setLienParente(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0, lineHeight: 1 }}
                      >✕</button>
                    </div>
                  ) : (
                    <input
                      value={parentSearch}
                      onChange={(e) => { setParentSearch(e.target.value); setParentDropOpen(true); }}
                      onFocus={() => { if (parentSearch) setParentDropOpen(true); }}
                      placeholder="Rechercher par nom, prénom, téléphone…"
                      style={inp()}
                    />
                  )}

                  {/* Dropdown */}
                  {parentDropOpen && !selectedParent && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d9e0e8', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 100, maxHeight: 220, overflowY: 'auto' }}>
                      {parentLoading && (
                        <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8' }}>Recherche…</div>
                      )}
                      {!parentLoading && parentResults.length === 0 && parentSearch.trim() && (
                        <div style={{ padding: '12px 14px', fontSize: 13, color: '#64748b' }}>
                          Aucun parent trouvé pour « {parentSearch} »
                        </div>
                      )}
                      {!parentLoading && parentResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => { setSelectedParent(p); setForm((f) => ({ ...f, parentIds: [String(p.id)] })); setParentSearch(parentLabel(p)); setParentDropOpen(false); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{parentLabel(p)}</div>
                          {p.telephone && <div style={{ fontSize: 11, color: '#64748b' }}>{p.telephone}</div>}
                          {p.email && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.email}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lien de parenté */}
                {selectedParent && (
                  <div style={{ marginTop: 10 }}>
                    <label style={lbl()}>Lien de parenté</label>
                    <select
                      value={lienParente}
                      onChange={(e) => setLienParente(e.target.value)}
                      style={{ ...inp(), height: 38 }}
                    >
                      <option value="">-- Sélectionner --</option>
                      {[
                        { v: 'PERE',      l: 'Père' },
                        { v: 'MERE',      l: 'Mère' },
                        { v: 'TUTEUR',    l: 'Tuteur' },
                        { v: 'TUTRICE',   l: 'Tutrice' },
                        { v: 'GRAND_PERE', l: 'Grand-père' },
                        { v: 'GRAND_MERE', l: 'Grand-mère' },
                        { v: 'ONCLE',     l: 'Oncle' },
                        { v: 'TANTE',     l: 'Tante' },
                        { v: 'AUTRE',     l: 'Autre' },
                      ].map(({ v, l }) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Inline parent creation */}
              {showParentForm && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Nouveau parent / tuteur</span>
                    <button onClick={() => setShowParentForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    {[
                      { label: 'Prénom *', key: 'prenom', placeholder: 'Ousmane' },
                      { label: 'Nom *',    key: 'nom',    placeholder: 'Ndiaye' },
                      { label: 'Téléphone', key: 'telephone', placeholder: '+221 77 000 00 00' },
                      { label: 'Email',    key: 'email',  placeholder: 'parent@email.com' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label style={lbl()}>{label}</label>
                        <input
                          value={parentForm[key as keyof typeof parentForm]}
                          onChange={(e) => {
                            const value = key === 'prenom' ? formatFirstName(e.target.value) : key === 'nom' ? formatLastName(e.target.value) : e.target.value;
                            setParentForm((pf) => ({ ...pf, [key]: value }));
                          }}
                          placeholder={placeholder}
                          style={inp()}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button onClick={() => setShowParentForm(false)} style={{ height: 34, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', color: '#334155' }}>Annuler</button>
                    <button onClick={handleCreateParent} disabled={creatingParent} style={{ height: 34, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: creatingParent ? 0.7 : 1 }}>
                      {creatingParent ? 'Création…' : 'Ajouter et sélectionner'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e6ebf1', flexShrink: 0, background: '#fff' }}>
              <button onClick={() => setModalOpen(false)} style={{ height: 42, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Créer l\'élève'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {detailEleve && (() => {
        const e = detailEleve;
        const prenom  = String(e.prenom  ?? e.firstName ?? '');
        const nom     = String(e.nom     ?? e.lastName  ?? '');
        const matricule = String(e.matricule ?? '');
        const photoUrl  = String(e.photoUrl ?? '');
        const initials  = ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase();
        const classeRaw = e.classe as Record<string, unknown> | undefined;
        const classeNom = classeRaw ? String(classeRaw.nom ?? '') : String(e.classeNom ?? '');
        const elevParents = e.elevParents as Array<{ parent: ParentItem }> | undefined;
        const parents = elevParents?.map((ep) => ep.parent) ?? [];
        const genre = String(e.genre ?? '');
        const dateNaissance = String(e.dateNaissance ?? '');
        const lieuNaissance = String(e.lieuNaissance ?? '');
        const numeroUrgence = String(e.numeroUrgence ?? '');
        const adresse = String(e.adresse ?? '');
        const eleveId = String(e.id ?? e.eleveId ?? '');

        const docsByType = DOC_TYPES.map((dt) => ({
          ...dt,
          docs: docs.filter((d) => d.type === dt.value),
        }));

        return (
          <>
            {/* Overlay */}
            <div onClick={() => setDetailEleve(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', zIndex: 60 }} />
            {/* Drawer */}
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 540, background: '#fff', boxShadow: '-8px 0 40px rgba(15,23,42,.18)', zIndex: 61, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ flexShrink: 0, padding: '20px 24px 18px', borderBottom: '1px solid #e6ebf1', background: '#f8fafc', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0 }}>
                  {photoUrl
                    ? <img src={photoUrl} style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid #e2e8f0' }} alt="" />
                    : <div style={{ width: 56, height: 56, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>{initials}</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{prenom} {nom}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    {matricule && <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{matricule}</span>}
                    {classeNom && <span style={{ fontSize: 12, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, padding: '2px 8px' }}>{classeNom}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); setDetailEleve(null); openStudentCard(e); }}
                    style={{ height: 32, padding: '0 12px', border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                    title="Générer carte scolaire"
                  >
                    Carte
                  </button>
                  <button onClick={() => setDetailEleve(null)} style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid #e6ebf1' }}>
                {(['profil', 'documents'] as const).map((tab) => (
                  <button key={tab} onClick={() => setDetailTab(tab)} style={{ height: 42, padding: '0 22px', border: 'none', borderBottom: detailTab === tab ? '2px solid #2563eb' : '2px solid transparent', background: 'transparent', color: detailTab === tab ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: detailTab === tab ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer', textTransform: 'capitalize' }}>
                    {tab === 'profil' ? 'Profil' : `Documents (${docs.length})`}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
                {detailTab === 'profil' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {/* Info personnelle */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Informations personnelles</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                        {[
                          { l: 'Genre', v: genre === 'M' ? 'Masculin' : genre === 'F' ? 'Féminin' : '—' },
                          { l: 'Date de naissance', v: dateNaissance ? new Date(dateNaissance).toLocaleDateString('fr-FR') : '—' },
                          { l: 'Lieu de naissance', v: lieuNaissance || '—' },
                          { l: 'Adresse', v: adresse || '—' },
                          { l: 'N° urgence', v: numeroUrgence || '—' },
                          { l: 'Matricule', v: matricule || '—' },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 3 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Parents */}
                    {parents.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Parent / Tuteur</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {parents.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e6ebf1' }}>
                              <div style={{ width: 36, height: 36, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {((String(p.firstName ?? p.prenom ?? '')[0] ?? '') + (String(p.lastName ?? p.nom ?? '')[0] ?? '')).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{parentLabel(p)}</div>
                                {p.telephone && <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>{p.telephone}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                      <button onClick={() => { setDetailEleve(null); openEdit(e); }} style={{ height: 36, padding: '0 16px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                        Modifier le profil
                      </button>
                      <button onClick={() => { setDetailEleve(null); openStudentCard(e); }} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                        Générer carte scolaire
                      </button>
                    </div>
                  </div>
                )}

                {detailTab === 'documents' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Upload zone */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Ajouter un document</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <select
                          value={docUploadType}
                          onChange={(ev) => setDocUploadType(ev.target.value)}
                          style={{ height: 36, border: '1px solid #e2e8f0', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', flex: 1, minWidth: 180 }}
                        >
                          {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                        </select>
                        <button
                          onClick={() => docInputRef.current?.click()}
                          disabled={docUploading}
                          style={{ height: 36, padding: '0 16px', border: 'none', background: docUploading ? '#94a3b8' : '#0f172a', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: docUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {docUploading ? 'Upload…' : 'Choisir un fichier'}
                        </button>
                        <input
                          ref={docInputRef} type="file" multiple
                          accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx"
                          style={{ display: 'none' }}
                          onChange={(ev) => { const files = ev.target.files; if (files?.length) handleDocUpload(files); ev.target.value = ''; }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Formats acceptés : PDF, JPG, PNG, WEBP, DOC, DOCX · Max 10 Mo</div>
                    </div>

                    {/* Document list grouped by type */}
                    {docsLoading ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
                    ) : docs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>Aucun document dans le dossier</div>
                    ) : docsByType.filter((g) => g.docs.length > 0).map((group) => (
                      <div key={group.value}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>{group.label}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {group.docs.map((doc) => (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', border: '1px solid #e6ebf1' }}>
                              {/* Icon */}
                              <div style={{ width: 34, height: 34, background: doc.mimeType === 'application/pdf' ? '#fee2e2' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {doc.mimeType === 'application/pdf'
                                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                                  {new Date(doc.createdAt).toLocaleDateString('fr-FR')} · {(doc.taille / 1024).toFixed(0)} Ko
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => handleDocView(doc)} style={{ width: 30, height: 30, border: '1px solid #e2e8f0', background: '#fff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Ouvrir">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                </button>
                                <button onClick={() => handleDocDelete(doc)} style={{ width: 30, height: 30, border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Supprimer">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Inscription Modal ── */}
      {inscriModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 440, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e6ebf1' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Inscrire l'élève</div>
              <button onClick={() => setInscriModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e6ebf1', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {String(inscriModal.prenom ?? inscriModal.firstName ?? '')} {String(inscriModal.nom ?? inscriModal.lastName ?? '')}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl()}>Classe <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  value={inscriClasseId}
                  onChange={(ev) => setInscriClasseId(ev.target.value)}
                  style={{ height: 38, width: '100%', border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">-- Sélectionner une classe --</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              {!anneeCouranteId && (
                <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>Aucune année académique active. Configurez-en une avant d'inscrire.</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e6ebf1', background: '#fff' }}>
              <button onClick={() => setInscriModal(null)} style={{ height: 40, padding: '0 18px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleInscrire} disabled={inscriSaving || !inscriClasseId || !anneeCouranteId} style={{ height: 40, padding: '0 22px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: (inscriSaving || !inscriClasseId || !anneeCouranteId) ? 0.7 : 1 }}>
                {inscriSaving ? 'Inscription…' : 'Inscrire'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cardModal && (
        <div onClick={() => setCardModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 24 }}>
          <div onClick={(ev) => ev.stopPropagation()} style={{ background: '#1e293b', border: '1px solid #334155', boxShadow: '0 32px 80px rgba(0,0,0,.5)', padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 18, borderRadius: 4 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '.1em' }}>Carte scolaire</div>
                <div style={{ fontSize: 17, color: '#f1f5f9', fontWeight: 800, marginTop: 3 }}>
                  {String(cardModal.eleve.prenom ?? cardModal.eleve.firstName ?? '')} {String(cardModal.eleve.nom ?? cardModal.eleve.lastName ?? '')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => window.open(cardModal.rectoUrl, '_blank', 'noopener,noreferrer')} style={{ height: 32, padding: '0 13px', border: '1px solid #1d4ed8', background: '#1d4ed8', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Télécharger
                </button>
                <button onClick={() => setCardModal(null)} style={{ width: 32, height: 32, border: '1px solid #334155', background: '#0f172a', color: '#64748b', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            </div>
            {/* Card image */}
            <div style={{ width: 540, height: 340 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cardModal.rectoUrl} alt="Carte scolaire" style={{ width: 540, height: 340, display: 'block', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
