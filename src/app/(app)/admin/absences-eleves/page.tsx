'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useAdminAbsencesEleves,
  useAdminAbsencesElevesStats,
  useAdminAbsencesElevesDemandes,
  useAdminClasses,
  useApprouverAbsenceEleve,
  useRejeterAbsenceEleve,
  useAdminCreateAbsenceEleve,
  useAbsencesStatsParCycle,
  useAbsencesStatsParNiveau,
  useAbsencesStatsParClasse,
  useAbsencesEvolution,
  useAbsencesTopAbsents,
  useAdminConvocations,
  useCreateConvocation,
  useAdminCompteRenduConvocation,
  useAdminDeleteConvocation,
} from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';

/* ── Types ── */
type Absence = {
  id: string;
  eleveId?: string;
  eleveNom?: string;
  elevePrenom?: string;
  elevePhoto?: string;
  eleveMatricule?: string;
  classeNom?: string;
  classeId?: string;
  date: string;
  typeAbsence: string;
  justifiee?: boolean;
  motif?: string | null;
  documentJustificatifUrl?: string | null;
  statut: string;
  source?: string;
  motifRejet?: string | null;
  createdAt?: string;
  // legacy nested
  eleve?: { id: string; firstName?: string; lastName?: string };
  classe?: { id: string; nom?: string };
};

type Stats = {
  total: number;
  enAttente: number;
  approuvees: number;
  rejetees: number;
  justifiees: number;
  nonJustifiees: number;
  retards: number;
  journeesCompletes: number;
  demandesEleves: number;
};

type Section = 'dashboard' | 'absences' | 'demandes';

type CycleStat = { cycleId: string; cycleLibelle: string; nbEleves: number; nbAbsences: number; nbRetards: number; nbJustifiees: number; nbNonJustifiees: number; moyenneParEleve: number };
type NiveauStat = { niveauId: string; niveauLibelle: string; cycleId: string; nbClasses: number; nbEleves: number; nbAbsences: number; nbRetards: number; nbJustifiees: number; moyenneParEleve: number };
type ClasseStat = { classeId: string; classeNom: string; niveauId: string; nbEleves: number; nbAbsences: number; nbRetards: number; nbJustifiees: number; moyenneParEleve: number };
type Evolution = { periode: string; nbAbsences: number; nbRetards: number; nbJustifiees: number };
type TopEleve = { eleveId: string; eleveNom: string; elevePrenom: string; classeNom: string; nbAbsences: number; nbRetards: number; nbNonJustifiees: number };
type ClasseItem = { id: string; nom: string };
type Convocation = {
  id: string;
  eleveId: string;
  parentId: string;
  motif: string;
  type?: string;
  dateConvocation: string;
  statut: string;
  compteRendu?: string | null;
  observations?: string | null;
  createdAt?: string;
};
type ParentItem = { id: string; firstName?: string; lastName?: string; email?: string };
const EMPTY_CONVOC_FORM = { parentId: '', motif: '', type: 'DISCIPLINAIRE', dateConvocation: '', observations: '' };

const EMPTY_STATS: Stats = { total: 0, enAttente: 0, approuvees: 0, rejetees: 0, justifiees: 0, nonJustifiees: 0, retards: 0, journeesCompletes: 0, demandesEleves: 0 };

const TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ABSENT: { label: 'Absent', bg: '#f1f5f9', color: '#475569' },
  RETARD: { label: 'Retard', bg: '#fef3c7', color: '#92400e' },
  // valeurs legacy Java
  JOURNEE_COMPLETE: { label: 'Journée', bg: '#f1f5f9', color: '#475569' },
  DEMI_JOURNEE: { label: 'Demi-journée', bg: '#f1f5f9', color: '#475569' },
  COURS_SPECIFIQUE: { label: 'Cours', bg: '#f1f5f9', color: '#475569' },
};

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#92400e' },
  JUSTIFIEE: { label: 'Justifiée', bg: '#dcfce7', color: '#166534' },
  NON_JUSTIFIEE: { label: 'Non justifiée', bg: '#fee2e2', color: '#991b1b' },
  // alias pour compatibilité Java backend
  APPROUVEE: { label: 'Approuvée', bg: '#dcfce7', color: '#166534' },
  REJETEE: { label: 'Rejetée', bg: '#fee2e2', color: '#991b1b' },
};

const SOURCE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN: { label: 'Admin', bg: '#f1f5f9', color: '#475569' },
  SURVEILLANT: { label: 'Surveillant', bg: '#f1f5f9', color: '#475569' },
  ENSEIGNANT: { label: 'Enseignant', bg: '#f1f5f9', color: '#475569' },
  PARENT: { label: 'Parent', bg: '#f1f5f9', color: '#475569' },
  ELEVE: { label: 'Élève', bg: '#f1f5f9', color: '#475569' },
};

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}

/* ── Helpers ── */
function eleveName(a: Absence): string {
  if (a.elevePrenom || a.eleveNom) return `${a.elevePrenom ?? ''} ${a.eleveNom ?? ''}`.trim();
  if (a.eleve) return `${a.eleve.firstName ?? ''} ${a.eleve.lastName ?? ''}`.trim();
  return '—';
}

function className(a: Absence): string {
  return a.classeNom ?? a.classe?.nom ?? '—';
}

const EMPTY_FORM = { eleveId: '', classeId: '', date: '', typeAbsence: 'ABSENT', motif: '', justifiee: false };

export default function AbsencesElevesPage() {
  /* ── Data ── */
  const { data: absencesRaw } = useAdminAbsencesEleves();
  const absences: Absence[] = Array.isArray(absencesRaw) ? absencesRaw : Array.isArray((absencesRaw as { data?: unknown })?.data) ? (absencesRaw as { data: Absence[] }).data : [];

  const { data: statsRaw } = useAdminAbsencesElevesStats();
  const stats: Stats = (statsRaw as Stats) ?? EMPTY_STATS;

  const { data: demandesRaw } = useAdminAbsencesElevesDemandes();
  const demandes: Absence[] = Array.isArray(demandesRaw) ? demandesRaw : [];

  const { data: classesData } = useAdminClasses();
  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.data ?? []);
  const classes: ClasseItem[] = rawClasses;

  /* ── Elèves par classe (pour le modal) ── */
  const [elevesByClasse, setElevesByClasse] = useState<Record<string, { id: string; firstName: string; lastName: string }[]>>({});
  const loadEleves = async (classeId: string) => {
    if (elevesByClasse[classeId]?.length) return;
    try {
      const res = await apiClient.get('/admin/eleves', { params: { classeId, size: 200 } });
      const raw = res.data;
      const data = raw?.data ?? raw?.content ?? (Array.isArray(raw) ? raw : []);
      setElevesByClasse((prev) => ({ ...prev, [classeId]: Array.isArray(data) ? data : [] }));
    } catch { /* ignore */ }
  };

  /* ── Mutations ── */
  const approuverMut = useApprouverAbsenceEleve();
  const rejeterMut = useRejeterAbsenceEleve();
  const createMut = useAdminCreateAbsenceEleve();

  /* ── Analytics data ── */
  const { data: cycleStatsRaw } = useAbsencesStatsParCycle();
  const cycleStats: CycleStat[] = Array.isArray(cycleStatsRaw) ? cycleStatsRaw : [];
  const [drillCycleId, setDrillCycleId] = useState<string | null>(null);
  const { data: niveauStatsRaw } = useAbsencesStatsParNiveau(drillCycleId ? { cycleId: drillCycleId } : undefined);
  const niveauStats: NiveauStat[] = Array.isArray(niveauStatsRaw) ? niveauStatsRaw : [];
  const [drillNiveauId, setDrillNiveauId] = useState<string | null>(null);
  const { data: classeStatsRaw } = useAbsencesStatsParClasse(drillNiveauId ? { niveauId: drillNiveauId } : undefined);
  const classeStats: ClasseStat[] = Array.isArray(classeStatsRaw) ? classeStatsRaw : [];
  const { data: evolutionRaw } = useAbsencesEvolution();
  const evolution: Evolution[] = Array.isArray(evolutionRaw) ? evolutionRaw : [];
  const { data: topRaw } = useAbsencesTopAbsents({ limit: 10 });
  const topAbsents: TopEleve[] = Array.isArray(topRaw) ? topRaw : [];

  /* ── State ── */
  const [section, setSection] = useState<Section>('dashboard');
  const [filterClasseId, setFilterClasseId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterJustifiee, setFilterJustifiee] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [showRejetModal, setShowRejetModal] = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState('');

  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detail' | 'convocations'>('detail');

  /* ── Convocations pour l'élève sélectionné ── */
  const eleveIdForConvoc = selectedAbsence?.eleveId ?? null;
  const { data: eleveConvocRaw } = useAdminConvocations(eleveIdForConvoc ? { eleveId: eleveIdForConvoc } : undefined);
  const eleveConvocations: Convocation[] = (() => {
    if (Array.isArray(eleveConvocRaw)) return eleveConvocRaw;
    const r = eleveConvocRaw as Record<string, unknown> | undefined;
    const list = r?.data ?? r?.content;
    return Array.isArray(list) ? list : [];
  })();

  /* ── Parents (pour modal convocation) ── */
  const [parents, setParents] = useState<ParentItem[]>([]);
  const loadParents = async () => {
    const eleveId = selectedAbsence?.eleveId;
    if (!eleveId) return;
    try {
      // /admin/eleves/:id retourne l'élève avec elevParents inclus
      const res = await apiClient.get(`/admin/eleves/${eleveId}`);
      const eleve = res.data?.data ?? res.data;
      const elevParents: { parent: ParentItem }[] = Array.isArray(eleve?.elevParents) ? eleve.elevParents : [];
      if (elevParents.length > 0) {
        setParents(elevParents.map((ep) => ep.parent));
      } else {
        // Fallback : cherche par relation
        const r2 = await apiClient.get('/admin/parents', { params: { eleveId, size: 50 } });
        const raw = r2.data;
        const list = raw?.content ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
        setParents(Array.isArray(list) ? list : []);
      }
    } catch { /* ignore */ }
  };

  /* ── Modal convocation ── */
  const [showConvocModal, setShowConvocModal] = useState(false);
  const [convocForm, setConvocForm] = useState(EMPTY_CONVOC_FORM);
  const createConvocMut = useCreateConvocation();
  const compteRenduMut = useAdminCompteRenduConvocation();
  const deleteConvocMut = useAdminDeleteConvocation();

  /* ── Compte-rendu inline ── */
  const [compteRenduId, setCompteRenduId] = useState<string | null>(null);
  const [compteRenduText, setCompteRenduText] = useState('');

  /* ── Alertes seuils ── */
  const [alerteSeuil, setAlerteSeuil] = useState(5);
  const elevesEnAlerte = useMemo(() =>
    topAbsents.filter((t) => t.nbNonJustifiees >= alerteSeuil),
    [topAbsents, alerteSeuil]
  );

  /* ── Export CSV ── */
  const exportCSV = () => {
    const headers = ['Élève', 'Matricule', 'Classe', 'Date', 'Type', 'Source', 'Justifiée', 'Statut', 'Motif'];
    const rows = filtered.map((a) => [
      eleveName(a),
      a.eleveMatricule ?? '',
      className(a),
      a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '',
      TYPE_MAP[a.typeAbsence]?.label ?? a.typeAbsence,
      SOURCE_MAP[a.source ?? 'ADMIN']?.label ?? (a.source ?? ''),
      a.justifiee ? 'Oui' : 'Non',
      STATUT_MAP[a.statut]?.label ?? a.statut,
      (a.motif ?? '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `absences_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} absences exportées`);
  };

  /* ── Filtres ── */
  const filtered = useMemo(() => {
    return absences.filter((a) => {
      const cId = a.classeId ?? a.classe?.id ?? '';
      if (filterClasseId && cId !== filterClasseId) return false;
      if (filterType && a.typeAbsence !== filterType) return false;
      if (filterStatut && a.statut !== filterStatut) return false;
      if (filterSource && (a.source ?? 'ADMIN') !== filterSource) return false;
      if (filterJustifiee === 'true' && !a.justifiee) return false;
      if (filterJustifiee === 'false' && a.justifiee) return false;
      if (filterDateFrom && a.date < filterDateFrom) return false;
      if (filterDateTo && a.date > filterDateTo) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!eleveName(a).toLowerCase().includes(s) && !className(a).toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [absences, filterClasseId, filterType, filterStatut, filterSource, filterJustifiee, filterDateFrom, filterDateTo, search]);

  const resetFilters = () => {
    setFilterClasseId(''); setFilterType(''); setFilterStatut(''); setFilterSource('');
    setFilterJustifiee(''); setFilterDateFrom(''); setFilterDateTo(''); setSearch('');
  };
  const hasFilters = !!(filterClasseId || filterType || filterStatut || filterSource || filterJustifiee || filterDateFrom || filterDateTo || search);

  /* ── Actions ── */
  const handleApprouver = (id: string) => approuverMut.mutate(id);
  const handleRejeter = () => {
    if (!showRejetModal) return;
    rejeterMut.mutate({ id: showRejetModal, motifRejet: motifRejet || undefined });
    setShowRejetModal(null);
    setMotifRejet('');
  };

  const handleCreate = () => {
    if (!form.eleveId) { toast.error('Sélectionnez un élève'); return; }
    if (!form.date) { toast.error('La date est obligatoire'); return; }
    createMut.mutate({
      eleveId: form.eleveId,
      classeId: form.classeId,
      date: form.date,
      typeAbsence: form.typeAbsence,
      motif: form.motif || null,
      justifiee: form.justifiee,
    });
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const openConvocModal = () => {
    if (!selectedAbsence) return;
    setParents([]); // reset pour forcer le rechargement des parents de cet élève
    const nbAbsences = eleveConvocations.length;
    setConvocForm({
      ...EMPTY_CONVOC_FORM,
      motif: `Suite à ${nbAbsences > 0 ? nbAbsences + ' absences non justifiées' : 'absences répétées'} — ${eleveName(selectedAbsence)}`,
    });
    loadParents();
    setShowConvocModal(true);
  };

  const handleCreateConvoc = () => {
    if (!selectedAbsence?.eleveId) return;
    if (!convocForm.parentId) { toast.error('Sélectionnez un parent'); return; }
    if (!convocForm.dateConvocation) { toast.error('La date de convocation est obligatoire'); return; }
    if (!convocForm.motif) { toast.error('Le motif est obligatoire'); return; }
    createConvocMut.mutate({
      eleveId: selectedAbsence.eleveId,
      parentId: convocForm.parentId,
      motif: convocForm.motif,
      type: convocForm.type,
      dateConvocation: convocForm.dateConvocation,
      observations: convocForm.observations || null,
    });
    setShowConvocModal(false);
    setConvocForm(EMPTY_CONVOC_FORM);
    setDrawerTab('convocations');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Absences élèves</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} entrée(s)</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {section === 'absences' && (
              <button onClick={exportCSV} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                ↓ Exporter CSV
              </button>
            )}
            <button onClick={() => { setShowForm(true); }} style={{ height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              + Déclarer une absence
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 28px', gap: 0, borderTop: '1px solid #e6ebf1' }}>
          {([
            ['dashboard', 'Tableau de bord', null],
            ['absences', 'Absences', null],
            ['demandes', 'Demandes à valider', stats.demandesEleves],
          ] as [Section, string, number | null][]).map(([key, label, badge]) => (
            <button key={key} onClick={() => setSection(key)} style={{ height: 40, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: section === key ? 700 : 400, color: section === key ? '#2563eb' : '#64748b', borderBottom: section === key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              {label}
              {badge != null && badge > 0 && (
                <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, minWidth: 18, textAlign: 'center' }}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB DASHBOARD ═══ */}
      {section === 'dashboard' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
          {/* KPIs globaux */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total absences', value: stats.total, color: '#0f172a' },
              { label: 'En attente', value: stats.enAttente, color: '#92400e' },
              { label: 'Justifiées', value: stats.justifiees, color: '#166534' },
              { label: 'Non justifiées', value: stats.nonJustifiees, color: '#991b1b' },
              { label: 'Retards', value: stats.retards, color: '#475569' },
              { label: 'Demandes', value: stats.demandesEleves, color: '#92400e' },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Évolution mensuelle */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Évolution mensuelle</div>
              {evolution.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>Aucune donnée</div>}
              {evolution.length > 0 && (() => {
                const maxVal = Math.max(...evolution.map(e => e.nbAbsences), 1);
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
                    {evolution.map((e) => (
                      <div key={e.periode} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>{e.nbAbsences}</div>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <div style={{ height: Math.max(2, (e.nbAbsences / maxVal) * 100), background: '#334155', opacity: 0.85 }} title={`${e.nbAbsences} absences`} />
                          <div style={{ height: Math.max(1, (e.nbRetards / maxVal) * 100), background: '#94a3b8', opacity: 0.7 }} title={`${e.nbRetards} retards`} />
                        </div>
                        <div style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap' }}>{e.periode.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#334155', display: 'inline-block' }} /> Absences</span>
                <span style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#94a3b8', display: 'inline-block' }} /> Retards</span>
              </div>
            </div>

            {/* Top élèves absents */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Top 10 élèves les plus absents</div>
              {topAbsents.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>Aucune donnée</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {topAbsents.map((t, idx) => (
                  <div key={t.eleveId} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 60px 60px 70px', padding: '7px 0', borderBottom: idx < topAbsents.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: idx < 3 ? '#0f172a' : '#94a3b8' }}>{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{t.elevePrenom} {t.eleveNom}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.classeNom}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{t.nbAbsences} abs.</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{t.nbRetards} ret.</span>
                    <span style={{ fontSize: 11, color: '#991b1b' }}>{t.nbNonJustifiees} inj.</span>
                    <button onClick={() => { setSection('absences'); setSearch(`${t.elevePrenom} ${t.eleveNom}`); }} style={{ fontSize: 10, color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>Voir →</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Alertes seuils ── */}
          <div style={{ background: '#fff', border: `1px solid ${elevesEnAlerte.length > 0 ? '#fca5a5' : '#e6ebf1'}`, padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: elevesEnAlerte.length > 0 ? 14 : 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: elevesEnAlerte.length > 0 ? '#dc2626' : '#0f172a' }}>
                {elevesEnAlerte.length > 0 ? `⚠ ${elevesEnAlerte.length} élève(s) en alerte` : 'Alertes absences'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Seuil absences injustifiées :</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={alerteSeuil}
                  onChange={(e) => setAlerteSeuil(Math.max(1, Number(e.target.value)))}
                  style={{ width: 54, height: 30, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 13, fontFamily: 'inherit', textAlign: 'center' }}
                />
              </div>
            </div>
            {elevesEnAlerte.length === 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Aucun élève ne dépasse le seuil de {alerteSeuil} absence(s) non justifiée(s).</div>
            )}
            {elevesEnAlerte.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {elevesEnAlerte.map((t, idx) => (
                  <div key={t.eleveId} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 120px', padding: '9px 0', borderBottom: idx < elevesEnAlerte.length - 1 ? '1px solid #fef2f2' : 'none', alignItems: 'center', background: idx % 2 === 0 ? '#fef9f9' : '#fff' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.elevePrenom} {t.eleveNom}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.classeNom}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{t.nbNonJustifiees} inj.</span>
                    <span style={{ fontSize: 12, color: '#0f172a' }}>{t.nbAbsences} abs.</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{t.nbRetards} ret.</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setSection('absences'); setSearch(`${t.elevePrenom} ${t.eleveNom}`); }} style={{ height: 26, padding: '0 8px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Absences
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats par cycle — drill-down */}
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {drillNiveauId ? 'Par classe' : drillCycleId ? 'Par niveau' : 'Par cycle'}
              </div>
              {(drillCycleId || drillNiveauId) && (
                <button onClick={() => { if (drillNiveauId) setDrillNiveauId(null); else setDrillCycleId(null); }} style={{ fontSize: 11, color: '#2563eb', background: 'transparent', border: '1px solid #dbeafe', padding: '2px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Retour
                </button>
              )}
            </div>

            {/* Niveau cycle */}
            {!drillCycleId && !drillNiveauId && (
              <div style={{ display: 'flex', gap: 12 }}>
                {cycleStats.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12 }}>Aucune donnée</div>}
                {cycleStats.map((c) => (
                  <div key={c.cycleId} onClick={() => setDrillCycleId(c.cycleId)} style={{ flex: 1, border: '1px solid #e6ebf1', padding: '16px', cursor: 'pointer', transition: 'box-shadow .15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.08)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{c.cycleLibelle}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Élèves</span><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{c.nbEleves}</div></div>
                      <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Absences</span><div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{c.nbAbsences}</div></div>
                      <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Retards</span><div style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>{c.nbRetards}</div></div>
                      <div><span style={{ fontSize: 10, color: '#94a3b8' }}>Moy/élève</span><div style={{ fontSize: 16, fontWeight: 700, color: '#475569' }}>{c.moyenneParEleve}</div></div>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#16a34a', background: '#dcfce7', padding: '1px 6px' }}>{c.nbJustifiees} just.</span>
                      <span style={{ fontSize: 10, color: '#dc2626', background: '#fee2e2', padding: '1px 6px' }}>{c.nbNonJustifiees} non j.</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#2563eb', marginTop: 8 }}>Voir les niveaux →</div>
                  </div>
                ))}
              </div>
            )}

            {/* Niveau niveau */}
            {drillCycleId && !drillNiveauId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px 80px', padding: '10px 0', borderBottom: '1px solid #e6ebf1' }}>
                  {['Niveau', 'Classes', 'Élèves', 'Absences', 'Retards', 'Justif.', 'Moy/élève'].map((h) => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {niveauStats.map((n, idx) => (
                  <div key={n.niveauId} onClick={() => setDrillNiveauId(n.niveauId)} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px 80px', padding: '10px 0', borderBottom: idx < niveauStats.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', alignItems: 'center' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{n.niveauLibelle}</span>
                    <span style={{ fontSize: 12, color: '#475569' }}>{n.nbClasses}</span>
                    <span style={{ fontSize: 12, color: '#475569' }}>{n.nbEleves}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{n.nbAbsences}</span>
                    <span style={{ fontSize: 12, color: '#7c3aed' }}>{n.nbRetards}</span>
                    <span style={{ fontSize: 12, color: '#16a34a' }}>{n.nbJustifiees}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>{n.moyenneParEleve}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Niveau classe */}
            {drillNiveauId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px', padding: '10px 0', borderBottom: '1px solid #e6ebf1' }}>
                  {['Classe', 'Élèves', 'Absences', 'Retards', 'Justif.', 'Moy/élève'].map((h) => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {classeStats.map((c, idx) => (
                  <div key={c.classeId} onClick={() => { setSection('absences'); setFilterClasseId(c.classeId); }} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px 80px', padding: '10px 0', borderBottom: idx < classeStats.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', alignItems: 'center' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.classeNom}</span>
                    <span style={{ fontSize: 12, color: '#475569' }}>{c.nbEleves}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{c.nbAbsences}</span>
                    <span style={{ fontSize: 12, color: '#7c3aed' }}>{c.nbRetards}</span>
                    <span style={{ fontSize: 12, color: '#16a34a' }}>{c.nbJustifiees}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>{c.moyenneParEleve}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB ABSENCES ═══ */}
      {section === 'absences' && (
        <>
          {/* Stats */}
          <div style={{ flexShrink: 0, padding: '16px 28px 0', display: 'flex', gap: 12 }}>
            {[
              { label: 'Total', value: stats.total, color: '#0f172a' },
              { label: 'En attente', value: stats.enAttente, color: '#92400e' },
              { label: 'Approuvées', value: stats.approuvees, color: '#166534' },
              { label: 'Rejetées', value: stats.rejetees, color: '#991b1b' },
              { label: 'Justifiées', value: stats.justifiees, color: '#475569' },
              { label: 'Retards', value: stats.retards, color: '#475569' },
              { label: 'Demandes', value: stats.demandesEleves, color: '#92400e' },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ flexShrink: 0, padding: '12px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, maxWidth: 260, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher élève ou classe…" style={{ border: 'none', outline: 'none', fontSize: 13, height: 36, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
            </div>
            <select value={filterClasseId} onChange={(e) => setFilterClasseId(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Toutes les classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Tous les types</option>
              <option value="ABSENT">Absent</option>
              <option value="RETARD">Retard</option>
            </select>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="JUSTIFIEE">Justifiée</option>
              <option value="NON_JUSTIFIEE">Non justifiée</option>
            </select>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Toutes les sources</option>
              {Object.entries(SOURCE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterJustifiee} onChange={(e) => setFilterJustifiee(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Justifiée ?</option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
            {hasFilters && (
              <button onClick={resetFilters} style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', background: '#fff', color: '#475569', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>Réinitialiser</button>
            )}
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 28px 28px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 95px 90px 80px 80px 100px 140px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Élève', 'Classe', 'Date', 'Type', 'Source', 'Justif.', 'Statut', 'Actions'].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {filtered.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence</div>}
              {filtered.map((a, idx) => {
                const st = STATUT_MAP[a.statut] ?? STATUT_MAP.EN_ATTENTE;
                const tp = TYPE_MAP[a.typeAbsence] ?? { label: a.typeAbsence, bg: '#f1f5f9', color: '#475569' };
                const src = SOURCE_MAP[a.source ?? 'ADMIN'] ?? SOURCE_MAP.ADMIN;
                return (
                  <div key={a.id ?? idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 95px 90px 80px 80px 100px 140px', padding: '10px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setSelectedAbsence(a)}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{eleveName(a)}</div>
                      {a.eleveMatricule && <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.eleveMatricule}</div>}
                    </div>
                    <span style={{ fontSize: 12, color: '#475569' }}>{className(a)}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: tp.color, background: tp.bg, padding: '2px 6px', display: 'inline-block', whiteSpace: 'nowrap' }}>{tp.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: src.color, background: src.bg, padding: '2px 6px', display: 'inline-block' }}>{src.label}</span>
                    <span style={{ fontSize: 11, color: a.justifiee ? '#16a34a' : '#dc2626' }}>{a.justifiee ? 'Oui' : 'Non'}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 7px', display: 'inline-block' }}>{st.label}</span>
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      {a.statut === 'EN_ATTENTE' && (
                        <>
                          <button onClick={() => handleApprouver(a.id)} style={{ height: 26, padding: '0 8px', border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                          <button onClick={() => { setShowRejetModal(a.id); setMotifRejet(''); }} style={{ height: 26, padding: '0 8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══ TAB DEMANDES ═══ */}
      {section === 'demandes' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
            Demandes d&apos;absence déclarées par les élèves ou parents — nécessitent votre validation.
          </div>
          {demandes.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#fff', border: '1px solid #e6ebf1', fontSize: 13 }}>Aucune demande en attente</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {demandes.map((d) => {
              const tp = TYPE_MAP[d.typeAbsence] ?? { label: d.typeAbsence, bg: '#f1f5f9', color: '#475569' };
              const src = SOURCE_MAP[d.source ?? 'ELEVE'] ?? SOURCE_MAP.ELEVE;
              return (
                <div key={d.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{eleveName(d)}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{className(d)}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: src.color, background: src.bg, padding: '2px 8px' }}>Déclaré par {src.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: tp.color, background: tp.bg, padding: '2px 8px' }}>{tp.label}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 6 }}>
                        <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>DATE ABSENCE</span><div style={{ fontSize: 12, color: '#334155' }}>{new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
                        <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>DATE DEMANDE</span><div style={{ fontSize: 12, color: '#334155' }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div></div>
                        <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>JUSTIFIÉE</span><div style={{ fontSize: 12, color: d.justifiee ? '#16a34a' : '#dc2626' }}>{d.justifiee ? 'Oui' : 'Non'}</div></div>
                      </div>
                      {d.motif && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>MOTIF : </span>{d.motif}</div>}
                      {d.documentJustificatifUrl && (
                        <div style={{ marginTop: 6 }}>
                          <a href={d.documentJustificatifUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'underline' }}>Voir justificatif</a>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => handleApprouver(d.id)} style={{ height: 32, padding: '0 14px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Approuver
                      </button>
                      <button onClick={() => { setShowRejetModal(d.id); setMotifRejet(''); }} style={{ height: 32, padding: '0 14px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MODAL DÉCLARER ABSENCE ═══ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 500, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Déclarer une absence</div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Classe *</label>
              <select value={form.classeId} onChange={(e) => { setForm((f) => ({ ...f, classeId: e.target.value, eleveId: '' })); if (e.target.value) loadEleves(e.target.value); }} style={{ ...inp() }}>
                <option value="">Sélectionner une classe…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Élève *</label>
              <select value={form.eleveId} onChange={(e) => setForm((f) => ({ ...f, eleveId: e.target.value }))} style={{ ...inp() }} disabled={!form.classeId}>
                <option value="">Sélectionner un élève…</option>
                {(elevesByClasse[form.classeId] ?? []).map((el) => <option key={el.id} value={el.id}>{el.firstName} {el.lastName}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={lbl()}>Type</label>
                <select value={form.typeAbsence} onChange={(e) => setForm((f) => ({ ...f, typeAbsence: e.target.value }))} style={{ ...inp() }}>
                  <option value="ABSENT">Absent</option>
                  <option value="RETARD">Retard</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Motif</label>
              <input value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} style={inp()} placeholder="Motif (optionnel)" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.justifiee} onChange={(e) => setForm((f) => ({ ...f, justifiee: e.target.checked }))} />
              Absence justifiée
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreate} disabled={createMut.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: createMut.isPending ? 0.7 : 1 }}>
                {createMut.isPending ? 'Enregistrement…' : 'Déclarer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL REJET ═══ */}
      {showRejetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: '#fff', width: 420, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Rejeter l&apos;absence</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Le motif de rejet sera visible par l&apos;élève et le parent.</div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl()}>Motif du rejet (optionnel)</label>
              <textarea value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)} rows={3} placeholder="Ex: Aucun justificatif fourni…" style={{ ...inp(), height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRejetModal(null)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleRejeter} style={{ height: 38, padding: '0 20px', border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DRAWER DÉTAIL ═══ */}
      {selectedAbsence && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }} onClick={() => { setSelectedAbsence(null); setDrawerTab('detail'); }}>
          <div style={{ width: 520, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,.1)', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>

            {/* Header drawer */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{eleveName(selectedAbsence)}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{className(selectedAbsence)}{selectedAbsence.eleveMatricule ? ` · ${selectedAbsence.eleveMatricule}` : ''}</div>
                </div>
                <button onClick={() => { setSelectedAbsence(null); setDrawerTab('detail'); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
              </div>
              {/* Onglets */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e6ebf1', marginBottom: -1 }}>
                {([['detail', 'Détail absence'], ['convocations', `Convocations${eleveConvocations.length > 0 ? ` (${eleveConvocations.length})` : ''}`]] as [string, string][]).map(([t, label]) => (
                  <button key={t} onClick={() => setDrawerTab(t as 'detail' | 'convocations')} style={{ height: 36, padding: '0 16px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: drawerTab === t ? 700 : 400, color: drawerTab === t ? '#2563eb' : '#64748b', borderBottom: drawerTab === t ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Onglet Détail ── */}
            {drawerTab === 'detail' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {/* Infos grille */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Date</div>
                    <div style={{ fontSize: 13, color: '#0f172a' }}>{new Date(selectedAbsence.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Type</div>
                    {(() => { const tp = TYPE_MAP[selectedAbsence.typeAbsence] ?? { label: selectedAbsence.typeAbsence, bg: '#f1f5f9', color: '#475569' }; return <span style={{ fontSize: 11, fontWeight: 700, color: tp.color, background: tp.bg, padding: '3px 8px' }}>{tp.label}</span>; })()}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Statut</div>
                    {(() => { const st = STATUT_MAP[selectedAbsence.statut] ?? STATUT_MAP.EN_ATTENTE; return <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px' }}>{st.label}</span>; })()}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Source</div>
                    {(() => { const src = SOURCE_MAP[selectedAbsence.source ?? 'ADMIN'] ?? SOURCE_MAP.ADMIN; return <span style={{ fontSize: 11, fontWeight: 700, color: src.color, background: src.bg, padding: '3px 8px' }}>{src.label}</span>; })()}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Justifiée</div>
                    <div style={{ fontSize: 13, color: selectedAbsence.justifiee ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{selectedAbsence.justifiee ? 'Oui' : 'Non'}</div>
                  </div>
                </div>

                {selectedAbsence.motif && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Motif</div>
                    <div style={{ fontSize: 13, color: '#334155', background: '#f8fafc', padding: '10px 14px', border: '1px solid #e6ebf1' }}>{selectedAbsence.motif}</div>
                  </div>
                )}

                {selectedAbsence.motifRejet && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Motif du rejet</div>
                    <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', padding: '10px 14px', border: '1px solid #fee2e2' }}>{selectedAbsence.motifRejet}</div>
                  </div>
                )}

                {/* Justificatif */}
                {selectedAbsence.documentJustificatifUrl && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Justificatif</div>
                    <div style={{ border: '1px solid #e6ebf1', padding: '12px 14px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>📎</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#334155', fontWeight: 600, marginBottom: 2 }}>Document joint</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAbsence.documentJustificatifUrl.split('/').pop()}</div>
                      </div>
                      <a href={selectedAbsence.documentJustificatifUrl} target="_blank" rel="noopener noreferrer" style={{ height: 30, padding: '0 12px', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        Ouvrir
                      </a>
                    </div>
                  </div>
                )}

                {/* Actions absence */}
                <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e6ebf1', flexWrap: 'wrap' }}>
                  {selectedAbsence.statut === 'EN_ATTENTE' && (
                    <>
                      <button onClick={() => { handleApprouver(selectedAbsence.id); setSelectedAbsence(null); }} style={{ flex: 1, minWidth: 100, height: 38, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Approuver
                      </button>
                      <button onClick={() => setShowRejetModal(selectedAbsence.id)} style={{ flex: 1, minWidth: 100, height: 38, border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Rejeter
                      </button>
                    </>
                  )}
                  <button onClick={openConvocModal} style={{ flex: 1, minWidth: 130, height: 38, border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Convoquer le parent
                  </button>
                </div>
              </div>
            )}

            {/* ── Onglet Convocations ── */}
            {drawerTab === 'convocations' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Historique des convocations pour {eleveName(selectedAbsence)}</div>
                  <button onClick={openConvocModal} style={{ height: 32, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Nouvelle
                  </button>
                </div>

                {eleveConvocations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                    Aucune convocation pour cet élève
                    <div style={{ marginTop: 12 }}>
                      <button onClick={openConvocModal} style={{ height: 36, padding: '0 18px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Créer une convocation
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {eleveConvocations.map((c) => (
                    <div key={c.id} style={{ border: '1px solid #e6ebf1', background: '#fff', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                            {c.dateConvocation ? new Date(c.dateConvocation).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {c.type && <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '1px 6px' }}>{c.type}</span>}
                            <span style={{ fontSize: 10, fontWeight: 600, color: c.statut === 'EN_ATTENTE' ? '#92400e' : '#166534', background: c.statut === 'EN_ATTENTE' ? '#fef3c7' : '#dcfce7', padding: '1px 6px' }}>
                              {c.statut === 'EN_ATTENTE' ? 'En attente' : c.statut === 'PRESENTE' ? 'Présentée' : c.statut}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => { if (confirm('Supprimer cette convocation ?')) deleteConvocMut.mutate(c.id); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#94a3b8', padding: 4 }} title="Supprimer">✕</button>
                      </div>

                      <div style={{ fontSize: 12, color: '#334155', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>MOTIF : </span>{c.motif}
                      </div>

                      {c.observations && (
                        <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, fontStyle: 'italic' }}>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, fontStyle: 'normal' }}>OBS : </span>{c.observations}
                        </div>
                      )}

                      {/* Compte-rendu */}
                      {c.compteRendu ? (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', marginTop: 6 }}>
                          <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, marginBottom: 2 }}>COMPTE-RENDU</div>
                          <div style={{ fontSize: 12, color: '#15803d' }}>{c.compteRendu}</div>
                        </div>
                      ) : (
                        compteRenduId === c.id ? (
                          <div style={{ marginTop: 8 }}>
                            <textarea value={compteRenduText} onChange={(e) => setCompteRenduText(e.target.value)} rows={2} placeholder="Compte-rendu de la convocation…" style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                              <button onClick={() => { compteRenduMut.mutate({ id: c.id, compteRendu: compteRenduText }); setCompteRenduId(null); setCompteRenduText(''); }} disabled={!compteRenduText} style={{ height: 28, padding: '0 12px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: compteRenduText ? 1 : 0.5 }}>Enregistrer</button>
                              <button onClick={() => { setCompteRenduId(null); setCompteRenduText(''); }} style={{ height: 28, padding: '0 10px', border: '1px solid #d9e0e8', background: '#fff', color: '#475569', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setCompteRenduId(c.id); setCompteRenduText(''); }} style={{ marginTop: 6, height: 26, padding: '0 10px', border: '1px solid #d9e0e8', background: '#fff', color: '#64748b', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            + Ajouter compte-rendu
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL CONVOCATION ═══ */}
      {showConvocModal && selectedAbsence && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', width: 520, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Convoquer le parent</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Élève : {eleveName(selectedAbsence)} — {className(selectedAbsence)}</div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Parent *</label>
              <select value={convocForm.parentId} onChange={(e) => setConvocForm((f) => ({ ...f, parentId: e.target.value }))} style={{ ...inp() }}>
                <option value="">Sélectionner un parent…</option>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}{p.email ? ` — ${p.email}` : ''}</option>)}
              </select>
              {parents.length === 0 && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Chargement des parents…</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl()}>Motif *</label>
              <textarea value={convocForm.motif} onChange={(e) => setConvocForm((f) => ({ ...f, motif: e.target.value }))} rows={3} style={{ ...inp(), height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl()}>Type</label>
                <select value={convocForm.type} onChange={(e) => setConvocForm((f) => ({ ...f, type: e.target.value }))} style={{ ...inp() }}>
                  <option value="DISCIPLINAIRE">Disciplinaire</option>
                  <option value="ACADEMIQUE">Académique</option>
                  <option value="ADMINISTRATIF">Administratif</option>
                </select>
              </div>
              <div>
                <label style={lbl()}>Date de convocation *</label>
                <input type="datetime-local" value={convocForm.dateConvocation} onChange={(e) => setConvocForm((f) => ({ ...f, dateConvocation: e.target.value }))} style={inp()} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl()}>Observations (optionnel)</label>
              <textarea value={convocForm.observations} onChange={(e) => setConvocForm((f) => ({ ...f, observations: e.target.value }))} rows={2} placeholder="Ex: Apporter le carnet de correspondance…" style={{ ...inp(), height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowConvocModal(false); setConvocForm(EMPTY_CONVOC_FORM); }} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreateConvoc} disabled={createConvocMut.isPending} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: createConvocMut.isPending ? 0.7 : 1 }}>
                {createConvocMut.isPending ? 'Envoi…' : 'Créer la convocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
