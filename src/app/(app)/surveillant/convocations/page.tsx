'use client';

import { useState, useMemo } from 'react';
import {
  useSurveillantConvocations,
  useSurveillantEleves,
  useSurveillantParents,
  useCreateSurveillantConvocation,
  useCompteRenduConvocation,
  useDeleteConvocation,
} from '@/hooks/use-query-api';

type Conv = Record<string, unknown>;

const STATIC_CONV: Conv[] = [
  { id: 'c1', eleveNom: 'Moussa Diallo', parentNom: 'Abdoulaye Diallo', motif: 'Indiscipline répétée', dateConvocation: '2026-01-30T14:00:00Z', statut: 'EN_ATTENTE', compteRendu: null },
  { id: 'c2', eleveNom: 'Ibrahima Fall', parentNom: 'Mamadou Fall', motif: 'Absences non justifiées (5)', dateConvocation: '2026-01-31T10:00:00Z', statut: 'EFFECTUEE', compteRendu: 'Parents informés, engagement signé.' },
  { id: 'c3', eleveNom: 'Awa Cissé', parentNom: 'Aminata Cissé', motif: 'Retards répétés', dateConvocation: '2026-02-04T09:30:00Z', statut: 'EN_ATTENTE', compteRendu: null },
  { id: 'c4', eleveNom: 'Cheikh Sarr', parentNom: 'Oumar Sarr', motif: 'Résultats préoccupants', dateConvocation: '2026-02-05T15:00:00Z', statut: 'EN_ATTENTE', compteRendu: null },
];

const STATUT_CFG: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'Planifiée', bg: '#eff6ff', color: '#2563eb' },
  EFFECTUEE:  { label: 'Effectuée', bg: '#dcfce7', color: '#16a34a' },
  ANNULEE:    { label: 'Annulée',   bg: '#fee2e2', color: '#dc2626' },
};

function fd(v: unknown): string {
  try { return new Date(String(v)).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return String(v ?? '—'); }
}

export default function ConvocationsPage() {
  const { data: convData } = useSurveillantConvocations();
  const { data: elevesData } = useSurveillantEleves();
  const { data: parentsData } = useSurveillantParents();

  const createConvocation = useCreateSurveillantConvocation();
  const compteRenduMut   = useCompteRenduConvocation();
  const deleteConv       = useDeleteConvocation();

  const rawConv: Conv[]    = Array.isArray(convData)    ? convData    : (convData?.content    ?? convData?.data    ?? []) as Conv[];
  const rawEleves: Conv[]  = Array.isArray(elevesData)  ? elevesData  : (elevesData?.content  ?? elevesData?.data  ?? []) as Conv[];
  const rawParents: Conv[] = Array.isArray(parentsData) ? parentsData : (parentsData?.content ?? parentsData?.data ?? []) as Conv[];

  const convocations = rawConv.length > 0 ? rawConv : STATIC_CONV;

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('TOUS');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showCompteRendu, setShowCompteRendu] = useState<Conv | null>(null);
  const [showDetail, setShowDetail] = useState<Conv | null>(null);

  // Create form
  const [form, setForm] = useState({ eleveId: '', parentId: '', motif: '', dateConvocation: '' });

  // Compte-rendu form
  const [crText, setCrText] = useState('');

  const filtered = useMemo(() => {
    let list = convocations;
    if (filterStatut !== 'TOUS') list = list.filter((c) => c.statut === filterStatut);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        String(c.motif ?? '').toLowerCase().includes(q) ||
        String(c.eleveNom ?? c.eleveId ?? '').toLowerCase().includes(q) ||
        String(c.parentNom ?? c.parentId ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [convocations, filterStatut, search]);

  const nbPlanifie = convocations.filter((c) => c.statut !== 'EFFECTUEE' && c.statut !== 'ANNULEE').length;
  const nbEffectue = convocations.filter((c) => c.statut === 'EFFECTUEE').length;

  const handleCreate = async () => {
    if (!form.motif || !form.dateConvocation) return;
    try {
      await createConvocation.mutateAsync({
        eleveId: form.eleveId || undefined,
        parentId: form.parentId || undefined,
        motif: form.motif,
        dateConvocation: new Date(form.dateConvocation).toISOString(),
      });
      setShowCreate(false);
      setForm({ eleveId: '', parentId: '', motif: '', dateConvocation: '' });
    } catch { /* hook handles toast */ }
  };

  const handleCompteRendu = async () => {
    if (!showCompteRendu || !crText.trim()) return;
    try {
      await compteRenduMut.mutateAsync({ id: String(showCompteRendu.id), compteRendu: crText });
      setShowCompteRendu(null);
      setCrText('');
    } catch { /* hook handles toast */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette convocation ?')) return;
    try { await deleteConv.mutateAsync(id); } catch { /* hook handles toast */ }
  };

  const TABS = [
    { key: 'TOUS', label: 'Toutes', count: convocations.length },
    { key: 'EN_ATTENTE', label: 'Planifiées', count: nbPlanifie },
    { key: 'EFFECTUEE', label: 'Effectuées', count: nbEffectue },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', minHeight: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Convocations</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{convocations.length} convocation{convocations.length !== 1 ? 's' : ''}</div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
        >
          + Nouvelle convocation
        </button>
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Planifiées',  count: nbPlanifie,            color: '#2563eb', bg: '#eff6ff' },
          { label: 'Effectuées', count: nbEffectue,             color: '#16a34a', bg: '#dcfce7' },
          { label: 'Total',       count: convocations.length,   color: '#475569', bg: '#f8fafc' },
        ].map((s) => (
          <div key={s.label} style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Rechercher motif, élève…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 0, border: '1px solid #e6ebf1', overflow: 'hidden' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterStatut(t.key)}
              style={{ height: 36, padding: '0 14px', border: 'none', background: filterStatut === t.key ? '#2563eb' : '#fff', color: filterStatut === t.key ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', borderRight: '1px solid #e6ebf1' }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr 150px 100px 130px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1', minWidth: 760 }}>
            {['Élève', 'Parent / Tuteur', 'Motif', 'Date convocation', 'Statut', 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune convocation trouvée</div>
          ) : (
            filtered.map((c, idx) => {
              const statut = String(c.statut ?? 'EN_ATTENTE');
              const st = STATUT_CFG[statut] ?? STATUT_CFG.EN_ATTENTE;
              const isEffectuee = statut === 'EFFECTUEE';
              return (
                <div
                  key={String(c.id ?? idx)}
                  style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr 150px 100px 130px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', minWidth: 760 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {String(c.eleveNom ?? c.eleveId ?? '—')}
                  </span>
                  <span style={{ fontSize: 12, color: '#475569' }}>
                    {String(c.parentNom ?? c.parentId ?? '—')}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{String(c.motif ?? '—')}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{fd(c.dateConvocation)}</span>
                  <span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 7px' }}>{st.label}</span>
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowDetail(c)}
                      style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Détail
                    </button>
                    {!isEffectuee && (
                      <button
                        onClick={() => { setShowCompteRendu(c); setCrText(String(c.compteRendu ?? '')); }}
                        style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: 'none', border: '1px solid #bbf7d0', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Clôturer
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(String(c.id))}
                      disabled={deleteConv.isPending}
                      style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Nouvelle convocation */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nouvelle convocation</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Élève */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Élève</label>
                {rawEleves.length > 0 ? (
                  <select
                    value={form.eleveId}
                    onChange={(e) => setForm((f) => ({ ...f, eleveId: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                  >
                    <option value="">— Sélectionner un élève —</option>
                    {rawEleves.map((e) => (
                      <option key={String(e.id)} value={String(e.id)}>
                        {String(e.prenom ?? '')} {String(e.nom ?? '')} {e.classe ? `— ${String(e.classe)}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="ID ou nom de l'élève"
                    value={form.eleveId}
                    onChange={(e) => setForm((f) => ({ ...f, eleveId: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Parent */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Parent / Tuteur</label>
                {rawParents.length > 0 ? (
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}
                  >
                    <option value="">— Sélectionner un parent —</option>
                    {rawParents.map((p) => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {String(p.prenom ?? '')} {String(p.nom ?? '')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    placeholder="ID ou nom du parent"
                    value={form.parentId}
                    onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Motif */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Motif *</label>
                <textarea
                  value={form.motif}
                  onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {/* Date */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Date et heure *</label>
                <input
                  type="datetime-local"
                  value={form.dateConvocation}
                  onChange={(e) => setForm((f) => ({ ...f, dateConvocation: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button
                onClick={() => { setShowCreate(false); setForm({ eleveId: '', parentId: '', motif: '', dateConvocation: '' }); }}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={createConvocation.isPending || !form.motif || !form.dateConvocation}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (createConvocation.isPending || !form.motif || !form.dateConvocation) ? 0.6 : 1 }}
              >
                {createConvocation.isPending ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Compte-rendu / Clôturer */}
      {showCompteRendu && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Clôturer la convocation</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>Motif : <strong>{String(showCompteRendu.motif ?? '—')}</strong></div>

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Compte-rendu *</label>
            <textarea
              value={crText}
              onChange={(e) => setCrText(e.target.value)}
              rows={5}
              placeholder="Résumé de l'entretien, décisions prises, engagements…"
              style={{ width: '100%', border: '1px solid #d9e0e8', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                onClick={() => { setShowCompteRendu(null); setCrText(''); }}
                style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleCompteRendu}
                disabled={compteRenduMut.isPending || !crText.trim()}
                style={{ height: 38, padding: '0 20px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: (compteRenduMut.isPending || !crText.trim()) ? 0.6 : 1 }}
              >
                {compteRenduMut.isPending ? 'Enregistrement…' : 'Clôturer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Détail */}
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 440, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>Détail convocation</div>
            {[
              { label: 'Élève',           value: String(showDetail.eleveNom ?? showDetail.eleveId ?? '—') },
              { label: 'Parent / Tuteur', value: String(showDetail.parentNom ?? showDetail.parentId ?? '—') },
              { label: 'Motif',           value: String(showDetail.motif ?? '—') },
              { label: 'Date',            value: fd(showDetail.dateConvocation) },
              { label: 'Créé par',        value: String(showDetail.creePar ?? '—') },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', width: 120, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{value}</span>
              </div>
            ))}
            {Boolean(showDetail.compteRendu) && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>Compte-rendu</div>
                <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5 }}>{String(showDetail.compteRendu)}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setShowDetail(null)}
                style={{ height: 38, padding: '0 20px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
