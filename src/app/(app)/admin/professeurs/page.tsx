'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { formatFirstName, formatLastName } from '@/lib/person-name';
import { asRecord } from '@/lib/api-data';
import { useAdminProfesseurs, useAdminMatieres, useCreateProfesseur, useUpdateProfesseur } from '@/hooks/use-query-api';

type ProfItem = Record<string, unknown>;
type MatiereItem = { id: string; libelle?: string; code?: string; nom?: string };
type Credentials = { username: string; password: string; photoUrl?: string; name?: string } | null;

const PAGE_SIZE = 12;
function pageItems<T>(items: T[], page: number) {
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}
function pageCount(total: number) { return Math.max(1, Math.ceil(total / PAGE_SIZE)); }

function PaginationControls({ page, total, onPageChange }: { page: number; total: number; onPageChange: (p: number) => void }) {
  const pages = pageCount(total);
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(total, page * PAGE_SIZE);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{start}–{end} sur {total}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Préc.</button>
        <span style={{ fontSize: 12, color: '#64748b', lineHeight: '28px' }}>{page}/{pages}</span>
        <button onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page >= pages ? 'not-allowed' : 'pointer', opacity: page >= pages ? 0.5 : 1 }}>Suiv.</button>
      </div>
    </div>
  );
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
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => { URL.revokeObjectURL(url); resolve(blob ?? file); }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function profName(p: ProfItem): string {
  return `${p.prenom ?? p.firstName ?? ''} ${p.nom ?? p.lastName ?? ''}`.trim();
}
function profInitials(p: ProfItem): string {
  const f = String(p.prenom ?? p.firstName ?? '');
  const l = String(p.nom ?? p.lastName ?? '');
  return ((f[0] ?? '') + (l[0] ?? '')).toUpperCase() || '?';
}
function isActif(p: ProfItem): boolean {
  return p.actif === true || p.actif === 1 || p.statut === 'actif';
}
// Libellé complet — pour modal de sélection et drawer
function matiereLabel(m: MatiereItem, allMatieres?: MatiereItem[]): string {
  if (allMatieres && m.id) {
    const found = allMatieres.find((am) => am.id === m.id);
    if (found?.libelle) return String(found.libelle);
    if (found?.nom) return String(found.nom);
  }
  return String(m.libelle ?? m.nom ?? m.code ?? '?');
}
// Code court — pour les badges compacts sur les cartes
function matiereCode(m: MatiereItem, allMatieres?: MatiereItem[]): string {
  if (allMatieres && m.id) {
    const found = allMatieres.find((am) => am.id === m.id);
    if (found?.code) return String(found.code);
  }
  return String(m.code ?? m.libelle ?? '?');
}

const EMPTY_FORM = { prenom: '', nom: '', email: '', telephone: '', matricule: '', specialite: '', adresse: '' };

export default function ProfesseursPage() {
  const { data, isLoading } = useAdminProfesseurs();
  const { data: matieresData } = useAdminMatieres();
  const createProfesseur = useCreateProfesseur();
  const updateProfesseur = useUpdateProfesseur();

  // ── Liste ─────────────────────────────────────────────────────────
  const rawList = (Array.isArray(data) ? data : ((data as Record<string, unknown> | undefined)?.professeurs ?? (data as Record<string, unknown> | undefined)?.enseignants ?? (data as Record<string, unknown> | undefined)?.content ?? (data as Record<string, unknown> | undefined)?.data ?? [])) as ProfItem[];
  const allMatieres = (Array.isArray(matieresData) ? matieresData : ((matieresData as Record<string, unknown> | undefined)?.data ?? (matieresData as Record<string, unknown> | undefined)?.content ?? [])) as MatiereItem[];

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('actif');
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = rawList.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchQ = !q || profName(p).toLowerCase().includes(q) || String(p.specialite ?? '').toLowerCase().includes(q) || String(p.matricule ?? '').toLowerCase().includes(q);
    const actif = isActif(p);
    const matchS = !filterStatut || (filterStatut === 'actif' ? actif : !actif);
    return matchQ && matchS;
  });

  const paged = pageItems(filtered, currentPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatut]);

  // ── Credentials banner ────────────────────────────────────────────
  const [credentials, setCredentials] = useState<Credentials>(null);

  // ── Detail drawer ─────────────────────────────────────────────────
  const [detailProf, setDetailProf] = useState<ProfItem | null>(null);
  const [detailTab, setDetailTab] = useState<'profil' | 'classes' | 'paiements'>('profil');
  const [profPaiements, setProfPaiements] = useState<Record<string, unknown>[]>([]);
  const [profClasses, setProfClasses] = useState<Record<string, unknown>[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesAnnee, setClassesAnnee] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = useCallback(async (p: ProfItem) => {
    setDetailProf(p);
    setDetailTab('profil');
    setProfPaiements([]);
    setProfClasses([]);
    setClassesAnnee('');
    setDetailLoading(true);
    try {
      const res = await apiClient.get('/admin/paiements-professeurs');
      const all = (Array.isArray(res.data) ? res.data : (res.data?.data ?? res.data?.content ?? [])) as Record<string, unknown>[];
      const profId = String(p.id ?? '');
      setProfPaiements(all.filter((pay) => String(pay.enseignantId ?? pay.professeurId ?? pay.userId ?? '') === profId));
    } catch { /* silencieux */ }
    finally { setDetailLoading(false); }
  }, []);

  const loadClasses = useCallback(async (p: ProfItem) => {
    setClassesLoading(true);
    try {
      const profId = String(p.id ?? '');
      // matieres-classes contient anneeScolaire (string directe) + classeId + matiere
      const [mcRes, clRes] = await Promise.allSettled([
        apiClient.get('/admin/matieres-classes', { params: { size: 500 } }),
        apiClient.get('/admin/classes', { params: { size: 500 } }),
      ]);
      const extract = (r: PromiseSettledResult<{ data: unknown }>) => {
        if (r.status !== 'fulfilled') return [] as Record<string, unknown>[];
        const d = r.value.data as Record<string, unknown>;
        return (Array.isArray(d) ? d : (d?.content ?? d?.data ?? [])) as Record<string, unknown>[];
      };
      const allMC      = extract(mcRes);
      const allClasses = extract(clRes);

      // Index classes par id
      const classeIdx: Record<string, Record<string, unknown>> = {};
      for (const c of allClasses) classeIdx[String(c.id ?? '')] = c;

      // Filtrer par professeur (enseignantId)
      const profMC = allMC.filter((mc) =>
        String(mc.enseignantId ?? '') === profId ||
        String((mc.enseignant as Record<string, unknown> | undefined)?.id ?? '') === profId
      );

      // Enrichir avec nom classe + niveau + annee
      const enriched = profMC.map((mc) => {
        const classe  = classeIdx[String(mc.classeId ?? '')] ?? {};
        const niveau  = classe.niveau as Record<string, unknown> | undefined;
        // Priorite : relation directe mc.anneeAcademique > classe.anneeAcademique > champ denormalise
        const anneeAcMc = mc.anneeAcademique as Record<string, unknown> | undefined;
        const anneeAcCl = classe.anneeAcademique as Record<string, unknown> | undefined;
        return {
          ...mc,
          _classeNom:   String(classe.nom ?? '—'),
          _niveauNom:   String(niveau?.libelle ?? niveau?.nom ?? ''),
          _annee:       String(anneeAcMc?.libelle ?? anneeAcCl?.libelle ?? mc.anneeScolaire ?? ''),
          _nbEleves:    Number((classe._count as Record<string, unknown>)?.eleves ?? 0),
        };
      });
      setProfClasses(enriched);
    } catch { setProfClasses([]); }
    finally { setClassesLoading(false); }
  }, []);

  // ── Modal ─────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProfItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoChanged, setPhotoChanged] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setSelectedMatieres([]);
    setPhotoFile(null); setPhotoPreview(''); setPhotoChanged(false);
    setModalOpen(true);
  };

  const openEdit = (p: ProfItem) => {
    setEditItem(p);
    setForm({
      prenom:     String(p.prenom ?? p.firstName ?? ''),
      nom:        String(p.nom ?? p.lastName ?? ''),
      email:      String(p.email ?? ''),
      telephone:  String(p.telephone ?? ''),
      matricule:  String(p.matricule ?? ''),
      specialite: String(p.specialite ?? ''),
      adresse:    String(p.adresse ?? ''),
    });
    // backend returns matières as `specialites` (array of { id, code, libelle }) after sanitization
    const mats = (p.specialites as Array<MatiereItem> | undefined) ?? [];
    setSelectedMatieres(mats.map((m) => m?.id).filter(Boolean) as string[]);
    setPhotoFile(null); setPhotoPreview(String(p.photoUrl ?? '')); setPhotoChanged(false);
    setModalOpen(true);
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file); setPhotoChanged(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(String(ev.target?.result ?? ''));
      reader.readAsDataURL(file);
    } else { setPhotoPreview(''); }
  };

  const uploadPhoto = async (profId: string) => {
    if (!photoChanged || !photoFile) return;
    const resized = await resizeImageFile(photoFile);
    const data = new FormData();
    data.append('file', resized, `${photoFile.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`);
    await apiClient.post(`/admin/users/${profId}/photo`, data);
  };

  const toggleMatiere = (id: string) => {
    setSelectedMatieres((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim()) {
      toast.error('Prénom, nom et email sont requis'); return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName:  formatFirstName(form.prenom.trim()),
        lastName:   formatLastName(form.nom.trim()),
        email:      form.email.trim(),
        telephone:  form.telephone.trim() || undefined,
        matricule:  form.matricule.trim() || undefined,
        specialite: form.specialite.trim() || undefined,
        adresse:    form.adresse.trim() || undefined,
        matiereIds: selectedMatieres.length > 0 ? selectedMatieres : undefined,
      };

      if (editItem) {
        await updateProfesseur.mutateAsync({ id: String(editItem.id), data: payload });
        await uploadPhoto(String(editItem.id));
      } else {
        const result = await createProfesseur.mutateAsync(payload);
        // Réponse axios : `AxiosResponse` et `Record<string, unknown>` ne se
        // recouvrent pas, il faut passer par `unknown`.
        const res = asRecord(asRecord(result).data ?? result);
        const newId = String(res?.id ?? '');
        const username = String(res?.username ?? '');
        const matricule = String(res?.matricule ?? '');
        const generatedPassword = String(res?.generatedPassword ?? '');
        if (newId) await uploadPhoto(newId);
        // Refetch pour avoir la photoUrl dans la bannière
        const photoUrl = photoPreview || String(res?.photoUrl ?? '');
        if (username) setCredentials({ username, password: generatedPassword || matricule, photoUrl, name: `${form.prenom} ${form.nom}`.trim() } as Credentials);
      }
      setModalOpen(false);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
          Enseignants <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>· {filtered.length}</span>
        </div>
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 40, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Ajouter un professeur
        </button>
      </div>

      {/* Credentials banner */}
      {credentials && (
        <div style={{ flexShrink: 0, margin: '14px 28px 0', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, flexShrink: 0, overflow: 'hidden', background: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {credentials.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={credentials.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{(credentials.name ?? '').split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)}</span>}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 5 }}>{credentials.name || 'Enseignant'} — Compte créé</div>
                <div style={{ fontSize: 13, color: '#166534', display: 'flex', gap: 20 }}>
                  <span>Identifiant : <strong style={{ background: '#dcfce7', padding: '1px 8px' }}>{credentials.username}</strong></span>
                  {credentials.password && <span>Mot de passe : <strong style={{ background: '#dcfce7', padding: '1px 8px' }}>{credentials.password}</strong></span>}
                </div>
              </div>
            </div>
            <button onClick={() => setCredentials(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, flexShrink: 0 }}>✕</button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 380 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, spécialité, matricule…" style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', outline: 'none', width: '100%', height: 38, fontFamily: 'inherit' }} />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {/* Grille */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 0' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Aucun professeur trouvé</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {paged.map((p) => {
              const name = profName(p);
              const specialite = String(p.specialite ?? '');
              const email = String(p.email ?? '');
              const telephone = String(p.telephone ?? '');
              const matricule = String(p.matricule ?? '');
              const photoUrl = String(p.photoUrl ?? '');
              const actif = isActif(p);
              const mats = (p.specialites as Array<MatiereItem> | undefined) ?? [];

              return (
                <div
                  key={String(p.id)}
                  onClick={() => openDetail(p)}
                  style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 20, cursor: 'pointer', transition: 'border-color .15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e6ebf1')}
                >
                  {/* Avatar + nom */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, flexShrink: 0, overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {photoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{profInitials(p)}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: actif ? '#16a34a' : '#94a3b8', background: actif ? '#dcfce7' : '#f1f5f9', padding: '2px 7px' }}>{actif ? 'Actif' : 'Inactif'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coordonnées */}
                  {email && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉ {email}</div>}
                  {telephone && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>📞 {telephone}</div>}
                  {matricule && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Matricule : {matricule}</div>}

                  {/* Matières */}
                  {mats.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, marginBottom: 4 }}>
                      {mats.slice(0, 4).map((m, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 6px' }}>
                          {matiereCode(m, allMatieres)}
                        </span>
                      ))}
                      {mats.length > 4 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{mats.length - 4}</span>}
                    </div>
                  )}

                  {/* Actions */}
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 12 }}>
                    <button onClick={() => openEdit(p)} style={{ flex: 1, height: 30, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      Modifier
                    </button>
                    <button
                      onClick={async () => {
                        const act = isActif(p);
                        if (!confirm(act ? `Désactiver ${profName(p)} ?` : `Réactiver ${profName(p)} ?`)) return;
                        try {
                          await updateProfesseur.mutateAsync({ id: String(p.id), data: { actif: !act } });
                          toast.success(act ? 'Compte désactivé' : 'Compte réactivé');
                        } catch { toast.error('Erreur'); }
                      }}
                      style={{ height: 30, padding: '0 10px', border: `1px solid ${isActif(p) ? '#dc2626' : '#16a34a'}`, background: '#fff', color: isActif(p) ? '#dc2626' : '#16a34a', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      {isActif(p) ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div style={{ padding: '18px 0 28px' }}>
            <PaginationControls page={currentPage} total={filtered.length} onPageChange={setCurrentPage} />
          </div>
        )}
        {filtered.length <= PAGE_SIZE && <div style={{ height: 28 }} />}
      </div>

      {/* ── Detail Drawer ── */}
      {detailProf && (() => {
        const p = detailProf;
        const mats = (p.specialites as Array<MatiereItem> | undefined) ?? [];
        const adresse = String(p.adresse ?? '');
        const actif = isActif(p);

        return (
          <>
            <div onClick={() => setDetailProf(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.35)', zIndex: 60 }} />
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 500, background: '#fff', boxShadow: '-8px 0 40px rgba(15,23,42,.18)', zIndex: 61, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ flexShrink: 0, padding: '20px 24px 18px', borderBottom: '1px solid #e6ebf1', background: '#f8fafc', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {String(p.photoUrl ?? '')
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={String(p.photoUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{profInitials(p)}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{profName(p)}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: actif ? '#16a34a' : '#94a3b8', background: actif ? '#dcfce7' : '#f1f5f9', padding: '2px 7px' }}>{actif ? 'Actif' : 'Inactif'}</span>
                  </div>
                </div>
                <button onClick={() => setDetailProf(null)} style={{ width: 32, height: 32, border: '1px solid #e2e8f0', background: '#fff', color: '#94a3b8', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
              </div>

              {/* Tabs */}
              <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid #e6ebf1' }}>
                {(['profil', 'classes', 'paiements'] as const).map((tab) => (
                  <button key={tab} onClick={() => {
                    setDetailTab(tab);
                    if (tab === 'classes' && profClasses.length === 0 && !classesLoading) loadClasses(p);
                  }} style={{ height: 42, padding: '0 22px', border: 'none', borderBottom: detailTab === tab ? '2px solid #2563eb' : '2px solid transparent', background: 'transparent', color: detailTab === tab ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: detailTab === tab ? 700 : 500, fontFamily: 'inherit', cursor: 'pointer' }}>
                    {tab === 'profil' ? 'Profil' : tab === 'classes' ? 'Classes' : 'Paiements'}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
                {detailTab === 'profil' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {/* Coordonnées */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Coordonnées</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                        {[
                          { l: 'Email', v: String(p.email ?? '—') },
                          { l: 'Téléphone', v: String(p.telephone ?? '—') },
                          { l: 'Matricule', v: String(p.matricule ?? '—') },
                          { l: 'Adresse', v: adresse || '—' },
                          { l: 'Identifiant', v: String(p.username ?? '—') },
                        ].map(({ l, v }) => (
                          <div key={l}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginTop: 3, wordBreak: 'break-all' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matières */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Matières enseignées ({mats.length})</div>
                      {mats.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>Aucune matière assignée</div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {mats.map((m, i) => (
                            <span key={i} style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px' }}>
                              {matiereLabel(m, allMatieres)}
                              {m?.code && <span style={{ color: '#94a3b8', marginLeft: 5, fontSize: 10 }}>{m.code}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                      <button onClick={() => { setDetailProf(null); openEdit(p); }} style={{ height: 36, padding: '0 16px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                        Modifier le profil
                      </button>
                    </div>
                  </div>
                )}

                {detailTab === 'classes' && (() => {
                  // _annee est déjà calculé dans loadClasses depuis anneeScolaire (string directe)
                  const getAnnee = (c: Record<string, unknown>): string => String(c._annee ?? c.anneeScolaire ?? '');
                  const annees = Array.from(new Set(profClasses.map(getAnnee).filter(Boolean))).sort((a, b) => b.localeCompare(a));
                  const displayClasses = classesAnnee ? profClasses.filter((c) => getAnnee(c) === classesAnnee) : profClasses;

                  return (
                    <div>
                      {classesLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
                      ) : (
                        <>
                          {/* Filtre année — toujours visible dès qu'il y a des classes */}
                          <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>Année scolaire</label>
                            <select
                              value={classesAnnee}
                              onChange={(e) => setClassesAnnee(e.target.value)}
                              style={{ height: 36, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', width: '100%' }}
                            >
                              <option value="">Toutes les années ({profClasses.length})</option>
                              {annees.map((a) => (
                                <option key={a} value={a}>{a} ({profClasses.filter((c) => getAnnee(c) === a).length})</option>
                              ))}
                            </select>
                          </div>

                          {displayClasses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                              {profClasses.length === 0 ? 'Aucune classe assignée' : 'Aucune classe pour cette année'}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {(classesAnnee ? [classesAnnee] : annees.length > 0 ? annees : ['']).map((annee) => {
                                const items = annee ? displayClasses.filter((c) => getAnnee(c) === annee) : displayClasses;
                                if (items.length === 0) return null;
                                return (
                                  <div key={annee || '_'}>
                                    {annees.length > 0 && !classesAnnee && (
                                      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{annee || 'Année inconnue'}</div>
                                    )}
                                    <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                                      {items.map((c, idx) => {
                                        const nom       = String(c._classeNom ?? c.nom ?? '—');
                                        const niveau    = String(c._niveauNom ?? '');
                                        const nbEleves  = Number(c._nbEleves ?? 0);
                                        const matiere   = c.matiere as Record<string, unknown> | undefined;
                                        const matiereNom = matiereLabel(matiere as MatiereItem, allMatieres);
                                        return (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: idx < items.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                                            <div style={{ width: 36, height: 36, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{nom}</div>
                                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                                {niveau && <span>{niveau}</span>}
                                                {matiereNom && <span>{niveau ? ' · ' : ''}{matiereNom}</span>}
                                              </div>
                                            </div>
                                            {nbEleves > 0 && (
                                              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', flexShrink: 0 }}>{nbEleves} élève{nbEleves > 1 ? 's' : ''}</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}

                {detailTab === 'paiements' && (
                  <div>
                    {detailLoading ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
                    ) : profPaiements.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>Aucun paiement enregistré</div>
                    ) : (
                      <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
                        {profPaiements.map((pay, idx) => {
                          const isPaid = pay.statut === 'PAYE' || pay.statut === 'paye' || pay.statut === 'VALIDE';
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderLeft: `3px solid ${isPaid ? '#16a34a' : '#f59e0b'}`, borderBottom: idx < profPaiements.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{String(pay.mois ?? pay.libelle ?? pay.periode ?? 'Paiement')}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{String(pay.datePaiement ?? pay.date ?? pay.createdAt ?? '')}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{Number(pay.montant ?? 0).toLocaleString('fr-FR')} F</div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: isPaid ? '#16a34a' : '#d97706' }}>{isPaid ? 'Payé' : 'En attente'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 620, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 24px 60px rgba(15,23,42,.30)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{editItem ? 'Modifier le professeur' : 'Nouveau professeur'}</div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {/* Photo */}
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div onClick={() => photoInputRef.current?.click()} style={{ width: 64, height: 64, background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}>
                  {photoPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Photo</div>
                  <button onClick={() => photoInputRef.current?.click()} style={{ height: 30, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                    {photoPreview ? 'Changer' : 'Choisir une photo'}
                  </button>
                  {photoFile && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{photoFile.name}</div>}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhotoChange} />
              </div>

              {/* Identité */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Identité</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Prénom *', key: 'prenom', placeholder: 'Abdoulaye' },
                  { label: 'Nom *', key: 'nom', placeholder: 'SALL' },
                  { label: 'Email *', key: 'email', placeholder: 'a.sall@ecole.sn' },
                  { label: 'Téléphone', key: 'telephone', placeholder: '+221 77 000 00 00' },
                  { label: 'Adresse', key: 'adresse', placeholder: 'Dakar' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#334155', marginBottom: 5 }}>{label}</label>
                    <input
                      value={form[key as keyof typeof form]}
                      onChange={(e) => {
                        let v = e.target.value;
                        if (key === 'nom') v = formatLastName(v);
                        else if (key === 'adresse') v = v.toUpperCase();
                        else if (key === 'prenom') v = formatFirstName(v);
                        setForm((f) => ({ ...f, [key]: v }));
                      }}
                      placeholder={placeholder}
                      style={{ height: 38, width: '100%', border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    />
                  </div>
                ))}
              </div>

              {/* Type d'enseignant */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, marginTop: 4 }}>Type d&apos;enseignant</div>
              <div style={{ marginBottom: 14 }}>
                <select
                  value={form.specialite}
                  onChange={(e) => setForm((f) => ({ ...f, specialite: e.target.value }))}
                  style={{ height: 38, width: '100%', border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}
                >
                  <option value="">-- Selectionner le type --</option>
                  <option value="PRESCOLAIRE">Prescolaire (maternelle, creche)</option>
                  <option value="PRIMAIRE">Primaire (elementaire)</option>
                  <option value="SECONDAIRE">Secondaire (college et lycee)</option>
                </select>
              </div>

              {/* Matières */}
              {allMatieres.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, marginTop: 4 }}>Matières enseignées</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14, maxHeight: 160, overflowY: 'auto' }}>
                    {allMatieres.map((m) => {
                      const selected = selectedMatieres.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleMatiere(m.id)}
                          style={{ height: 28, padding: '0 10px', border: `1px solid ${selected ? '#2563eb' : '#e2e8f0'}`, background: selected ? '#eff6ff' : '#fff', color: selected ? '#2563eb' : '#475569', fontSize: 12, fontWeight: selected ? 700 : 400, fontFamily: 'inherit', cursor: 'pointer' }}
                        >
                          {matiereLabel(m, allMatieres)}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #e6ebf1', flexShrink: 0 }}>
              <button onClick={() => setModalOpen(false)} style={{ height: 42, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: '0 24px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : editItem ? 'Enregistrer' : 'Créer le professeur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
