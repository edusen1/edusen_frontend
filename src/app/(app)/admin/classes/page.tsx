'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { useCreateClasse, useUpdateClasse, useDeleteClasse } from '@/hooks/use-query-api';

type NiveauItem = { id: string; nom: string; cycleId?: string; cycle?: { libelle?: string; code?: string } };
type ClasseItem = Record<string, unknown>;
type AnneeItem = { id: string; libelle: string; active?: boolean; actif?: boolean };
type ClasseEleveItem = {
  inscriptionId: string;
  numeroInscription?: string;
  fraisInscription?: number | null;
  statut?: string;
  createdAt?: string;
  eleve?: {
    id: string;
    nom?: string;
    firstName?: string;
    lastName?: string;
    matricule?: string;
    email?: string;
    telephone?: string;
    photoUrl?: string;
    genre?: string;
  } | null;
};
type EleveReport = {
  moyenneAnnuelle?: number | null;
  classe?: { nom?: string; annee?: string | null; bareme?: number };
  periodes?: Array<{
    code: string;
    label: string;
    moyenne?: number | null;
    matieres?: Array<{
      matiereId: string;
      libelle: string;
      coefficient?: number;
      moyenne?: number | null;
      moyenneDevoirs?: number | null;
      professeur?: string | null;
      devoirs?: Array<{ note?: number; noteSur?: number }>;
      composition?: Array<{ note?: number; noteSur?: number }>;
    }>;
  }>;
};
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderTop: '1px solid #eef2f6' }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{start}-{end} sur {total}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>Préc.</button>
        <span style={{ fontSize: 12, color: '#64748b' }}>{page}/{totalPages}</span>
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Suiv.</button>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [selectedAnneeId, setSelectedAnneeId] = useState('');
  const [classes, setClasses] = useState<ClasseItem[]>([]);

  const createClasse = useCreateClasse();
  const updateClasse = useUpdateClasse();
  const deleteClasse = useDeleteClasse();

  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [annees, setAnnees] = useState<AnneeItem[]>([]);
  const [profs, setProfs] = useState<{ id: string; nom: string; specialite?: string }[]>([]);
  const [salles, setSalles] = useState<{ id: string; nom: string }[]>([]);
  const [search, setSearch] = useState('');
  const [filterNiveauId, setFilterNiveauId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ClasseItem | null>(null);
  const [selectedClasse, setSelectedClasse] = useState<ClasseItem | null>(null);
  const [classeEleves, setClasseEleves] = useState<ClasseEleveItem[]>([]);
  const [classeElevesPage, setClasseElevesPage] = useState(1);
  const [selectedEleve, setSelectedEleve] = useState<ClasseEleveItem | null>(null);
  const [selectedEleveReport, setSelectedEleveReport] = useState<EleveReport | null>(null);
  const [loadingEleveReport, setLoadingEleveReport] = useState(false);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [form, setForm] = useState({ nom: '', niveauId: '', effectifMax: '', professeurResponsableId: '', salleId: '' });

  const fetchClasses = (anneeId: string) => {
    const params = anneeId ? { anneeId } : {};
    apiClient.get('/admin/classes', { params }).then((r) => {
      const d = r.data as Record<string, unknown>;
      setClasses(Array.isArray(d) ? d as ClasseItem[] : ((d?.data ?? d?.content ?? d?.classes ?? []) as ClasseItem[]));
    }).catch(() => {});
  };

  useEffect(() => {
    const parse = (d: unknown): Record<string, unknown>[] => {
      if (Array.isArray(d)) return d;
      const obj = d as Record<string, unknown>;
      return (Array.isArray(obj?.data) ? obj.data : Array.isArray(obj?.content) ? obj.content : []) as Record<string, unknown>[];
    };
    Promise.all([
      apiClient.get('/admin/configuration/niveaux'),
      apiClient.get('/admin/configuration/annees-academiques'),
      apiClient.get('/admin/configuration/annees-academiques/courante'),
      apiClient.get('/admin/professeurs', { params: { size: 500 } }).catch(() => ({ data: [] })),
      apiClient.get('/admin/salles', { params: { size: 500 } }).catch(() => ({ data: [] })),
    ]).then(([nr, anneesr, currentr, profsR, sallesR]) => {
      const nd = nr.data as Record<string, unknown>;
      setNiveaux(Array.isArray(nd) ? nd as NiveauItem[] : ((nd?.data ?? nd?.content ?? []) as NiveauItem[]));

      const ad = anneesr.data as Record<string, unknown>;
      const list: AnneeItem[] = Array.isArray(ad) ? ad as AnneeItem[] : ((ad?.data ?? ad?.content ?? []) as AnneeItem[]);
      const sorted = [...list].sort((a, b) => b.libelle.localeCompare(a.libelle));
      setAnnees(sorted);

      const cd = currentr.data as Record<string, unknown>;
      const current = (cd?.data ?? cd) as Record<string, unknown>;
      const currentId = current?.id ? String(current.id) : (sorted[0]?.id ?? '');
      setSelectedAnneeId(currentId);
      fetchClasses(currentId);

      setProfs(parse(profsR.data).map((p) => ({ id: String(p.id), nom: `${p.firstName ?? p.prenom ?? ''} ${p.lastName ?? p.nom ?? ''}`.trim() || 'Enseignant', specialite: String(p.specialite ?? '') })));
      setSalles(parse(sallesR.data).map((s) => ({ id: String(s.id), nom: String(s.nom ?? s.libelle ?? '') })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedAnneeId) fetchClasses(selectedAnneeId);
  }, [selectedAnneeId]);

  const filtered = classes.filter((c) => {
    const nom = (c.nom ?? '') as string;
    const niveauId = (c.niveauId ?? (c.niveau as Record<string, unknown> | undefined)?.id ?? '') as string;
    return nom.toLowerCase().includes(search.toLowerCase()) &&
      (!filterNiveauId || niveauId === filterNiveauId);
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ nom: '', niveauId: '', effectifMax: '', professeurResponsableId: '', salleId: '' });
    setShowModal(true);
  };

  const openEdit = (c: ClasseItem) => {
    setEditItem(c);
    const profObj = c.professeurResponsable as Record<string, unknown> | undefined;
    setForm({
      nom: (c.nom ?? '') as string,
      niveauId: (c.niveauId ?? (c.niveau as Record<string, unknown> | undefined)?.id ?? '') as string,
      effectifMax: String(c.effectifMax ?? ''),
      professeurResponsableId: String(profObj?.id ?? c.professeurResponsableId ?? ''),
      salleId: String(c.salleId ?? ''),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) { toast.error('Nom de classe requis'); return; }
    if (!form.niveauId) { toast.error('Niveau requis'); return; }
    if (!selectedAnneeId && !editItem) { toast.error('Aucune année académique sélectionnée'); return; }
    const payload: Record<string, unknown> = {
      nom: form.nom.trim(),
      niveauId: form.niveauId,
      ...(form.effectifMax ? { effectifMax: Number(form.effectifMax) } : {}),
      ...(form.professeurResponsableId ? { professeurResponsableId: form.professeurResponsableId } : editItem ? { professeurResponsableId: null } : {}),
      ...(form.salleId ? { salleId: form.salleId } : {}),
      ...(!editItem ? { anneeAcademiqueId: selectedAnneeId } : {}),
    };
    try {
      if (editItem) {
        await updateClasse.mutateAsync({ id: String(editItem.id), data: payload });
      } else {
        await createClasse.mutateAsync(payload);
      }
      setShowModal(false);
      fetchClasses(selectedAnneeId);
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (c: ClasseItem) => {
    if (!confirm(`Supprimer la classe ${c.nom} ?`)) return;
    try {
      await deleteClasse.mutateAsync(String(c.id));
      fetchClasses(selectedAnneeId);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openDetails = async (c: ClasseItem) => {
    setSelectedClasse(c);
    setClasseEleves([]);
    setClasseElevesPage(1);
    setSelectedEleve(null);
    setSelectedEleveReport(null);
    setSelectedEleveCardUrl('');
    setLoadingEleves(true);
    try {
      const r = await apiClient.get(`/admin/classes/${String(c.id)}/eleves`);
      const d = r.data as unknown;
      setClasseEleves(Array.isArray(d) ? d as ClasseEleveItem[] : []);
    } catch {
      toast.error('Impossible de charger les élèves de cette classe');
      setClasseEleves([]);
    } finally {
      setLoadingEleves(false);
    }
  };

  const closeDetails = () => {
    setSelectedClasse(null);
    setClasseEleves([]);
    setClasseElevesPage(1);
    setSelectedEleve(null);
    setSelectedEleveReport(null);
    setLoadingEleveReport(false);
    setLoadingEleves(false);
  };

  const openEleveDetails = async (item: ClasseEleveItem) => {
    setSelectedEleve(item);
    setSelectedEleveReport(null);
    if (!selectedClasse || !item.eleve?.id) return;

    setLoadingEleveReport(true);
    try {
      const r = await apiClient.get(`/admin/classes/${String(selectedClasse.id)}/eleves/${item.eleve.id}/notes`);
      setSelectedEleveReport(r.data as EleveReport);
    } catch { /* silent */ }
    finally { setLoadingEleveReport(false); }
  };

  const formatAmount = (value?: number | null) => typeof value === 'number'
    ? `${new Intl.NumberFormat('fr-FR').format(value)} F`
    : '—';
  const formatAverage = (value?: number | null) => typeof value === 'number' ? value.toFixed(2) : '—';
  const formatNote = (note?: { note?: number; noteSur?: number }) => typeof note?.note === 'number' ? `${note.note}/${note.noteSur ?? 20}` : '—';
  useEffect(() => { setClasseElevesPage((page) => Math.min(page, pageCount(classeEleves.length))); }, [classeEleves.length]);
  const pagedClasseEleves = pageItems(classeEleves, classeElevesPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Classes</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} classe(s)</div>
        {annees.length > 0 && (
          <select
            value={selectedAnneeId}
            onChange={(e) => setSelectedAnneeId(e.target.value)}
            style={{ height: 34, border: '1px solid #d9e0e8', background: '#f8fafc', padding: '0 10px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', marginLeft: 8 }}
          >
            {annees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.libelle}{(a.active || a.actif) ? ' (active)' : ''}
              </option>
            ))}
          </select>
        )}
        <button onClick={openCreate} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Nouvelle classe
        </button>
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 300 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une classe…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterNiveauId} onChange={(e) => setFilterNiveauId(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les niveaux</option>
          {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
        </select>
      </div>

      {/* Cards grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
              Aucune classe trouvée
            </div>
          ) : filtered.map((c) => {
            const id = String(c.id);
            const nom = (c.nom ?? '') as string;
            const niveauObj = c.niveau as Record<string, unknown> | undefined;
            const niveauLabel = (niveauObj?.libelle ?? niveauObj?.nom ?? '') as string;
            const cycleObj = c.cycle as Record<string, unknown> | undefined;
            const cycleLabel = (cycleObj?.libelle ?? cycleObj?.code ?? '') as string;
            const countObj = c._count as Record<string, unknown> | undefined;
            const effectif = Number(c.nbEleves ?? c.effectif ?? countObj?.inscriptions ?? countObj?.eleves ?? 0);
            const effectifMax = (c.effectifMax ?? 0) as number;
            const profObj = c.professeurResponsable as Record<string, unknown> | undefined;
            const profNom = profObj ? `${profObj.firstName ?? profObj.prenom ?? ''} ${profObj.lastName ?? profObj.nom ?? ''}`.trim() : '—';
            const annee = (c.anneeAcademique as Record<string, unknown> | undefined)?.libelle as string ?? '';
            const fillRate = effectifMax > 0 ? Math.round((effectif / effectifMax) * 100) : 0;

            return (
              <div key={id} onClick={() => openDetails(c)} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-.01em' }}>{nom}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{niveauLabel}</div>
                  </div>
                  {cycleLabel && <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 9px' }}>{cycleLabel}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 5 }}>
                    <span>{effectif} élève(s)</span>
                    {effectifMax > 0 && <span>/ {effectifMax} max ({fillRate}%)</span>}
                  </div>
                  {effectifMax > 0 && (
                    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: fillRate >= 90 ? '#dc2626' : fillRate >= 70 ? '#d97706' : '#16a34a', width: `${fillRate}%` }} />
                    </div>
                  )}
                </div>

                {profObj && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>PP :</span> {profNom}
                </div>}
                {annee && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>{annee}</div>}

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                  <button onClick={(e) => { e.stopPropagation(); openDetails(c); }} style={{ flex: 1, height: 30, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    Voir élèves
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} style={{ width: 30, height: 30, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c); }} style={{ width: 30, height: 30, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div style={{ background: '#fff', width: 500, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {editItem ? 'Modifier la classe' : 'Nouvelle classe'}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
                Nom de la classe <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="Ex: 3ème B" style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Niveau <span style={{ color: '#dc2626' }}>*</span></label>
                <select value={form.niveauId} onChange={(e) => setForm((f) => ({ ...f, niveauId: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">-- Selectionner --</option>
                  {niveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Effectif max</label>
                <input type="number" value={form.effectifMax} onChange={(e) => setForm((f) => ({ ...f, effectifMax: e.target.value }))} placeholder="50" min={1} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Professeur responsable</label>
                <select value={form.professeurResponsableId} onChange={(e) => setForm((f) => ({ ...f, professeurResponsableId: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">-- Aucun --</option>
                  {(() => {
                    const selectedNiveau = niveaux.find((n) => n.id === form.niveauId);
                    const cycleCode = (selectedNiveau?.cycle?.code ?? '').toUpperCase();
                    const isPrimaire = ['PRESCOLAIRE', 'PRIMAIRE', 'MATERNELLE', 'CRECHE', 'ELEMENTAIRE'].includes(cycleCode);
                    const expectedType = ['PRESCOLAIRE', 'MATERNELLE', 'CRECHE'].includes(cycleCode) ? 'PRESCOLAIRE' : isPrimaire ? 'PRIMAIRE' : '';
                    const filteredProfs = expectedType
                      ? profs.filter((p) => !p.specialite || p.specialite.toUpperCase() === expectedType)
                      : profs;
                    return filteredProfs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}{p.specialite ? ` (${p.specialite.toLowerCase()})` : ''}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Salle principale</label>
                <select value={form.salleId} onChange={(e) => setForm((f) => ({ ...f, salleId: e.target.value }))} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">-- Aucune --</option>
                  {salles.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={createClasse.isPending || updateClasse.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (createClasse.isPending || updateClasse.isPending) ? 0.7 : 1 }}>
                {(createClasse.isPending || updateClasse.isPending) ? 'Enregistrement…' : (editItem ? 'Enregistrer' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedClasse && (
        <div onClick={closeDetails} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.42)', display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(620px, 100vw)', height: '100%', background: '#fff', boxShadow: '-12px 0 30px rgba(15,23,42,.14)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '22px 26px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Détails de la classe</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{String(selectedClasse.nom ?? '')}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {String(((selectedClasse.niveau as Record<string, unknown> | undefined)?.nom ?? (selectedClasse.niveau as Record<string, unknown> | undefined)?.libelle ?? '—'))}
                  {' · '}
                  {String(((selectedClasse.anneeAcademique as Record<string, unknown> | undefined)?.libelle ?? '—'))}
                </div>
              </div>
              <button onClick={closeDetails} style={{ width: 34, height: 34, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#475569', fontSize: 18 }}>×</button>
            </div>

            <div style={{ padding: '18px 26px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ background: '#f8fafc', padding: 14 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Élèves</div>
                <div style={{ fontSize: 20, color: '#0f172a', fontWeight: 800 }}>{classeEleves.length}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Effectif max</div>
                <div style={{ fontSize: 20, color: '#0f172a', fontWeight: 800 }}>{String(selectedClasse.effectifMax ?? '∞')}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Professeur</div>
                <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, marginTop: 5 }}>
                  {(() => {
                    const prof = selectedClasse.professeurResponsable as Record<string, unknown> | undefined;
                    return prof ? String(prof.nom ?? `${prof.firstName ?? ''} ${prof.lastName ?? ''}`.trim()) : 'Non assigné';
                  })()}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Élèves inscrits</div>
              {loadingEleves ? (
                <div style={{ padding: '36px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Chargement des élèves…</div>
              ) : classeEleves.length === 0 ? (
                <div style={{ padding: '36px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13, border: '1px dashed #cbd5e1' }}>Aucun élève inscrit dans cette classe.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e6ebf1', borderBottom: 'none' }}>
                  {pagedClasseEleves.map((item) => {
                    const eleve = item.eleve;
                    const fullName = eleve?.nom || `${eleve?.firstName ?? ''} ${eleve?.lastName ?? ''}`.trim() || 'Eleve sans nom';
                    const isSelected = selectedEleve?.inscriptionId === item.inscriptionId;
                    return (
                      <div key={item.inscriptionId}>
                        <button
                          type="button"
                          onClick={() => isSelected ? (setSelectedEleve(null), setSelectedEleveReport(null)) : openEleveDetails(item)}
                          style={{ width: '100%', border: 'none', borderBottom: '1px solid #e6ebf1', background: isSelected ? '#eff6ff' : '#fff', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 140px 72px 18px', gap: 14, alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{eleve?.matricule ?? 'Matricule non defini'}</div>
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.numeroInscription ?? '—'}</div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: item.statut === 'ACTIF' ? '#15803d' : '#92400e', background: item.statut === 'ACTIF' ? '#dcfce7' : '#fef3c7', padding: '4px 8px' }}>
                            {item.statut ?? '—'}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ transition: 'transform .2s', transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)' }}><polyline points="6 9 12 15 18 9"/></svg>
                        </button>

                        {/* Accordeon inline */}
                        {isSelected && (
                          <div style={{ borderBottom: '1px solid #e6ebf1', background: '#f8fafc', padding: '14px 16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Email</div>
                                <div style={{ fontSize: 12, color: '#0f172a', marginTop: 2 }}>{eleve?.email ?? '—'}</div>
                              </div>
                              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Telephone</div>
                                <div style={{ fontSize: 12, color: '#0f172a', marginTop: 2 }}>{eleve?.telephone ?? '—'}</div>
                              </div>
                              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Frais</div>
                                <div style={{ fontSize: 12, color: '#0f172a', marginTop: 2 }}>{formatAmount(item.fraisInscription)}</div>
                              </div>
                              <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Moyenne annuelle</div>
                                <div style={{ fontSize: 12, color: '#0f172a', marginTop: 2, fontWeight: 800 }}>{formatAverage(selectedEleveReport?.moyenneAnnuelle)}</div>
                              </div>
                            </div>

                            {/* Notes */}
                            {loadingEleveReport ? (
                              <div style={{ padding: '16px 0', color: '#64748b', fontSize: 12, textAlign: 'center' }}>Chargement des notes...</div>
                            ) : !selectedEleveReport?.periodes?.length ? (
                              <div style={{ padding: '16px 0', color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>Aucune note trouvee</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedEleveReport.periodes.map((periode) => (
                                  <div key={periode.code} style={{ border: '1px solid #e6ebf1', background: '#fff' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{periode.label}</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Moy: {formatAverage(periode.moyenne)}</span>
                                    </div>
                                    {(periode.matieres ?? []).map((matiere) => (
                                      <div key={`${periode.code}-${matiere.matiereId}`} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 60px', gap: 8, padding: '6px 12px', fontSize: 11, color: '#0f172a', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matiere.libelle}</span>
                                        <span style={{ color: '#64748b' }}>{formatNote(matiere.devoirs?.[0])}</span>
                                        <span style={{ color: '#64748b' }}>{formatNote(matiere.devoirs?.[1])}</span>
                                        <span style={{ color: '#64748b' }}>{formatNote(matiere.composition?.[0])}</span>
                                        <span style={{ fontWeight: 800 }}>{formatAverage(matiere.moyenne)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <PaginationControls page={classeElevesPage} total={classeEleves.length} onPageChange={setClasseElevesPage} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
