'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

type AnneeItem = { id: string; libelle: string; estCourante?: boolean };
type CycleConfig = { id: string; nom: string; typePeriode: string; moyenneMaximale?: number };
type CycleInfo = { id?: string; libelle?: string; nom?: string; code?: string; typePeriode?: string };
type ClasseItem = { id: string; nom: string; cycleId?: string; cycle?: CycleInfo; niveau?: { libelle?: string; nom?: string; cycleId?: string; cycle?: CycleInfo }; nbEleves?: number; _count?: { eleves?: number } };

type BulletinItem = {
  id: string; eleveId: string; trimestre: string; moyenne: number | null; moyenneClasse?: number | null;
  rang?: number | null; appreciation?: string | null; nombreAbsences?: number; nombreRetards?: number;
  statut?: string;
  eleve?: EleveItem;
};
type EleveItem = { id: string; firstName?: string; lastName?: string; matricule?: string };
type MatiereItem = { id: string; code?: string; libelle?: string };
type MatiereClasseItem = { matiereId?: string; matiere?: MatiereItem; coefficient?: number; noteMaximum?: number };
type NoteItem = { id: string; eleveId: string; matiereId?: string; note: number; typeEvaluation?: string; type?: string; trimestre?: string; matiere?: MatiereItem };

function getCycleName(c: ClasseItem): string {
  return c.cycle?.libelle ?? c.cycle?.nom ?? c.niveau?.cycle?.libelle ?? c.niveau?.cycle?.nom ?? 'Autre';
}

function eleveName(e?: { firstName?: string; lastName?: string }): string {
  if (!e) return '—';
  return `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || '—';
}

function fmtRang(r: number): string {
  if (r === 1) return '1er';
  return `${r}ème`;
}

function getNoteColor(n: number): string {
  if (n >= 16) return '#16a34a';
  if (n >= 12) return '#2563eb';
  if (n >= 10) return '#d97706';
  return '#dc2626';
}

function getMention(m: number | null): string {
  if (m === null) return '—';
  if (m >= 16) return 'TB';
  if (m >= 14) return 'B';
  if (m >= 12) return 'AB';
  if (m >= 10) return 'Passable';
  return 'Insuffisant';
}

// Codes période backend
const TRIMESTRES = ['TRIMESTRE_1', 'TRIMESTRE_2', 'TRIMESTRE_3'];
const SEMESTRES = ['SEMESTRE_1', 'SEMESTRE_2'];

function periodeLabel(code: string): string {
  const map: Record<string, string> = {
    TRIMESTRE_1: 'Trimestre 1', TRIMESTRE_2: 'Trimestre 2', TRIMESTRE_3: 'Trimestre 3',
    SEMESTRE_1: 'Semestre 1', SEMESTRE_2: 'Semestre 2',
  };
  return map[code] ?? code;
}

function periodeShort(code: string): string {
  const map: Record<string, string> = {
    TRIMESTRE_1: 'T1', TRIMESTRE_2: 'T2', TRIMESTRE_3: 'T3',
    SEMESTRE_1: 'S1', SEMESTRE_2: 'S2',
  };
  return map[code] ?? code;
}

export default function BulletinsAdminPage() {
  const [annees, setAnnees] = useState<AnneeItem[]>([]);
  const [selectedAnneeId, setSelectedAnneeId] = useState('');
  const [cyclesConfig, setCyclesConfig] = useState<CycleConfig[]>([]);
  const [classes, setClasses] = useState<ClasseItem[]>([]);
  const [bulletins, setBulletins] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  // Drawer détails
  const [detailClasse, setDetailClasse] = useState<ClasseItem | null>(null);
  const [detailEleves, setDetailEleves] = useState<EleveItem[]>([]);
  const [detailMatieres, setDetailMatieres] = useState<(MatiereItem & { coefficient: number; noteMaximum: number })[]>([]);
  const [detailMoyMax, setDetailMoyMax] = useState(20);
  const [detailNotes, setDetailNotes] = useState<NoteItem[]>([]);
  const [detailBulletins, setDetailBulletins] = useState<BulletinItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPeriodes, setDetailPeriodes] = useState<string[]>([]);
  const [detailTab, setDetailTab] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [expandedEleves, setExpandedEleves] = useState<Set<string>>(new Set());

  const fetchData = useCallback((anneeId: string) => {
    setLoading(true);
    const params = anneeId ? { anneeId, size: 500 } : { size: 500 };
    Promise.all([
      apiClient.get('/admin/classes', { params }),
      apiClient.get('/admin/bulletins', { params: { size: 1000 } }),
      apiClient.get('/admin/configuration/sections'),
    ]).then(([clRes, bulRes, cycRes]) => {
      const cd = clRes.data as Record<string, unknown>;
      setClasses((Array.isArray(cd) ? cd : (cd?.data ?? cd?.content ?? [])) as ClasseItem[]);
      const bd = bulRes.data as Record<string, unknown>;
      setBulletins((Array.isArray(bd) ? bd : (bd?.data ?? bd?.content ?? [])) as Record<string, unknown>[]);
      const cyc = cycRes.data;
      const configs = (Array.isArray(cyc) ? cyc : ((cyc as Record<string, unknown>)?.data ?? [])) as CycleConfig[];
      setCyclesConfig(configs);
      if (!selectedPeriode && configs.length > 0) {
        const firstTp = configs[0].typePeriode;
        setSelectedPeriode(firstTp === 'SEMESTRE' ? 'SEMESTRE_1' : 'TRIMESTRE_1');
      }
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPeriode]);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/configuration/annees-academiques'),
      apiClient.get('/admin/configuration/annees-academiques/courante'),
    ]).then(([anneesRes, couranteRes]) => {
      const ad = anneesRes.data as Record<string, unknown>;
      const list: AnneeItem[] = Array.isArray(ad) ? ad : ((ad?.data ?? ad?.content ?? []) as AnneeItem[]);
      const sorted = [...list].sort((a, b) => b.libelle.localeCompare(a.libelle));
      setAnnees(sorted);
      const cd = couranteRes.data as Record<string, unknown>;
      const current = (cd?.data ?? cd) as Record<string, unknown>;
      const couranteId = current?.id ? String(current.id) : (sorted[0]?.id ?? '');
      setSelectedAnneeId(couranteId);
      fetchData(couranteId);
    }).catch(() => setLoading(false));
  }, [fetchData]);

  useEffect(() => {
    if (selectedAnneeId) fetchData(selectedAnneeId);
  }, [selectedAnneeId, fetchData]);

  const selectedAnneeLibelle = annees.find((a) => a.id === selectedAnneeId)?.libelle ?? '';

  // Cycles config
  const cycleConfigById = new Map(cyclesConfig.map((cc) => [cc.id, cc]));

  const resolveTypePeriode = (c: ClasseItem): string => {
    const cycleId = c.cycle?.id ?? c.niveau?.cycle?.id ?? c.cycleId ?? c.niveau?.cycleId;
    if (cycleId) { const cfg = cycleConfigById.get(cycleId); if (cfg?.typePeriode) return cfg.typePeriode; }
    return c.cycle?.typePeriode ?? c.niveau?.cycle?.typePeriode ?? 'TRIMESTRE';
  };

  const allPeriodes: string[] = [];
  const seenPeriodes = new Set<string>();
  for (const cc of cyclesConfig) {
    const ps = cc.typePeriode === 'SEMESTRE' ? SEMESTRES : TRIMESTRES;
    for (const p of ps) { if (!seenPeriodes.has(p)) { seenPeriodes.add(p); allPeriodes.push(p); } }
  }
  if (allPeriodes.length === 0) allPeriodes.push(...TRIMESTRES);

  const isPeriodeCompatible = (c: ClasseItem): boolean => {
    const tp = resolveTypePeriode(c);
    if (tp === 'SEMESTRE') return selectedPeriode.startsWith('SEMESTRE');
    return selectedPeriode.startsWith('TRIMESTRE');
  };

  const getBulletinCount = (classeId: string, periode: string): number => {
    return bulletins.filter((b) => {
      const bCid = String(b.classeId ?? (b.classe as Record<string, unknown> | undefined)?.id ?? '');
      return bCid === classeId && String(b.trimestre ?? '') === periode;
    }).length;
  };

  // Grouper par cycle
  const cycleGroups: { cycleName: string; typePeriode: string; classes: ClasseItem[] }[] = [];
  const cycleMap = new Map<string, { typePeriode: string; classes: ClasseItem[] }>();
  for (const c of classes) {
    const name = getCycleName(c);
    const tp = resolveTypePeriode(c);
    if (!cycleMap.has(name)) cycleMap.set(name, { typePeriode: tp, classes: [] });
    cycleMap.get(name)!.classes.push(c);
  }
  for (const [cycleName, data] of cycleMap) cycleGroups.push({ cycleName, ...data });

  const handleGenerer = async (classe: ClasseItem) => {
    setGenerating(classe.id);
    try {
      await apiClient.post('/admin/bulletins/generer', { classeId: classe.id, trimestre: selectedPeriode, anneeScolaire: selectedAnneeLibelle });
      toast.success(`Bulletins ${classe.nom} — ${periodeShort(selectedPeriode)} générés`);
      fetchData(selectedAnneeId);
    } catch { toast.error(`Erreur lors de la génération pour ${classe.nom}`); }
    finally { setGenerating(null); }
  };

  const handleGenererTous = async () => {
    const nonGeneres = visibleClasses.filter((c) => {
      const nb = getBulletinCount(c.id, selectedPeriode);
      return nb === 0 || nb < (c.nbEleves ?? c._count?.eleves ?? 0);
    });
    if (nonGeneres.length === 0) { toast.success('Tous les bulletins sont déjà générés'); return; }
    setGenerating('ALL');
    let ok = 0, fail = 0;
    for (const c of nonGeneres) {
      try { await apiClient.post('/admin/bulletins/generer', { classeId: c.id, trimestre: selectedPeriode, anneeScolaire: selectedAnneeLibelle }); ok++; }
      catch { fail++; }
    }
    setGenerating(null);
    fetchData(selectedAnneeId);
    if (fail === 0) toast.success(`${ok} classe${ok > 1 ? 's' : ''} — ${periodeShort(selectedPeriode)} générés`);
    else toast.error(`${ok} générés, ${fail} en erreur`);
  };

  const handlePublierTous = async () => {
    setGenerating('PUBLISH');
    try {
      await apiClient.post('/admin/bulletins/publier', { portee: 'TOUS', trimestre: selectedPeriode, anneeScolaire: selectedAnneeLibelle });
      toast.success('Bulletins publiés — visibles par les élèves');
      fetchData(selectedAnneeId);
    } catch { toast.error('Erreur lors de la publication'); }
    setGenerating(null);
  };

  // Ouvrir détails d'une classe — charger élèves, matières, notes, bulletins
  const openDetail = async (c: ClasseItem) => {
    setDetailClasse(c);
    setDetailLoading(true);
    setDetailEleves([]);
    setDetailMatieres([]);
    setDetailNotes([]);
    setDetailBulletins([]);
    const tp = resolveTypePeriode(c);
    const periodes = tp === 'SEMESTRE' ? SEMESTRES : TRIMESTRES;
    setDetailPeriodes(periodes);
    setDetailTab(periodes[0]);
    // Résoudre la moyenne maximale du cycle
    const cycleId = c.cycle?.id ?? c.niveau?.cycle?.id ?? c.cycleId ?? c.niveau?.cycleId;
    const cycleConf = cycleId ? cycleConfigById.get(cycleId) : undefined;
    setDetailMoyMax(cycleConf?.moyenneMaximale ?? 20);
    try {
      const extract = (r: { data: unknown }) => {
        const d = r.data as Record<string, unknown>;
        return Array.isArray(d) ? d : ((d?.data ?? d?.content ?? []) as Record<string, unknown>[]);
      };
      // Resolve niveauId for this class
      const niveauId = String((c as Record<string, unknown>).niveauId ?? ((c as Record<string, unknown>).niveau as Record<string, unknown> | undefined)?.id ?? '');
      const [elevesRes, mcRes, mnRes, notesRes, bulRes] = await Promise.all([
        apiClient.get(`/admin/classes/${c.id}/eleves`),
        apiClient.get('/admin/matieres-classes', { params: { classeId: c.id, size: 500 } }),
        niveauId ? apiClient.get('/admin/matieres-niveaux', { params: { niveauId, size: 500 } }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        apiClient.get('/admin/notes', { params: { classeId: c.id, size: 2000 } }),
        apiClient.get('/admin/bulletins', { params: { classeId: c.id, size: 500 } }),
      ]);
      const rawEleves = extract(elevesRes);
      const eleves = rawEleves.map((item) => {
        const e = (item as Record<string, unknown>).eleve as EleveItem | undefined;
        return e ?? item as unknown as EleveItem;
      }).filter((e) => e?.id);
      // Sort by rang (from bulletins of selected period), fallback to name
      setDetailEleves(eleves);
      setExpandedEleves(eleves.length > 0 ? new Set([eleves[0].id]) : new Set());

      // Coefficients depuis matieres-niveaux (source de vérité)
      const mnList = extract(mnRes) as Record<string, unknown>[];
      const coefMap = new Map<string, { coefficient: number; noteMaximum: number }>();
      for (const mn of mnList) {
        const mId = String(mn.matiereId ?? (mn.matiere as Record<string, unknown> | undefined)?.id ?? '');
        if (mId) coefMap.set(mId, { coefficient: Number(mn.coefficient ?? 1), noteMaximum: Number(mn.noteMaximum ?? 20) });
      }

      // Matières depuis matieres-classes + coefficients depuis matieres-niveaux
      const mcList = extract(mcRes) as MatiereClasseItem[];
      const matMap = new Map<string, MatiereItem & { coefficient: number; noteMaximum: number }>();
      for (const mc of mcList) {
        const m = mc.matiere as MatiereItem | undefined;
        if (m?.id && !matMap.has(m.id)) {
          const cn = coefMap.get(m.id);
          matMap.set(m.id, { ...m, coefficient: cn?.coefficient ?? mc.coefficient ?? 1, noteMaximum: cn?.noteMaximum ?? mc.noteMaximum ?? 20 });
        }
      }
      const notesList = extract(notesRes) as NoteItem[];
      // Fallback : extraire les matières depuis les notes si matieres-classes est vide
      if (matMap.size === 0) {
        for (const n of notesList) {
          const m = n.matiere as MatiereItem | undefined;
          const mId = n.matiereId ?? m?.id;
          if (mId && !matMap.has(mId)) {
            const cn = coefMap.get(mId);
            matMap.set(mId, { id: mId, libelle: m?.libelle ?? m?.code ?? '—', code: m?.code ?? '', coefficient: cn?.coefficient ?? 1, noteMaximum: cn?.noteMaximum ?? 20 });
          }
        }
      }
      // Si matieres-niveaux a des matières pas dans matieres-classes, les ajouter aussi
      for (const mn of mnList) {
        const m = (mn.matiere as Record<string, unknown> | undefined);
        const mId = String(mn.matiereId ?? m?.id ?? '');
        if (mId && !matMap.has(mId) && m) {
          matMap.set(mId, { id: mId, libelle: String(m.libelle ?? m.code ?? ''), code: String(m.code ?? ''), coefficient: Number(mn.coefficient ?? 1), noteMaximum: Number(mn.noteMaximum ?? 20) });
        }
      }
      setDetailMatieres(Array.from(matMap.values()).sort((a, b) => (a.libelle ?? a.code ?? '').localeCompare(b.libelle ?? b.code ?? '', 'fr')));
      setDetailNotes(notesList);
      setDetailBulletins(extract(bulRes) as BulletinItem[]);
    } catch { /* silent */ }
    finally { setDetailLoading(false); }
  };

  // Stats
  const visibleClasses = cycleGroups.flatMap((g) => g.classes);
  const totalEleves = visibleClasses.reduce((acc, c) => acc + (c.nbEleves ?? c._count?.eleves ?? 0), 0);
  const totalGeneres = visibleClasses.reduce((acc, c) => acc + getBulletinCount(c.id, selectedPeriode), 0);
  const allDone = visibleClasses.length > 0 && visibleClasses.every((c) => {
    const nb = getBulletinCount(c.id, selectedPeriode);
    return nb > 0 && nb >= (c.nbEleves ?? c._count?.eleves ?? 0);
  });

  // Helpers pour le drawer
  const getNotesForEleve = (eleveId: string, matiereId: string, periode: string): NoteItem[] => {
    return detailNotes.filter((n) => n.eleveId === eleveId && (n.matiereId === matiereId || (n.matiere as MatiereItem | undefined)?.id === matiereId) && String(n.trimestre ?? '') === periode);
  };
  const getBulletinForEleve = (eleveId: string, periode: string): BulletinItem | undefined => {
    return detailBulletins.find((b) => b.eleveId === eleveId && b.trimestre === periode);
  };
  const isDevoir = (n: NoteItem) => {
    const t = (n.typeEvaluation ?? n.type ?? '').toUpperCase();
    return t === 'DEVOIR' || t === 'INTERROGATION' || t === 'CONTROLE';
  };
  const isComposition = (n: NoteItem) => {
    const t = (n.typeEvaluation ?? n.type ?? '').toUpperCase();
    return t === 'COMPOSITION' || t === 'EXAMEN';
  };

  /**
   * Moyenne générale d'un élève pour une période, calculée depuis les notes.
   * C'est exactement le calcul utilisé pour l'affichage — le rang doit en
   * découler, sinon moyenne et classement se contredisent à l'écran.
   */
  const computeMoyenne = (eleveId: string, periode: string): number | null => {
    if (detailMatieres.length === 0) return null;
    let totalCoef = 0;
    let totalPoints = 0;
    for (const m of detailMatieres) {
      const notes = detailNotes.filter(
        (n) =>
          n.eleveId === eleveId &&
          (n.matiereId === m.id || (n.matiere as MatiereItem | undefined)?.id === m.id) &&
          String(n.trimestre ?? '') === periode
      );
      const devoirs = notes.filter(isDevoir);
      const compositions = notes.filter(isComposition);
      const moyDevoirs = devoirs.length > 0 ? devoirs.reduce((s, n) => s + n.note, 0) / devoirs.length : 0;
      const noteCompo = compositions.length > 0 ? compositions.reduce((s, n) => s + n.note, 0) / compositions.length : 0;
      totalCoef += m.coefficient;
      totalPoints += ((moyDevoirs + noteCompo) / 2) * m.coefficient;
    }
    return totalCoef > 0 ? totalPoints / totalCoef : null;
  };

  /**
   * Rangs recalculés à partir des moyennes affichées.
   * Les ex aequo partagent le même rang (1, 2, 2, 4…).
   */
  const rangsCalcules = useMemo(() => {
    const map = new Map<string, number>();
    if (detailEleves.length === 0 || detailMatieres.length === 0) return map;

    const scores = detailEleves
      .map((e) => ({ id: e.id, moy: computeMoyenne(e.id, detailTab) }))
      .filter((s): s is { id: string; moy: number } => s.moy !== null)
      .sort((a, b) => b.moy - a.moy);

    let rang = 0;
    let precedente: number | null = null;
    scores.forEach((s, index) => {
      // Comparaison sur 2 décimales : deux moyennes affichées identiques
      // doivent recevoir le même rang.
      const arrondie = Math.round(s.moy * 100) / 100;
      if (precedente === null || arrondie !== precedente) {
        rang = index + 1;
        precedente = arrondie;
      }
      map.set(s.id, rang);
    });
    return map;
  }, [detailEleves, detailNotes, detailMatieres, detailTab]);

  const totalClasses = rangsCalcules.size;

  // Tri par rang recalculé, puis par nom
  const sortedDetailEleves = useMemo(() => {
    if (detailEleves.length === 0) return detailEleves;
    return [...detailEleves].sort((a, b) => {
      const ra = rangsCalcules.get(a.id) ?? 9999;
      const rb = rangsCalcules.get(b.id) ?? 9999;
      if (ra !== rb) return ra - rb;
      return eleveName(a).localeCompare(eleveName(b), 'fr');
    });
  }, [detailEleves, rangsCalcules]);

  // Formats : moyenne par matière = 1 décimale, moy×coef et totaux = 2 décimales
  const fmt1 = (n: number): string => n % 1 === 0 ? String(n) : n.toFixed(1);
  const fmt2 = (n: number): string => n % 1 === 0 ? String(n) : n.toFixed(2);
  const fmt = (n: number | null): string => n === null ? '—' : fmt2(n);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Bulletins</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{visibleClasses.length} classes</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {!loading && visibleClasses.length > 0 && !allDone && (
            <button onClick={handleGenererTous} disabled={generating === 'ALL'}
              style={{ height: 38, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {generating === 'ALL' ? 'Génération…' : `Générer ${periodeShort(selectedPeriode)}`}
            </button>
          )}
          {!loading && totalGeneres > 0 && (
            <button onClick={handlePublierTous} disabled={generating === 'PUBLISH'}
              style={{ height: 38, padding: '0 16px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/></svg>
              {generating === 'PUBLISH' ? 'Publication…' : 'Publier'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'Classes', val: String(visibleClasses.length), color: '#2563eb', bg: '#eff6ff' },
          // Effectif = inscriptions ACTIVES. Les inscriptions désactivées ne sont
          // pas comptées, d'où un total inférieur au nombre d'élèves de l'école.
          // Le libellé le dit, sinon l'écart se lit comme des élèves manquants.
          { label: 'Élèves inscrits', val: String(totalEleves), color: '#7c3aed', bg: '#f5f3ff' },
          { label: `Bulletins ${periodeShort(selectedPeriode)}`, val: String(totalGeneres), color: '#16a34a', bg: '#dcfce7' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10 }}>
        <select value={selectedAnneeId} onChange={(e) => setSelectedAnneeId(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Toutes les années</option>
          {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.estCourante ? ' (en cours)' : ''}</option>)}
        </select>
        <select value={selectedPeriode} onChange={(e) => setSelectedPeriode(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', fontWeight: 600 }}>
          {allPeriodes.map((p) => <option key={p} value={p}>{periodeLabel(p)}</option>)}
        </select>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : visibleClasses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Aucune classe pour cette période</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {cycleGroups.map((group) => (
              <div key={group.cycleName}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{group.cycleName}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px' }}>
                    {group.typePeriode === 'SEMESTRE' ? 'Semestres' : 'Trimestres'}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{group.classes.length} classes</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                  {group.classes.map((c) => {
                    const nbEleves = c.nbEleves ?? c._count?.eleves ?? 0;
                    const nbGeneres = getBulletinCount(c.id, selectedPeriode);
                    const done = nbGeneres > 0 && nbGeneres >= nbEleves;
                    const progress = nbEleves > 0 ? Math.round((nbGeneres / nbEleves) * 100) : 0;
                    const isLoading = generating === c.id;

                    return (
                      <div key={c.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 40, height: 40, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{c.nom}</div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>{nbEleves} élèves</div>
                            </div>
                          </div>
                          {done && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px' }}>Généré</span>}
                        </div>

                        {nbGeneres > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                              <span>{nbGeneres}/{nbEleves} bulletins</span>
                              <span style={{ fontWeight: 700, color: done ? '#16a34a' : '#0f172a' }}>{progress}%</span>
                            </div>
                            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                              <div style={{ height: '100%', borderRadius: 3, background: done ? '#16a34a' : '#2563eb', width: `${progress}%`, transition: 'width .3s' }} />
                            </div>
                          </div>
                        )}

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {done ? (
                            <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                              {periodeShort(selectedPeriode)} généré
                            </div>
                          ) : (
                            <button onClick={() => handleGenerer(c)} disabled={isLoading}
                              style={{ flex: 1, height: 34, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                              {isLoading ? 'Génération…' : `Générer ${periodeShort(selectedPeriode)}`}
                            </button>
                          )}
                          <button onClick={() => openDetail(c)}
                            style={{ height: 34, padding: '0 14px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Détails
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer détails */}
      {detailClasse && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.3)' }} onClick={() => setDetailClasse(null)} />
          <div style={{ position: 'relative', width: 780, maxWidth: '92vw', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,.1)' }}>
            {/* Drawer header */}
            <div style={{ flexShrink: 0, borderBottom: '1px solid #e6ebf1', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{detailClasse.nom}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {selectedAnneeLibelle} — {detailEleves.length} élèves — {detailMatieres.length} matières
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => {
                  if (expandedEleves.size === detailEleves.length) setExpandedEleves(new Set());
                  else setExpandedEleves(new Set(detailEleves.map((e) => e.id)));
                }} style={{ height: 30, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {expandedEleves.size === detailEleves.length ? 'Tout replier' : 'Tout déplier'}
                </button>
                <button onClick={() => setDetailClasse(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Onglets périodes */}
            <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid #e6ebf1' }}>
              {detailPeriodes.map((p) => (
                <button key={p} onClick={() => setDetailTab(p)}
                  style={{ flex: 1, height: 42, border: 'none', borderBottom: detailTab === p ? '2px solid #2563eb' : '2px solid transparent', background: 'none', color: detailTab === p ? '#2563eb' : '#64748b', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                  {periodeLabel(p)}
                </button>
              ))}
            </div>

            {/* Recherche */}
            <div style={{ flexShrink: 0, padding: '12px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', background: '#fff', padding: '0 12px', height: 36 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} placeholder="Rechercher un élève…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', background: 'transparent', fontFamily: 'inherit' }} />
              </div>
            </div>

            {/* Drawer content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
              ) : detailEleves.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Aucun élève dans cette classe</div>
              ) : (() => {
                const isPrimaire = detailMoyMax < 20;
                const isLastPeriode = detailTab === detailPeriodes[detailPeriodes.length - 1];
                const periodeLabelStr = detailTab.startsWith('SEMESTRE') ? 'semestrielle' : 'trimestrielle';
                const filteredEleves = detailSearch
                  ? sortedDetailEleves.filter((e) => eleveName(e).toLowerCase().includes(detailSearch.toLowerCase()) || (e.matricule ?? '').toLowerCase().includes(detailSearch.toLowerCase()))
                  : sortedDetailEleves;
                const th = { fontSize: 10, fontWeight: 700 as const, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '.03em', padding: '8px 0' };

                // Calcul moyenne annuelle pour un élève
                const calcMoyAnnuelle = (eleveId: string): number | null => {
                  const moysPeriodes: number[] = [];
                  for (const p of detailPeriodes) {
                    const bulP = getBulletinForEleve(eleveId, p);
                    if (bulP?.moyenne !== null && bulP?.moyenne !== undefined) {
                      moysPeriodes.push(bulP.moyenne);
                    } else {
                      const ligs = detailMatieres.map((m) => {
                        const notes = getNotesForEleve(eleveId, m.id, p);
                        const devs = notes.filter(isDevoir);
                        const comps = notes.filter(isComposition);
                        const md = devs.length > 0 ? devs.reduce((s, n) => s + n.note, 0) / devs.length : 0;
                        const nc = comps.length > 0 ? comps.reduce((s, n) => s + n.note, 0) / comps.length : 0;
                        return ((md + nc) / 2) * m.coefficient;
                      });
                      const totalC = detailMatieres.reduce((s, m) => s + m.coefficient, 0);
                      const tp = ligs.reduce((s, v) => s + v, 0);
                      if (totalC > 0) moysPeriodes.push(tp / totalC);
                    }
                  }
                  return moysPeriodes.length > 0 ? moysPeriodes.reduce((a, b) => a + b, 0) / moysPeriodes.length : null;
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {filteredEleves.map((eleve) => {
                      const bul = getBulletinForEleve(eleve.id, detailTab);
                      const lignes = detailMatieres.map((m) => {
                        const notes = getNotesForEleve(eleve.id, m.id, detailTab);
                        const devoirs = notes.filter(isDevoir);
                        const compositions = notes.filter(isComposition);
                        // Note absente = 0 (toutes les matières comptent)
                        const moyDevoirs = devoirs.length > 0 ? devoirs.reduce((s, n) => s + n.note, 0) / devoirs.length : 0;
                        const noteCompo = compositions.length > 0 ? compositions.reduce((s, n) => s + n.note, 0) / compositions.length : 0;
                        const noteMax = m.noteMaximum;
                        const coef = m.coefficient;
                        // Moyenne semestrielle = (devoirs + composition) / 2
                        const moyPeriode = (moyDevoirs + noteCompo) / 2;
                        const periodeXCoef = moyPeriode * coef;
                        return { matiere: m, moyDevoirs, noteCompo, moyPeriode, noteMax, coef, periodeXCoef };
                      });
                      // TOUTES les matières comptent dans le total (sans notes = 0)
                      const totalCoef = lignes.reduce((s, l) => s + l.coef, 0);
                      const totalPoints = lignes.reduce((s, l) => s + l.periodeXCoef, 0);
                      const totalSur = lignes.reduce((s, l) => s + (l.noteMax * l.coef), 0);
                      const moyGenerale = totalCoef > 0 ? totalPoints / totalCoef : null;
                      // Toujours utiliser le calcul frontend (le backend peut avoir une ancienne valeur)
                      const moyAffichee = moyGenerale;
                      // Le rang dérive de cette même moyenne : les deux ne peuvent plus diverger.
                      const rangCalcule = rangsCalcules.get(eleve.id) ?? null;

                      const isExpanded = expandedEleves.has(eleve.id);
                      const toggleEleve = () => setExpandedEleves((prev) => {
                        const next = new Set(prev);
                        if (next.has(eleve.id)) next.delete(eleve.id); else next.add(eleve.id);
                        return next;
                      });

                      return (
                        <div key={eleve.id} style={{ border: '1px solid #e6ebf1' }}>
                          {/* Élève header — cliquable */}
                          <div onClick={toggleEleve} style={{ padding: '12px 16px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ transition: 'transform .2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}><path d="m9 18 6-6-6-6"/></svg>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{eleveName(eleve)}</span>
                              {moyAffichee !== null && <span style={{ fontSize: 12, fontWeight: 700, color: getNoteColor(moyAffichee) }}>{fmt(moyAffichee)}/{detailMoyMax}</span>}
                              {rangCalcule && <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtRang(rangCalcule)}</span>}
                            </div>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{eleve.matricule ?? ''}</span>
                          </div>

                          {/* Contenu — accordéon */}
                          {isExpanded && <>
                          {/* Tableau bulletin */}
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                              <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                                  <th style={{ ...th, textAlign: 'left', paddingLeft: 16 }}>Disciplines</th>
                                  <th style={{ ...th, textAlign: 'center' }}>Devoirs<br /><span style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8' }}>sur {detailMoyMax}</span></th>
                                  <th style={{ ...th, textAlign: 'center' }}>Composition<br /><span style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8' }}>sur {detailMoyMax}</span></th>
                                  <th style={{ ...th, textAlign: 'center' }}>{periodeLabelStr.charAt(0).toUpperCase() + periodeLabelStr.slice(1)}<br /><span style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8' }}>sur {detailMoyMax}</span></th>
                                  <th style={{ ...th, textAlign: 'center' }}>Coef.</th>
                                  <th style={{ ...th, textAlign: 'center' }}>{periodeLabelStr.charAt(0).toUpperCase() + periodeLabelStr.slice(1)}<br /><span style={{ fontSize: 9, fontWeight: 500, color: '#94a3b8' }}>× Coef</span></th>
                                  <th style={{ ...th, textAlign: 'left', paddingLeft: 8 }}>Appréciations</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lignes.map((l, li) => {
                                  const appreciation = getMention(l.moyPeriode);
                                  return (
                                    <tr key={l.matiere.id} style={{ borderBottom: li < lignes.length - 1 ? '1px solid #f1f5f9' : '1px solid #e6ebf1' }}>
                                      <td style={{ padding: '7px 16px', fontWeight: 600, color: '#0f172a' }}>
                                        {l.matiere.libelle ?? l.matiere.code ?? '—'}
                                      </td>
                                      <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, color: getNoteColor(l.moyDevoirs) }}>{fmt1(l.moyDevoirs)}</td>
                                      <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, color: getNoteColor(l.noteCompo) }}>{fmt1(l.noteCompo)}</td>
                                      <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 800, color: getNoteColor(l.moyPeriode) }}>{fmt1(l.moyPeriode)}</td>
                                      <td style={{ padding: '7px 4px', textAlign: 'center', color: '#64748b' }}>{l.coef}</td>
                                      <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{fmt2(l.periodeXCoef)}</td>
                                      <td style={{ padding: '7px 8px', fontSize: 11, color: '#475569' }}>{appreciation}</td>
                                    </tr>
                                  );
                                })}
                                {detailMatieres.length === 0 && (
                                  <tr><td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>Aucune matière affectée</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Footer bulletin — style bulletin sénégalais */}
                          <div style={{ borderTop: '2px solid #0f172a', background: '#f8fafc' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderBottom: '1px solid #e6ebf1' }}>
                              <div style={{ padding: '10px 16px', borderRight: '1px solid #e6ebf1' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Total général</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{fmt2(totalPoints)} <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>sur {fmt2(totalSur)}</span></div>
                              </div>
                              <div style={{ padding: '10px 16px', borderRight: '1px solid #e6ebf1' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Moyenne {periodeLabelStr}</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: moyAffichee !== null ? getNoteColor(moyAffichee) : '#64748b' }}>
                                  {fmt(moyAffichee)} <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>sur {detailMoyMax}</span>
                                </div>
                              </div>
                              <div style={{ padding: '10px 16px', borderRight: '1px solid #e6ebf1' }}>
                                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Rang</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                                  {rangCalcule ? fmtRang(rangCalcule) : '—'}
                                  {rangCalcule && totalClasses > 0 && (
                                    <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}> sur {totalClasses}</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ padding: '10px 16px', display: 'flex', gap: 16 }}>
                                <div>
                                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Absences</div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: (bul?.nombreAbsences ?? 0) > 0 ? '#dc2626' : '#0f172a' }}>{bul?.nombreAbsences ?? 0}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Retards</div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: (bul?.nombreRetards ?? 0) > 0 ? '#d97706' : '#0f172a' }}>{bul?.nombreRetards ?? 0}</div>
                                </div>
                              </div>
                            </div>
                            {isLastPeriode && (
                              <div style={{ padding: '10px 16px', background: '#fefce8', borderBottom: '1px solid #e6ebf1' }}>
                                <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600 }}>Moyenne générale annuelle</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: calcMoyAnnuelle(eleve.id) !== null ? getNoteColor(calcMoyAnnuelle(eleve.id)!) : '#64748b' }}>
                                  {fmt(calcMoyAnnuelle(eleve.id))} <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8' }}>sur {detailMoyMax}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {bul?.appreciation && (
                            <div style={{ padding: '10px 16px', borderTop: '1px solid #e6ebf1', fontSize: 12, color: '#475569', fontStyle: 'italic', background: '#fefce8' }}>
                              <strong>Appréciation :</strong> {bul.appreciation}
                            </div>
                          )}
                          </>}
                        </div>
                      );
                    })}
                    {filteredEleves.length === 0 && detailSearch && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>Aucun élève trouvé pour "{detailSearch}"</div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
