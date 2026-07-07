'use client';

import { useState } from 'react';
import { usePlatformAuditLogs } from '@/hooks/use-query-api';

const STATIC_LOGS = [
  { id: 'l1', action: 'LOGIN', utilisateur: 'admin@demo.sn', role: 'ADMIN', tenant: 'École Dakar-Sud', ip: '192.168.1.10', date: '27/01/2026 08:42', statut: 'success' },
  { id: 'l2', action: 'CREATE_ELEVE', utilisateur: 'admin@demo.sn', role: 'ADMIN', tenant: 'École Dakar-Sud', ip: '192.168.1.10', date: '27/01/2026 09:15', statut: 'success' },
  { id: 'l3', action: 'SAISIR_NOTES', utilisateur: 'prof@demo.sn', role: 'ENSEIGNANT', tenant: 'École Dakar-Sud', ip: '192.168.1.22', date: '27/01/2026 10:30', statut: 'success' },
  { id: 'l4', action: 'DELETE_ELEVE', utilisateur: 'admin@demo.sn', role: 'ADMIN', tenant: 'École Thiès', ip: '10.0.0.5', date: '27/01/2026 11:05', statut: 'success' },
  { id: 'l5', action: 'LOGIN', utilisateur: 'hacker@test.com', role: '—', tenant: '—', ip: '203.0.113.99', date: '27/01/2026 11:20', statut: 'failed' },
  { id: 'l6', action: 'UPDATE_PARAMETRES', utilisateur: 'super@platform.sn', role: 'SUPER_ADMIN', tenant: 'Platform', ip: '10.0.0.1', date: '27/01/2026 14:00', statut: 'success' },
  { id: 'l7', action: 'PUBLISH_BULLETINS', utilisateur: 'admin@demo.sn', role: 'ADMIN', tenant: 'École Dakar-Sud', ip: '192.168.1.10', date: '27/01/2026 15:30', statut: 'success' },
];

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  LOGIN: { bg: '#eff6ff', color: '#2563eb' },
  CREATE_ELEVE: { bg: '#dcfce7', color: '#16a34a' },
  DELETE_ELEVE: { bg: '#fee2e2', color: '#dc2626' },
  SAISIR_NOTES: { bg: '#f5f3ff', color: '#7c3aed' },
  UPDATE_PARAMETRES: { bg: '#fef3c7', color: '#d97706' },
  PUBLISH_BULLETINS: { bg: '#ecfdf5', color: '#059669' },
};

export default function AuditLogsPage() {
  const { data } = usePlatformAuditLogs();
  const rawList = Array.isArray(data) ? data : (data?.logs ?? data?.data ?? []);
  const logs = rawList.length > 0 ? rawList : STATIC_LOGS;

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const filtered = (logs as Record<string, unknown>[]).filter((l) => {
    const user = (l.utilisateur ?? '') as string;
    const action = (l.action ?? '') as string;
    const statut = (l.statut ?? '') as string;
    const matchSearch = user.toLowerCase().includes(search.toLowerCase()) || action.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || statut === filterStatut;
    return matchSearch && matchStatut;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Audit Logs</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{filtered.length} entrées</div>
        <button onClick={() => {}} style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 360 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par action ou utilisateur…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option value="success">Succès</option>
          <option value="failed">Échec</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 110px 160px 130px 120px 80px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
            {['Action', 'Utilisateur', 'Rôle', 'Établissement', 'IP', 'Date', 'Statut'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((l, idx) => {
            const action = (l.action ?? '') as string;
            const ac = ACTION_COLORS[action] ?? { bg: '#f8fafc', color: '#475569' };
            const statut = (l.statut ?? 'success') as string;
            return (
              <div key={String(l.id ?? idx)} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 110px 160px 130px 120px 80px', padding: '11px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ac.color, background: ac.bg, padding: '3px 8px', display: 'inline-block', fontFamily: 'monospace' }}>{action}</span>
                <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>{(l.utilisateur ?? '') as string}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{(l.role ?? '') as string}</span>
                <span style={{ fontSize: 12, color: '#475569' }}>{(l.tenant ?? '') as string}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{(l.ip ?? '') as string}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>{(l.date ?? '') as string}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: statut === 'success' ? '#16a34a' : '#dc2626', background: statut === 'success' ? '#dcfce7' : '#fee2e2', padding: '2px 7px', display: 'inline-block' }}>
                  {statut === 'success' ? 'OK' : 'FAIL'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
