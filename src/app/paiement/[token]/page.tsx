'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

export default function PaiementPublicPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(false);

  // Demo data (replace with API call)
  const paiement = {
    eleve: 'Awa Ndiaye',
    classe: '3ème B',
    etablissement: 'École Edusen',
    type: 'Frais de scolarité — 2e tranche',
    montant: 75000,
    echeance: '31/01/2026',
    statut: 'en_attente' as 'en_attente' | 'paye' | 'expire',
    reference: `NS-PAY-${token?.slice(0, 8)?.toUpperCase() ?? ''}`,
  };

  const handlePayer = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    toast.success('Paiement enregistré avec succès !');
  };

  const statutColors: Record<string, { bg: string; color: string; label: string }> = {
    en_attente: { bg: '#fef3c7', color: '#d97706', label: 'En attente' },
    paye: { bg: '#dcfce7', color: '#16a34a', label: 'Payé' },
    expire: { bg: '#fee2e2', color: '#dc2626', label: 'Expiré' },
  };
  const st = statutColors[paiement.statut];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Edusen</span>
        <span style={{ marginLeft: 4, fontSize: 13, color: '#64748b' }}>— Paiement en ligne</span>
      </div>

      <div style={{ maxWidth: 520, margin: '60px auto', padding: '0 20px' }}>
        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e6ebf1', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
          {/* Top band */}
          <div style={{ background: '#0f172a', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Facture de scolarité</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{paiement.etablissement}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '5px 12px' }}>{st.label}</span>
          </div>

          <div style={{ padding: '28px' }}>
            {/* Élève info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, padding: '16px', background: '#f8fafc', border: '1px solid #e6ebf1' }}>
              <div style={{ width: 48, height: 48, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800 }}>
                {paiement.eleve.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{paiement.eleve}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{paiement.classe}</div>
              </div>
            </div>

            {/* Détails */}
            <div style={{ marginBottom: 28 }}>
              {[
                { label: 'Référence', val: paiement.reference },
                { label: 'Objet', val: paiement.type },
                { label: 'Échéance', val: paiement.echeance },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Montant */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px', marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Montant à payer</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#1d4ed8', letterSpacing: '-.02em' }}>
                {paiement.montant.toLocaleString('fr-FR')} <span style={{ fontSize: 20 }}>FCFA</span>
              </div>
            </div>

            {/* Actions */}
            {paiement.statut === 'en_attente' && (
              <button
                onClick={handlePayer}
                disabled={loading}
                style={{ width: '100%', height: 52, border: 'none', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              >
                {loading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    Traitement…
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Payer maintenant
                  </>
                )}
              </button>
            )}

            {paiement.statut === 'paye' && (
              <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>Paiement effectué</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Ce paiement a déjà été enregistré.</div>
              </div>
            )}

            {paiement.statut === 'expire' && (
              <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>⏰</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Lien expiré</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Ce lien de paiement n'est plus valide. Contactez l'établissement.</div>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 20 }}>
          Paiement sécurisé par Edusen · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
