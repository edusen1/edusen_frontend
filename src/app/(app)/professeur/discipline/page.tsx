'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useProfesseurDiscipline, useCreateProfesseurDiscipline, useCloturerProfesseurDiscipline, useSurveillantClasses } from '@/hooks/use-query-api';
import { apiClient } from '@/lib/api/client';

type TypeSanction =
  | 'AVERTISSEMENT' | 'BLAME' | 'RETENUE' | 'EXCLUSION_COURS'
  | 'EXCLUSION_TEMPORAIRE' | 'EXCLUSION_DEFINITIVE' | 'TRAVAUX_INTERET_SCOLAIRE' | 'CONSEIL_DISCIPLINE';

type StatutDiscipline = 'OUVERT' | 'EN_TRAITEMENT' | 'CLOTURE' | 'APPEL';

interface Incident {
  id: string;
  eleveNom: string;
  eleveClasse?: string;
  type: TypeSanction;
  motif: string;
  dateIncident: string;
  gravite: number;
  statut: StatutDiscipline;
  sanction?: string;
  compteRendu?: string;
}

const SANCTIONS: { value: TypeSanction; label: string }[] = [
  { value: 'AVERTISSEMENT',            label: 'Avertissement' },
  { value: 'BLAME',                    label: 'Blâme' },
  { value: 'RETENUE',                  label: 'Retenue' },
  { value: 'EXCLUSION_COURS',          label: 'Exclusion de cours' },
  { value: 'EXCLUSION_TEMPORAIRE',     label: 'Exclusion temporaire' },
  { value: 'TRAVAUX_INTERET_SCOLAIRE', label: 'Travaux d\'intérêt scolaire' },
];

const SANCTION_CFG: Record<string, { label: string; color: string; bg: string }> = {
  AVERTISSEMENT:              { label: 'Avertissement',    color: '#d97706', bg: '#fef3c7' },
  BLAME:                      { label: 'Blâme',            color: '#c2410c', bg: '#fed7aa' },
  RETENUE:                    { label: 'Retenue',          color: '#ea580c', bg: '#ffedd5' },
  EXCLUSION_COURS:            { label: 'Exclu. cours',     color: '#dc2626', bg: '#fee2e2' },
  EXCLUSION_TEMPORAIRE:       { label: 'Exclu. temp.',     color: '#7c3aed', bg: '#f3e8ff' },
  EXCLUSION_DEFINITIVE:       { label: 'Exclu. déf.',      color: '#fff',    bg: '#7f1d1d' },
  TRAVAUX_INTERET_SCOLAIRE:   { label: 'T.I.S.',           color: '#0891b2', bg: '#e0f2fe' },
  CONSEIL_DISCIPLINE:         { label: 'Conseil disc.',    color: '#fff',    bg: '#1e1b4b' },
};

const STATUT_CFG: Record<string, { label: string; color: string }> = {
  OUVERT:         { label: 'Ouvert',        color: '#dc2626' },
  EN_TRAITEMENT:  { label: 'En traitement', color: '#d97706' },
  CLOTURE:        { label: 'Clôturé',       color: '#16a34a' },
  APPEL:          { label: 'En appel',      color: '#7c3aed' },
};

const GRAVITE_COLORS: Record<number, string> = { 1: '#d97706', 2: '#c2410c', 3: '#dc2626' };
const GRAVITE_LABELS: Record<number, string> = { 1: 'Faible', 2: 'Moyenne', 3: 'Élevée' };

type RapporteurType = 'ELEVE' | 'PROFESSEUR' | 'PERSONNEL' | 'PARENT';
const RAPPORTEUR_TYPES: { value: RapporteurType; label: string }[] = [
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PROFESSEUR', label: 'Professeur' },
  { value: 'PERSONNEL', label: 'Personnel' },
  { value: 'PARENT', label: 'Parent' },
];
type PersonItem = { id: string; firstName?: string; lastName?: string };

const EMPTY_FORM = {
  classeId: '', classeNom: '', eleveId: '', eleveNom: '',
  type: 'AVERTISSEMENT' as TypeSanction,
  motif: '', dateIncident: new Date().toISOString().split('T')[0],
  gravite: 2 as 1 | 2 | 3,
  rapporteurType: '' as '' | RapporteurType, rapporteurNom: '',
};

const EMPTY_CLOTURE = { sanction: '', compteRendu: '' };

export default function ProfesseurDisciplinePage() {
  const { user } = useAuthStore();

  const { data: raw, isLoading } = useProfesseurDiscipline(
    user?.id ? { signaleParId: user.id } : undefined,
  );
  const incidents: Incident[] = Array.isArray(raw) ? raw : (raw as { content?: Incident[] })?.content ?? [];

  const { data: classesRaw } = useSurveillantClasses();
  const classes: { id: string; nom: string }[] = Array.isArray(classesRaw) ? classesRaw : (classesRaw as { content?: { id: string; nom: string }[] })?.content ?? [];

  const createDiscipline = useCreateProfesseurDiscipline();
  const cloturerDiscipline = useCloturerProfesseurDiscipline();

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<Incident | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [cloture, setCloture] = useState(EMPTY_CLOTURE);
  const [elevesByClasse, setElevesByClasse] = useState<Record<string, PersonItem[]>>({});

  async function loadEleves(classeId: string) {
    if (elevesByClasse[classeId]?.length) return;
    try {
      const res = await apiClient.get('/admin/eleves', { params: { classeId, size: 200 } });
      const raw2 = res.data;
      const data = raw2?.data ?? raw2?.content ?? (Array.isArray(raw2) ? raw2 : []);
      setElevesByClasse(prev => ({ ...prev, [classeId]: Array.isArray(data) ? data : [] }));
    } catch { /* ignore */ }
  }

  function personLabel(p: PersonItem) {
    return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return incidents;
    const q = search.toLowerCase();
    return incidents.filter(i =>
      i.eleveNom.toLowerCase().includes(q) ||
      (i.eleveClasse ?? '').toLowerCase().includes(q) ||
      i.motif.toLowerCase().includes(q),
    );
  }, [incidents, search]);

  function handleCreate() {
    if (!form.eleveNom.trim()) { toast.error('Élève requis'); return; }
    if (!form.motif.trim()) { toast.error('Description requise'); return; }
    createDiscipline.mutate({
      eleveNom: form.eleveNom,
      eleveClasse: form.classeNom || undefined,
      type: form.type,
      motif: form.motif,
      dateIncident: form.dateIncident,
      gravite: form.gravite,
      statut: 'OUVERT',
      rapporteur: form.rapporteurNom || undefined,
      rapporteurRole: form.rapporteurType || 'PROFESSEUR',
      signaleParId: user?.id,
    }, {
      onSuccess: () => { setShowModal(false); setForm(EMPTY_FORM); },
    });
  }

  function handleClore() {
    if (!detail) return;
    if (!cloture.compteRendu.trim()) { toast.error('Le compte-rendu est obligatoire'); return; }
    if (!cloture.sanction.trim()) { toast.error('La sanction est obligatoire'); return; }
    cloturerDiscipline.mutate({ id: detail.id, data: { ...cloture } }, {
      onSuccess: () => { setDetail(null); setCloture(EMPTY_CLOTURE); },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Signalements disciplinaires</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{incidents.length} incident{incidents.length !== 1 ? 's' : ''} signalé{incidents.length !== 1 ? 's' : ''} par vous</div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          + Signaler un incident
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Ouverts',    count: incidents.filter(i => i.statut === 'OUVERT').length,   color: '#dc2626' },
          { label: 'Clôturés',   count: incidents.filter(i => i.statut === 'CLOTURE').length,  color: '#16a34a' },
          { label: 'Total',      count: incidents.length,                                       color: '#0f172a' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 140px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0' }}>
        <input
          placeholder="Rechercher élève, classe…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 240, boxSizing: 'border-box' }}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {isLoading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun incident signalé</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(inc => {
              const sc = SANCTION_CFG[inc.type] ?? { label: inc.type, color: '#475569', bg: '#f1f5f9' };
              const st = STATUT_CFG[inc.statut] ?? { label: inc.statut, color: '#475569' };
              return (
                <div key={inc.id} onClick={() => { setDetail(inc); setCloture(EMPTY_CLOTURE); }}
                  style={{ background: '#fff', border: `1px solid ${inc.gravite === 3 ? '#fecaca' : '#e6ebf1'}`, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: GRAVITE_COLORS[inc.gravite], marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{inc.eleveNom}</span>
                      {inc.eleveClasse && <span style={{ background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{inc.eleveClasse}</span>}
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
                      <span style={{ color: st.color, fontWeight: 600, fontSize: 11 }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151' }}>{inc.motif}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      {new Date(inc.dateIncident).toLocaleDateString('fr-FR')} · Gravité {GRAVITE_LABELS[inc.gravite] ?? inc.gravite}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Signaler incident */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Signaler un incident</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Classe *</label>
                  <select value={form.classeId} onChange={e => {
                    const c = classes.find(cl => cl.id === e.target.value);
                    setForm(f => ({ ...f, classeId: e.target.value, classeNom: c?.nom ?? '', eleveId: '', eleveNom: '' }));
                    if (e.target.value) loadEleves(e.target.value);
                  }} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                    <option value="">Choisir…</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Élève *</label>
                  <select value={form.eleveId} onChange={e => {
                    const el = (elevesByClasse[form.classeId] ?? []).find(x => x.id === e.target.value);
                    setForm(f => ({ ...f, eleveId: e.target.value, eleveNom: el ? personLabel(el) : '' }));
                  }} disabled={!form.classeId} style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: !form.classeId ? '#f8fafc' : '#fff' }}>
                    <option value="">Sélectionner…</option>
                    {(elevesByClasse[form.classeId] ?? []).map(el => <option key={el.id} value={el.id}>{personLabel(el)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Sanction envisagée</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TypeSanction }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                    {SANCTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date</label>
                  <input type="date" value={form.dateIncident} onChange={e => setForm(f => ({ ...f, dateIncident: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Gravité</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([1, 2, 3] as const).map(g => (
                    <button key={g} onClick={() => setForm(f => ({ ...f, gravite: g }))}
                      style={{ flex: 1, padding: 8, border: `2px solid ${form.gravite === g ? GRAVITE_COLORS[g] : '#e2e8f0'}`, borderRadius: 6, background: form.gravite === g ? GRAVITE_COLORS[g] + '15' : '#fff', color: form.gravite === g ? GRAVITE_COLORS[g] : '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {GRAVITE_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Description de l&apos;incident *</label>
                <textarea value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
                  rows={3} placeholder="Décrivez l'incident précisément…"
                  style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              {/* Rapporteur */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Rôle du rapporteur</label>
                  <select value={form.rapporteurType} onChange={e => setForm(f => ({ ...f, rapporteurType: e.target.value as '' | RapporteurType, rapporteurNom: '' }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
                    <option value="">— Aucun —</option>
                    {RAPPORTEUR_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom du rapporteur</label>
                  <input value={form.rapporteurNom} onChange={e => setForm(f => ({ ...f, rapporteurNom: e.target.value }))}
                    placeholder={form.rapporteurType ? 'Saisir le nom…' : '—'}
                    disabled={!form.rapporteurType}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: !form.rapporteurType ? '#f8fafc' : '#fff', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreate} disabled={createDiscipline.isPending}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: createDiscipline.isPending ? .7 : 1 }}>
                {createDiscipline.isPending ? 'Enregistrement…' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Dossier disciplinaire</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ background: (SANCTION_CFG[detail.type] ?? {}).bg, color: (SANCTION_CFG[detail.type] ?? {}).color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{(SANCTION_CFG[detail.type] ?? {}).label ?? detail.type}</span>
              <span style={{ color: (STATUT_CFG[detail.statut] ?? {}).color, fontWeight: 700, fontSize: 12 }}>{(STATUT_CFG[detail.statut] ?? {}).label}</span>
            </div>
            {[
              { label: 'Élève',  value: detail.eleveNom },
              { label: 'Classe', value: detail.eleveClasse ?? '—' },
              { label: 'Date',   value: new Date(detail.dateIncident).toLocaleDateString('fr-FR') },
              { label: 'Gravité', value: `${GRAVITE_LABELS[detail.gravite]} (${detail.gravite}/3)` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', width: 80, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{value}</span>
              </div>
            ))}
            <div style={{ margin: '12px 0', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e6ebf1' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>Description</div>
              <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>{detail.motif}</div>
            </div>
            {detail.sanction && <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}><b>Sanction :</b> {detail.sanction}</div>}
            {detail.compteRendu && <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}><b>Compte-rendu :</b> {detail.compteRendu}</div>}

            {(detail.statut === 'OUVERT' || detail.statut === 'EN_TRAITEMENT') && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: 14, marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>Clôturer ce dossier</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Sanction appliquée *</label>
                    <input value={cloture.sanction} onChange={e => setCloture(c => ({ ...c, sanction: e.target.value }))}
                      placeholder="Ex : Retenue le samedi"
                      style={{ width: '100%', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Compte-rendu *</label>
                    <textarea value={cloture.compteRendu} onChange={e => setCloture(c => ({ ...c, compteRendu: e.target.value }))}
                      rows={3} placeholder="Résumé de l'entretien…"
                      style={{ width: '100%', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={handleClore} disabled={cloturerDiscipline.isPending}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: cloturerDiscipline.isPending ? .7 : 1, fontFamily: 'inherit' }}>
                    {cloturerDiscipline.isPending ? 'Clôture…' : 'Clôturer le dossier'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setDetail(null)}
                style={{ height: 38, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
