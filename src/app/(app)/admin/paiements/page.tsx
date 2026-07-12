'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

type TenantInfo = {
  plan: string;
  dateExpiration: string | null;
  nom: string;
  actif: boolean;
};

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  TRIAL: { label: 'Essai gratuit', color: '#d97706', bg: '#fffbeb' },
  STARTER: { label: 'Starter', color: '#2563eb', bg: '#eff6ff' },
  STANDARD: { label: 'Standard', color: '#7c3aed', bg: '#f5f3ff' },
  PREMIUM: { label: 'Premium', color: '#16a34a', bg: '#f0fdf4' },
  ENTERPRISE: { label: 'Enterprise', color: '#0f172a', bg: '#f8fafc' },
};

function fmtDate(v: string | null) {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return v; }
}

function daysLeft(v: string | null): number | null {
  if (!v) return null;
  const diff = new Date(v).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function PaiementsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/configuration/ecole');
      const d = res.data as Record<string, unknown>;
      setTenant({
        plan: String(d.plan ?? d.abonnement ?? 'TRIAL'),
        dateExpiration: d.dateExpiration ? String(d.dateExpiration) : null,
        nom: String(d.nom ?? ''),
        actif: d.actif !== false,
      });
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void fetchTenant(); }, [fetchTenant]);

  const planInfo = PLAN_LABELS[tenant?.plan ?? 'TRIAL'] ?? PLAN_LABELS.TRIAL;
  const jours = tenant?.dateExpiration ? daysLeft(tenant.dateExpiration) : null;
  const expire = jours !== null && jours <= 0;
  const bientot = jours !== null && jours > 0 && jours <= 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Abonnement & Facturation</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
        ) : !tenant ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Informations indisponibles</div>
        ) : (
          <div style={{ maxWidth: 700 }}>
            {/* Alerte expiration */}
            {expire && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                Votre abonnement a expiré. Veuillez renouveler pour continuer à utiliser la plateforme.
              </div>
            )}
            {bientot && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '14px 18px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
                Votre abonnement expire dans <strong>{jours} jour(s)</strong>. Pensez à renouveler.
              </div>
            )}

            {/* Plan actuel */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Plan actuel</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, background: planInfo.bg, border: `2px solid ${planInfo.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: planInfo.color, flexShrink: 0 }}>
                  {tenant.plan[0]}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{planInfo.label}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{tenant.nom}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '4px 10px', background: tenant.actif ? '#f0fdf4' : '#fef2f2', color: tenant.actif ? '#16a34a' : '#dc2626', border: `1px solid ${tenant.actif ? '#bbf7d0' : '#fecaca'}` }}>
                  {tenant.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Date d&apos;expiration</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: expire ? '#dc2626' : '#0f172a' }}>{fmtDate(tenant.dateExpiration)}</div>
                  {jours !== null && !expire && <div style={{ fontSize: 11, color: bientot ? '#d97706' : '#64748b', marginTop: 2 }}>{jours} jour(s) restant(s)</div>}
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Statut</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tenant.actif ? '#16a34a' : '#dc2626' }}>{tenant.actif ? 'Abonnement actif' : 'Abonnement expiré'}</div>
                </div>
              </div>
            </div>

            {/* Informations */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Informations</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
                Pour modifier votre plan, renouveler votre abonnement ou obtenir une facture, veuillez contacter l&apos;administration de la plateforme Medaaris.
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af' }}>
                La gestion des abonnements et factures est centralisée au niveau de la plateforme. Un module de paiement en ligne sera disponible prochainement.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
