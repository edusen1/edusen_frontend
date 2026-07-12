'use client';

import { useCallback, useEffect, useState } from 'react';
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
  EN_ATTENTE: 'En attente', APPROUVEE: 'Approuvée', REJETEE: 'Rejetée',
};

const ACTION_COLORS: Record<string, string> = {
  CREATION: '#16a34a', MODIFICATION: '#2563eb', SUPPRESSION: '#dc2626',
  PUBLICATION: '#7c3aed', VALIDATION: '#16a34a', REJET: '#d97706',
  ACTIVATION: '#0891b2', APPROBATION: '#16a34a', DECONNEXION: '#94a3b8',
  GENERATION: '#0369a1', DUPLICATION: '#6366f1',
};

function fmtDate(v: string) {
  try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return v; }
}

function fmtDateTime(v: string) {
  try { return new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }) + ' UTC'; } catch { return v; }
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{label}</span>;
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

  // Filters for logs
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [logsSize] = useState(50);

  const fetchDemandes = useCallback(async () => {
    setLoadingDemandes(true);
    try {
      const res = await apiClient.get('/admin/demandes-audit');
      setDemandes(Array.isArray(res.data) ? res.data : []);
    } catch { /* ignore */ }
    setLoadingDemandes(false);
  }, []);

  useEffect(() => { void fetchDemandes(); }, [fetchDemandes]);

  async function handleSubmitDemande() {
    if (!newForm.motif.trim()) { toast.error('Motif requis'); return; }
    if (!newForm.dateDebut || !newForm.dateFin) { toast.error('Période requise'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/admin/demandes-audit', {
        ...newForm,
        filtreActions: newForm.filtreActions.length > 0 ? newForm.filtreActions : undefined,
        filtreRoles: newForm.filtreRoles.length > 0 ? newForm.filtreRoles : undefined,
        filtreResources: newForm.filtreResources.length > 0 ? newForm.filtreResources : undefined,
      });
      toast.success('Demande envoyée');
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
    await fetchLogs(d.id, 0, '', '');
  }

  async function fetchLogs(demandeId: string, page: number, action: string, resource: string) {
    setLoadingLogs(true);
    try {
      const params: Record<string, string> = { demandeId, page: String(page), size: String(logsSize) };
      if (action) params.action = action;
      if (resource) params.resourceType = resource;
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
    void fetchLogs(viewingDemande.id, p, filterAction, filterResource);
  }

  function handleFilterChange(action: string, resource: string) {
    if (!viewingDemande) return;
    setFilterAction(action);
    setFilterResource(resource);
    setLogsPage(0);
    void fetchLogs(viewingDemande.id, 0, action, resource);
  }

  const approuvees = demandes.filter((d) => isAccessible(d));
  const enAttente = demandes.filter((d) => d.statut === 'EN_ATTENTE');

  // ─── If viewing logs ───────────────────────────────────────────────────

  if (viewingDemande) {
    const totalPages = Math.ceil(logsTotal / logsSize);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
          <button onClick={() => setViewingDemande(null)} style={{ height: 32, padding: '0 12px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            ← Retour
          </button>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Logs d&apos;audit</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {fmtDate(viewingDemande.dateDebut)} — {fmtDate(viewingDemande.dateFin)} · {logsTotal} entrée(s)
          </div>
          <button onClick={() => window.print()} style={{ marginLeft: 'auto', height: 32, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimer
          </button>
        </div>

        {/* Filters */}
        <div style={{ flexShrink: 0, padding: '12px 24px', display: 'flex', gap: 10, background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <input value={filterAction} onChange={(e) => handleFilterChange(e.target.value, filterResource)} placeholder="Filtrer par action..." style={{ border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 12, width: 180, fontFamily: 'inherit' }} />
          <input value={filterResource} onChange={(e) => handleFilterChange(filterAction, e.target.value)} placeholder="Filtrer par ressource..." style={{ border: '1px solid #e2e8f0', padding: '6px 10px', fontSize: 12, width: 180, fontFamily: 'inherit' }} />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
          {loadingLogs ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucun log pour cette période</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                  {['Date', 'Action', 'Ressource', 'Utilisateur', 'Appareil', 'IP / Lieu'].map((h) => (
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
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{l.userNomComplet || l.utilisateur?.firstName + ' ' + l.utilisateur?.lastName || '—'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{l.role ?? ''}{l.userMatricule ? ` · ${l.userMatricule}` : ''}</div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 10, color: '#64748b' }}>
                      {[l.deviceType, l.browserName, l.osName].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                      {l.ipAddress ?? '—'}
                      {l.geoCity || l.geoCountry ? <div style={{ fontFamily: 'inherit', fontSize: 10, color: '#64748b' }}>{[l.geoCity, l.geoCountry].filter(Boolean).join(', ')}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
                <button key={i} onClick={() => handleLogsPageChange(i)} style={{ width: 30, height: 30, border: '1px solid #e2e8f0', background: logsPage === i ? '#2563eb' : '#fff', color: logsPage === i ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Log detail modal */}
        {logDetail && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Détail du log</span>
                <button onClick={() => setLogDetail(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Badge label={logDetail.action} color={ACTION_COLORS[logDetail.action] ?? '#475569'} />
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><b>Utilisateur :</b> {logDetail.userNomComplet || '—'}</div>
                  <div><b>Matricule :</b> {logDetail.userMatricule || '—'}</div>
                  <div><b>Email :</b> {logDetail.userEmail || '—'}</div>
                  <div><b>Téléphone :</b> {logDetail.userTelephone || '—'}</div>
                  <div><b>Username :</b> {logDetail.userUsername || '—'}</div>
                  <div><b>Rôle :</b> {logDetail.role || '—'}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div><b>Ressource :</b> {logDetail.resourceType || '—'}{logDetail.resourceId ? ` (${logDetail.resourceId.slice(0, 8)}…)` : ''}</div>
                  <div><b>Date :</b> {fmtDateTime(logDetail.createdAt)}</div>
                  <div><b>IP :</b> <code style={{ background: '#f1f5f9', padding: '1px 4px' }}>{logDetail.ipAddress || '—'}</code></div>
                  <div><b>Appareil :</b> {[logDetail.deviceType, logDetail.browserName, logDetail.osName].filter(Boolean).join(' · ') || '—'}</div>
                  {(logDetail.geoCity || logDetail.geoCountry) && <div><b>Localisation :</b> {[logDetail.geoCity, logDetail.geoCountry].filter(Boolean).join(', ')}</div>}
                </div>
                {logDetail.details && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Détails</div>
                    <pre style={{ background: '#f1f5f9', padding: '10px 12px', fontSize: 11, color: '#475569', overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(logDetail.details, null, 2)}</pre>
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
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Journal d&apos;audit</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Demandes d&apos;accès</div>
        <button onClick={() => setShowNewModal(true)} style={{ marginLeft: 'auto', height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Nouvelle demande
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Info banner */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
          L&apos;accès aux logs d&apos;audit nécessite une demande préalable. Sélectionnez la période souhaitée et décrivez le motif de votre demande. Elle sera examinée par l&apos;administrateur de la plateforme.
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total demandes', value: demandes.length, color: '#0f172a' },
            { label: 'En attente', value: enAttente.length, color: '#d97706' },
            { label: 'Accès actifs', value: approuvees.length, color: '#16a34a' },
            { label: 'Rejetées', value: demandes.filter((d) => d.statut === 'REJETEE').length, color: '#dc2626' },
          ].map((k) => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Demandes list */}
        {loadingDemandes ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
        ) : demandes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', background: '#fff', border: '1px solid #e6ebf1' }}>
            Aucune demande d&apos;audit. Cliquez sur &quot;Nouvelle demande&quot; pour commencer.
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
                      <span style={{ fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '1px 7px' }}>
                        {STATUT_LABELS[d.statut]}{expired ? ' (expirée)' : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{d.motif}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      Demandée le {fmtDate(d.createdAt)}
                      {d.commentaire && <span> · Réponse : {d.commentaire}</span>}
                      {d.expirationAcces && d.statut === 'APPROUVEE' && <span> · Expire le {fmtDate(d.expirationAcces)}</span>}
                    </div>
                  </div>
                  {accessible && (
                    <button onClick={() => void openLogs(d)} style={{ height: 32, padding: '0 14px', border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Consulter les logs
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
              {/* Période */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4, display: 'block' }}>Période</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={newForm.dateDebut} onChange={(e) => setNewForm((f) => ({ ...f, dateDebut: e.target.value }))} style={{ flex: 1, border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                  <input type="date" value={newForm.dateFin} onChange={(e) => setNewForm((f) => ({ ...f, dateFin: e.target.value }))} style={{ flex: 1, border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
                </div>
              </div>

              {/* Rôles */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block' }}>Rôles concernés (laisser vide = tous)</label>
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
                <textarea value={newForm.motif} onChange={(e) => setNewForm((f) => ({ ...f, motif: e.target.value }))} rows={3} placeholder="Décrivez la raison de votre demande d'accès aux logs..." style={{ width: '100%', border: '1px solid #e2e8f0', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              {/* Summary */}
              {(newForm.filtreRoles.length > 0 || newForm.filtreResources.length > 0) && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: 11, color: '#475569' }}>
                  Périmètre : {newForm.filtreRoles.length > 0 ? `${newForm.filtreRoles.length} rôle(s)` : 'tous rôles'}
                  {' · '}{newForm.filtreResources.length > 0 ? `${newForm.filtreResources.length} module(s)` : 'tous modules'}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNewModal(false)} style={{ height: 34, padding: '0 16px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => void handleSubmitDemande()} disabled={submitting} style={{ height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Envoi…' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
