'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

type Alerte = { type: string; texte: string; href?: string; categorie?: string };

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  danger: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', icon: '!!' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '!' },
  info: { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', icon: 'i' },
};

const CATEGORIE_LABELS: Record<string, string> = {
  absences: 'Absences & Présences',
  pedagogie: 'Pédagogie',
  finances: 'Finances',
  administration: 'Administration',
  communication: 'Communication',
};

function categorize(texte: string): string {
  if (/absence|retard|présence/i.test(texte)) return 'absences';
  if (/bulletin|enseignant|emploi|note/i.test(texte)) return 'pedagogie';
  if (/paiement|dette|frais|recouvrement/i.test(texte)) return 'finances';
  if (/convocation|réclamation/i.test(texte)) return 'communication';
  return 'administration';
}

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const fetchAlertes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/v1/stats/etablissement');
      const data = res.data as Record<string, unknown>;
      const raw = Array.isArray(data.alertes) ? data.alertes as Alerte[] : [];
      setAlertes(raw.map((a) => ({ ...a, categorie: categorize(a.texte) })));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAlertes(); }, [fetchAlertes]);

  const filtered = alertes.filter((a) => {
    if (filterType && a.type !== filterType) return false;
    if (filterCat && a.categorie !== filterCat) return false;
    return true;
  });

  const countByType = (type: string) => alertes.filter((a) => a.type === type).length;
  const dangers = countByType('danger');
  const warnings = countByType('warning');
  const infos = countByType('info');

  // Group by category
  const grouped = new Map<string, Alerte[]>();
  for (const a of filtered) {
    const cat = a.categorie ?? 'administration';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(a);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Alertes</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{alertes.length} alerte(s) active(s)</div>
        <button onClick={() => void fetchAlertes()} style={{ marginLeft: 'auto', height: 34, padding: '0 14px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          Actualiser
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Critiques', value: dangers, color: '#dc2626', bg: '#fef2f2' },
            { label: 'Avertissements', value: warnings, color: '#d97706', bg: '#fffbeb' },
            { label: 'Informations', value: infos, color: '#0369a1', bg: '#f0f9ff' },
            { label: 'Total', value: alertes.length, color: '#0f172a', bg: '#f8fafc' },
          ].map((k) => (
            <div key={k.label} style={{ background: k.bg, border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ height: 34, border: '1px solid #e2e8f0', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
            <option value="">Tous les niveaux</option>
            <option value="danger">Critiques</option>
            <option value="warning">Avertissements</option>
            <option value="info">Informations</option>
          </select>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ height: 34, border: '1px solid #e2e8f0', padding: '0 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff' }}>
            <option value="">Toutes les catégories</option>
            {Object.entries(CATEGORIE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
        ) : alertes.length === 0 ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>Aucune alerte</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Tout est en ordre dans votre établissement.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Aucune alerte pour ce filtre</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[...grouped.entries()].map(([cat, items]) => (
              <div key={cat}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                  {CATEGORIE_LABELS[cat] ?? cat}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((a, i) => {
                    const s = TYPE_STYLES[a.type] ?? TYPE_STYLES.info;
                    return (
                      <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 28, height: 28, background: s.text + '18', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: s.text }}>
                          {s.icon}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, color: s.text, fontWeight: 500 }}>{a.texte}</div>
                        {a.href && (
                          <Link href={a.href} style={{ fontSize: 12, color: s.text, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                            Voir
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
