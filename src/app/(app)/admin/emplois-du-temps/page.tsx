'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const HEURES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const TRANCHES = HEURES.slice(0, -1).map((h, i) => ({ label: `${h.slice(0, 2)}h-${HEURES[i + 1].slice(0, 2)}h`, debut: h, fin: HEURES[i + 1] }));
const COULEURS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#ffedd5', '#e0f2fe', '#fae8ff'];
const COULEURS_TXT = ['#1d4ed8', '#15803d', '#b45309', '#be185d', '#7c3aed', '#c2410c', '#0369a1', '#a21caf'];

type AnneeItem = { id: string; libelle: string; estCourante?: boolean };
type CycleItem = { id: string; nom: string; typePeriode?: string };
type NiveauItem = { id: string; nom: string; sectionId: string; section: string };
type ClasseItem = { id: string; nom: string; cycleId?: string; niveauId?: string; cycle?: { id: string; nom?: string; libelle?: string }; niveau?: { id: string; nom?: string; libelle?: string; cycleId?: string } };
type MatiereItem = { id: string; code?: string; libelle?: string };
type ProfItem = { id: string; firstName?: string; lastName?: string; matieresEnseignees?: { id: string; matiereId?: string; matiere?: { id: string } }[] };
type SalleItem = { id: string; nom: string; capacite?: number };
type CoursItem = { id: string; matiereId: string; classeId: string; enseignantId: string; matiere?: MatiereItem; classe?: { id: string; nom: string }; volumeHoraireHebdo?: number };
type EdtItem = { id: string; classeId: string; coursId?: string; salleId?: string; enseignantId?: string; matiereId?: string; jourSemaine: string; heureDebut: string; heureFin: string; publie?: boolean };

type MatiereNiveauItem = { id: string; matiereId: string; niveauId: string; coefficient: number; matiere?: MatiereItem };
const EMPTY_FORM = { classeId: '', matiereId: '', enseignantId: '', salleId: '', jourSemaine: 'Lundi', heureDebut: '08:00', heureFin: '10:00' };

function profName(p?: ProfItem | null): string {
  if (!p) return '—';
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '—';
}

function extract(r: { data: unknown }): Record<string, unknown>[] {
  const d = r.data as Record<string, unknown>;
  return Array.isArray(d) ? d : ((d?.data ?? d?.content ?? []) as Record<string, unknown>[]);
}

export default function CoursPage() {
  // Référentiels
  const [annees, setAnnees] = useState<AnneeItem[]>([]);
  const [cycles, setCycles] = useState<CycleItem[]>([]);
  const [niveaux, setNiveaux] = useState<NiveauItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClasseItem[]>([]);
  const [matieres, setMatieres] = useState<MatiereItem[]>([]);
  const [professeurs, setProfesseurs] = useState<ProfItem[]>([]);
  const [salles, setSalles] = useState<SalleItem[]>([]);
  const [matieresNiveaux, setMatieresNiveaux] = useState<MatiereNiveauItem[]>([]);
  const [allCours, setAllCours] = useState<CoursItem[]>([]);
  const [allEdt, setAllEdt] = useState<EdtItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [selectedAnneeId, setSelectedAnneeId] = useState('');
  const [filterCycleId, setFilterCycleId] = useState('');
  const [filterNiveauId, setFilterNiveauId] = useState('');
  const [filterClasseId, setFilterClasseId] = useState('');
  const [filterProfId, setFilterProfId] = useState('');
  const [filterSalleId, setFilterSalleId] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [extraSlots, setExtraSlots] = useState<{ jourSemaine: string; heureDebut: string; heureFin: string }[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Charger référentiels
  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/configuration/annees-academiques'),
      apiClient.get('/admin/configuration/annees-academiques/courante'),
      apiClient.get('/admin/configuration/sections'),
      apiClient.get('/admin/configuration/niveaux'),
      apiClient.get('/admin/matieres', { params: { size: 500 } }),
      apiClient.get('/admin/professeurs', { params: { size: 500 } }),
      apiClient.get('/admin/salles', { params: { size: 500 } }),
    ]).then(([anneesR, couranteR, cyclesR, niveauxR, matR, profR, sallesR]) => {
      const al = (Array.isArray(anneesR.data) ? anneesR.data : ((anneesR.data as Record<string, unknown>)?.data ?? [])) as AnneeItem[];
      const sorted = [...al].sort((a, b) => b.libelle.localeCompare(a.libelle));
      setAnnees(sorted);
      const cd = couranteR.data as Record<string, unknown>;
      const current = (cd?.data ?? cd) as Record<string, unknown>;
      setSelectedAnneeId(current?.id ? String(current.id) : (sorted[0]?.id ?? ''));
      setCycles(extract(cyclesR) as CycleItem[]);
      setNiveaux(extract(niveauxR) as NiveauItem[]);
      setMatieres(extract(matR) as MatiereItem[]);
      setProfesseurs(extract(profR) as ProfItem[]);
      setSalles(extract(sallesR) as SalleItem[]);
    }).catch(() => {});
  }, []);

  // Charger classes + cours + edt quand année change
  const fetchData = useCallback((anneeId: string) => {
    setLoading(true);
    const params = anneeId ? { anneeId, size: 500 } : { size: 500 };
    Promise.all([
      apiClient.get('/admin/classes', { params }),
      apiClient.get('/admin/cours', { params: { size: 1000 } }),
      apiClient.get('/admin/emplois-du-temps', { params: { size: 2000 } }),
      apiClient.get('/admin/matieres-niveaux', { params: { size: 1000 } }),
    ]).then(([clR, coursR, edtR, mnR]) => {
      setAllClasses(extract(clR) as ClasseItem[]);
      setAllCours(extract(coursR) as CoursItem[]);
      setAllEdt(extract(edtR) as EdtItem[]);
      setMatieresNiveaux(extract(mnR) as MatiereNiveauItem[]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (selectedAnneeId) fetchData(selectedAnneeId); }, [selectedAnneeId, fetchData]);

  // Lookups
  const profsById = useMemo(() => new Map(professeurs.map((p) => [p.id, p])), [professeurs]);
  const sallesById = useMemo(() => new Map(salles.map((s) => [s.id, s])), [salles]);
  const classesById = useMemo(() => new Map(allClasses.map((c) => [c.id, c])), [allClasses]);
  const coursById = useMemo(() => new Map(allCours.map((c) => [c.id, c])), [allCours]);

  // Classes filtrées
  const filteredClasses = useMemo(() => {
    return allClasses.filter((c) => {
      const cycleId = c.cycle?.id ?? c.cycleId ?? c.niveau?.cycleId;
      const niveauId = c.niveau?.id ?? c.niveauId;
      if (filterCycleId && cycleId !== filterCycleId) return false;
      if (filterNiveauId && niveauId !== filterNiveauId) return false;
      if (filterClasseId && c.id !== filterClasseId) return false;
      return true;
    });
  }, [allClasses, filterCycleId, filterNiveauId, filterClasseId]);

  const filteredClasseIds = useMemo(() => new Set(filteredClasses.map((c) => c.id)), [filteredClasses]);

  // EDT filtrés (par classes filtrées + par prof si filtre actif)
  const filteredEdt = useMemo(() => {
    return allEdt.filter((e) => {
      if (!filteredClasseIds.has(e.classeId)) return false;
      if (filterProfId && e.enseignantId !== filterProfId) return false;
      if (filterSalleId && e.salleId !== filterSalleId) return false;
      return true;
    });
  }, [allEdt, filteredClasseIds, filterProfId, filterSalleId]);

  // Niveaux filtrés par cycle sélectionné
  const filteredNiveaux = filterCycleId ? niveaux.filter((n) => n.sectionId === filterCycleId) : niveaux;

  // Classes pour le select filtre (filtrées par cycle + niveau)
  const classesForFilter = useMemo(() => {
    return allClasses.filter((c) => {
      const cycleId = c.cycle?.id ?? c.cycleId ?? c.niveau?.cycleId;
      const niveauId = c.niveau?.id ?? c.niveauId;
      if (filterCycleId && cycleId !== filterCycleId) return false;
      if (filterNiveauId && niveauId !== filterNiveauId) return false;
      return true;
    });
  }, [allClasses, filterCycleId, filterNiveauId]);

  // Couleur par classeId (pour distinguer les classes dans un même créneau)
  const getClasseColor = (classeId: string) => {
    const idx = classeId.charCodeAt(0) % COULEURS.length;
    return { bg: COULEURS[idx], text: COULEURS_TXT[idx] };
  };

  // Créneaux qui démarrent à cette heure
  const getCreneauxStart = (jour: string, heure: string): EdtItem[] => {
    return filteredEdt.filter((e) => e.jourSemaine === jour && e.heureDebut === heure);
  };

  // Créneaux qui couvrent cette heure (mais ne démarrent pas ici — pour marquer occupé)
  const isHeureCovered = (jour: string, heure: string): boolean => {
    return filteredEdt.some((e) => e.jourSemaine === jour && e.heureDebut < heure && e.heureFin > heure);
  };

  // Hauteur en lignes d'un créneau
  const getRowSpan = (edt: EdtItem): number => {
    const start = HEURES.indexOf(edt.heureDebut);
    const end = HEURES.indexOf(edt.heureFin);
    if (start === -1 || end === -1) return 1;
    return Math.max(1, end - start);
  };

  const getCreneauInfo = (edt: EdtItem) => {
    const c = edt.coursId ? coursById.get(edt.coursId) : null;
    const classe = classesById.get(edt.classeId);
    const matiere = c?.matiere ?? (edt.matiereId ? matieres.find((m) => m.id === edt.matiereId) : null);
    const prof = edt.enseignantId ? profsById.get(edt.enseignantId) : null;
    const salle = edt.salleId ? sallesById.get(edt.salleId) : null;
    return { classe, matiere, prof, salle };
  };

  // Matières configurées pour une classe (via matieres-niveaux avec coefficient)
  const getMatieresWithCoefForClasse = (classeId: string): (MatiereItem & { coefficient: number })[] => {
    const classe = classesById.get(classeId);
    const niveauId = classe?.niveau?.id ?? classe?.niveauId;
    if (!niveauId) return matieres.map((m) => ({ ...m, coefficient: 1 }));
    const mnForNiveau = matieresNiveaux.filter((mn) => mn.niveauId === niveauId);
    if (mnForNiveau.length === 0) return matieres.map((m) => ({ ...m, coefficient: 1 }));
    return mnForNiveau.map((mn) => {
      const m = mn.matiere ?? matieres.find((x) => x.id === mn.matiereId);
      return m ? { ...m, coefficient: mn.coefficient ?? 1 } : null;
    }).filter(Boolean) as (MatiereItem & { coefficient: number })[];
  };

  // CRUD
  const openCreate = (jour?: string, heure?: string) => {
    setEditId(null);
    const nextHeure = heure ? `${String(Math.min(Number(heure.split(':')[0]) + 1, 19)).padStart(2, '0')}:00` : '09:00';
    setForm({ ...EMPTY_FORM, classeId: filterClasseId || (filteredClasses[0]?.id ?? ''), ...(jour ? { jourSemaine: jour } : {}), ...(heure ? { heureDebut: heure, heureFin: nextHeure } : {}) });
    setExtraSlots([]);
    setShowModal(true);
  };

  const openEdit = (edt: EdtItem) => {
    setEditId(edt.id);
    setForm({ classeId: edt.classeId, matiereId: edt.matiereId ?? '', enseignantId: edt.enseignantId ?? '', salleId: edt.salleId ?? '', jourSemaine: edt.jourSemaine, heureDebut: edt.heureDebut, heureFin: edt.heureFin });
    setExtraSlots([]);
    setShowModal(true);
  };

  // Vérifier si deux créneaux se chevauchent
  const chevauche = (d1: string, f1: string, d2: string, f2: string): boolean => {
    return d1 < f2 && d2 < f1;
  };

  const handleSave = async () => {
    if (!form.classeId) { toast.error('Sélectionnez une classe'); return; }
    if (!form.matiereId) { toast.error('Sélectionnez une matière'); return; }
    if (!form.enseignantId) { toast.error('Sélectionnez un professeur'); return; }
    if (form.heureDebut >= form.heureFin) { toast.error('L\'heure de fin doit être après l\'heure de début'); return; }

    const enseignantId = form.enseignantId;

    // Créneaux du même jour (exclure celui en cours d'édition)
    const memeJour = allEdt.filter((e) => e.jourSemaine === form.jourSemaine && e.id !== editId);

    // Règle 1 : une classe ne peut pas avoir 2 cours en même temps
    const conflitClasse = memeJour.find((e) => e.classeId === form.classeId && chevauche(form.heureDebut, form.heureFin, e.heureDebut, e.heureFin));
    if (conflitClasse) {
      const info = getCreneauInfo(conflitClasse);
      toast.error(`Conflit classe : ${classesById.get(form.classeId)?.nom} a déjà ${info.matiere?.libelle ?? 'un cours'} de ${conflitClasse.heureDebut} à ${conflitClasse.heureFin}`);
      return;
    }

    // Règle 2 : un professeur ne peut pas donner 2 cours en même temps
    if (enseignantId) {
      const conflitProf = memeJour.find((e) => e.enseignantId === enseignantId && chevauche(form.heureDebut, form.heureFin, e.heureDebut, e.heureFin));
      if (conflitProf) {
        const info = getCreneauInfo(conflitProf);
        toast.error(`Conflit professeur : ${profName(profsById.get(enseignantId))} enseigne déjà ${info.matiere?.libelle ?? 'un cours'} en ${info.classe?.nom ?? '—'} de ${conflitProf.heureDebut} à ${conflitProf.heureFin}`);
        return;
      }
    }

    // Règle 3 : une salle ne peut pas accueillir 2 cours en même temps
    if (form.salleId) {
      const conflitSalle = memeJour.find((e) => e.salleId === form.salleId && chevauche(form.heureDebut, form.heureFin, e.heureDebut, e.heureFin));
      if (conflitSalle) {
        const info = getCreneauInfo(conflitSalle);
        toast.error(`Conflit salle : ${sallesById.get(form.salleId)?.nom} est occupée par ${info.classe?.nom ?? '—'} (${info.matiere?.libelle ?? '—'}) de ${conflitSalle.heureDebut} à ${conflitSalle.heureFin}`);
        return;
      }
    }

    setSaving(true);
    // Trouver ou créer le cours correspondant
    let coursId = allCours.find((c) => c.classeId === form.classeId && c.matiereId === form.matiereId && c.enseignantId === form.enseignantId)?.id;
    if (!coursId) {
      try {
        const coef = getMatieresWithCoefForClasse(form.classeId).find((m) => m.id === form.matiereId)?.coefficient ?? 1;
        const res = await apiClient.post('/admin/cours', { classeId: form.classeId, matiereId: form.matiereId, enseignantId: form.enseignantId, coefficient: coef });
        coursId = (res.data?.id ?? (res.data as Record<string, unknown>)?.data?.id) as string | undefined;
      } catch { /* le cours existe peut-être déjà */ }
    }
    const payload = {
      classeId: form.classeId, coursId: coursId || undefined, salleId: form.salleId || undefined,
      enseignantId, matiereId: form.matiereId,
      jourSemaine: form.jourSemaine, heureDebut: form.heureDebut, heureFin: form.heureFin,
    };
    try {
      if (editId) {
        await apiClient.put(`/admin/emplois-du-temps/${editId}`, payload);
      } else {
        await apiClient.post('/admin/emplois-du-temps', payload);
        // Create extra slots for the same cours
        for (const slot of extraSlots) {
          await apiClient.post('/admin/emplois-du-temps', {
            ...payload,
            jourSemaine: slot.jourSemaine,
            heureDebut: slot.heureDebut,
            heureFin: slot.heureFin,
          });
        }
      }
      setShowModal(false);
      setExtraSlots([]);
      fetchData(selectedAnneeId);
      const nbTotal = 1 + (editId ? 0 : extraSlots.length);
      toast.success(editId ? 'Créneau modifié' : `${nbTotal} créneau(x) ajouté(s)`);
    } catch { toast.error('Erreur lors de l\'enregistrement'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    try { await apiClient.delete(`/admin/emplois-du-temps/${id}`); fetchData(selectedAnneeId); toast.success('Créneau supprimé'); }
    catch { toast.error('Erreur'); }
  };

  // Publication
  const isPublie = filteredEdt.length > 0 && filteredEdt.every((e) => e.publie);
  const handleTogglePublier = async () => {
    setPublishing(true);
    const newStatut = !isPublie;
    try {
      await Promise.all(filteredEdt.map((e) => apiClient.put(`/admin/emplois-du-temps/${e.id}`, { ...e, publie: newStatut })));
      fetchData(selectedAnneeId);
      toast.success(newStatut ? 'Emploi du temps publié' : 'Emploi du temps dépublié');
    } catch { toast.error('Erreur'); }
    finally { setPublishing(false); }
  };

  // Label filtre actif
  const filterLabel = filterClasseId ? classesById.get(filterClasseId)?.nom : filterProfId ? profName(profsById.get(filterProfId)) : filterSalleId ? sallesById.get(filterSalleId)?.nom : filterNiveauId ? niveaux.find((n) => n.id === filterNiveauId)?.nom : filterCycleId ? cycles.find((c) => c.id === filterCycleId)?.nom : 'Toutes les classes';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Emploi du temps</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filterLabel} — {filteredEdt.length} créneaux</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {filteredEdt.length > 0 && (
            <button onClick={handleTogglePublier} disabled={publishing}
              style={{ height: 38, padding: '0 14px', border: '1px solid #e2e8f0', background: isPublie ? '#dcfce7' : '#fff', color: isPublie ? '#16a34a' : '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isPublie ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>Publié</> : 'Publier'}
            </button>
          )}
          <button onClick={() => openCreate()} style={{ height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            + Ajouter
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select value={selectedAnneeId} onChange={(e) => setSelectedAnneeId(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0f172a', fontFamily: 'inherit' }}>
          {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.estCourante ? ' (en cours)' : ''}</option>)}
        </select>
        <select value={filterCycleId} onChange={(e) => { setFilterCycleId(e.target.value); setFilterNiveauId(''); setFilterClasseId(''); }} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les cycles</option>
          {cycles.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={filterNiveauId} onChange={(e) => { setFilterNiveauId(e.target.value); setFilterClasseId(''); }} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les niveaux</option>
          {filteredNiveaux.map((n) => <option key={n.id} value={n.id}>{n.nom}</option>)}
        </select>
        <select value={filterClasseId} onChange={(e) => setFilterClasseId(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0f172a', fontFamily: 'inherit', fontWeight: filterClasseId ? 700 : 400 }}>
          <option value="">Toutes les classes</option>
          {classesForFilter.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={filterProfId} onChange={(e) => setFilterProfId(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les professeurs</option>
          {professeurs.map((p) => <option key={p.id} value={p.id}>{profName(p)}</option>)}
        </select>
        <select value={filterSalleId} onChange={(e) => setFilterSalleId(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Toutes les salles</option>
          {salles.map((s) => <option key={s.id} value={s.id}>{s.nom}{s.capacite ? ` (${s.capacite})` : ''}</option>)}
        </select>
      </div>

      {/* Grille */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e6ebf1', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 70, padding: '11px 4px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', fontSize: 10, color: '#94a3b8' }}>Heure</th>
                {JOURS.map((j) => (
                  <th key={j} style={{ padding: '11px 10px', background: '#f8fafc', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', borderLeft: '1px solid #e6ebf1', borderBottom: '1px solid #e6ebf1' }}>{j}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANCHES.map((tranche, hi) => {
                const heure = tranche.debut;
                return (
                  <tr key={heure} style={{ height: 44, borderBottom: hi < TRANCHES.length - 1 ? '1px solid #eef2f6' : 'none' }}>
                    <td style={{ padding: '4px 6px', fontSize: 10, color: '#94a3b8', fontWeight: 600, borderRight: '1px solid #eef2f6', verticalAlign: 'middle', textAlign: 'center' }}>{tranche.label}</td>
                    {JOURS.map((jour) => {
                      // Si cette cellule est couverte par un créneau qui a démarré plus tôt, skip
                      if (isHeureCovered(jour, heure)) return null;

                      const creneaux = getCreneauxStart(jour, heure);
                      const maxSpan = creneaux.length > 0 ? Math.max(...creneaux.map(getRowSpan)) : 1;

                      if (creneaux.length === 0) {
                        return (
                          <td key={jour} style={{ borderLeft: '1px solid #eef2f6', padding: 4, minHeight: 64, verticalAlign: 'top', cursor: 'pointer' }}
                            onClick={() => openCreate(jour, heure)}>
                            <div style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
                              <span style={{ fontSize: 18, color: '#d1d5db' }}>+</span>
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={jour} rowSpan={maxSpan} style={{ borderLeft: '1px solid #eef2f6', padding: 2, verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {creneaux.map((edt) => {
                              const info = getCreneauInfo(edt);
                              const colors = getClasseColor(edt.classeId);
                              return (
                                <div key={edt.id} style={{ background: colors.bg, padding: '2px 5px', borderLeft: `2px solid ${colors.text}`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                                  onClick={() => openEdit(edt)} title={`${info.matiere?.libelle ?? '—'} — ${info.classe?.nom ?? '—'} — ${profName(info.prof)}${info.salle ? ` — ${info.salle.nom}` : ''} (${edt.heureDebut}–${edt.heureFin})`}>
                                  <div style={{ fontWeight: 700, color: colors.text, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.matiere?.libelle ?? info.matiere?.code ?? '—'}</div>
                                  <div style={{ color: '#64748b', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.classe?.nom ?? ''} · {edt.heureDebut}–{edt.heureFin}</div>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(edt.id); }}
                                    style={{ position: 'absolute', top: 1, right: 1, width: 12, height: 12, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
                                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                  </button>
                                </div>
                              );
                            })}
                            {/* Bouton + pour ajouter un autre cours sur ce créneau */}
                            <div onClick={() => openCreate(jour, heure)} style={{ padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>+</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal créneau */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 500, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editId ? 'Modifier le créneau' : 'Nouveau créneau'}</div>

            {(() => {
              const modalMatieres = form.classeId ? getMatieresWithCoefForClasse(form.classeId) : [];
              const selectedMatiere = modalMatieres.find((m) => m.id === form.matiereId);
              return <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Classe *</label>
                  <select value={form.classeId} onChange={(e) => setForm((f) => ({ ...f, classeId: e.target.value, matiereId: '', enseignantId: '' }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Sélectionner…</option>
                    {allClasses.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Matière *</label>
                  <select value={form.matiereId} onChange={(e) => setForm((f) => ({ ...f, matiereId: e.target.value, enseignantId: '' }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Sélectionner…</option>
                    {modalMatieres.map((m) => <option key={m.id} value={m.id}>{m.libelle ?? m.code ?? '—'} (coef. {m.coefficient})</option>)}
                  </select>
                  {form.classeId && modalMatieres.length === 0 && (
                    <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>Aucune matière configurée pour ce niveau. Allez dans Configuration &gt; Coefficients.</div>
                  )}
                  {selectedMatiere && <div style={{ fontSize: 11, color: '#2563eb', marginTop: 3 }}>Coefficient : {selectedMatiere.coefficient}</div>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Professeur *</label>
                  <select value={form.enseignantId} onChange={(e) => setForm((f) => ({ ...f, enseignantId: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Sélectionner…</option>
                    {(() => {
                      // Filtrer les profs par matiere selectionnee
                      const filtered = form.matiereId
                        ? professeurs.filter((p) => {
                            if (!p.matieresEnseignees?.length) return true; // Pas d'affectation → afficher quand meme
                            return p.matieresEnseignees.some((me) => (me.matiereId ?? me.matiere?.id) === form.matiereId);
                          })
                        : professeurs;
                      return filtered.map((p) => <option key={p.id} value={p.id}>{profName(p)}</option>);
                    })()}
                  </select>
                  {form.matiereId && !form.enseignantId && (
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                      {professeurs.filter((p) => p.matieresEnseignees?.some((me) => (me.matiereId ?? me.matiere?.id) === form.matiereId)).length} prof(s) pour cette matière
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Salle</label>
                  <select value={form.salleId} onChange={(e) => setForm((f) => ({ ...f, salleId: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Aucune salle</option>
                    {salles.map((s) => <option key={s.id} value={s.id}>{s.nom}{s.capacite ? ` (${s.capacite} places)` : ''}</option>)}
                  </select>
                </div>
              </>;
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Jour *</label>
                <select value={form.jourSemaine} onChange={(e) => setForm((f) => ({ ...f, jourSemaine: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                  {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Début *</label>
                <select value={form.heureDebut} onChange={(e) => setForm((f) => ({ ...f, heureDebut: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                  {HEURES.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Fin *</label>
                <select value={form.heureFin} onChange={(e) => setForm((f) => ({ ...f, heureFin: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit' }}>
                  {HEURES.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* Extra slots (creation only) */}
            {!editId && extraSlots.map((slot, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 8, padding: '8px 10px', background: '#f8fafc', border: '1px solid #e6ebf1' }}>
                <select value={slot.jourSemaine} onChange={(e) => setExtraSlots((s) => s.map((sl, j) => j === i ? { ...sl, jourSemaine: e.target.value } : sl))} style={{ height: 34, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 12, fontFamily: 'inherit' }}>
                  {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
                <select value={slot.heureDebut} onChange={(e) => setExtraSlots((s) => s.map((sl, j) => j === i ? { ...sl, heureDebut: e.target.value } : sl))} style={{ height: 34, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 12, fontFamily: 'inherit' }}>
                  {HEURES.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={slot.heureFin} onChange={(e) => setExtraSlots((s) => s.map((sl, j) => j === i ? { ...sl, heureFin: e.target.value } : sl))} style={{ height: 34, border: '1px solid #d9e0e8', padding: '0 8px', fontSize: 12, fontFamily: 'inherit' }}>
                  {HEURES.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <button onClick={() => setExtraSlots((s) => s.filter((_, j) => j !== i))} style={{ width: 34, height: 34, border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>×</button>
              </div>
            ))}
            {!editId && (
              <button onClick={() => setExtraSlots((s) => [...s, { jourSemaine: 'Mardi', heureDebut: '08:00', heureFin: '10:00' }])} style={{ width: '100%', height: 34, border: '1px dashed #bfdbfe', background: '#f8fafc', color: '#2563eb', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', marginBottom: 16 }}>
                + Ajouter un créneau
              </button>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : editId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
