'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { calculerMoyenne, type ModeCalcul } from '@/lib/calcul-moyenne';

type R = Record<string, unknown>;
const B = '#e6ebf1';
type Tab = 'eleves' | 'appels' | 'notes' | 'cahier';

type Eleve = R & { id: string; firstName?: string; lastName?: string; matricule?: string; photoUrl?: string };

function fmtD(v: string) { try { return new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } }

/** Render simple formatting: **bold**, _italic_, <u>underline</u>, ### headings, • lists */
function renderFormatted(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/g, '<u>$1</u>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-size:14px;font-weight:700;margin:4px 0">$1</div>')
    .replace(/^———+$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:6px 0">')
    .replace(/\n/g, '<br>');
}

import { resolveStorageUrl } from '@/lib/resolve-url';

const JOURS_MAP: Record<number, string> = { 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi' };
const JOURS_REV: Record<string, number> = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };

/** Generate past course session dates from EDT slots (last 4 weeks) */
function buildCourseSessions(edtSlots: R[]): { key: string; label: string; date: string; heureDebut: string; heureFin: string; matiereNom: string; edtId: string }[] {
  const sessions: { key: string; label: string; date: string; heureDebut: string; heureFin: string; matiereNom: string; edtId: string; ts: number }[] = [];
  const now = new Date();
  for (const slot of edtSlots) {
    const jourNom = String(slot.jourSemaine ?? '');
    const targetDay = JOURS_REV[jourNom];
    if (!targetDay) continue;
    const heureDebut = String(slot.heureDebut ?? '');
    const heureFin = String(slot.heureFin ?? '');
    const matiereNom = String(slot.matiereLibelle ?? (slot.matiere as R)?.libelle ?? slot.matiereNom ?? '');
    const edtId = String(slot.id ?? '');
    // Generate dates for this weekday over the past 4 weeks + current week
    for (let w = 0; w < 5; w++) {
      const d = new Date(now);
      d.setDate(d.getDate() - ((d.getDay() - targetDay + 7) % 7) - w * 7);
      if (d > now) continue; // skip future
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
      sessions.push({
        key: `${edtId}__${dateStr}`,
        label: `${dayLabel} · ${heureDebut}–${heureFin} · ${matiereNom}`,
        date: dateStr, heureDebut, heureFin, matiereNom, edtId,
        ts: d.getTime(),
      });
    }
  }
  sessions.sort((a, b) => b.ts - a.ts);
  return sessions;
}

export default function ClasseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classeId = String(params.classeId ?? '');

  const [tab, setTab] = useState<Tab>('eleves');
  const [loading, setLoading] = useState(true);
  const [classeNom, setClasseNom] = useState('');
  const [niveau, setNiveau] = useState('');
  const [matieres, setMatieres] = useState<{ id: string; nom: string }[]>([]);
  const [filterMatiere, setFilterMatiere] = useState('');
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [appels, setAppels] = useState<R[]>([]);
  const [notes, setNotes] = useState<R[]>([]);
  const [cahier, setCahier] = useState<R[]>([]);
  const [edt, setEdt] = useState<R[]>([]);
  const [modeCalcul, setModeCalcul] = useState<ModeCalcul>('MOYENNE');

  // Notes state
  const [filterPeriode, setFilterPeriode] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteType, setNoteType] = useState('DEVOIR');
  const [noteMatiere, setNoteMatiere] = useState('');
  const [notesSaisie, setNotesSaisie] = useState<Record<string, string>>({});
  const [noteSaving, setNoteSaving] = useState(false);
  const [typePeriode, setTypePeriode] = useState('TRIMESTRE');
  const [editingNote, setEditingNote] = useState<{ id: string; valeur: string } | null>(null);
  const [creatingNote, setCreatingNote] = useState<{ eleveId: string; type: string; valeur: string; col: string } | null>(null);

  // Cahier de texte form
  const [showCahierForm, setShowCahierForm] = useState(false);
  const [cahierForm, setCahierForm] = useState({ contenuTraite: '', observations: '', chapitreId: '', coursSessionKey: '' });
  const [cahierSaving, setCahierSaving] = useState(false);
  const [cahierEditId, setCahierEditId] = useState<string | null>(null);
  const [chapitres, setChapitres] = useState<R[]>([]);
  const [niveauId, setNiveauId] = useState('');

  // Detail eleve
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [eleveNotes, setEleveNotes] = useState<R[]>([]);
  const [loadingEleve, setLoadingEleve] = useState(false);

  // Appel state
  const [appelMode, setAppelMode] = useState(false);
  const [appelStatuts, setAppelStatuts] = useState<Record<string, string>>({});
  const [appelSaving, setAppelSaving] = useState(false);
  const [coursActuel, setCoursActuel] = useState<R | null>(null);
  const [appelDetail, setAppelDetail] = useState<R | null>(null);
  const [appelDetailLignes, setAppelDetailLignes] = useState<R[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [elevesRes, classesRes, edtRes, configRes] = await Promise.all([
        apiClient.get(`/professeur/classes/${classeId}/eleves`).catch(() => ({ data: [] })),
        apiClient.get('/professeur/mes-classes').catch(() => ({ data: [] })),
        apiClient.get('/professeur/emploi-du-temps').catch(() => ({ data: [] })),
        apiClient.get('/professeur/configuration').catch(() => ({ data: {} })),
      ]);
      const cfg = (configRes.data ?? {}) as R;
      if (cfg.modeCalculNotes === 'MEILLEURE_NOTE') setModeCalcul('MEILLEURE_NOTE');
      const eRaw = Array.isArray(elevesRes.data) ? elevesRes.data : ((elevesRes.data as R)?.data ?? (elevesRes.data as R)?.content ?? []);
      // API returns { eleve: { id, firstName, ... } } — flatten
      const eList = (eRaw as R[]).map((item) => {
        const el = (item.eleve ?? item) as R;
        return { ...el, id: String(el.id ?? item.id ?? ''), inscriptionId: String(item.inscriptionId ?? '') } as Eleve;
      });
      setEleves(eList);

      const allClasses = Array.isArray(classesRes.data) ? classesRes.data : ((classesRes.data as R)?.data ?? (classesRes.data as R)?.content ?? (classesRes.data as R)?.classes ?? []);
      const myItems = (allClasses as R[]).filter((c) => String(c.classeId ?? (c.classe as R)?.id ?? c.id) === classeId);
      const matSet = new Map<string, string>();
      if (myItems.length > 0) {
        const first = myItems[0];
        const cl = (first.classe ?? first) as R;
        setClasseNom(String(cl.nom ?? first.nom ?? ''));
        setNiveau(String((cl.niveau as R)?.libelle ?? (cl.niveau as R)?.nom ?? ''));
        setNiveauId(String((cl.niveau as R)?.id ?? ''));
        const cycle = (cl.niveau as R)?.cycle as R | undefined;
        setTypePeriode(String(cycle?.typePeriode ?? 'TRIMESTRE'));
        // Matières from matieresEnseignees (via Cours)
        const matEns = Array.isArray(first.matieresEnseignees) ? first.matieresEnseignees as R[] : [];
        for (const m of matEns) {
          const mId = String(m.id ?? '');
          const mNom = String(m.libelle ?? m.nom ?? m.code ?? '');
          if (mId && mNom) matSet.set(mId, mNom);
        }
      }

      const edtData = Array.isArray(edtRes.data) ? edtRes.data : ((edtRes.data as R)?.data ?? (edtRes.data as R)?.content ?? []);
      const classeEdt = (edtData as R[]).filter((e) => String(e.classeId ?? (e.classe as R)?.id) === classeId);
      setEdt(classeEdt);
      // Fallback: enrich matieres from EDT if API didn't return them
      if (matSet.size === 0) {
        for (const slot of classeEdt) {
          const mId = String(slot.matiereId ?? (slot.matiere as R)?.id ?? '');
          const mNom = String(slot.matiereLibelle ?? (slot.matiere as R)?.libelle ?? '');
          if (mId && mNom && !matSet.has(mId)) matSet.set(mId, mNom);
        }
      }
      const matList = [...matSet.entries()].map(([id, nom]) => ({ id, nom }));
      setMatieres(matList);

      // Detect cours actuel
      const now = new Date();
      const jourNom = JOURS_MAP[now.getDay()] ?? '';
      const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const actuel = classeEdt.find((e) => String(e.jourSemaine) === jourNom && String(e.heureDebut ?? '') <= heure && String(e.heureFin ?? '') > heure);
      setCoursActuel(actuel ?? null);
    } catch { /* ignore */ }
    setLoading(false);
  }, [classeId]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (tab === 'appels') {
      apiClient.get(`/professeur/classes/${classeId}/appels`).then((r) => {
        setAppels((Array.isArray(r.data) ? r.data : ((r.data as R)?.data ?? (r.data as R)?.content ?? [])) as R[]);
      }).catch(() => {});
    } else if (tab === 'notes') {
      apiClient.get('/professeur/notes', { params: { classeId, size: 200, ...(filterMatiere ? { matiereId: filterMatiere } : {}), ...(filterPeriode ? { trimestre: filterPeriode } : {}) } }).then((r) => {
        setNotes((Array.isArray(r.data) ? r.data : ((r.data as R)?.data ?? (r.data as R)?.content ?? [])) as R[]);
      }).catch(() => {});
    } else if (tab === 'cahier') {
      apiClient.get('/professeur/cahier-texte', { params: { classeId } }).then((r) => {
        setCahier((Array.isArray(r.data) ? r.data : ((r.data as R)?.data ?? (r.data as R)?.content ?? [])) as R[]);
      }).catch(() => {});
      // Charger les chapitres du programme pour cette classe/matiere
      if (niveauId) {
        apiClient.get('/admin/programmes/avancement', { params: { niveauId } }).then((r) => {
          const progs = (Array.isArray(r.data) ? r.data : []) as R[];
          const allChaps: R[] = [];
          for (const p of progs) {
            const chs = Array.isArray(p.chapitres) ? p.chapitres as R[] : [];
            for (const ch of chs) allChaps.push({ ...ch, matiereNom: p.matiereNom, programmeId: p.programmeId });
          }
          setChapitres(allChaps);
        }).catch(() => {});
      }
    }
  }, [tab, classeId, filterMatiere, filterPeriode, eleves, niveauId]);

  // Appel functions
  function startAppel() {
    const statuts: Record<string, string> = {};
    for (const e of eleves) statuts[e.id] = 'PRESENT';
    setAppelStatuts(statuts);
    setAppelMode(true);
  }

  async function submitAppel() {
    setAppelSaving(true);
    try {
      const absents = Object.entries(appelStatuts).filter(([, s]) => s === 'ABSENT').map(([id]) => id);
      const retards = Object.entries(appelStatuts).filter(([, s]) => s === 'RETARD').map(([id]) => id);
      const now = new Date();
      const heureActuelle = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await apiClient.post(`/professeur/classes/${classeId}/appels`, {
        classeId,
        coursId: coursActuel?.coursId ?? coursActuel?.id,
        dateCours: now.toISOString().slice(0, 10),
        heureDebut: coursActuel?.heureDebut ?? heureActuelle,
        session: now.getHours() < 13 ? 'MATIN' : 'APRES_MIDI',
        // `lignes` porte le statut explicite de chaque élève. On garde `absents`
        // pour compatibilité, mais c'est `lignes` qui fait foi : mélanger des
        // identifiants et des objets dans `absents` faisait disparaître les
        // retards, enregistrés comme « présent ».
        lignes: [
          ...absents.map((eleveId) => ({ eleveId, statut: 'ABSENT' })),
          ...retards.map((eleveId) => ({ eleveId, statut: 'RETARD' })),
        ],
        absents,
      });
      toast.success('Appel enregistré');
      setAppelMode(false);
      // Refresh appels
      apiClient.get(`/professeur/classes/${classeId}/appels`).then((r) => {
        setAppels((Array.isArray(r.data) ? r.data : ((r.data as R)?.data ?? [])) as R[]);
      }).catch(() => {});
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur');
    }
    setAppelSaving(false);
  }

  const nbPresents = Object.values(appelStatuts).filter((s) => s === 'PRESENT').length;
  const nbAbsents = Object.values(appelStatuts).filter((s) => s === 'ABSENT').length;
  const nbRetards = Object.values(appelStatuts).filter((s) => s === 'RETARD').length;

  const [eleveAbsences, setEleveAbsences] = useState<R[]>([]);
  const [eleveDetailTab, setEleveDetailTab] = useState<'notes' | 'absences' | 'discipline'>('notes');

  const [eleveDiscipline, setEleveDiscipline] = useState<R[]>([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ motif: '', gravite: 2, type: 'AVERTISSEMENT' });
  const [incidentSaving, setIncidentSaving] = useState(false);

  async function openEleveDetail(eleve: Eleve) {
    setSelectedEleve(eleve);
    setEleveDetailTab('notes');
    setLoadingEleve(true);
    try {
      const [notesRes, appelsRes, discRes] = await Promise.all([
        apiClient.get(`/professeur/classes/${classeId}/eleves/${eleve.id}/notes`).catch(() => ({ data: [] })),
        apiClient.get(`/professeur/classes/${classeId}/appels`).catch(() => ({ data: [] })),
        apiClient.get('/admin/discipline', { params: { eleveId: eleve.id } }).catch(() => ({ data: [] })),
      ]);
      const parse = (d: unknown) => { if (Array.isArray(d)) return d; const o = d as R; return Array.isArray(o?.data) ? o.data : Array.isArray(o?.content) ? o.content : []; };
      setEleveNotes(parse(notesRes.data) as R[]);
      // Extract absences from appel lignes
      const allAppels = parse(appelsRes.data) as R[];
      const absFromAppels: R[] = [];
      for (const appel of allAppels) {
        const lignes = (Array.isArray(appel.lignes) ? appel.lignes : []) as R[];
        for (const ligne of lignes) {
          if (String(ligne.eleveId) === eleve.id && String(ligne.statut) !== 'PRESENT') {
            absFromAppels.push({
              date: appel.dateCours ?? appel.date,
              typeAbsence: String(ligne.statut) === 'RETARD' ? 'RETARD' : 'ABSENCE',
              heureDebut: appel.heureDebut,
              motif: '',
              justifiee: false,
            });
          }
        }
      }
      setEleveAbsences(absFromAppels);
      setEleveDiscipline(parse(discRes.data) as R[]);
    } catch { setEleveNotes([]); setEleveAbsences([]); setEleveDiscipline([]); }
    setLoadingEleve(false);
  }

  async function openAppelDetail(appel: R) {
    setAppelDetail(appel);
    try {
      // Fetch appel lines — the appel object may contain lignes directly
      const lignes = Array.isArray(appel.lignes) ? appel.lignes : Array.isArray(appel.presences) ? appel.presences : [];
      setAppelDetailLignes(lignes as R[]);
    } catch { setAppelDetailLignes([]); }
  }

  // Edit note inline
  async function saveEditNote(noteId: string, valeur: string) {
    const v = Number(valeur);
    if (isNaN(v) || v < 0 || v > 20) { toast.error('Note invalide (0-20)'); setEditingNote(null); return; }
    try {
      await apiClient.put(`/professeur/notes/${noteId}`, { valeur: v });
      setNotes((prev) => prev.map((n) => String(n.id) === noteId ? { ...n, valeur: v, note: v } : n));
      toast.success('Note modifiée');
    } catch { toast.error('Erreur modification'); }
    setEditingNote(null);
  }

  // Create note inline (for empty cells)
  async function saveCreateNote(eleveId: string, typeEvaluation: string, valeur: string) {
    const v = Number(valeur);
    if (isNaN(v) || v < 0 || v > 20) { toast.error('Note invalide (0-20)'); setCreatingNote(null); return; }
    const mat = filterMatiere || matieres[0]?.id;
    if (!mat) { toast.error('Aucune matière'); setCreatingNote(null); return; }
    try {
      await apiClient.post('/professeur/notes', {
        eleveId, classeId, valeur: v, noteSur: 20,
        typeEvaluation, trimestre: filterPeriode || (typePeriode === 'SEMESTRE' ? 'SEMESTRE_1' : 'TRIMESTRE_1'),
        matiereId: mat,
      });
      toast.success('Note ajoutée');
      // Refresh notes
      const r = await apiClient.get('/professeur/notes', { params: { classeId, size: 200, ...(filterMatiere ? { matiereId: filterMatiere } : {}), ...(filterPeriode ? { trimestre: filterPeriode } : {}) } });
      setNotes((Array.isArray(r.data) ? r.data : ((r.data as R)?.data ?? (r.data as R)?.content ?? [])) as R[]);
    } catch (err) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur'); }
    setCreatingNote(null);
  }

  // Cahier formatting helpers
  function getTextarea(): HTMLTextAreaElement | null { return document.getElementById('cahier-contenu-textarea') as HTMLTextAreaElement | null; }
  function insertFormat(before: string, after: string) {
    const ta = getTextarea(); if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const text = cahierForm.contenuTraite;
    const selected = text.slice(start, end) || 'texte';
    const newText = text.slice(0, start) + before + selected + after + text.slice(end);
    setCahierForm((f) => ({ ...f, contenuTraite: newText }));
    setTimeout(() => { ta.focus(); ta.selectionStart = start + before.length; ta.selectionEnd = start + before.length + selected.length; }, 10);
  }
  function insertPrefix(prefix: string) {
    const ta = getTextarea(); if (!ta) return;
    const start = ta.selectionStart;
    const text = cahierForm.contenuTraite;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart);
    setCahierForm((f) => ({ ...f, contenuTraite: newText }));
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + prefix.length; }, 10);
  }
  function insertText(snippet: string) {
    const ta = getTextarea(); if (!ta) return;
    const pos = ta.selectionStart;
    const text = cahierForm.contenuTraite;
    const newText = text.slice(0, pos) + snippet + text.slice(pos);
    setCahierForm((f) => ({ ...f, contenuTraite: newText }));
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = pos + snippet.length; }, 10);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'eleves', label: `Élèves (${eleves.length})` },
    { key: 'appels', label: 'Appels' },
    { key: 'notes', label: 'Notes' },
    { key: 'cahier', label: 'Cahier de texte' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0 }}>
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/professeur/mes-classes')} style={{ height: 32, padding: '0 10px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>←</button>
          <div style={{ flex: '1 1 120px', minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{classeNom || 'Classe'}</div>
            {niveau && <div style={{ fontSize: 11, color: '#94a3b8' }}>{niveau} · {eleves.length} élève(s)</div>}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {matieres.map((m) => {
              const active = !filterMatiere || filterMatiere === m.id;
              return (
                <button key={m.id} onClick={() => setFilterMatiere(filterMatiere === m.id ? '' : m.id)}
                  style={{ fontSize: 10, fontWeight: 600, color: active ? '#2563eb' : '#94a3b8', background: active ? '#eff6ff' : '#f8fafc', padding: '3px 8px', border: `1px solid ${active ? '#bfdbfe' : B}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {m.nom}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', padding: '0 12px', borderTop: `1px solid ${B}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ height: 42, padding: '0 14px', border: 'none', background: 'transparent', fontSize: 12, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#2563eb' : '#64748b', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 12px' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>}

        {/* ── ELEVES ── */}
        {!loading && tab === 'eleves' && (
          eleves.length === 0 ? <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucun élève inscrit dans cette classe</div> : (
            <div style={{ background: '#fff', border: `1px solid ${B}` }}>
              {eleves.map((e, i) => (
                <div key={e.id ?? `e-${i}`} onClick={() => void openEleveDetail(e)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < eleves.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = '#f8fafc')} onMouseLeave={(ev) => (ev.currentTarget.style.background = '')}>
                  {resolveStorageUrl(e.photoUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveStorageUrl(e.photoUrl)} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#2563eb' }}>
                      {(e.firstName?.[0] ?? '').toUpperCase()}{(e.lastName?.[0] ?? '').toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{e.firstName ?? ''} {e.lastName ?? ''}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{e.matricule ?? ''}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── APPELS ── */}
        {!loading && tab === 'appels' && (
          <div>
            {/* Cours actuel */}
            {coursActuel && !appelMode && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>Cours en cours</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                    {String((coursActuel.matiere as R)?.libelle ?? ((coursActuel.cours as R)?.matiere as R)?.libelle ?? '')} · {String(coursActuel.heureDebut ?? '')}—{String(coursActuel.heureFin ?? '')}
                  </div>
                </div>
                <button onClick={startAppel} style={{ height: 34, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Faire l&apos;appel
                </button>
              </div>
            )}
            {!coursActuel && !appelMode && (
              <div style={{ background: '#f8fafc', border: `1px solid ${B}`, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', flex: '1 1 150px' }}>Pas de cours en ce moment</div>
                <button onClick={startAppel} style={{ height: 32, padding: '0 12px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Faire l&apos;appel
                </button>
              </div>
            )}

            {/* Formulaire d'appel */}
            {appelMode && (
              <div style={{ background: '#fff', border: `1px solid ${B}`, marginBottom: 12 }}>
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Appel — {new Date().toLocaleDateString('fr-FR')}</div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>{nbPresents} P</span>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>{nbAbsents} A</span>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>{nbRetards} R</span>
                  </div>
                </div>
                {eleves.map((e) => {
                  const st = appelStatuts[e.id] ?? 'PRESENT';
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {resolveStorageUrl(e.photoUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveStorageUrl(e.photoUrl)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
                            {(e.firstName?.[0] ?? '').toUpperCase()}{(e.lastName?.[0] ?? '').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{e.firstName ?? ''} {e.lastName ?? ''}</div>
                          {e.matricule && <div style={{ fontSize: 9, color: '#94a3b8' }}>{e.matricule}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['PRESENT', 'ABSENT', 'RETARD'] as const).map((s) => {
                          const colors = { PRESENT: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' }, ABSENT: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' }, RETARD: { bg: '#fffbeb', border: '#fde68a', text: '#d97706' } };
                          const c = colors[s];
                          const active = st === s;
                          return (
                            <button key={s} onClick={() => setAppelStatuts((prev) => ({ ...prev, [e.id]: s }))}
                              style={{ height: 28, padding: '0 10px', border: `1px solid ${active ? c.border : '#e2e8f0'}`, background: active ? c.bg : '#fff', color: active ? c.text : '#94a3b8', fontSize: 10, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                              {s[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div style={{ padding: '12px 18px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setAppelMode(false)} style={{ height: 36, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                  <button onClick={() => void submitAppel()} disabled={appelSaving} style={{ height: 36, padding: '0 18px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: appelSaving ? 'wait' : 'pointer', opacity: appelSaving ? 0.7 : 1 }}>
                    {appelSaving ? 'Enregistrement...' : 'Valider l\'appel'}
                  </button>
                </div>
              </div>
            )}

            {/* Historique appels */}
            {!appelMode && (
              appels.length === 0 ? <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun appel enregistré</div> : (
                <div style={{ background: '#fff', border: `1px solid ${B}` }}>
                  <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: `1px solid ${B}`, fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                    {appels.length} appel(s) — cliquez pour voir le détail
                  </div>
                  {appels.map((a, i) => {
                    const isExpanded = appelDetail?.id === a.id;
                    return (
                      <div key={String(a.id ?? i)}>
                        <div onClick={() => isExpanded ? setAppelDetail(null) : openAppelDetail(a)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          onMouseEnter={(ev) => (ev.currentTarget.style.background = '#f8fafc')} onMouseLeave={(ev) => (ev.currentTarget.style.background = '')}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', width: 130 }}>
                            {fmtD(String(a.dateCours ?? a.date ?? a.createdAt ?? ''))}
                            {Boolean(a.heureDebut) && <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 4 }}>à {String(a.heureDebut)}</span>}
                          </div>
                          <div style={{ flex: 1, display: 'flex', gap: 12, fontSize: 11 }}>
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>{String(a.nbPresents ?? 0)} Présent(s)</span>
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>{String(a.nbAbsents ?? 0)} Absent(s)</span>
                            <span style={{ color: '#d97706', fontWeight: 600 }}>{String(a.nbRetards ?? 0)} Retard(s)</span>
                          </div>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : '', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                        {isExpanded && (
                          <div style={{ background: '#f8fafc', padding: '8px 16px', borderBottom: `1px solid ${B}` }}>
                            {appelDetailLignes.length > 0 ? (
                              appelDetailLignes.map((l, li) => {
                                const eleveId = String(l.eleveId ?? (l.eleve as R)?.id ?? '');
                                const el = eleves.find((e) => e.id === eleveId);
                                const nom = el ? `${el.firstName ?? ''} ${el.lastName ?? ''}`.trim() : String((l.eleve as R)?.firstName ?? '') + ' ' + String((l.eleve as R)?.lastName ?? '');
                                const statut = String(l.statut ?? l.typeAbsence ?? 'PRESENT');
                                const sc = statut === 'ABSENT' ? { bg: '#fef2f2', text: '#dc2626', label: 'Absent' } : statut === 'RETARD' ? { bg: '#fffbeb', text: '#d97706', label: 'Retard' } : { bg: '#f0fdf4', text: '#16a34a', label: 'Présent' };
                                return (
                                  <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: li < appelDetailLignes.length - 1 ? '1px solid #e6ebf1' : 'none' }}>
                                    <span style={{ flex: 1, fontSize: 11, color: '#334155', fontWeight: 500 }}>{nom || '—'}</span>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', background: sc.bg, color: sc.text }}>{sc.label}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>Aucune ligne de présence</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* ── NOTES ── */}
        {!loading && tab === 'notes' && (
          <div>
            {/* Filtres */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={filterPeriode} onChange={(e) => setFilterPeriode(e.target.value)} style={{ height: 34, border: `1px solid ${B}`, padding: '0 8px', fontSize: 11, fontFamily: 'inherit', background: '#fff', flex: '0 0 auto' }}>
                <option value="">Périodes</option>
                {typePeriode === 'SEMESTRE' ? (
                  <><option value="SEMESTRE_1">Sem. 1</option><option value="SEMESTRE_2">Sem. 2</option></>
                ) : (
                  <><option value="TRIMESTRE_1">Trim. 1</option><option value="TRIMESTRE_2">Trim. 2</option><option value="TRIMESTRE_3">Trim. 3</option></>
                )}
              </select>
              <div style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${B}`, padding: '0 8px', background: '#f8fafc' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input value={noteSearch} onChange={(e) => setNoteSearch(e.target.value)} placeholder="Rechercher..." style={{ border: 'none', outline: 'none', fontSize: 11, height: 32, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
              </div>
              {!showNoteForm && (
                <button onClick={() => { setShowNoteForm(true); setNotesSaisie({}); setNoteMatiere(filterMatiere || matieres[0]?.id || ''); if (!filterPeriode) setFilterPeriode(typePeriode === 'SEMESTRE' ? 'SEMESTRE_1' : 'TRIMESTRE_1'); }} style={{ height: 34, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  + Saisir
                </button>
              )}
            </div>

            {/* Formulaire saisie */}
            {showNoteForm && (
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '12px', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={noteMatiere} onChange={(e) => setNoteMatiere(e.target.value)} style={{ height: 32, border: `1px solid ${B}`, padding: '0 6px', fontSize: 11, fontFamily: 'inherit', background: '#fff', flex: '1 1 100px' }}>
                    {matieres.length === 0 && <option value="">— Aucune matière —</option>}
                    {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
                  </select>
                  <select value={noteType} onChange={(e) => setNoteType(e.target.value)} style={{ height: 32, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                    <option value="DEVOIR">Devoir</option>
                    <option value="COMPOSITION">Composition</option>
                    <option value="EXAMEN">Examen</option>
                    <option value="BONUS">Bonus</option>
                  </select>
                  <select value={filterPeriode || ''} onChange={(e) => setFilterPeriode(e.target.value)} style={{ height: 32, border: `1px solid ${B}`, padding: '0 8px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                    {typePeriode === 'SEMESTRE' ? (
                      <><option value="SEMESTRE_1">Semestre 1</option><option value="SEMESTRE_2">Semestre 2</option></>
                    ) : (
                      <><option value="TRIMESTRE_1">Trimestre 1</option><option value="TRIMESTRE_2">Trimestre 2</option><option value="TRIMESTRE_3">Trimestre 3</option></>
                    )}
                  </select>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => setShowNoteForm(false)} style={{ height: 32, padding: '0 12px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                  <button disabled={noteSaving || !noteMatiere || Object.values(notesSaisie).filter((v) => v.trim()).length === 0} onClick={async () => {
                    if (!noteMatiere) { toast.error('Sélectionnez une matière'); return; }
                    // Validation frontend
                    const entries = Object.entries(notesSaisie).filter(([, v]) => v.trim());
                    for (const [, val] of entries) {
                      const n = Number(val);
                      if (isNaN(n) || n < 0) { toast.error('Les notes doivent être positives'); return; }
                      if (noteType !== 'BONUS' && n > 20) { toast.error('La note ne peut pas dépasser 20'); return; }
                    }
                    setNoteSaving(true);
                    try {
                      for (const [eleveId, val] of entries) {
                        await apiClient.post('/professeur/notes', {
                          eleveId, classeId, valeur: Number(val), noteSur: noteType === 'BONUS' ? 0 : 20,
                          typeEvaluation: noteType, trimestre: filterPeriode || undefined,
                          matiereId: noteMatiere,
                        });
                      }
                      toast.success(`${entries.length} note(s) enregistrée(s)`);
                      setShowNoteForm(false);
                      setNotesSaisie({});
                      // Refresh
                      apiClient.get('/professeur/notes', { params: { classeId, size: 200, ...(filterMatiere ? { matiereId: filterMatiere } : {}), ...(filterPeriode ? { trimestre: filterPeriode } : {}) } }).then((r) => {
                        setNotes((Array.isArray(r.data) ? r.data : ((r.data as R)?.data ?? (r.data as R)?.content ?? [])) as R[]);
                      }).catch(() => {});
                    } catch (err) { toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erreur'); }
                    setNoteSaving(false);
                  }} style={{ height: 32, padding: '0 14px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: noteSaving ? 0.7 : 1 }}>
                    {noteSaving ? '...' : 'Enregistrer'}
                  </button>
                </div>
                {/* Tableau saisie */}
                <div style={{ border: `1px solid ${B}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', padding: '6px 12px', background: '#f8fafc', borderBottom: `1px solid ${B}`, fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>
                    <span>Élève</span>
                    <span>{noteType === 'BONUS' ? 'Points' : 'Note /20'}</span>
                  </div>
                  {eleves.map((e) => (
                    <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px', padding: '4px 12px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {resolveStorageUrl(e.photoUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveStorageUrl(e.photoUrl)} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
                            {(e.firstName?.[0] ?? '').toUpperCase()}{(e.lastName?.[0] ?? '').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span style={{ fontSize: 12, color: '#0f172a' }}>{e.firstName} {e.lastName}</span>
                          {e.matricule && <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 6 }}>{e.matricule}</span>}
                        </div>
                      </div>
                      <input type="number" value={notesSaisie[e.id] ?? ''} onChange={(ev) => setNotesSaisie((p) => ({ ...p, [e.id]: ev.target.value }))}
                        placeholder={noteType === 'BONUS' ? '+2' : '/20'} onWheel={(ev) => (ev.target as HTMLInputElement).blur()}
                        style={{ width: 80, height: 28, border: `1px solid ${B}`, padding: '0 6px', fontSize: 12, fontFamily: 'inherit', textAlign: 'center' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tableau notes — toujours visible */}
            {!showNoteForm && (() => {
              const q = noteSearch.toLowerCase();
              // Group notes by eleve
              const notesByEleve = new Map<string, R[]>();
              for (const n of notes) {
                const eid = String(n.eleveId ?? (n.eleve as R)?.id ?? '');
                if (!notesByEleve.has(eid)) notesByEleve.set(eid, []);
                notesByEleve.get(eid)!.push(n);
              }
              // Build list: all students (even without notes), filtered by search
              const allStudents = eleves.filter((e) => {
                if (!q) return true;
                return `${e.firstName ?? ''} ${e.lastName ?? ''}`.toLowerCase().includes(q);
              });
              // Collect evaluation types from existing notes
              const types = [...new Set(notes.map((n) => String(n.typeEvaluation ?? '')))].filter(Boolean);
              const nbDevoirs = Math.max(1, ...[...notesByEleve.values()].map((ns) => ns.filter((n) => n.typeEvaluation === 'DEVOIR').length));

              return (
                <div style={{ background: '#fff', border: `1px solid ${B}`, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${B}` }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Élève</th>
                        {Array.from({ length: nbDevoirs }, (_, i) => (
                          <th key={`d${i}`} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: '#2563eb', fontSize: 10 }}>D{i + 1}</th>
                        ))}
                        {types.filter((t) => t !== 'DEVOIR').map((t) => (
                          <th key={t} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, color: t === 'COMPOSITION' ? '#dc2626' : t === 'BONUS' ? '#16a34a' : '#7c3aed', fontSize: 10 }}>{t.slice(0, 5)}</th>
                        ))}
                        <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, color: '#0f172a', fontSize: 10 }}>Moy.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStudents.map((e) => {
                        const ns = notesByEleve.get(e.id) ?? [];
                        const nom = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
                        const devoirNotes = ns.filter((n) => n.typeEvaluation === 'DEVOIR');
                        const devoirVals = devoirNotes.map((n) => Number(n.valeur ?? 0));
                        const compoNote = ns.find((n) => n.typeEvaluation === 'COMPOSITION');
                        const bonusNotes = ns.filter((n) => n.typeEvaluation === 'BONUS');
                        const totalBonus = bonusNotes.reduce((s, n) => s + Number(n.valeur ?? 0), 0);
                        const calc = calculerMoyenne(devoirVals, compoNote ? Number(compoNote.valeur ?? 0) : null, totalBonus, modeCalcul);
                        const moy = calc.moyenneGenerale;
                        const hasAnyNote = calc.hasNotes;
                        const moyColor = !hasAnyNote ? '#94a3b8' : moy >= 14 ? '#16a34a' : moy >= 10 ? '#d97706' : '#dc2626';
                        return (
                          <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {resolveStorageUrl(e.photoUrl) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={resolveStorageUrl(e.photoUrl)} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
                                    {(e.firstName?.[0] ?? '').toUpperCase()}{(e.lastName?.[0] ?? '').toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>{nom}</div>
                                  {e.matricule && <div style={{ fontSize: 9, color: '#94a3b8' }}>{e.matricule}</div>}
                                </div>
                              </div>
                            </td>
                            {Array.from({ length: nbDevoirs }, (_, i) => {
                              const d = devoirNotes[i];
                              const v = d ? Number(d.valeur ?? 0) : null;
                              const nId = d ? String(d.id) : null;
                              const c = v !== null ? (v >= 14 ? '#16a34a' : v >= 10 ? '#d97706' : '#dc2626') : '#94a3b8';
                              const isEditing = editingNote?.id === nId && nId;
                              const colKey = `${e.id}_D_${i}`;
                              const isCreating = creatingNote?.col === colKey;
                              return <td key={`d${i}`} style={{ padding: '2px 4px', textAlign: 'center' }}>
                                {isEditing ? (
                                  <input type="number" autoFocus value={editingNote!.valeur} onChange={(ev) => setEditingNote({ id: nId!, valeur: ev.target.value })}
                                    onBlur={() => void saveEditNote(nId!, editingNote!.valeur)} onKeyDown={(ev) => { if (ev.key === 'Enter') void saveEditNote(nId!, editingNote!.valeur); if (ev.key === 'Escape') setEditingNote(null); }}
                                    onWheel={(ev) => (ev.target as HTMLInputElement).blur()}
                                    style={{ width: 44, height: 26, border: '2px solid #2563eb', borderRadius: 4, textAlign: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                                ) : isCreating ? (
                                  <input type="number" autoFocus value={creatingNote!.valeur} onChange={(ev) => setCreatingNote({ ...creatingNote!, valeur: ev.target.value })}
                                    onBlur={() => void saveCreateNote(e.id, 'DEVOIR', creatingNote!.valeur)} onKeyDown={(ev) => { if (ev.key === 'Enter') void saveCreateNote(e.id, 'DEVOIR', creatingNote!.valeur); if (ev.key === 'Escape') setCreatingNote(null); }}
                                    onWheel={(ev) => (ev.target as HTMLInputElement).blur()}
                                    style={{ width: 44, height: 26, border: '2px solid #16a34a', borderRadius: 4, textAlign: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                                ) : nId ? (
                                  <button onClick={() => setEditingNote({ id: nId, valeur: String(v ?? 0) })}
                                    style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: c, fontFamily: 'inherit', minWidth: 36 }}
                                    title="Modifier cette note">
                                    {v ?? 0} <span style={{ fontSize: 9, color: '#94a3b8' }}>✎</span>
                                  </button>
                                ) : (
                                  <button onClick={() => setCreatingNote({ eleveId: e.id, type: 'DEVOIR', valeur: '', col: colKey })}
                                    style={{ border: '1px dashed #cbd5e1', background: '#f8fafc', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11, color: '#94a3b8', fontFamily: 'inherit', minWidth: 36 }}
                                    title="Ajouter une note">
                                    +
                                  </button>
                                )}
                              </td>;
                            })}
                            {types.filter((t) => t !== 'DEVOIR').map((t) => {
                              const n = ns.find((x) => x.typeEvaluation === t);
                              const v = n ? Number(n.valeur ?? 0) : null;
                              const nId = n ? String(n.id) : null;
                              const c = v !== null ? (v >= 14 ? '#16a34a' : v >= 10 ? '#d97706' : '#dc2626') : '#94a3b8';
                              const isEditing = editingNote?.id === nId && nId;
                              const colKey = `${e.id}_${t}`;
                              const isCreating = creatingNote?.col === colKey;
                              return <td key={t} style={{ padding: '2px 4px', textAlign: 'center' }}>
                                {isEditing ? (
                                  <input type="number" autoFocus value={editingNote!.valeur} onChange={(ev) => setEditingNote({ id: nId!, valeur: ev.target.value })}
                                    onBlur={() => void saveEditNote(nId!, editingNote!.valeur)} onKeyDown={(ev) => { if (ev.key === 'Enter') void saveEditNote(nId!, editingNote!.valeur); if (ev.key === 'Escape') setEditingNote(null); }}
                                    onWheel={(ev) => (ev.target as HTMLInputElement).blur()}
                                    style={{ width: 44, height: 26, border: '2px solid #2563eb', borderRadius: 4, textAlign: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                                ) : isCreating ? (
                                  <input type="number" autoFocus value={creatingNote!.valeur} onChange={(ev) => setCreatingNote({ ...creatingNote!, valeur: ev.target.value })}
                                    onBlur={() => void saveCreateNote(e.id, t, creatingNote!.valeur)} onKeyDown={(ev) => { if (ev.key === 'Enter') void saveCreateNote(e.id, t, creatingNote!.valeur); if (ev.key === 'Escape') setCreatingNote(null); }}
                                    onWheel={(ev) => (ev.target as HTMLInputElement).blur()}
                                    style={{ width: 44, height: 26, border: '2px solid #16a34a', borderRadius: 4, textAlign: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                                ) : nId ? (
                                  <button onClick={() => setEditingNote({ id: nId, valeur: String(v ?? 0) })}
                                    style={{ border: '1px solid #e2e8f0', background: '#fff', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: c, fontFamily: 'inherit', minWidth: 36 }}
                                    title="Modifier cette note">
                                    {v ?? 0} <span style={{ fontSize: 9, color: '#94a3b8' }}>✎</span>
                                  </button>
                                ) : (
                                  <button onClick={() => setCreatingNote({ eleveId: e.id, type: t, valeur: '', col: colKey })}
                                    style={{ border: '1px dashed #cbd5e1', background: '#f8fafc', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11, color: '#94a3b8', fontFamily: 'inherit', minWidth: 36 }}
                                    title="Ajouter une note">
                                    +
                                  </button>
                                )}
                              </td>;
                            })}
                            <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 800, color: moyColor }}
                              title={hasAnyNote ? `Moy Dev: ${calc.moyenneDevoirsBonifiee.toFixed(1)} | Compo: ${calc.noteCompositionBonifiee.toFixed(1)}${calc.bonusApplique > 0 ? ` | Bonus: +${calc.bonusApplique}` : ''}${calc.bonusPerdu > 0 ? ` (${calc.bonusPerdu} perdu)` : ''}` : ''}>
                              {hasAnyNote ? moy.toFixed(1) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── CAHIER ── */}
        {!loading && tab === 'cahier' && (() => {
          const courseSessions = buildCourseSessions(edt);
          const selectedSession = courseSessions.find((s) => s.key === cahierForm.coursSessionKey);
          return (
          <div>
            {/* Bouton ajouter / Formulaire */}
            {!showCahierForm ? (
              <div style={{ marginBottom: 12 }}>
                <button onClick={() => { setCahierEditId(null); setCahierForm({ contenuTraite: '', observations: '', chapitreId: '', coursSessionKey: courseSessions[0]?.key ?? '' }); setShowCahierForm(true); }} style={{ height: 36, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                  Ajouter une entrée
                </button>
              </div>
            ) : (
              <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{cahierEditId ? 'Modifier l\'entrée' : 'Nouvelle entrée'} — cahier de texte</div>
                {/* Sélection du cours */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Cours concerné *</label>
                  {courseSessions.length > 0 ? (
                    <select value={cahierForm.coursSessionKey} onChange={(e) => setCahierForm((f) => ({ ...f, coursSessionKey: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                      {courseSessions.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: 12, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 10px' }}>
                      Aucun créneau EDT trouvé pour cette classe. Vérifiez l&apos;emploi du temps.
                    </div>
                  )}
                </div>
                {/* Chapitre du programme */}
                {chapitres.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Chapitre du programme</label>
                    <select value={cahierForm.chapitreId} onChange={(e) => setCahierForm((f) => ({ ...f, chapitreId: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
                      <option value="">— Aucun chapitre —</option>
                      {chapitres.map((ch, ci) => (
                        <option key={ci} value={String(ch.id)}>{String(ch.numero)}. {String(ch.titre)} ({String(ch.matiereNom ?? '')})</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Contenu traité */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Contenu traité *</label>
                  <div style={{ border: `1px solid ${B}` }}>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: 2, padding: '4px 6px', borderBottom: `1px solid ${B}`, background: '#f8fafc' }}>
                      {[
                        { label: 'B', title: 'Gras', fn: () => insertFormat('**', '**') },
                        { label: 'I', title: 'Italique', fn: () => insertFormat('_', '_'), style: { fontStyle: 'italic' as const } },
                        { label: 'U', title: 'Souligné', fn: () => insertFormat('<u>', '</u>'), style: { textDecoration: 'underline' as const } },
                        { label: 'H', title: 'Titre', fn: () => insertPrefix('### ') },
                        { label: '•', title: 'Liste', fn: () => insertPrefix('• ') },
                        { label: '1.', title: 'Liste numérotée', fn: () => insertPrefix('1) ') },
                        { label: '—', title: 'Séparateur', fn: () => insertText('\n———————————\n') },
                      ].map((btn) => (
                        <button key={btn.label} title={btn.title} onClick={btn.fn} type="button"
                          style={{ width: 28, height: 26, border: `1px solid ${B}`, background: '#fff', fontSize: 12, fontWeight: 700, fontFamily: btn.label === '•' || btn.label === '—' ? 'inherit' : 'serif', cursor: 'pointer', color: '#475569', ...btn.style }}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                    <textarea id="cahier-contenu-textarea" value={cahierForm.contenuTraite} onChange={(e) => setCahierForm((f) => ({ ...f, contenuTraite: e.target.value }))} rows={8}
                      placeholder={"Introduction\nI/ Historique\nII/ Définitions\n  1) Premier concept\n  2) Deuxième concept\nIII/ Exercices d'application"}
                      style={{ width: '100%', border: 'none', padding: '8px 10px', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
                  </div>
                </div>
                {/* Observations / devoirs */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Observations / Devoirs</label>
                  <input value={cahierForm.observations} onChange={(e) => setCahierForm((f) => ({ ...f, observations: e.target.value }))} placeholder="Ex: Exercices 1 à 5 page 42 pour lundi" style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 12, fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCahierForm(false)} style={{ height: 34, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
                  <button disabled={!cahierForm.contenuTraite.trim() || (!cahierEditId && !selectedSession) || cahierSaving} onClick={async () => {
                    setCahierSaving(true);
                    try {
                      if (cahierEditId) {
                        await apiClient.patch(`/professeur/cahier-texte/${cahierEditId}`, {
                          contenuTraite: cahierForm.contenuTraite.trim(),
                          observations: cahierForm.observations.trim() || null,
                          chapitreId: cahierForm.chapitreId || null,
                        });
                        toast.success('Entrée modifiée');
                      } else {
                        if (!selectedSession) return;
                        await apiClient.post('/professeur/cahier-texte', {
                          classeId,
                          dateCours: selectedSession.date,
                          contenuTraite: cahierForm.contenuTraite.trim(),
                          observations: cahierForm.observations.trim() || undefined,
                          chapitreId: cahierForm.chapitreId || undefined,
                        });
                        toast.success('Entrée ajoutée');
                      }
                      setShowCahierForm(false);
                      setCahierEditId(null);
                      const r = await apiClient.get('/professeur/cahier-texte', { params: { classeId } });
                      setCahier((Array.isArray(r.data) ? r.data : ((r.data as R)?.data ?? [])) as R[]);
                    } catch { toast.error('Erreur'); }
                    setCahierSaving(false);
                  }} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: cahierSaving ? 'wait' : 'pointer', opacity: !cahierForm.contenuTraite.trim() || (!cahierEditId && !selectedSession) || cahierSaving ? 0.5 : 1 }}>
                    {cahierSaving ? 'Enregistrement...' : cahierEditId ? 'Modifier' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            )}

            {/* Avancement programme */}
            {chapitres.length > 0 && !showCahierForm && (() => {
              const total = chapitres.length;
              const termines = chapitres.filter((ch) => ch.statut === 'TERMINE').length;
              const enCours = chapitres.filter((ch) => ch.statut === 'EN_COURS').length;
              const pct = total > 0 ? Math.round((termines / total) * 100) : 0;
              return (
                <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Avancement programme</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 80 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626' }}>{pct}% terminé</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#16a34a' : pct >= 40 ? '#d97706' : '#2563eb', borderRadius: 4, transition: 'width .3s' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#64748b', marginBottom: 10 }}>
                    <span>{termines}/{total} terminé(s)</span>
                    <span>{enCours} en cours</span>
                    <span>{total - termines - enCours} restant(s)</span>
                  </div>
                  {/* Chapitres list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {chapitres.map((ch) => {
                      const st = String(ch.statut ?? 'NON_COMMENCE');
                      const stColors = { TERMINE: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'Terminé' }, EN_COURS: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', label: 'En cours' }, NON_COMMENCE: { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8', label: 'Non commencé' } };
                      const sc = stColors[st as keyof typeof stColors] ?? stColors.NON_COMMENCE;
                      const nextStatut = st === 'NON_COMMENCE' ? 'EN_COURS' : st === 'EN_COURS' ? 'TERMINE' : 'NON_COMMENCE';
                      return (
                        <div key={String(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: `1px solid ${sc.border}`, background: sc.bg }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', flex: 1 }}>{String(ch.numero)}. {String(ch.titre)}</span>
                          {Boolean(ch.matiereNom) && <span style={{ fontSize: 9, color: '#7c3aed' }}>{String(ch.matiereNom)}</span>}
                          <button onClick={async () => {
                            try {
                              await apiClient.patch(`/professeur/chapitres/${ch.id}/statut`, { statut: nextStatut });
                              setChapitres((prev) => prev.map((c2) => String(c2.id) === String(ch.id) ? { ...c2, statut: nextStatut } : c2));
                            } catch { toast.error('Erreur'); }
                          }} style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', border: `1px solid ${sc.border}`, background: '#fff', color: sc.text, cursor: 'pointer', fontFamily: 'inherit' }}
                            title={`Cliquer pour passer à : ${nextStatut.replace('_', ' ').toLowerCase()}`}>
                            {sc.label}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Historique */}
            {cahier.length === 0 && !showCahierForm ? <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune entrée dans le cahier de texte</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cahier.map((c, i) => {
                  const chap = (c.chapitre ?? chapitres.find((ch) => String(ch.id) === String(c.chapitreId))) as R | undefined;
                  const matiereLabel = String(((c.cours as R)?.matiere as R)?.libelle ?? ((c.cours as R)?.matiere as R)?.nom ?? '');
                  const dateLabel = (() => { try { return new Date(String(c.dateCours)).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); } catch { return '—'; } })();
                  return (
                    <div key={String(c.id ?? i)} style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{dateLabel}</span>
                          {matiereLabel && <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '1px 6px', border: '1px solid #ddd6fe' }}>{matiereLabel}</span>}
                        </div>
                        {Boolean(chap) && <span style={{ fontSize: 9, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '1px 6px' }}>Ch.{String(chap?.numero ?? '')} {String(chap?.titre ?? '')}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: renderFormatted(String(c.contenuTraite ?? '')) }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        {Boolean(c.observations) && <div style={{ flex: 1, fontSize: 11, color: '#d97706', padding: '4px 8px', background: '#fffbeb', border: '1px solid #fde68a' }}>Devoirs : {String(c.observations)}</div>}
                        <button onClick={() => {
                          setCahierEditId(String(c.id));
                          setCahierForm({ contenuTraite: String(c.contenuTraite ?? ''), observations: String(c.observations ?? ''), chapitreId: String(c.chapitreId ?? ''), coursSessionKey: '' });
                          setShowCahierForm(true);
                        }} style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                          Modifier
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          ); })()}
      </div>

      {/* ── Detail eleve modal ── */}
      {selectedEleve && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setSelectedEleve(null)} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: 480, background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,.1)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSelectedEleve(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
              {resolveStorageUrl(selectedEleve.photoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveStorageUrl(selectedEleve.photoUrl)} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {(selectedEleve.firstName?.[0] ?? '').toUpperCase()}{(selectedEleve.lastName?.[0] ?? '').toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{selectedEleve.firstName ?? ''} {selectedEleve.lastName ?? ''}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{selectedEleve.matricule ?? ''} · {classeNom}</div>
              </div>
            </div>

            {/* Onglets detail */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${B}` }}>
              {([{ key: 'notes', label: `Notes (${eleveNotes.length})` }, { key: 'absences', label: `Absences (${eleveAbsences.length})` }, { key: 'discipline', label: `Discipline (${eleveDiscipline.length})` }] as { key: string; label: string }[]).map((t) => (
                <button key={t.key} onClick={() => setEleveDetailTab(t.key as 'notes' | 'absences' | 'discipline')} style={{ flex: 1, height: 38, border: 'none', background: 'transparent', fontSize: 12, fontWeight: eleveDetailTab === t.key ? 700 : 400, color: eleveDetailTab === t.key ? '#2563eb' : '#64748b', borderBottom: eleveDetailTab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>{t.label}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
              {loadingEleve ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
              ) : eleveDetailTab === 'absences' ? (
                /* Absences */
                eleveAbsences.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence enregistrée</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1, background: '#fef2f2', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>Total</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{eleveAbsences.length}</div>
                      </div>
                      <div style={{ flex: 1, background: '#fffbeb', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>Retards</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{eleveAbsences.filter((a) => a.typeAbsence === 'RETARD').length}</div>
                      </div>
                      <div style={{ flex: 1, background: '#f0fdf4', padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>Justifiées</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>{eleveAbsences.filter((a) => a.justifiee).length}</div>
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: `1px solid ${B}` }}>
                      {eleveAbsences.map((a, i) => {
                        const type = String(a.typeAbsence ?? 'ABSENCE');
                        const sc = type === 'RETARD' ? { bg: '#fffbeb', text: '#d97706' } : { bg: '#fef2f2', text: '#dc2626' };
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: i < eleveAbsences.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a', width: 100 }}>{fmtD(String(a.date ?? a.dateAbsence ?? ''))}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', background: sc.bg, color: sc.text }}>{type === 'RETARD' ? 'Retard' : 'Absence'}</span>
                            <span style={{ flex: 1, fontSize: 10, color: '#64748b' }}>{String(a.motif ?? '')}</span>
                            {Boolean(a.justifiee) && <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}>Justifiée</span>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )
              ) : eleveDetailTab === 'discipline' ? (
                /* Discipline */
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <button onClick={() => { setIncidentForm({ motif: '', gravite: 2, type: 'AVERTISSEMENT' }); setShowIncidentModal(true); }} style={{ height: 34, padding: '0 14px', border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      Signaler un incident
                    </button>
                  </div>
                  {eleveDiscipline.length === 0 ? (
                    <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun incident</div>
                  ) : (
                    <div style={{ background: '#fff', border: `1px solid ${B}` }}>
                      {eleveDiscipline.map((d, i) => {
                        const grav = String(d.gravite ?? '');
                        const gc = grav === 'ELEVEE' ? '#dc2626' : grav === 'MOYENNE' ? '#d97706' : '#64748b';
                        return (
                          <div key={i} style={{ padding: '10px 14px', borderBottom: i < eleveDiscipline.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: gc, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{String(d.sanctionEnvisagee ?? d.sanction ?? 'Incident')}</span>
                              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>{fmtD(String(d.date ?? d.createdAt ?? ''))}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#475569', marginLeft: 16 }}>{String(d.description ?? d.motif ?? '')}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16, marginTop: 2 }}>
                              <span style={{ fontSize: 10, color: '#94a3b8' }}>Statut : <span style={{ fontWeight: 600, color: d.statut === 'CLOTURE' ? '#16a34a' : '#d97706' }}>{String(d.statut ?? 'OUVERT')}</span></span>
                              {d.statut === 'OUVERT' && (
                                <button onClick={async (ev) => {
                                  ev.stopPropagation();
                                  if (!confirm('Annuler ce signalement ?')) return;
                                  try {
                                    await apiClient.put(`/admin/discipline/${d.id}`, { statut: 'ANNULE' });
                                    toast.success('Signalement annulé');
                                    setEleveDiscipline((prev) => prev.filter((x) => x.id !== d.id));
                                  } catch { toast.error('Erreur'); }
                                }} style={{ fontSize: 9, color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                                  Annuler
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : eleveNotes.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune note pour cet élève</div>
              ) : (
                <>
                  {/* Stats */}
                  {(() => {
                    const vals = eleveNotes.map((n) => Number(n.valeur ?? 0)).filter((v) => v >= 0);
                    const moy = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
                    const max = vals.length > 0 ? Math.max(...vals) : 0;
                    const min = vals.length > 0 ? Math.min(...vals) : 0;
                    const moyColor = moy >= 14 ? '#16a34a' : moy >= 10 ? '#d97706' : '#dc2626';
                    return (
                      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <div style={{ flex: 1, background: '#f8fafc', padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Moyenne</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: moyColor }}>{moy > 0 ? moy.toFixed(1) : '—'}</div>
                        </div>
                        <div style={{ flex: 1, background: '#f0fdf4', padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Meilleure</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{max > 0 ? max : '—'}</div>
                        </div>
                        <div style={{ flex: 1, background: '#fef2f2', padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Plus faible</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{min > 0 ? min : '—'}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Evolution graphique */}
                  {(() => {
                    const sorted = [...eleveNotes].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')));
                    const vals = sorted.map((n) => Number(n.valeur ?? 0)).filter((v) => v >= 0);
                    if (vals.length < 2) return null;
                    const maxVal = Math.max(...vals, 20);
                    return (
                      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: '14px 16px', marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Évolution des notes</div>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 80 }}>
                          {vals.map((v, i) => {
                            const h = Math.round((v / maxVal) * 70);
                            const color = v >= 14 ? '#16a34a' : v >= 10 ? '#d97706' : '#dc2626';
                            return (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <div style={{ fontSize: 8, color, fontWeight: 700 }}>{v}</div>
                                <div style={{ width: '100%', height: h, background: color, borderRadius: '2px 2px 0 0', minHeight: 3 }} />
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>{vals.length} évaluation(s) — du plus ancien au plus récent</div>
                      </div>
                    );
                  })()}

                  {/* Liste des notes */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Détail des notes ({eleveNotes.length})</div>
                  <div style={{ background: '#fff', border: `1px solid ${B}` }}>
                    {eleveNotes.map((n, i) => {
                      const val = Number(n.valeur ?? 0);
                      const sur = Number(n.noteSur ?? 20);
                      const color = val >= sur * 0.7 ? '#16a34a' : val >= sur * 0.5 ? '#d97706' : '#dc2626';
                      return (
                        <div key={String(n.id ?? i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: i < eleveNotes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color, width: 55 }}>{val}/{sur}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>{String(n.typeEvaluation ?? 'Évaluation')}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{String(n.trimestre ?? '')} · {fmtD(String(n.createdAt ?? ''))}</div>
                          </div>
                          {Boolean(n.commentaire) && <div style={{ fontSize: 10, color: '#64748b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(n.commentaire)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal signalement incident ── */}
      {showIncidentModal && selectedEleve && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowIncidentModal(false)} />
          <div style={{ position: 'relative', background: '#fff', width: '95vw', maxWidth: 480, maxHeight: '85vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${B}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Signaler un incident</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{selectedEleve.firstName} {selectedEleve.lastName} · {classeNom}</div>
              </div>
              <button onClick={() => setShowIncidentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Gravité</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ val: 1, label: 'Faible', color: '#64748b' }, { val: 2, label: 'Moyenne', color: '#d97706' }, { val: 3, label: 'Élevée', color: '#dc2626' }].map((g) => (
                    <button key={g.val} onClick={() => setIncidentForm((f) => ({ ...f, gravite: g.val }))}
                      style={{ flex: 1, height: 34, border: `2px solid ${incidentForm.gravite === g.val ? g.color : B}`, background: incidentForm.gravite === g.val ? g.color + '15' : '#fff', color: incidentForm.gravite === g.val ? g.color : '#64748b', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Type de sanction</label>
                <select value={incidentForm.type} onChange={(e) => setIncidentForm((f) => ({ ...f, type: e.target.value }))} style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff' }}>
                  <option value="AVERTISSEMENT">Avertissement</option>
                  <option value="BLAME">Blâme</option>
                  <option value="RETENUE">Retenue</option>
                  <option value="EXCLUSION_COURS">Exclusion de cours</option>
                  <option value="EXCLUSION_TEMPORAIRE">Exclusion temporaire</option>
                  <option value="CONVOCATION_PARENTS">Convocation des parents</option>
                  <option value="CONSEIL_DISCIPLINE">Conseil de discipline</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Motif / Description *</label>
                <textarea value={incidentForm.motif} onChange={(e) => setIncidentForm((f) => ({ ...f, motif: e.target.value }))} rows={4} placeholder="Décrivez les faits, le contexte et les circonstances..." style={{ width: '100%', border: `1px solid ${B}`, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${B}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowIncidentModal(false)} style={{ height: 34, padding: '0 16px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button disabled={!incidentForm.motif.trim() || incidentSaving} onClick={async () => {
                setIncidentSaving(true);
                try {
                  const eleveNom = `${selectedEleve.firstName ?? ''} ${selectedEleve.lastName ?? ''}`.trim();
                  await apiClient.post('/admin/discipline', {
                    eleveId: selectedEleve.id,
                    eleveNom: `${eleveNom} (${selectedEleve.matricule ?? ''})`,
                    classeId,
                    eleveClasse: classeNom,
                    type: incidentForm.type,
                    motif: incidentForm.motif.trim(),
                    dateIncident: new Date().toISOString(),
                    gravite: incidentForm.gravite,
                    rapporteurRole: 'ENSEIGNANT',
                  });
                  toast.success('Incident signalé — visible par l\'administration et la surveillance');
                  setShowIncidentModal(false);
                  const r = await apiClient.get('/admin/discipline', { params: { eleveId: selectedEleve.id } });
                  const parse3 = (d3: unknown) => { if (Array.isArray(d3)) return d3; const o3 = d3 as Record<string, unknown>; return Array.isArray(o3?.data) ? o3.data : []; };
                  setEleveDiscipline(parse3(r.data) as R[]);
                } catch { toast.error('Erreur lors du signalement'); }
                setIncidentSaving(false);
              }} style={{ height: 34, padding: '0 16px', border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: incidentSaving ? 'wait' : 'pointer', opacity: !incidentForm.motif.trim() || incidentSaving ? 0.5 : 1 }}>
                {incidentSaving ? 'Envoi...' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
