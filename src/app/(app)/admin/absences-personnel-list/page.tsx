'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { resolveStorageUrl } from '@/lib/resolve-url';

type R = Record<string, unknown>;
type Section = 'dashboard' | 'absences' | 'demandes';

type AbsItem = {
  id: string; personnelId: string; personnelNom: string; personnelRole: string | null;
  dateDebut: string; dateFin: string; heureDebut: string | null; heureFin: string | null;
  typeAbsence: string; motif: string; statut: string; documentJustificatifUrl: string | null; createdAt: string;
};

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#fef3c7', color: '#92400e' },
  APPROUVEE: { label: 'Approuvée', bg: '#dcfce7', color: '#166534' },
  REJETEE: { label: 'Rejetée', bg: '#fee2e2', color: '#991b1b' },
};
const TYPE_MAP: Record<string, { label: string; bg: string; color: string }> = {
  MALADIE: { label: 'Maladie', bg: '#fef2f2', color: '#991b1b' },
  CONGE: { label: 'Congé', bg: '#eff6ff', color: '#1d4ed8' },
  SANS_SOLDE: { label: 'Sans solde', bg: '#f5f3ff', color: '#6d28d9' },
  FORMATION: { label: 'Formation', bg: '#ecfeff', color: '#0e7490' },
  AUTRE: { label: 'Autre', bg: '#f1f5f9', color: '#475569' },
};

function inp(): React.CSSProperties { return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }; }
function lbl(): React.CSSProperties { return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }; }

type PersonnelOpt = { personnelId: string; userId: string; nom: string; role: string | null };
const DECL_TYPES = ['MALADIE', 'CONGE', 'SANS_SOLDE', 'AUTRE'];
const EMPTY_DECL = { personnelId: '', dateDebut: '', dateFin: '', heureDebut: '', heureFin: '', typeAbsence: 'MALADIE', motif: '' };

export default function AbsencesPersonnelListPage() {
  const [absences, setAbsences] = useState<AbsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('dashboard');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedAbsence, setSelectedAbsence] = useState<AbsItem | null>(null);
  const [showDecl, setShowDecl] = useState(false);
  const [declForm, setDeclForm] = useState(EMPTY_DECL);
  const [justifFiles, setJustifFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [personnels, setPersonnels] = useState<PersonnelOpt[]>([]);

  const fetchAbsences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/absences-personnel-list');
      const data = (Array.isArray(res.data) ? res.data : []) as R[];
      setAbsences(data.map((a) => {
        // Prefer direct utilisateur (resolved via userId), fallback to personnel.utilisateur
        const user = (a.utilisateur ?? (a.personnel as R)?.utilisateur ?? {}) as R;
        return {
          id: String(a.id ?? ''), personnelId: String(a.personnelId ?? ''),
          personnelNom: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Personnel',
          personnelRole: String(user.role ?? ''),
          dateDebut: String(a.dateDebut ?? ''), dateFin: String(a.dateFin ?? ''),
          heureDebut: a.heureDebut ? String(a.heureDebut) : null, heureFin: a.heureFin ? String(a.heureFin) : null,
          typeAbsence: String(a.typeAbsence ?? 'AUTRE'), motif: String(a.motif ?? ''),
          statut: String(a.statut ?? 'EN_ATTENTE'),
          documentJustificatifUrl: a.justificatifUrl ? String(a.justificatifUrl) : null,
          createdAt: String(a.createdAt ?? ''),
        };
      }));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAbsences(); }, [fetchAbsences]);

  useEffect(() => {
    apiClient.get('/admin/absences-personnel-list/personnels')
      .then((res) => setPersonnels((Array.isArray(res.data) ? res.data : []) as PersonnelOpt[]))
      .catch(() => { /* ignore */ });
  }, []);

  function openDecl() { setDeclForm(EMPTY_DECL); setJustifFiles([]); setShowDecl(true); }

  async function handleDeclare() {
    if (!declForm.personnelId) { toast.error('Sélectionnez un membre du personnel'); return; }
    if (!declForm.dateDebut || !declForm.dateFin) { toast.error('Dates de début et de fin requises'); return; }
    setSaving(true);
    try {
      const urls: string[] = [];
      for (const file of justifFiles) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await apiClient.post('/admin/absences-personnel-list/justificatif', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        const url = (up.data as R)?.justificatifUrl as string;
        if (url) urls.push(url);
      }
      await apiClient.post('/admin/absences-personnel-list', {
        ...declForm,
        justificatifUrl: urls.length > 0 ? urls.join(',') : undefined,
      });
      toast.success('Absence déclarée');
      setShowDecl(false);
      void fetchAbsences();
    } catch { toast.error('Erreur lors de la déclaration'); }
    setSaving(false);
  }

  async function handleApprouver(id: string) {
    try { await apiClient.patch(`/admin/absences-personnel-list/${id}/approuver`); toast.success('Approuvée'); setAbsences((p) => p.map((a) => a.id === id ? { ...a, statut: 'APPROUVEE' } : a)); } catch { toast.error('Erreur'); }
  }
  async function handleRejeter(id: string) {
    try { await apiClient.patch(`/admin/absences-personnel-list/${id}/rejeter`); toast.success('Rejetée'); setAbsences((p) => p.map((a) => a.id === id ? { ...a, statut: 'REJETEE' } : a)); } catch { toast.error('Erreur'); }
  }

  // Stats
  const stats = useMemo(() => {
    const total = absences.length;
    const enAttente = absences.filter((a) => a.statut === 'EN_ATTENTE').length;
    const approuvees = absences.filter((a) => a.statut === 'APPROUVEE').length;
    const rejetees = absences.filter((a) => a.statut === 'REJETEE').length;
    return { total, enAttente, approuvees, rejetees };
  }, [absences]);

  const demandes = useMemo(() => absences.filter((a) => a.statut === 'EN_ATTENTE'), [absences]);

  // Top absents
  const topAbsents = useMemo(() => {
    const map = new Map<string, { nom: string; specialite: string | null; count: number }>();
    for (const a of absences) {
      const existing = map.get(a.personnelId);
      if (existing) existing.count++;
      else map.set(a.personnelId, { nom: a.personnelNom, specialite: a.personnelRole, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [absences]);

  // Evolution par mois
  const evolution = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of absences) {
      const m = a.dateDebut.slice(0, 7);
      map.set(m, (map.get(m) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([periode, nb]) => ({ periode, nb }));
  }, [absences]);

  // Filters
  const filtered = useMemo(() => absences.filter((a) => {
    if (filterType && a.typeAbsence !== filterType) return false;
    if (filterStatut && a.statut !== filterStatut) return false;
    if (filterDateFrom && a.dateDebut < filterDateFrom) return false;
    if (filterDateTo && a.dateDebut > filterDateTo) return false;
    if (search) { const q = search.toLowerCase(); if (!a.personnelNom.toLowerCase().includes(q) && !a.motif.toLowerCase().includes(q)) return false; }
    return true;
  }), [absences, filterType, filterStatut, filterDateFrom, filterDateTo, search]);

  const hasFilters = !!(filterType || filterStatut || filterDateFrom || filterDateTo || search);
  const resetFilters = () => { setFilterType(''); setFilterStatut(''); setFilterDateFrom(''); setFilterDateTo(''); setSearch(''); };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Enseignant', 'Spécialité', 'Date début', 'Date fin', 'Type', 'Statut', 'Motif'];
    const rows = filtered.map((a) => [a.personnelNom, a.personnelRole ?? '', new Date(a.dateDebut).toLocaleDateString('fr-FR'), new Date(a.dateFin).toLocaleDateString('fr-FR'), TYPE_MAP[a.typeAbsence]?.label ?? a.typeAbsence, STATUT_MAP[a.statut]?.label ?? a.statut, (a.motif ?? '').replace(/,/g, ';')]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `absences-personnel-list_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success(`${filtered.length} absences exportées`);
  };

  const f = (v: string) => { try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return '—'; } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Absences personnel</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} entrée(s)</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {section === 'absences' && (
              <button onClick={exportCSV} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                ↓ Exporter CSV
              </button>
            )}
            <button onClick={openDecl} style={{ height: 38, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
              + Déclarer une absence
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 28px', gap: 0, borderTop: '1px solid #e6ebf1' }}>
          {([['dashboard', 'Tableau de bord', null], ['absences', 'Absences', null], ['demandes', 'Demandes à valider', stats.enAttente]] as [Section, string, number | null][]).map(([key, label, badge]) => (
            <button key={key} onClick={() => setSection(key)} style={{ height: 40, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: section === key ? 700 : 400, color: section === key ? '#2563eb' : '#64748b', borderBottom: section === key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              {label}
              {badge != null && badge > 0 && <span style={{ background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8, minWidth: 18, textAlign: 'center' }}>{badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB DASHBOARD ═══ */}
      {section === 'dashboard' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total absences', value: stats.total, color: '#0f172a' },
              { label: 'En attente', value: stats.enAttente, color: '#92400e' },
              { label: 'Approuvées', value: stats.approuvees, color: '#166534' },
              { label: 'Rejetées', value: stats.rejetees, color: '#991b1b' },
              { label: 'Demandes', value: stats.enAttente, color: '#92400e' },
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
                const maxVal = Math.max(...evolution.map((e) => e.nb), 1);
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
                    {evolution.map((e) => (
                      <div key={e.periode} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>{e.nb}</div>
                        <div style={{ width: '100%', height: Math.max(2, (e.nb / maxVal) * 110), background: '#334155', opacity: 0.85, borderRadius: '2px 2px 0 0' }} />
                        <div style={{ fontSize: 9, color: '#94a3b8', whiteSpace: 'nowrap' }}>{e.periode.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Top enseignants absents */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Top 10 personnel les plus absents</div>
              {topAbsents.length === 0 && <div style={{ color: '#94a3b8', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>Aucune donnée</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {topAbsents.map((t, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px', padding: '7px 0', borderBottom: idx < topAbsents.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: idx < 3 ? '#0f172a' : '#94a3b8' }}>{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{t.nom}</div>
                      {t.specialite && <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.specialite}</div>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{t.count} abs.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Par type */}
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Répartition par type</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {Object.entries(TYPE_MAP).map(([key, val]) => {
                const count = absences.filter((a) => a.typeAbsence === key).length;
                if (!count) return null;
                return (
                  <div key={key} style={{ flex: 1, border: '1px solid #e6ebf1', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: val.color }}>{count}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{val.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB ABSENCES ═══ */}
      {section === 'absences' && (
        <>
          {/* Stats row */}
          <div style={{ flexShrink: 0, padding: '16px 28px 0', display: 'flex', gap: 12 }}>
            {[
              { label: 'Total', value: stats.total, color: '#0f172a' },
              { label: 'En attente', value: stats.enAttente, color: '#92400e' },
              { label: 'Approuvées', value: stats.approuvees, color: '#166534' },
              { label: 'Rejetées', value: stats.rejetees, color: '#991b1b' },
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
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher personnel…" style={{ border: 'none', outline: 'none', fontSize: 13, height: 36, background: 'transparent', fontFamily: 'inherit', width: '100%' }} />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Tous les types</option>
              {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={{ height: 36, border: '1px solid #d9e0e8', background: '#fff', padding: '0 10px', fontSize: 12, fontFamily: 'inherit' }} />
            {hasFilters && <button onClick={resetFilters} style={{ height: 36, padding: '0 12px', border: '1px solid #d9e0e8', background: '#fff', color: '#475569', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}>Réinitialiser</button>}
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 28px 28px' }}>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 90px 100px 140px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Personnel', 'Date début', 'Date fin', 'Type', 'Statut', 'Actions'].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {filtered.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune absence</div>}
              {filtered.map((a, idx) => {
                const st = STATUT_MAP[a.statut] ?? STATUT_MAP.EN_ATTENTE;
                const tp = TYPE_MAP[a.typeAbsence] ?? TYPE_MAP.AUTRE;
                return (
                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 90px 100px 140px', padding: '10px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setSelectedAbsence(a)}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.personnelNom}</div>
                      {a.personnelRole && <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.personnelRole}</div>}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{f(a.dateDebut)}</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{f(a.dateFin)}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: tp.color, background: tp.bg, padding: '2px 6px', display: 'inline-block' }}>{tp.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: st.bg, padding: '2px 7px', display: 'inline-block' }}>{st.label}</span>
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      {a.statut === 'EN_ATTENTE' && (
                        <>
                          <button onClick={() => void handleApprouver(a.id)} style={{ height: 26, padding: '0 8px', border: 'none', background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                          <button onClick={() => void handleRejeter(a.id)} style={{ height: 26, padding: '0 8px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
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
            Demandes d&apos;absence déclarées par le personnel — nécessitent votre validation.
          </div>
          {demandes.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#fff', border: '1px solid #e6ebf1', fontSize: 13 }}>Aucune demande en attente</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {demandes.map((d) => {
              const tp = TYPE_MAP[d.typeAbsence] ?? TYPE_MAP.AUTRE;
              return (
                <div key={d.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{d.personnelNom}</span>
                        {d.personnelRole && <span style={{ fontSize: 12, color: '#64748b' }}>{d.personnelRole}</span>}
                        <span style={{ fontSize: 10, fontWeight: 700, color: tp.color, background: tp.bg, padding: '2px 8px' }}>{tp.label}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 6 }}>
                        <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>DATE DÉBUT</span><div style={{ fontSize: 12, color: '#334155' }}>{new Date(d.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
                        <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>DATE FIN</span><div style={{ fontSize: 12, color: '#334155' }}>{new Date(d.dateFin).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
                        <div><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>DATE DEMANDE</span><div style={{ fontSize: 12, color: '#334155' }}>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</div></div>
                      </div>
                      {d.motif && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}><span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>MOTIF : </span>{d.motif}</div>}
                      {d.documentJustificatifUrl && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                          {d.documentJustificatifUrl.split(',').map((url, i) => (
                            <a key={i} href={resolveStorageUrl(url.trim())} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'underline' }}>Justificatif {i + 1}</a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => void handleApprouver(d.id)} style={{ height: 32, padding: '0 14px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Approuver</button>
                      <button onClick={() => void handleRejeter(d.id)} style={{ height: 32, padding: '0 14px', border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Rejeter</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ DRAWER DÉTAIL ═══ */}
      {selectedAbsence && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setSelectedAbsence(null)} />
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 480, background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e6ebf1', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setSelectedAbsence(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{selectedAbsence.personnelNom}</div>
                {selectedAbsence.personnelRole && <div style={{ fontSize: 12, color: '#64748b' }}>{selectedAbsence.personnelRole}</div>}
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', background: (STATUT_MAP[selectedAbsence.statut] ?? STATUT_MAP.EN_ATTENTE).bg, color: (STATUT_MAP[selectedAbsence.statut] ?? STATUT_MAP.EN_ATTENTE).color }}>
                {(STATUT_MAP[selectedAbsence.statut] ?? STATUT_MAP.EN_ATTENTE).label}
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px' }}><div style={{ fontSize: 10, color: '#94a3b8' }}>Date début</div><div style={{ fontSize: 13, fontWeight: 600 }}>{f(selectedAbsence.dateDebut)}</div></div>
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px' }}><div style={{ fontSize: 10, color: '#94a3b8' }}>Date fin</div><div style={{ fontSize: 13, fontWeight: 600 }}>{f(selectedAbsence.dateFin)}</div></div>
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px' }}><div style={{ fontSize: 10, color: '#94a3b8' }}>Type</div><div style={{ fontSize: 13, fontWeight: 600 }}>{TYPE_MAP[selectedAbsence.typeAbsence]?.label ?? selectedAbsence.typeAbsence}</div></div>
                <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px' }}><div style={{ fontSize: 10, color: '#94a3b8' }}>Horaires</div><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedAbsence.heureDebut && selectedAbsence.heureFin ? `${selectedAbsence.heureDebut} – ${selectedAbsence.heureFin}` : 'Journée complète'}</div></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...lbl() }}>Motif</div>
                <div style={{ fontSize: 13, color: '#334155', background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px', lineHeight: 1.5 }}>{selectedAbsence.motif || '—'}</div>
              </div>
              {selectedAbsence.documentJustificatifUrl && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ ...lbl() }}>Justificatifs</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedAbsence.documentJustificatifUrl.split(',').map((url, i) => {
                      const resolved = resolveStorageUrl(url.trim());
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      return (
                        <a key={i} href={resolved} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', border: '1px solid #e6ebf1', background: '#f8fafc', textDecoration: 'none', fontSize: 10, color: '#2563eb', fontWeight: 600 }}>
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resolved} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          )}
                          Fichier {i + 1}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedAbsence.statut === 'EN_ATTENTE' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { void handleApprouver(selectedAbsence.id); setSelectedAbsence(null); }} style={{ flex: 1, height: 38, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Approuver</button>
                  <button onClick={() => { void handleRejeter(selectedAbsence.id); setSelectedAbsence(null); }} style={{ flex: 1, height: 38, border: '1px solid #fee2e2', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rejeter</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DÉCLARER UNE ABSENCE ═══ */}
      {showDecl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Déclarer une absence personnel</div>
              <button onClick={() => setShowDecl(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl()}>Membre du personnel *</label>
                <select value={declForm.personnelId} onChange={(e) => setDeclForm((f) => ({ ...f, personnelId: e.target.value }))} style={{ ...inp(), padding: '0 10px' }}>
                  <option value="">— Sélectionner —</option>
                  {personnels.map((p) => (
                    <option key={p.personnelId} value={p.personnelId}>{p.nom}{p.role ? ` (${p.role})` : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}><label style={lbl()}>Date début *</label><input type="date" value={declForm.dateDebut} onChange={(e) => setDeclForm((f) => ({ ...f, dateDebut: e.target.value }))} style={inp()} /></div>
                <div style={{ flex: 1 }}><label style={lbl()}>Date fin *</label><input type="date" value={declForm.dateFin} onChange={(e) => setDeclForm((f) => ({ ...f, dateFin: e.target.value }))} style={inp()} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}><label style={lbl()}>Heure début</label><input type="time" value={declForm.heureDebut} onChange={(e) => setDeclForm((f) => ({ ...f, heureDebut: e.target.value }))} style={inp()} /></div>
                <div style={{ flex: 1 }}><label style={lbl()}>Heure fin</label><input type="time" value={declForm.heureFin} onChange={(e) => setDeclForm((f) => ({ ...f, heureFin: e.target.value }))} style={inp()} /></div>
              </div>
              <div>
                <label style={lbl()}>Type</label>
                <select value={declForm.typeAbsence} onChange={(e) => setDeclForm((f) => ({ ...f, typeAbsence: e.target.value }))} style={{ ...inp(), padding: '0 10px' }}>
                  {DECL_TYPES.map((t) => <option key={t} value={t}>{TYPE_MAP[t]?.label ?? t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl()}>Motif</label>
                <textarea value={declForm.motif} onChange={(e) => setDeclForm((f) => ({ ...f, motif: e.target.value }))} rows={2} style={{ ...inp(), height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
              </div>
              <div>
                <label style={lbl()}>Justificatifs (1 ou plusieurs)</label>
                <input id="perso-justif-input" type="file" accept="image/*,.pdf,.doc,.docx" multiple style={{ display: 'none' }}
                  onChange={(e) => setJustifFiles((prev) => [...prev, ...(e.target.files ? [...e.target.files] : [])])} />
                <label htmlFor="perso-justif-input" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', border: '1px dashed #94a3b8', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  📎 Joindre un justificatif (certificat, ordonnance…)
                </label>
                {justifFiles.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {justifFiles.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 11, color: '#334155', background: '#f1f5f9', padding: '5px 10px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button onClick={() => setJustifFiles((prev) => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDecl(false)} style={{ height: 38, padding: '0 18px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => void handleDeclare()} disabled={saving} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : 'Déclarer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
