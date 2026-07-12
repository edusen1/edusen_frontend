'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminDiscipline, useAdminClasses, useCreateDiscipline, useUpdateDiscipline, useCloturerDiscipline } from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';

type TypeSanction = 'AVERTISSEMENT' | 'BLAME' | 'RETENUE' | 'EXCLUSION_TEMPORAIRE' | 'EXCLUSION_DEFINITIVE' | 'CONSEIL_DISCIPLINE';
type StatutDiscipline = 'OUVERT' | 'EN_TRAITEMENT' | 'CLOTURE' | 'APPEL';

interface Incident {
  id: string;
  eleveNom?: string; eleve?: { nom?: string; prenom?: string };
  eleveClasse?: string; classe?: { nom?: string };
  type: TypeSanction;
  motif: string;
  dateIncident: string;
  dateDecision?: string;
  statut: StatutDiscipline;
  gravite: 1 | 2 | 3;
  sanction?: string;
  rapporteur?: string;
  compteRendu?: string;
}

const TYPE_LABELS: Record<TypeSanction, { label: string; bg: string; color: string }> = {
  AVERTISSEMENT:         { label: 'Avertissement',        bg: '#fef3c7', color: '#d97706' },
  BLAME:                 { label: 'Blâme',                bg: '#fed7aa', color: '#c2410c' },
  RETENUE:               { label: 'Retenue',              bg: '#fce7f3', color: '#db2777' },
  EXCLUSION_TEMPORAIRE:  { label: 'Exclusion temporaire', bg: '#fee2e2', color: '#dc2626' },
  EXCLUSION_DEFINITIVE:  { label: 'Exclusion définitive', bg: '#7f1d1d', color: '#fff'   },
  CONSEIL_DISCIPLINE:    { label: 'Conseil de discipline', bg: '#1e1b4b', color: '#fff'  },
};

const STATUT_LABELS: Record<StatutDiscipline, { label: string; color: string }> = {
  OUVERT:       { label: 'Ouvert',       color: '#dc2626' },
  EN_TRAITEMENT:{ label: 'En traitement',color: '#d97706' },
  CLOTURE:      { label: 'Clôturé',      color: '#16a34a' },
  APPEL:        { label: 'En appel',     color: '#7c3aed' },
};

const GRAVITE_LABELS: Record<number, string> = { 1: 'Faible', 2: 'Moyenne', 3: 'Élevée' };
const GRAVITE_COLORS: Record<number, string> = { 1: '#d97706', 2: '#c2410c', 3: '#dc2626' };

function getEleveNom(i: Incident) {
  if (i.eleveNom) return i.eleveNom;
  if (i.eleve) return `${i.eleve.prenom ?? ''} ${i.eleve.nom ?? ''}`.trim();
  return '—';
}
function getClasse(i: Incident) {
  return i.eleveClasse ?? i.classe?.nom ?? '—';
}

type RapporteurType = 'ELEVE' | 'PROFESSEUR' | 'PERSONNEL' | 'PARENT';
const RAPPORTEUR_TYPES: { value: RapporteurType; label: string }[] = [
  { value: 'ELEVE',      label: 'Élève' },
  { value: 'PROFESSEUR', label: 'Professeur' },
  { value: 'PERSONNEL',  label: 'Personnel' },
  { value: 'PARENT',     label: 'Parent' },
];
const RAPPORTEUR_URLS: Record<RapporteurType, string> = {
  ELEVE: '/admin/eleves',
  PROFESSEUR: '/admin/professeurs',
  PERSONNEL: '/admin/personnel',
  PARENT: '/admin/parents',
};

type PersonItem = { id: string; firstName?: string; lastName?: string; nom?: string; prenom?: string };

const EMPTY_FORM = {
  classeId: '', classeNom: '', eleveId: '', eleveNom: '',
  type: 'AVERTISSEMENT' as TypeSanction,
  motif: '', dateIncident: new Date().toISOString().slice(0, 10),
  gravite: 2 as 1 | 2 | 3,
  rapporteurType: '' as '' | RapporteurType, rapporteurId: '', rapporteurNom: '',
};
const EMPTY_CLOTURE = { sanction: '', compteRendu: '', dateDecision: new Date().toISOString().slice(0, 10) };

export default function DisciplinePage() {
  const { data: raw, isLoading } = useAdminDiscipline();
  const incidents: Incident[] = Array.isArray(raw) ? raw : (raw as { content?: Incident[] })?.content ?? [];

  const { data: classesRaw } = useAdminClasses();
  const classes: { id: string; nom: string }[] = Array.isArray(classesRaw) ? classesRaw : (classesRaw as { content?: { id: string; nom: string }[] })?.content ?? [];

  const createDiscipline = useCreateDiscipline();
  const updateDiscipline = useUpdateDiscipline();
  const cloturerDiscipline = useCloturerDiscipline();

  const [onglet, setOnglet] = useState<'actifs' | 'historique'>('actifs');
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Incident | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cloture, setCloture] = useState(EMPTY_CLOTURE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [elevesByClasse, setElevesByClasse] = useState<Record<string, PersonItem[]>>({});
  const [rapporteurList, setRapporteurList] = useState<PersonItem[]>([]);
  const [rapporteurLoading, setRapporteurLoading] = useState(false);

  const actifs    = incidents.filter(i => i.statut === 'OUVERT' || i.statut === 'EN_TRAITEMENT' || i.statut === 'APPEL');
  const historique = incidents.filter(i => i.statut === 'CLOTURE');

  async function loadEleves(classeId: string) {
    if (elevesByClasse[classeId]?.length) return;
    try {
      const res = await apiClient.get('/admin/eleves', { params: { classeId, size: 200 } });
      const raw = res.data;
      const data = raw?.data ?? raw?.content ?? (Array.isArray(raw) ? raw : []);
      setElevesByClasse(prev => ({ ...prev, [classeId]: Array.isArray(data) ? data : [] }));
    } catch { /* ignore */ }
  }

  async function loadRapporteurs(type: RapporteurType) {
    setRapporteurList([]);
    setRapporteurLoading(true);
    try {
      const res = await apiClient.get(RAPPORTEUR_URLS[type], { params: { size: 200 } });
      const raw = res.data;
      const list = raw?.data ?? raw?.content ?? (Array.isArray(raw) ? raw : []);
      setRapporteurList(Array.isArray(list) ? list : []);
    } catch { /* ignore */ }
    finally { setRapporteurLoading(false); }
  }

  function personLabel(p: PersonItem) {
    return `${p.firstName ?? p.prenom ?? ''} ${p.lastName ?? p.nom ?? ''}`.trim();
  }

  function validateCreate() {
    const e: Record<string, string> = {};
    if (!form.eleveNom.trim()) e.eleveNom = 'Élève requis';
    if (!form.motif.trim()) e.motif = 'Motif requis';
    if (!form.dateIncident) e.dateIncident = 'Date requise';
    return e;
  }

  function handleCreate() {
    const e = validateCreate();
    if (Object.keys(e).length) { setErrors(e); return; }
    createDiscipline.mutate({
      eleveId: form.eleveId || undefined,
      eleveNom: form.eleveNom,
      classeId: form.classeId || undefined,
      eleveClasse: form.classeNom,
      type: form.type,
      motif: form.motif,
      dateIncident: form.dateIncident,
      gravite: form.gravite,
      statut: 'OUVERT',
      rapporteur: form.rapporteurNom || undefined,
      rapporteurRole: form.rapporteurType || undefined,
    }, {
      onSuccess: () => {
        setShowCreate(false);
        setForm(EMPTY_FORM);
        setErrors({});
        setRapporteurList([]);
      },
    });
  }

  function handlePrendreEnCharge(id: string) {
    updateDiscipline.mutate({ id, data: { statut: 'EN_TRAITEMENT' } });
  }

  function handleCloturer() {
    if (!detail) return;
    if (!cloture.compteRendu.trim()) { toast.error('Le compte-rendu est obligatoire pour clôturer'); return; }
    if (!cloture.sanction.trim()) { toast.error('La sanction est obligatoire pour clôturer'); return; }
    cloturerDiscipline.mutate({ id: detail.id, data: { ...cloture, statut: 'CLOTURE' } }, {
      onSuccess: () => { setDetail(null); setCloture(EMPTY_CLOTURE); },
    });
  }

  const liste = onglet === 'actifs' ? actifs : historique;

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Discipline</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Incidents · Sanctions · Dossiers</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + Signaler un incident
        </button>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Dossiers actifs', value: actifs.length, color: '#dc2626' },
            { label: 'En traitement', value: incidents.filter(i => i.statut === 'EN_TRAITEMENT').length, color: '#d97706' },
            { label: 'Clôturés', value: historique.length, color: '#16a34a' },
            { label: 'Gravité élevée', value: incidents.filter(i => i.gravite === 3 && i.statut !== 'CLOTURE').length, color: '#7c3aed' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e6ebf1' }}>
          {(['actifs', 'historique'] as const).map(o => (
            <button key={o} onClick={() => setOnglet(o)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: onglet === o ? 700 : 400, color: onglet === o ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: onglet === o ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2 }}>
              {o === 'actifs' ? `Dossiers actifs (${actifs.length})` : `Historique (${historique.length})`}
            </button>
          ))}
        </div>

        {/* Liste */}
        {isLoading && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            Chargement…
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!isLoading && liste.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              {onglet === 'actifs' ? 'Aucun dossier disciplinaire actif' : 'Aucun historique'}
            </div>
          )}
          {liste.map(inc => {
            const t = TYPE_LABELS[inc.type] ?? { label: inc.type, bg: '#f1f5f9', color: '#475569' };
            const st = STATUT_LABELS[inc.statut] ?? { label: inc.statut, color: '#94a3b8' };
            return (
              <div key={inc.id} style={{ background: '#fff', border: `1px solid ${inc.gravite === 3 ? '#fecaca' : '#e6ebf1'}`, padding: '14px 18px', cursor: 'pointer' }} onClick={() => setDetail(inc)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GRAVITE_COLORS[inc.gravite], marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{getEleveNom(inc)}</span>
                      <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{getClasse(inc)}</span>
                      <span style={{ background: t.bg, color: t.color, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{t.label}</span>
                      <span style={{ color: st.color, fontWeight: 600, fontSize: 11 }}>{st.label}</span>
                      <span style={{ color: GRAVITE_COLORS[inc.gravite], fontSize: 11, fontWeight: 600 }}>Gravité {GRAVITE_LABELS[inc.gravite]}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151' }}>{inc.motif}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      {new Date(inc.dateIncident).toLocaleDateString('fr-FR')}
                      {inc.rapporteur && ` · ${inc.rapporteur}`}
                    </div>
                  </div>
                  {inc.statut === 'OUVERT' && (
                    <button onClick={e => { e.stopPropagation(); handlePrendreEnCharge(inc.id); }} style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                      Prendre en charge
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal création */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Signaler un incident</span>
              <button onClick={() => { setShowCreate(false); setErrors({}); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Classe → Élève */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Classe *</label>
                  <select value={form.classeId} onChange={e => {
                    const c = classes.find(cl => cl.id === e.target.value);
                    setForm(f => ({ ...f, classeId: e.target.value, classeNom: c?.nom ?? '', eleveId: '', eleveNom: '' }));
                    if (e.target.value) loadEleves(e.target.value);
                  }} style={{ width: '100%', border: `1px solid ${errors.eleveNom ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    <option value="">Choisir…</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Élève *</label>
                  <select value={form.eleveId} onChange={e => {
                    const el = (elevesByClasse[form.classeId] ?? []).find(x => x.id === e.target.value);
                    const mat = el?.matricule ? ` (${el.matricule})` : '';
                    setForm(f => ({ ...f, eleveId: e.target.value, eleveNom: el ? personLabel(el) + mat : '' }));
                  }} disabled={!form.classeId} style={{ width: '100%', border: `1px solid ${errors.eleveNom ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, background: !form.classeId ? '#f8fafc' : '#fff' }}>
                    <option value="">Sélectionner…</option>
                    {(elevesByClasse[form.classeId] ?? []).map(el => <option key={el.id} value={el.id}>{personLabel(el)}{el.matricule ? ` (${el.matricule})` : ''}</option>)}
                  </select>
                  {errors.eleveNom && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.eleveNom}</div>}
                </div>
              </div>
              {/* Date + Type sanction */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date *</label>
                  <input type="date" value={form.dateIncident} onChange={e => setForm({ ...form, dateIncident: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.dateIncident ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type de sanction envisagée</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TypeSanction })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    {(Object.keys(TYPE_LABELS) as TypeSanction[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t].label}</option>)}
                  </select>
                </div>
              </div>
              {/* Gravité */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Gravité</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([1, 2, 3] as const).map(g => (
                    <button key={g} onClick={() => setForm({ ...form, gravite: g })} style={{ flex: 1, padding: '8px', border: `2px solid ${form.gravite === g ? GRAVITE_COLORS[g] : '#e2e8f0'}`, borderRadius: 6, background: form.gravite === g ? GRAVITE_COLORS[g] + '12' : '#fff', color: form.gravite === g ? GRAVITE_COLORS[g] : '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      {GRAVITE_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Motif */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Motif *</label>
                <textarea value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} rows={3} placeholder="Décrivez l'incident précisément…" style={{ width: '100%', border: `1px solid ${errors.motif ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                {errors.motif && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.motif}</div>}
              </div>
              {/* Rapporteur */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Rôle du rapporteur</label>
                  <select value={form.rapporteurType} onChange={e => {
                    const t = e.target.value as '' | RapporteurType;
                    setForm(f => ({ ...f, rapporteurType: t, rapporteurId: '', rapporteurNom: '' }));
                    if (t) loadRapporteurs(t);
                  }} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    <option value="">— Aucun —</option>
                    {RAPPORTEUR_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Rapporteur</label>
                  <select value={form.rapporteurId} onChange={e => {
                    const p = rapporteurList.find(x => x.id === e.target.value);
                    setForm(f => ({ ...f, rapporteurId: e.target.value, rapporteurNom: p ? personLabel(p) : '' }));
                  }} disabled={!form.rapporteurType || rapporteurLoading} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, background: !form.rapporteurType ? '#f8fafc' : '#fff' }}>
                    <option value="">{rapporteurLoading ? 'Chargement…' : 'Sélectionner…'}</option>
                    {rapporteurList.map(p => <option key={p.id} value={p.id}>{personLabel(p)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowCreate(false); setErrors({}); }} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreate} disabled={createDiscipline.isPending} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: createDiscipline.isPending ? .7 : 1 }}>
                {createDiscipline.isPending ? 'Enregistrement…' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 520, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Dossier disciplinaire</span>
              <button onClick={() => { setDetail(null); setCloture(EMPTY_CLOTURE); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: TYPE_LABELS[detail.type]?.bg, color: TYPE_LABELS[detail.type]?.color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{TYPE_LABELS[detail.type]?.label ?? detail.type}</span>
                <span style={{ color: STATUT_LABELS[detail.statut]?.color, fontWeight: 700, fontSize: 12 }}>{STATUT_LABELS[detail.statut]?.label}</span>
                <span style={{ color: GRAVITE_COLORS[detail.gravite], fontSize: 11, fontWeight: 600 }}>Gravité {GRAVITE_LABELS[detail.gravite]}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{getEleveNom(detail)} — {getClasse(detail)}</div>
              <div style={{ fontSize: 13, color: '#374151', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px', lineHeight: 1.6 }}>{detail.motif}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#64748b' }}>
                <div><b>Date :</b> {new Date(detail.dateIncident).toLocaleDateString('fr-FR')}</div>
                {detail.rapporteur && <div><b>Rapporteur :</b> {detail.rapporteur}</div>}
                {detail.sanction && <div><b>Sanction :</b> {detail.sanction}</div>}
                {detail.compteRendu && <div><b>Compte-rendu :</b> {detail.compteRendu}</div>}
              </div>
              {(detail.statut === 'OUVERT' || detail.statut === 'EN_TRAITEMENT') && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>Clôturer ce dossier</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Sanction appliquée *</label>
                      <input value={cloture.sanction} onChange={e => setCloture({ ...cloture, sanction: e.target.value })} placeholder="Ex : Retenue le samedi 5 juillet" style={{ width: '100%', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date de décision</label>
                      <input type="date" value={cloture.dateDecision} onChange={e => setCloture({ ...cloture, dateDecision: e.target.value })} style={{ width: '100%', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Compte-rendu *</label>
                      <textarea value={cloture.compteRendu} onChange={e => setCloture({ ...cloture, compteRendu: e.target.value })} rows={3} placeholder="Résumé de l'entretien, décision prise, engagement de l'élève…" style={{ width: '100%', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                    </div>
                    <button onClick={handleCloturer} disabled={cloturerDiscipline.isPending} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '9px', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: cloturerDiscipline.isPending ? .7 : 1 }}>
                      {cloturerDiscipline.isPending ? 'Clôture en cours…' : 'Clôturer le dossier'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setDetail(null); setCloture(EMPTY_CLOTURE); }} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
