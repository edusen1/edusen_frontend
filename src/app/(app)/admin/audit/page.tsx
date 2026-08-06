'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemandeAudit {
  id: string;
  motif: string;
  dateDebut: string;
  dateFin: string;
  statut: 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE';
  commentaire: string | null;
  expirationAcces: string | null;
  createdAt: string;
  demandeur?: { id: string; firstName: string; lastName: string; role: string };
}

interface AuditLog {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  role: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  userMatricule: string | null;
  userNomComplet: string | null;
  userEmail: string | null;
  userTelephone: string | null;
  userUsername: string | null;
  deviceType: string | null;
  browserName: string | null;
  osName: string | null;
  geoCity: string | null;
  geoCountry: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  utilisateur?: { id: string; firstName: string; lastName: string; email: string; role: string } | null;
}

const STATUT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  EN_ATTENTE: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  APPROUVEE: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
  REJETEE: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente', APPROUVEE: 'Approuvee', REJETEE: 'Rejetee',
};

const ACTION_COLORS: Record<string, string> = {
  CREATION: '#16a34a', MODIFICATION: '#2563eb', SUPPRESSION: '#dc2626',
  PUBLICATION: '#7c3aed', VALIDATION: '#16a34a', REJET: '#d97706',
  ACTIVATION: '#0891b2', APPROBATION: '#16a34a', DECONNEXION: '#94a3b8',
  GENERATION: '#0369a1', DUPLICATION: '#6366f1', CONNEXION: '#0891b2',
};

const PAGE_SIZE = 50;

function fmtDate(v: string) {
  try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return v; }
}

function fmtDateTime(v: string) {
  try {
    return new Date(v).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC',
    }) + ' UTC';
  } catch { return v; }
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}40`,
      padding: '2px 7px', fontSize: 11, fontWeight: 600, display: 'inline-block',
    }}>
      {label}
    </span>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function exportCsv(logs: AuditLog[], dateRange: string) {
  const headers = ['Date', 'Action', 'Ressource', 'ID Ressource', 'Utilisateur', 'Matricule', 'Email', 'Role', 'IP', 'Appareil', 'Navigateur', 'OS', 'Ville', 'Pays'];
  const rows = logs.map((l) => [
    fmtDateTime(l.createdAt),
    l.action,
    l.resourceType ?? '',
    l.resourceId ?? '',
    l.userNomComplet ?? '',
    l.userMatricule ?? '',
    l.userEmail ?? '',
    l.role ?? '',
    l.ipAddress ?? '',
    l.deviceType ?? '',
    l.browserName ?? '',
    l.osName ?? '',
    l.geoCity ?? '',
    l.geoCountry ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${dateRange}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [demandes, setDemandes] = useState<DemandeAudit[]>([]);
  const [loadingDemandes, setLoadingDemandes] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<{
    motif: string; dateDebut: string; dateFin: string;
    filtreActions: string[]; filtreRoles: string[]; filtreResources: string[];
  }>({ motif: '', dateDebut: '', dateFin: '', filtreActions: [], filtreRoles: [], filtreResources: [] });
  const [submitting, setSubmitting] = useState(false);

  // Consultation logs
  const [viewingDemande, setViewingDemande] = useState<DemandeAudit | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logDetail, setLogDetail] = useState<AuditLog | null>(null);

  // Filters for logs (with debounce)
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const debouncedAction = useDebounce(filterAction, 400);
  const debouncedResource = useDebounce(filterResource, 400);
  const debouncedRole = useDebounce(filterRole, 400);
  const prevFiltersRef = useRef({ action: '', resource: '', role: '' });

  const fetchDemandes = useCallback(async () => {
    setLoadingDemandes(true);
    try {
      const res = await apiClient.get('/admin/demandes-audit');
      setDemandes(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
    setLoadingDemandes(false);
  }, []);

  useEffect(() => { void fetchDemandes(); }, [fetchDemandes]);

  // Debounced filter effect
  useEffect(() => {
    if (!viewingDemande) return;
    const prev = prevFiltersRef.current;
    if (prev.action === debouncedAction && prev.resource === debouncedResource && prev.role === debouncedRole) return;
    prevFiltersRef.current = { action: debouncedAction, resource: debouncedResource, role: debouncedRole };
    setLogsPage(0);
    void fetchLogs(viewingDemande.id, 0, debouncedAction, debouncedResource, debouncedRole);
  }, [debouncedAction, debouncedResource, debouncedRole, viewingDemande]);

  async function handleSubmitDemande() {
    if (!newForm.motif.trim()) { toast.error('Motif requis'); return; }
    if (!newForm.dateDebut || !newForm.dateFin) { toast.error('Periode requise'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/admin/demandes-audit', {
        ...newForm,
        filtreActions: newForm.filtreActions.length > 0 ? newForm.filtreActions : undefined,
        filtreRoles: newForm.filtreRoles.length > 0 ? newForm.filtreRoles : undefined,
        filtreResources: newForm.filtreResources.length > 0 ? newForm.filtreResources : undefined,
      });
      toast.success('Demande envoyee');
      setShowNewModal(false);
      setNewForm({ motif: '', dateDebut: '', dateFin: '', filtreActions: [], filtreRoles: [], filtreResources: [] });
      void fetchDemandes();
    } catch { toast.error('Erreur lors de l\'envoi'); }
    setSubmitting(false);
  }

  function isAccessible(d: DemandeAudit) {
    if (d.statut !== 'APPROUVEE') return false;
    if (d.expirationAcces && new Date(d.expirationAcces) < new Date()) return false;
    return true;
  }

  async function openLogs(d: DemandeAudit) {
    setViewingDemande(d);
    setLogsPage(0);
    setFilterAction('');
    setFilterResource('');
    setFilterRole('');
    prevFiltersRef.current = { action: '', resource: '', role: '' };
    await fetchLogs(d.id, 0, '', '', '');
  }

  async function fetchLogs(demandeId: string, page: number, action: string, resource: string, role: string) {
    setLoadingLogs(true);
    try {
      const params: Record<string, string> = { demandeId, page: String(page), size: String(PAGE_SIZE) };
      if (action) params.action = action;
      if (resource) params.resourceType = resource;
      if (role) params.role = role;
      const res = await apiClient.get('/admin/audit-logs', { params });
      const d = res.data as { data: AuditLog[]; total: number };
      setLogs(d.data ?? []);
      setLogsTotal(d.total ?? 0);
    } catch {
      toast.error('Erreur lors du chargement des logs');
      setLogs([]);
    }
    setLoadingLogs(false);
  }

  function handleLogsPageChange(p: number) {
    if (!viewingDemande) return;
    setLogsPage(p);
    void fetchLogs(viewingDemande.id, p, debouncedAction, debouncedResource, debouncedRole);
  }

  const approuvees = demandes.filter((d) => isAccessible(d));
  const enAttente = demandes.filter((d) => d.statut === 'EN_ATTENTE');

  // Unique actions/resources from current logs for quick filter hints
  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();
  const uniqueResources = [...new Set(logs.map((l) => l.resourceType).filter(Boolean))].sort() as string[];
  const uniqueRoles = [...new Set(logs.map((l) => l.role).filter(Boolean))].sort() as string[];

  // ─── Logs view ────────────────────────────────────────────────────────

  if (viewingDemande) {
    const totalPages = Math.ceil(logsTotal / PAGE_SIZE);
    const start = logsTotal === 0 ? 0 : logsPage * PAGE_SIZE + 1;
    const end = Math.min(logsTotal, (logsPage + 1) * PAGE_SIZE);
    const dateRange = `${viewingDemande.dateDebut}_${viewingDemande.dateFin}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
          <button onClick={() => setViewingDemande(null)} style={{ height: 32, padding: '0 12px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour
          </button>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Logs d&apos;audit</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {fmtDate(viewingDemande.dateDebut)} — {fmtDate(viewingDemande.dateFin)}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{logsTotal} entree(s)</span>
            <button
              onClick={() => exportCsv(logs, dateRange)}
              disabled={logs.length === 0}
              style={{ height: 32, padding: '0 14px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: logs.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: logs.length === 0 ? 0.5 : 1 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV
            </button>
            <button onClick={() => window.print()} style={{ height: 32, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ flexShrink: 0, padding: '12px 24px', display: 'flex', gap: 10, background: '#fff', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              placeholder="Action..."
              list="actions-list"
              style={{ border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 12, width: 160, fontFamily: 'inherit' }}
            />
            <datalist id="actions-list">
              {uniqueActions.map((a) => <option key={a} value={a} />)}
            </datalist>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              placeholder="Ressource..."
              list="resources-list"
              style={{ border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 12, width: 160, fontFamily: 'inherit' }}
            />
            <datalist id="resources-list">
              {uniqueResources.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              placeholder="Role..."
              list="roles-list"
              style={{ border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 12, width: 140, fontFamily: 'inherit' }}
            />
            <datalist id="roles-list">
              {uniqueRoles.map((r) => <option key={r} value={r} />)}
            </datalist>
          </div>
          {(filterAction || filterResource || filterRole) && (
            <button
              onClick={() => { setFilterAction(''); setFilterResource(''); setFilterRole(''); }}
              style={{ border: 'none', background: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
            >
              Reinitialiser
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
          {loadingLogs ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement des logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: '#fff', border: '1px solid #e6ebf1', marginTop: 12 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Aucun log pour cette periode</div>
              {(filterAction || filterResource || filterRole) && (
                <div style={{ fontSize: 11, color: '#cbd5e1' }}>Essayez de modifier les filtres</div>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                  {['Date', 'Action', 'Ressource', 'Utilisateur', 'Role', 'Appareil', 'IP / Lieu'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} onClick={() => setLogDetail(l)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '8px 12px', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>{fmtDateTime(l.createdAt)}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <Badge label={l.action} color={ACTION_COLORS[l.action] ?? '#475569'} />
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: '#475569' }}>{l.resourceType ?? '—'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                        {l.userNomComplet || (l.utilisateur ? `${l.utilisateur.firstName} ${l.utilisateur.lastName}` : '—')}
                      </div>
                      {l.userMatricule && <div style={{ fontSize: 10, color: '#94a3b8' }}>{l.userMatricule}</div>}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {l.role ? <Badge label={l.role} color="#475569" /> : <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 10, color: '#64748b' }}>
                      {[l.deviceType, l.browserName, l.osName].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {l.ipAddress ?? '—'}
                      {(l.geoCity || l.geoCountry) && (
                        <div style={{ fontFamily: 'inherit', fontSize: 10, color: '#64748b' }}>{[l.geoCity, l.geoCountry].filter(Boolean).join(', ')}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {logsTotal > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{start}-{end} sur {logsTotal}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => handleLogsPageChange(Math.max(0, logsPage - 1))}
                  disabled={logsPage <= 0}
                  style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: logsPage <= 0 ? 'not-allowed' : 'pointer', opacity: logsPage <= 0 ? 0.5 : 1, fontFamily: 'inherit' }}
                >
                  Prec.
                </button>
                <span style={{ fontSize: 12, color: '#64748b' }}>{logsPage + 1}/{Math.max(1, totalPages)}</span>
                <button
                  onClick={() => handleLogsPageChange(Math.min(totalPages - 1, logsPage + 1))}
                  disabled={logsPage >= totalPages - 1}
                  style={{ height: 28, padding: '0 10px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, cursor: logsPage >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: logsPage >= totalPages - 1 ? 0.5 : 1, fontFamily: 'inherit' }}
                >
                  Suiv.
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Log detail modal */}
        {logDetail && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setLogDetail(null); }}>
            <div style={{ background: '#fff', width: 560, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Detail du log</span>
                  <Badge label={logDetail.action} color={ACTION_COLORS[logDetail.action] ?? '#475569'} />
                </div>
                <button onClick={() => setLogDetail(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Utilisateur */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Utilisateur</div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', fontSize: 12, color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                    <div><span style={{ color: '#94a3b8' }}>Nom :</span> {logDetail.userNomComplet || '—'}</div>
                    <div><span style={{ color: '#94a3b8' }}>Matricule :</span> {logDetail.userMatricule || '—'}</div>
                    <div><span style={{ color: '#94a3b8' }}>Email :</span> {logDetail.userEmail || '—'}</div>
                    <div><span style={{ color: '#94a3b8' }}>Tel :</span> {logDetail.userTelephone || '—'}</div>
                    <div><span style={{ color: '#94a3b8' }}>Username :</span> {logDetail.userUsername || '—'}</div>
                    <div><span style={{ color: '#94a3b8' }}>Role :</span> {logDetail.role ? <Badge label={logDetail.role} color="#475569" /> : '—'}</div>
                  </div>
                </div>

                {/* Contexte technique */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Contexte</div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', fontSize: 12, color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                    <div><span style={{ color: '#94a3b8' }}>Ressource :</span> {logDetail.resourceType || '—'}{logDetail.resourceId ? ` (${logDetail.resourceId.slice(0, 8)}...)` : ''}</div>
                    <div><span style={{ color: '#94a3b8' }}>Date :</span> {fmtDateTime(logDetail.createdAt)}</div>
                    <div><span style={{ color: '#94a3b8' }}>IP :</span> <code style={{ background: '#f1f5f9', padding: '1px 4px', fontSize: 11 }}>{logDetail.ipAddress || '—'}</code></div>
                    <div><span style={{ color: '#94a3b8' }}>Appareil :</span> {[logDetail.deviceType, logDetail.browserName, logDetail.osName].filter(Boolean).join(' · ') || '—'}</div>
                    {(logDetail.geoCity || logDetail.geoCountry) && (
                      <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8' }}>Localisation :</span> {[logDetail.geoCity, logDetail.geoCountry].filter(Boolean).join(', ')}</div>
                    )}
                  </div>
                </div>

                {/* Details JSON */}
                {logDetail.details && Object.keys(logDetail.details).length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Donnees</div>
                    <pre style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '10px 12px', fontSize: 11, color: '#475569', overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{JSON.stringify(logDetail.details, null, 2)}</pre>
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid #e6ebf1', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setLogDetail(null)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Main view: demandes ────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Journal d&apos;audit</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Demandes d&apos;acces aux logs</div>
        </div>
        <button onClick={() => setShowNewModal(true)} style={{ marginLeft: 'auto', height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle demande
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Info banner */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#1e40af', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>L&apos;acces aux logs d&apos;audit necessite une demande prealable. Selectionnez la periode souhaitee et decrivez le motif. La demande sera examinee par l&apos;administrateur de la plateforme.</span>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total demandes', value: demandes.length, color: '#0f172a' },
            { label: 'En attente', value: enAttente.length, color: '#d97706' },
            { label: 'Acces actifs', value: approuvees.length, color: '#16a34a' },
            { label: 'Rejetees', value: demandes.filter((d) => d.statut === 'REJETEE').length, color: '#dc2626' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Demandes list */}
        {loadingDemandes ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement...</div>
        ) : demandes.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: '#fff', border: '1px solid #e6ebf1' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Aucune demande d&apos;audit</div>
            <div style={{ fontSize: 11, color: '#cbd5e1' }}>Cliquez sur &quot;Nouvelle demande&quot; pour commencer</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {demandes.map((d) => {
              const sc = STATUT_COLORS[d.statut] ?? STATUT_COLORS.EN_ATTENTE;
              const accessible = isAccessible(d);
              const expired = d.statut === 'APPROUVEE' && d.expirationAcces && new Date(d.expirationAcces) < new Date();
              return (
                <div key={d.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtDate(d.dateDebut)} — {fmtDate(d.dateFin)}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, padding: '1px 7px' }}>
                        {STATUT_LABELS[d.statut]}{expired ? ' (expiree)' : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{d.motif}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      Demandee le {fmtDate(d.createdAt)}
                      {d.commentaire && <span> · Reponse : {d.commentaire}</span>}
                      {d.expirationAcces && d.statut === 'APPROUVEE' && <span> · Expire le {fmtDate(d.expirationAcces)}</span>}
                    </div>
                  </div>
                  {accessible && (
                    <button onClick={() => void openLogs(d)} style={{ height: 32, padding: '0 14px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Consulter
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New demande modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)' }} onClick={() => setShowNewModal(false)} />
          <div style={{ position: 'relative', background: '#fff', width: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,.18)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Nouvelle demande d&apos;audit</div>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Periode */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4, display: 'block' }}>Periode</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={newForm.dateDebut} onChange={(e) => setNewForm((f) => ({ ...f, dateDebut: e.target.value }))} style={{ flex: 1, border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                  <input type="date" value={newForm.dateFin} onChange={(e) => setNewForm((f) => ({ ...f, dateFin: e.target.value }))} style={{ flex: 1, border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* Roles */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block' }}>Roles concernes (laisser vide = tous)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {['ADMIN', 'ENSEIGNANT', 'CAISSIER', 'COMPTABLE', 'SURVEILLANT', 'RH', 'ELEVE', 'PARENT'].map((r) => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 11, color: '#334155', cursor: 'pointer', background: newForm.filtreRoles.includes(r) ? '#eff6ff' : '#f8fafc', border: `1px solid ${newForm.filtreRoles.includes(r) ? '#bfdbfe' : '#e2e8f0'}` }}>
                      <input type="checkbox" checked={newForm.filtreRoles.includes(r)} onChange={() => setNewForm((f) => ({ ...f, filtreRoles: f.filtreRoles.includes(r) ? f.filtreRoles.filter((x) => x !== r) : [...f.filtreRoles, r] }))} style={{ accentColor: '#2563eb', width: 12, height: 12 }} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              {/* Ressources */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block' }}>Modules / Ressources (laisser vide = tous)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {['eleve', 'inscription', 'paiement', 'bulletin', 'note', 'classe', 'absenceEleve', 'emploiDuTemps', 'discipline', 'communication', 'personnel', 'enseignant', 'pointage', 'convocation', 'ecoleConfig'].map((r) => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 11, color: '#334155', cursor: 'pointer', background: newForm.filtreResources.includes(r) ? '#eff6ff' : '#f8fafc', border: `1px solid ${newForm.filtreResources.includes(r) ? '#bfdbfe' : '#e2e8f0'}` }}>
                      <input type="checkbox" checked={newForm.filtreResources.includes(r)} onChange={() => setNewForm((f) => ({ ...f, filtreResources: f.filtreResources.includes(r) ? f.filtreResources.filter((x) => x !== r) : [...f.filtreResources, r] }))} style={{ accentColor: '#2563eb', width: 12, height: 12 }} />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              {/* Motif */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4, display: 'block' }}>Motif de la demande</label>
                <textarea value={newForm.motif} onChange={(e) => setNewForm((f) => ({ ...f, motif: e.target.value }))} rows={3} placeholder="Decrivez la raison de votre demande d'acces aux logs..." style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              {/* Summary */}
              {(newForm.filtreRoles.length > 0 || newForm.filtreResources.length > 0) && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: 11, color: '#475569' }}>
                  Perimetre : {newForm.filtreRoles.length > 0 ? `${newForm.filtreRoles.length} role(s)` : 'tous roles'}
                  {' · '}{newForm.filtreResources.length > 0 ? `${newForm.filtreResources.length} module(s)` : 'tous modules'}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNewModal(false)} style={{ height: 34, padding: '0 16px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => void handleSubmitDemande()} disabled={submitting} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
