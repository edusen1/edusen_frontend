'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminAbsencesEleves, useAdminClasses } from '@/hooks/use-query-api';

const STATIC_ABSENCES = [
  { id: 'ae1', eleve: { id: 'e1', firstName: 'Moussa', lastName: 'Diallo' }, classe: { id: 'c1', nom: '3ème B' }, date: '2026-06-24', duree: 1, typeAbsence: 'ABSENT', motif: null, justifiee: false, statut: 'NON_JUSTIFIEE' },
  { id: 'ae2', eleve: { id: 'e2', firstName: 'Fatou', lastName: 'Sall' }, classe: { id: 'c2', nom: '6ème A' }, date: '2026-06-24', duree: 1, typeAbsence: 'ABSENT', motif: 'Cérémonie familiale', justifiee: false, statut: 'EN_ATTENTE' },
  { id: 'ae3', eleve: { id: 'e3', firstName: 'Aminata', lastName: 'Diop' }, classe: { id: 'c3', nom: '4ème B' }, date: '2026-06-23', duree: 1, typeAbsence: 'ABSENT', motif: 'Consultation médicale', justifiee: true, statut: 'JUSTIFIEE' },
  { id: 'ae4', eleve: { id: 'e4', firstName: 'Ibrahima', lastName: 'Ndiaye' }, classe: { id: 'c1', nom: '3ème B' }, date: '2026-06-23', duree: 2, typeAbsence: 'RETARD', motif: null, justifiee: false, statut: 'NON_JUSTIFIEE' },
  { id: 'ae5', eleve: { id: 'e5', firstName: 'Aissatou', lastName: 'Ba' }, classe: { id: 'c4', nom: '5ème C' }, date: '2026-06-22', duree: 1, typeAbsence: 'ABSENT', motif: 'Maladie (certificat)', justifiee: true, statut: 'JUSTIFIEE' },
  { id: 'ae6', eleve: { id: 'e6', firstName: 'Oumar', lastName: 'Fall' }, classe: { id: 'c1', nom: '3ème B' }, date: '2026-06-21', duree: 1, typeAbsence: 'ABSENT', motif: 'Blessure sportive', justifiee: false, statut: 'EN_ATTENTE' },
];

const STATIC_CLASSES = [
  { id: 'c1', nom: '3ème B' },
  { id: 'c2', nom: '6ème A' },
  { id: 'c3', nom: '4ème B' },
  { id: 'c4', nom: '5ème C' },
];

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  JUSTIFIEE: { label: 'Justifiée', bg: '#dcfce7', color: '#16a34a' },
  NON_JUSTIFIEE: { label: 'Non justifiée', bg: '#fee2e2', color: '#dc2626' },
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#d97706' },
};

type Section = 'absences' | 'appels';

const EMPTY_FORM = { classeId: '', eleveNom: '', date: '', duree: '1', type: 'ABSENT', motif: '', justifiee: false };

function inp(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
}
function lbl(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}

export default function AbsencesElevesPage() {
  const { data } = useAdminAbsencesEleves();
  const rawList = Array.isArray(data) ? data : (data?.absences ?? data?.data ?? []);
  const absences = rawList.length > 0 ? rawList : STATIC_ABSENCES;

  const { data: classesData } = useAdminClasses();
  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.classes ?? classesData?.data ?? []);
  const classes = rawClasses.length > 0 ? rawClasses : STATIC_CLASSES;

  const [section, setSection] = useState<Section>('absences');
  const [filterClasseId, setFilterClasseId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = (absences as Record<string, unknown>[]).filter((a) => {
    const classeId = typeof a.classe === 'object' && a.classe !== null ? (a.classe as Record<string, unknown>).id : '';
    const typeAbsence = (a.typeAbsence ?? a.type ?? '') as string;
    const statut = (a.statut ?? '') as string;
    const date = (a.date ?? '') as string;
    if (filterClasseId && classeId !== filterClasseId) return false;
    if (filterType && typeAbsence !== filterType) return false;
    if (filterStatut && statut !== filterStatut) return false;
    if (filterDateFrom && date < filterDateFrom) return false;
    if (filterDateTo && date > filterDateTo) return false;
    return true;
  });

  const nbEnAttente = filtered.filter((a) => a.statut === 'EN_ATTENTE').length;
  const nbJustifiees = filtered.filter((a) => a.statut === 'JUSTIFIEE').length;
  const nbInjustifiees = filtered.filter((a) => a.statut === 'NON_JUSTIFIEE').length;

  const handleSaveAbsence = async () => {
    if (!form.eleveNom || !form.date) { toast.error('Élève et date requis'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    toast.success('Absence enregistrée');
  };

  const handleApprouver = async (id: string) => {
    await new Promise((r) => setTimeout(r, 300));
    toast.success('Absence approuvée');
  };

  const handleRejeter = async (id: string) => {
    await new Promise((r) => setTimeout(r, 300));
    toast.success('Absence rejetée');
  };

  const resetFilters = () => {
    setFilterClasseId(''); setFilterType(''); setFilterStatut('');
    setFilterDateFrom(''); setFilterDateTo('');
  };

  const eleveLabel = (eleve: unknown) => {
    if (typeof eleve === 'object' && eleve !== null) {
      const e = eleve as Record<string, unknown>;
      return `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || '—';
    }
    return String(eleve ?? '—');
  };

  const classeLabel = (classe: unknown) => {
    if (typeof classe === 'object' && classe !== null) return String((classe as Record<string, unknown>).nom ?? '—');
    return String(classe ?? '—');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Absences élèves</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} entrée(s)</div>
          <button onClick={() => { setShowForm(true); setSection('absences'); }} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            + Déclarer une absence
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 28px', gap: 0, borderTop: '1px solid #e6ebf1' }}>
          {([['absences', 'Absences'], ['appels', 'Appels']] as [Section, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSection(key)} style={{ height: 40, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: section === key ? 700 : 400, color: section === key ? '#2563eb' : '#64748b', borderBottom: section === key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {section === 'absences' && (
        <>
          {/* Stats */}
          <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
            {[
              { label: 'Total', count: filtered.length, bg: '#eff6ff', color: '#2563eb' },
              { label: 'En attente', count: nbEnAttente, bg: '#fef3c7', color: '#d97706' },
              { label: 'Justifiées', count: nbJustifiees, bg: '#dcfce7', color: '#16a34a' },
              { label: 'Non justifiées', count: nbInjustifiees, bg: '#fee2e2', color: '#dc2626' },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.count}</span>
                </span>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={filterClasseId} onChange={(e) => setFilterClasseId(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">Toutes les classes</option>
              {(classes as Record<string, unknown>[]).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.nom ?? '')}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">Tous les types</option>
              <option value="ABSENT">Absence</option>
              <option value="RETARD">Retard</option>
            </select>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="JUSTIFIEE">Justifiée</option>
              <option value="NON_JUSTIFIEE">Non justifiée</option>
            </select>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit' }} />
            {(filterClasseId || filterType || filterStatut || filterDateFrom || filterDateTo) && (
              <button onClick={resetFilters} style={{ height: 38, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#475569', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
                Réinitialiser
              </button>
            )}
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 80px 80px 120px 120px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Élève', 'Classe', 'Date', 'Durée', 'Type', 'Motif', 'Statut / Action'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {filtered.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence</div>
              )}
              {filtered.map((a, idx) => {
                const statut = (a.statut ?? 'EN_ATTENTE') as string;
                const st = STATUT_MAP[statut] ?? STATUT_MAP.EN_ATTENTE;
                const typeAbsence = (a.typeAbsence ?? a.type ?? '') as string;
                return (
                  <div key={String(a.id ?? idx)} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 80px 80px 120px 120px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{eleveLabel(a.eleve)}</div>
                    <span style={{ fontSize: 12, color: '#475569' }}>{classeLabel(a.classe)}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{a.date ? new Date(a.date as string).toLocaleDateString('fr-FR') : '—'}</span>
                    <span style={{ fontSize: 12, color: '#475569' }}>{a.duree ? `${a.duree}j` : '—'}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: typeAbsence === 'RETARD' ? '#7c3aed' : '#0369a1', background: typeAbsence === 'RETARD' ? '#f5f3ff' : '#e0f2fe', padding: '2px 7px', display: 'inline-block' }}>
                      {typeAbsence === 'RETARD' ? 'Retard' : 'Absent'}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(a.motif as string) ?? '—'}</span>
                    {statut === 'EN_ATTENTE' ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleApprouver(String(a.id))} style={{ height: 26, padding: '0 8px', border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Justifier</button>
                        <button onClick={() => handleRejeter(String(a.id))} style={{ height: 26, padding: '0 8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {section === 'appels' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: '#475569' }}>Registre des appels effectués</span>
            <button onClick={() => setShowForm(true)} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              + Nouvel appel
            </button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 100px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
              {['Classe', 'Date du cours', 'Heure début', 'Nb absences', 'Statut'].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
              ))}
            </div>
            {[
              { id: 'ap1', classe: '3ème B', date: '24/06/2026', heure: '08:00', nbAbsences: 2, statut: 'SOUMIS' },
              { id: 'ap2', classe: '6ème A', date: '23/06/2026', heure: '10:00', nbAbsences: 1, statut: 'SOUMIS' },
              { id: 'ap3', classe: '4ème B', date: '23/06/2026', heure: '14:00', nbAbsences: 0, statut: 'BROUILLON' },
            ].map((appel, idx, arr) => (
              <div key={appel.id} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 100px', padding: '12px 18px', borderBottom: idx < arr.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{appel.classe}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{appel.date}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{appel.heure}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: appel.nbAbsences > 0 ? '#dc2626' : '#16a34a' }}>{appel.nbAbsences}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: appel.statut === 'SOUMIS' ? '#16a34a' : '#d97706', background: appel.statut === 'SOUMIS' ? '#dcfce7' : '#fef3c7', padding: '3px 8px', display: 'inline-block' }}>
                  {appel.statut === 'SOUMIS' ? 'Soumis' : 'Brouillon'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal déclarer absence */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 500, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              {section === 'appels' ? 'Nouvel appel' : 'Déclarer une absence'}
            </div>
            {section === 'absences' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl()}>Classe</label>
                  <select value={form.classeId} onChange={(e) => setForm((f) => ({ ...f, classeId: e.target.value }))} style={{ ...inp() }}>
                    <option value="">Sélectionner une classe…</option>
                    {(classes as Record<string, unknown>[]).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.nom ?? '')}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl()}>Nom de l&apos;élève *</label>
                  <input value={form.eleveNom} onChange={(e) => setForm((f) => ({ ...f, eleveNom: e.target.value }))} style={inp()} placeholder="Nom prénom…" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={lbl()}>Date *</label>
                    <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inp()} />
                  </div>
                  <div>
                    <label style={lbl()}>Durée (jours)</label>
                    <input type="number" value={form.duree} onChange={(e) => setForm((f) => ({ ...f, duree: e.target.value }))} style={inp()} min={1} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl()}>Type</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={{ ...inp() }}>
                    <option value="ABSENT">Absence</option>
                    <option value="RETARD">Retard</option>
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl()}>Motif</label>
                  <input value={form.motif} onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))} style={inp()} placeholder="Motif (optionnel)" />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 20, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.justifiee} onChange={(e) => setForm((f) => ({ ...f, justifiee: e.target.checked }))} />
                  Absence justifiée
                </label>
              </>
            )}
            {section === 'appels' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl()}>Classe *</label>
                  <select value={form.classeId} onChange={(e) => setForm((f) => ({ ...f, classeId: e.target.value }))} style={{ ...inp() }}>
                    <option value="">Sélectionner une classe…</option>
                    {(classes as Record<string, unknown>[]).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.nom ?? '')}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={lbl()}>Date du cours *</label>
                    <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inp()} />
                  </div>
                  <div>
                    <label style={lbl()}>Heure début</label>
                    <input type="time" value={form.duree} onChange={(e) => setForm((f) => ({ ...f, duree: e.target.value }))} style={inp()} />
                  </div>
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleSaveAbsence} disabled={saving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
