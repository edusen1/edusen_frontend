'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { extractApiMessage } from '@/hooks/use-query-api';

type R = Record<string, unknown>;
type Programme = R & { id: string; titre: string; niveauNom: string; matiereNom: string; statut: string; nbChapitres: number; anneeAcademique?: { libelle: string } };
type Chapitre = R & { id: string; numero: number; titre: string; dateLimite: string; periode: string; volumeHoraire?: number; evaluationPrevue?: boolean; typeEvaluation?: string };
type ProgDetail = Programme & { chapitres: Chapitre[] };
type CahierTexte = { id: string; dateCours: string; enseignantNom?: string; classeNom?: string; contenuTraite: string; observations?: string };
type ChapAvancement = { id: string; numero: number; titre: string; dateLimite: string; periode: string; traite: boolean; enRetard: boolean; joursRetard: number; nbSeances: number; statut?: string; cahiersTexte?: CahierTexte[] };
type ProgAvancement = { programmeId: string; niveauNom: string; matiereNom: string; annee: string; totalChapitres: number; chapitresTraites: number; pourcentage: number; chapitresEnRetard: number; chapitres: ChapAvancement[] };

type TabKey = 'programmes' | 'avancement';
const B = '#e6ebf1';
const STATUT_COLORS: Record<string, { bg: string; text: string }> = { BROUILLON: { bg: '#f1f5f9', text: '#64748b' }, VALIDE: { bg: '#f0fdf4', text: '#16a34a' }, EN_COURS: { bg: '#eff6ff', text: '#2563eb' }, TERMINE: { bg: '#f8fafc', text: '#475569' } };
const STATUT_LABELS: Record<string, string> = { BROUILLON: 'Brouillon', VALIDE: 'Validé', EN_COURS: 'En cours', TERMINE: 'Terminé' };
const PERIODE_LABELS: Record<string, string> = { TRIMESTRE_1: 'T1', TRIMESTRE_2: 'T2', TRIMESTRE_3: 'T3', SEMESTRE_1: 'S1', SEMESTRE_2: 'S2' };
function fmtD(v: string) { try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return v; } }
function pctColor(p: number) { return p >= 80 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626'; }
function Bar({ value, max, color, h = 8 }: { value: number; max: number; color: string; h?: number }) {
  const w = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div style={{ background: '#f1f5f9', height: h, overflow: 'hidden' }}><div style={{ height: '100%', width: `${w}%`, background: color }} /></div>;
}

const EMPTY_PROG = { titre: '', description: '', niveauId: '', matiereId: '', anneeAcademiqueId: '' };
const EMPTY_CH = { titre: '', description: '', objectifs: '', competences: '', ressources: '', prerequis: '', periode: 'TRIMESTRE_1', dateLimite: '', volumeHoraire: '', nbSeances: '', evaluationPrevue: false, typeEvaluation: '' };

export default function ProgrammesPage() {
  const [tab, setTab] = useState<TabKey>('programmes');
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [niveaux, setNiveaux] = useState<{ id: string; libelle: string; typePeriode?: string }[]>([]);
  const [matieres, setMatieres] = useState<{ id: string; libelle: string }[]>([]);
  const [annees, setAnnees] = useState<{ id: string; libelle: string; estCourante?: boolean }[]>([]);
  const [fNiveau, setFNiveau] = useState('');
  const [fMatiere, setFMatiere] = useState('');
  const [fStatut, setFStatut] = useState('');
  const [fAnnee, setFAnnee] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PROG);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ProgDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showChModal, setShowChModal] = useState(false);
  const [editChId, setEditChId] = useState<string | null>(null);
  const [chForm, setChForm] = useState(EMPTY_CH);
  const [savingCh, setSavingCh] = useState(false);
  const [showDupModal, setShowDupModal] = useState(false);
  const [dupAnneeId, setDupAnneeId] = useState('');

  // Avancement
  const [avData, setAvData] = useState<ProgAvancement[]>([]);
  const [loadingAv, setLoadingAv] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedChId, setExpandedChId] = useState<string | null>(null);
  const [classes, setClasses] = useState<{ id: string; nom: string; niveauId: string; anneeAcademiqueId: string }[]>([]);
  const [profs, setProfs] = useState<{ id: string; nom: string }[]>([]);
  const [fClasse, setFClasse] = useState('');
  const [fProf, setFProf] = useState('');

  const fetchRef = useCallback(async () => {
    try {
      const [nivRes, matRes, annRes, classesRes, profsRes] = await Promise.all([
        apiClient.get('/admin/configuration/niveaux').catch(() => ({ data: [] })),
        apiClient.get('/admin/matieres').catch(() => ({ data: [] })),
        apiClient.get('/v1/annees-academiques').catch(() => ({ data: [] })),
        apiClient.get('/admin/classes').catch(() => ({ data: [] })),
        apiClient.get('/admin/personnel', { params: { role: 'ENSEIGNANT', size: 200 } }).catch(() => ({ data: [] })),
      ]);
      const parseList = (d: unknown): R[] => {
        if (Array.isArray(d)) return d;
        const obj = d as R;
        if (Array.isArray(obj?.data)) return obj.data as R[];
        if (Array.isArray(obj?.content)) return obj.content as R[];
        if (Array.isArray(obj?.niveaux)) return obj.niveaux as R[];
        return [];
      };
      setNiveaux(parseList(nivRes.data).map((n: R) => ({ id: String(n.id), libelle: String(n.libelle ?? n.nom ?? n.code ?? ''), typePeriode: String(n.typePeriode ?? 'TRIMESTRE') })) as { id: string; libelle: string; typePeriode?: string }[]);
      setMatieres(parseList(matRes.data).map((m: R) => ({ id: String(m.id), libelle: String(m.libelle ?? m.nom ?? m.code ?? '') })) as { id: string; libelle: string }[]);
      const a = parseList(annRes.data) as { id: string; libelle: string; estCourante?: boolean }[];
      setAnnees(a);
      if (!fAnnee && a.length > 0) {
        const courante = a.find((x) => x.estCourante);
        if (courante) setFAnnee(courante.id);
      }
      // Classes & profs
      const cls = parseList(classesRes.data).map((c: R) => ({ id: String(c.id), nom: String(c.nom ?? ''), niveauId: String(c.niveauId ?? (c.niveau as R)?.id ?? ''), anneeAcademiqueId: String(c.anneeAcademiqueId ?? (c.anneeAcademique as R)?.id ?? '') }));
      setClasses(cls);
      const prs = parseList(profsRes.data).map((p: R) => ({ id: String(p.id), nom: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() })).filter((p) => p.nom);
      setProfs(prs);
    } catch { /* ignore */ }
  }, [fAnnee]);

  const fetchProgs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/programmes', { params: { niveauId: fNiveau || undefined, matiereId: fMatiere || undefined, statut: fStatut || undefined, anneeAcademiqueId: fAnnee || undefined } });
      setProgrammes(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [fNiveau, fMatiere, fStatut, fAnnee]);

  const fetchAvancement = useCallback(async () => {
    setLoadingAv(true);
    try {
      const res = await apiClient.get('/admin/programmes/avancement', { params: { niveauId: fNiveau || undefined, anneeAcademiqueId: fAnnee || undefined, classeId: fClasse || undefined, enseignantId: fProf || undefined } });
      setAvData(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
    setLoadingAv(false);
  }, [fNiveau, fAnnee, fClasse, fProf]);

  useEffect(() => { void fetchRef(); }, [fetchRef]);
  useEffect(() => { if (tab === 'programmes') void fetchProgs(); }, [tab, fetchProgs]);
  useEffect(() => { if (tab === 'avancement') void fetchAvancement(); }, [tab, fetchAvancement]);

  async function loadDetail(id: string) {
    setLoadingDetail(true);
    try { const res = await apiClient.get(`/admin/programmes/${id}`); setDetail(res.data as ProgDetail); } catch { toast.error('Erreur'); }
    setLoadingDetail(false);
  }

  function openCreate() { setEditId(null); setForm({ ...EMPTY_PROG, anneeAcademiqueId: fAnnee }); setShowModal(true); }
  function openEdit(p: Programme) { setEditId(p.id); setForm({ titre: String(p.titre), description: String(p.description ?? ''), niveauId: String(p.niveauId ?? ''), matiereId: String(p.matiereId ?? ''), anneeAcademiqueId: String(p.anneeAcademiqueId ?? '') }); setShowModal(true); }

  async function handleSave() {
    if (!form.titre.trim()) { toast.error('Titre requis'); return; }
    setSaving(true);
    try {
      if (editId) { await apiClient.patch(`/admin/programmes/${editId}`, { titre: form.titre, description: form.description || null }); }
      else { await apiClient.post('/admin/programmes', form); }
      toast.success(editId ? 'Modifié' : 'Créé'); setShowModal(false); void fetchProgs();
      if (detail && editId === detail.id) void loadDetail(detail.id);
    } catch { toast.error('Erreur'); }
    setSaving(false);
  }

  async function handleDelete(id: string) { if (!confirm('Supprimer ce programme ?')) return; try { await apiClient.delete(`/admin/programmes/${id}`); toast.success('Supprimé'); setDetail(null); void fetchProgs(); } catch { toast.error('Erreur'); } }
  async function handleValider(id: string) { try { await apiClient.post(`/admin/programmes/${id}/valider`); toast.success('Validé'); void fetchProgs(); if (detail) void loadDetail(id); } catch { toast.error('Erreur'); } }

  /**
   * Période par défaut d'un nouveau chapitre, alignée sur la périodicité du
   * niveau. Sans ça, le formulaire s'ouvrait toujours sur TRIMESTRE_1 : pour un
   * niveau en semestres le <select> n'affiche que SEMESTRE_1/2, le navigateur
   * montrait « Semestre 1 » mais l'état React restait TRIMESTRE_1, et le
   * chapitre partait enregistré sur une période qui n'existe pas pour ce niveau.
   */
  function defaultPeriode(): string {
    const niveauId = detail?.niveauId ?? form.niveauId;
    const niveau = niveaux.find((n) => n.id === niveauId);
    return (niveau?.typePeriode ?? 'TRIMESTRE') === 'SEMESTRE' ? 'SEMESTRE_1' : 'TRIMESTRE_1';
  }

  function openAddCh() { setEditChId(null); setChForm({ ...EMPTY_CH, periode: defaultPeriode() }); setShowChModal(true); }
  function openEditCh(ch: Chapitre) { setEditChId(ch.id); setChForm({ titre: ch.titre, description: String(ch.description ?? ''), objectifs: String(ch.objectifs ?? ''), competences: String(ch.competences ?? ''), ressources: String(ch.ressources ?? ''), prerequis: String(ch.prerequis ?? ''), periode: ch.periode, dateLimite: ch.dateLimite?.slice(0, 10) ?? '', volumeHoraire: String(ch.volumeHoraire ?? ''), nbSeances: String(ch.nbSeances ?? ''), evaluationPrevue: Boolean(ch.evaluationPrevue), typeEvaluation: String(ch.typeEvaluation ?? '') }); setShowChModal(true); }

  async function handleSaveCh() {
    if (!detail) return;
    if (!chForm.titre.trim() || !chForm.dateLimite) { toast.error('Titre et date limite requis'); return; }
    setSavingCh(true);
    const body = { ...chForm, volumeHoraire: chForm.volumeHoraire ? Number(chForm.volumeHoraire) : null, nbSeances: chForm.nbSeances ? Number(chForm.nbSeances) : null };
    try {
      if (editChId) { await apiClient.patch(`/admin/programmes/${detail.id}/chapitres/${editChId}`, body); }
      else { await apiClient.post(`/admin/programmes/${detail.id}/chapitres`, body); }
      toast.success(editChId ? 'Modifié' : 'Ajouté'); setShowChModal(false); void loadDetail(detail.id); void fetchProgs();
    } catch { toast.error('Erreur'); }
    setSavingCh(false);
  }

  async function handleDeleteCh(chId: string) { if (!detail || !confirm('Supprimer ?')) return; try { await apiClient.delete(`/admin/programmes/${detail.id}/chapitres/${chId}`); toast.success('Supprimé'); void loadDetail(detail.id); void fetchProgs(); } catch { toast.error('Erreur'); } }

  // ── Detail view ─────────────────────────────────────────────────────
  if (detail) {
    const sc = STATUT_COLORS[detail.statut] ?? STATUT_COLORS.BROUILLON;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
        <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
          <button onClick={() => setDetail(null)} style={{ height: 32, padding: '0 12px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>← Retour</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{detail.titre}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{detail.niveauNom} · {detail.matiereNom} · {detail.anneeAcademique?.libelle}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', background: sc.bg, color: sc.text }}>{STATUT_LABELS[detail.statut]}</span>
          {detail.statut === 'BROUILLON' && <button onClick={() => handleValider(detail.id)} style={{ height: 32, padding: '0 14px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Valider</button>}
          <button onClick={() => { setDupAnneeId(''); setShowDupModal(true); }} style={{ height: 32, padding: '0 14px', border: '1px solid #d97706', background: '#fff', color: '#d97706', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Dupliquer</button>
          <button onClick={openAddCh} style={{ height: 32, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ Chapitre</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {loadingDetail ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : (
            <>
              {detail.description && <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#475569' }}>{detail.description}</div>}
              {detail.chapitres.length === 0 ? (
                <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucun chapitre. Cliquez sur &quot;+ Chapitre&quot;.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {detail.chapitres.map((ch) => (
                    <div key={ch.id} style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 32, height: 32, background: '#f8fafc', border: `1px solid ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#2563eb', flexShrink: 0 }}>{ch.numero}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{ch.titre}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10, color: '#64748b' }}>
                          <span style={{ padding: '1px 6px', background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>{PERIODE_LABELS[ch.periode] ?? ch.periode}</span>
                          <span>Avant le {fmtD(ch.dateLimite)}</span>
                          {ch.volumeHoraire && <span>{ch.volumeHoraire}h</span>}
                          {ch.evaluationPrevue && <span style={{ padding: '1px 6px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>{ch.typeEvaluation || 'Éval.'}</span>}
                        </div>
                        {ch.description && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{String(ch.description)}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => openEditCh(ch)} style={{ width: 28, height: 28, border: `1px solid ${B}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>
                        <button onClick={() => handleDeleteCh(ch.id)} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        {/* Chapitre modal */}
        {showChModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowChModal(false)} />
            <div style={{ position: 'relative', background: '#fff', width: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${B}`, fontSize: 14, fontWeight: 700 }}>{editChId ? 'Modifier le chapitre' : 'Nouveau chapitre'}</div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Titre *</label><input value={chForm.titre} onChange={(e) => setChForm((f) => ({ ...f, titre: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Période</label><select value={chForm.periode} onChange={(e) => setChForm((f) => ({ ...f, periode: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                    {(() => {
                      const niveauId = detail?.niveauId ?? form.niveauId;
                      const niveau = niveaux.find((n) => n.id === niveauId);
                      const type = niveau?.typePeriode ?? 'TRIMESTRE';
                      return type === 'SEMESTRE' ? (
                        <><option value="SEMESTRE_1">Semestre 1</option><option value="SEMESTRE_2">Semestre 2</option></>
                      ) : (
                        <><option value="TRIMESTRE_1">Trimestre 1</option><option value="TRIMESTRE_2">Trimestre 2</option><option value="TRIMESTRE_3">Trimestre 3</option></>
                      );
                    })()}
                  </select></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Date limite *</label><input type="date" value={chForm.dateLimite} onChange={(e) => setChForm((f) => ({ ...f, dateLimite: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Volume horaire</label><input type="number" value={chForm.volumeHoraire} onChange={(e) => setChForm((f) => ({ ...f, volumeHoraire: e.target.value }))} placeholder="6" style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Nb séances</label><input type="number" value={chForm.nbSeances} onChange={(e) => setChForm((f) => ({ ...f, nbSeances: e.target.value }))} placeholder="4" style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} /></div>
                </div>
                <div><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label><textarea value={chForm.description} onChange={(e) => setChForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} /></div>
                <div><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Objectifs pédagogiques</label><textarea value={chForm.objectifs} onChange={(e) => setChForm((f) => ({ ...f, objectifs: e.target.value }))} rows={2} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} /></div>
                <div><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Prérequis</label><input value={chForm.prerequis} onChange={(e) => setChForm((f) => ({ ...f, prerequis: e.target.value }))} placeholder="Ex: Maîtriser les fractions" style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} /></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={chForm.evaluationPrevue} onChange={(e) => setChForm((f) => ({ ...f, evaluationPrevue: e.target.checked }))} style={{ accentColor: '#2563eb' }} /><span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Évaluation prévue</span></label>
                  {chForm.evaluationPrevue && <select value={chForm.typeEvaluation} onChange={(e) => setChForm((f) => ({ ...f, typeEvaluation: e.target.value }))} style={{ border: `1px solid ${B}`, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}><option value="">Type</option><option value="DS">DS</option><option value="COMPOSITION">Composition</option><option value="EXERCICE">Exercice</option><option value="PROJET">Projet</option></select>}
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${B}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowChModal(false)} style={{ height: 34, padding: '0 16px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                <button onClick={() => void handleSaveCh()} disabled={savingCh} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: savingCh ? 'not-allowed' : 'pointer', opacity: savingCh ? 0.7 : 1 }}>{savingCh ? '...' : editChId ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        )}
        {/* Dupliquer modal */}
        {showDupModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowDupModal(false)} />
            <div style={{ position: 'relative', background: '#fff', width: 400, boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${B}`, fontSize: 14, fontWeight: 700 }}>Dupliquer le programme</div>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>Le programme <strong>{detail.titre}</strong> et tous ses chapitres seront copiés vers la nouvelle année.</div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Année académique cible *</label>
                <select value={dupAnneeId} onChange={(e) => setDupAnneeId(e.target.value)} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="">Choisir l&apos;année</option>
                  {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
                </select>
              </div>
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${B}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDupModal(false)} style={{ height: 34, padding: '0 16px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                <button disabled={!dupAnneeId} onClick={async () => {
                  try { await apiClient.post(`/admin/programmes/${detail.id}/dupliquer`, { anneeAcademiqueId: dupAnneeId }); toast.success('Programme dupliqué avec tous ses chapitres'); setShowDupModal(false); void fetchProgs(); }
                  // Le cas le plus fréquent est la duplication vers une année qui a
                  // déjà ce couple niveau/matière : le backend renvoie un 409 que
                  // « Erreur » rendait indéchiffrable.
                  catch (err) { toast.error(extractApiMessage(err, 'Duplication impossible')); }
                }} style={{ height: 34, padding: '0 16px', border: 'none', background: '#d97706', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: !dupAnneeId ? 'not-allowed' : 'pointer', opacity: !dupAnneeId ? 0.5 : 1 }}>Dupliquer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────
  // Avancement data
  const avGrouped = new Map<string, ProgAvancement[]>();
  for (const item of avData) { const k = item.niveauNom; if (!avGrouped.has(k)) avGrouped.set(k, []); avGrouped.get(k)!.push(item); }
  const totalRetards = avData.reduce((s, d) => s + d.chapitresEnRetard, 0);
  const avgPct = avData.length > 0 ? Math.round(avData.reduce((s, d) => s + d.pourcentage, 0) / avData.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0 }}>
        <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Programmes pédagogiques</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <select value={fAnnee} onChange={(e) => setFAnnee(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
              <option value="">Toutes les années</option>
              {annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}{a.estCourante ? ' (courante)' : ''}</option>)}
            </select>
            <select value={fNiveau} onChange={(e) => setFNiveau(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
              <option value="">Tous les niveaux</option>
              {niveaux.map((n) => <option key={n.id} value={n.id}>{n.libelle}</option>)}
            </select>
            {tab === 'programmes' && (
              <button onClick={openCreate} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>+ Nouveau</button>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 24px', borderTop: `1px solid ${B}` }}>
          {([{ key: 'programmes', label: 'Programmes' }, { key: 'avancement', label: 'Suivi d\'avancement' }] as { key: TabKey; label: string }[]).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ height: 42, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#2563eb' : '#64748b', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

        {/* ── TAB PROGRAMMES ── */}
        {tab === 'programmes' && (
          <>
            {/* Extra filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <select value={fMatiere} onChange={(e) => setFMatiere(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Toutes les matières</option>
                {matieres.map((m) => <option key={m.id} value={m.id}>{m.libelle ?? (m as R).nom}</option>)}
              </select>
              <select value={fStatut} onChange={(e) => setFStatut(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Tous les statuts</option>
                {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center' }}>{programmes.length} programme(s)</div>
            </div>

            {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : programmes.length === 0 ? (
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucun programme.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {programmes.map((p) => {
                  const sc = STATUT_COLORS[p.statut] ?? STATUT_COLORS.BROUILLON;
                  return (
                    <div key={p.id} onClick={() => void loadDetail(p.id)} style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2563eb')} onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.titre}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.niveauNom} · {p.matiereNom} · {p.anneeAcademique?.libelle ?? ''}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{p.nbChapitres} ch.</div>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', background: sc.bg, color: sc.text }}>{STATUT_LABELS[p.statut]}</span>
                      <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEdit(p)} style={{ width: 28, height: 28, border: `1px solid ${B}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>
                        <button onClick={() => handleDelete(p.id)} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── TAB AVANCEMENT ── */}
        {tab === 'avancement' && (
          <>
            {/* Filtres avancement */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <select value={fClasse} onChange={(e) => setFClasse(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Toutes les classes</option>
                {classes.filter((c) => !fAnnee || c.anneeAcademiqueId === fAnnee).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <select value={fProf} onChange={(e) => setFProf(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                <option value="">Tous les enseignants</option>
                {profs.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 18px', flex: 1 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Programmes</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{avData.length}</div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 18px', flex: 1 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Avancement moyen</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: pctColor(avgPct) }}>{avgPct}%</div>
              </div>
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 18px', flex: 1 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Chapitres en retard</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: totalRetards > 0 ? '#dc2626' : '#16a34a' }}>{totalRetards}</div>
              </div>
            </div>

            {loadingAv ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div> : avData.length === 0 ? (
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucun programme avec des chapitres.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[...avGrouped.entries()].map(([niveauNom, items]) => (
                  <div key={niveauNom}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{niveauNom}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {items.map((item) => {
                        const c = pctColor(item.pourcentage);
                        const expanded = expandedId === item.programmeId;
                        return (
                          <div key={item.programmeId}>
                            <div onClick={() => setExpandedId(expanded ? null : item.programmeId)} style={{ background: '#fff', border: `1px solid ${B}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{item.matiereNom}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{item.chapitresTraites}/{item.totalChapitres} chapitres</div>
                              </div>
                              <div style={{ width: 120 }}><Bar value={item.pourcentage} max={100} color={c} /></div>
                              <div style={{ width: 40, textAlign: 'right', fontSize: 13, fontWeight: 800, color: c }}>{item.pourcentage}%</div>
                              {item.chapitresEnRetard > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{item.chapitresEnRetard} retard</span>}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : '', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            {expanded && (
                              <div style={{ background: '#f8fafc', border: `1px solid ${B}`, borderTop: 'none', padding: '8px 16px' }}>
                                {item.chapitres.map((ch) => {
                                  const chExpanded = expandedChId === ch.id;
                                  const cahiers = ch.cahiersTexte ?? [];
                                  return (
                                  <div key={ch.id}>
                                    <div onClick={() => setExpandedChId(chExpanded ? null : ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                      <div style={{ width: 22, height: 22, background: ch.traite ? '#f0fdf4' : ch.enRetard ? '#fef2f2' : '#f8fafc', border: `1px solid ${ch.traite ? '#bbf7d0' : ch.enRetard ? '#fecaca' : B}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: ch.traite ? '#16a34a' : ch.enRetard ? '#dc2626' : '#64748b', flexShrink: 0 }}>
                                        {ch.traite ? '✓' : ch.numero}
                                      </div>
                                      <div style={{ flex: 1, fontSize: 11, color: '#334155', fontWeight: ch.enRetard ? 600 : 400 }}>{ch.titre}</div>
                                      {ch.statut && ch.statut !== 'NON_COMMENCE' && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', background: ch.statut === 'TERMINE' ? '#f0fdf4' : '#fffbeb', color: ch.statut === 'TERMINE' ? '#16a34a' : '#d97706', border: `1px solid ${ch.statut === 'TERMINE' ? '#bbf7d0' : '#fde68a'}` }}>{ch.statut === 'TERMINE' ? 'Terminé' : 'En cours'}</span>}
                                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Avant le {fmtD(ch.dateLimite)}</div>
                                      {ch.enRetard && <span style={{ fontSize: 9, color: '#dc2626', fontWeight: 700 }}>-{ch.joursRetard}j</span>}
                                      {cahiers.length > 0 && <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}>{cahiers.length} séance(s)</span>}
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ transform: chExpanded ? 'rotate(180deg)' : '', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                    {/* Cahier de texte entries for this chapter */}
                                    {chExpanded && (
                                      <div style={{ marginLeft: 32, padding: '6px 0' }}>
                                        {cahiers.length === 0 ? (
                                          <div style={{ fontSize: 11, color: '#94a3b8', padding: '4px 0' }}>Aucun enregistrement de cahier de texte</div>
                                        ) : cahiers.map((ct) => (
                                          <div key={ct.id} style={{ padding: '6px 10px', marginBottom: 4, background: '#fff', border: `1px solid ${B}` }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                              <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{fmtD(ct.dateCours)}</span>
                                              {ct.enseignantNom && <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 500 }}>{ct.enseignantNom}</span>}
                                              {ct.classeNom && <span style={{ fontSize: 9, color: '#7c3aed', background: '#f5f3ff', padding: '0 4px', border: '1px solid #ddd6fe' }}>{ct.classeNom}</span>}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{ct.contenuTraite}</div>
                                            {ct.observations && <div style={{ fontSize: 10, color: '#d97706', marginTop: 3 }}>Devoirs: {ct.observations}</div>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit programme modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowModal(false)} />
          <div style={{ position: 'relative', background: '#fff', width: 480, boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${B}`, fontSize: 14, fontWeight: 700 }}>{editId ? 'Modifier' : 'Nouveau programme'}</div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Titre *</label><input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} placeholder="Ex: Programme Mathématiques 3ème" style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} /></div>
              {!editId && (
                <>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Niveau *</label><select value={form.niveauId} onChange={(e) => setForm((f) => ({ ...f, niveauId: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}><option value="">Choisir</option>{niveaux.map((n) => <option key={n.id} value={n.id}>{n.libelle}</option>)}</select></div>
                    <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Matière *</label><select value={form.matiereId} onChange={(e) => setForm((f) => ({ ...f, matiereId: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}><option value="">Choisir</option>{matieres.map((m) => <option key={m.id} value={m.id}>{m.libelle ?? (m as R).nom}</option>)}</select></div>
                  </div>
                  <div><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Année académique *</label><select value={form.anneeAcademiqueId} onChange={(e) => setForm((f) => ({ ...f, anneeAcademiqueId: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}><option value="">Choisir</option>{annees.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}</select></div>
                </>
              )}
              <div><label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} /></div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${B}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 34, padding: '0 16px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => void handleSave()} disabled={saving} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : editId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
