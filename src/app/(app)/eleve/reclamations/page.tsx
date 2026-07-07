'use client';

import { useState } from 'react';
import { useEleveReclamations, useCreerReclamation } from '@/hooks/use-query-api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function getStatutStyle(statut?: string) {
  if (statut === 'RESOLU' || statut === 'TRAITÉE') return { bg: '#dcfce7', text: '#16a34a', label: 'TRAITÉE' };
  if (statut === 'EN_COURS') return { bg: '#dbeafe', text: '#2563eb', label: 'EN COURS' };
  return { bg: '#fef3c7', text: '#d97706', label: 'EN ATTENTE' };
}

export default function ReclamationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [motif, setMotif] = useState('');
  const [sujet, setSujet] = useState('');
  const { data, isLoading } = useEleveReclamations();
  const createMutation = useCreerReclamation();

  const reclamations = Array.isArray(data) ? data : (data?.reclamations ?? []);

  const handleSubmit = async () => {
    if (!motif.trim()) return;
    await createMutation.mutateAsync({ motif });
    setMotif('');
    setSujet('');
    setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '10px 20px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Réclamations</div>
          <button
            onClick={() => setShowForm(true)}
            style={{ height: 36, padding: '0 14px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nouvelle
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {isLoading ? (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : reclamations.length === 0 ? (
          <>
            {/* Static fallback */}
            <ReclamationCard
              status="EN_ATTENTE"
              titre="Erreur de note en Mathématiques"
              desc="La note du devoir du 18 mars semble incorrecte par rapport à ma copie."
              date="Il y a 2 jours"
              destinataire="Vie scolaire"
              reponse={undefined}
            />
            <ReclamationCard
              status="TRAITÉE"
              titre="Absence justifiée non prise en compte"
              desc="Le certificat médical du 3 mars a été transmis mais l'absence reste non justifiée."
              date="12 mars"
              destinataire={undefined}
              reponse={{ auteur: 'Mme Sarr', text: 'Absence régularisée. Merci de votre signalement.' }}
            />
          </>
        ) : (
          (reclamations as Record<string, unknown>[]).map((r, i) => {
            const statut = r.statut as string | undefined;
            const motifText = r.motif as string | undefined;
            const reponse = r.reponse as string | undefined;
            const dateStr = r.createdAt as string | undefined;
            let dateFormatted = '';
            try {
              if (dateStr) dateFormatted = format(new Date(dateStr), 'd MMM', { locale: fr });
            } catch { /* skip */ }
            return (
              <ReclamationCard
                key={(r.id as string) ?? i}
                status={statut ?? 'EN_ATTENTE'}
                titre={motifText ?? 'Réclamation'}
                desc={motifText ?? ''}
                date={dateFormatted}
                destinataire={undefined}
                reponse={reponse ? { auteur: 'Administration', text: reponse } : undefined}
              />
            );
          })
        )}
      </div>

      {/* New claim modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: '#fff', padding: '20px 20px 32px', borderRadius: '12px 12px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Nouvelle réclamation</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Sujet</div>
              <input
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Ex: Erreur de note en Mathématiques"
                style={{ width: '100%', height: 42, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 14, color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Description</div>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Décrivez votre réclamation…"
                rows={4}
                style={{ width: '100%', border: '1px solid #d9e0e8', padding: '10px 12px', fontSize: 14, color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none' }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!motif.trim() || createMutation.isPending}
              style={{ width: '100%', height: 48, border: 'none', background: '#2563eb', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {createMutation.isPending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReclamationCard({ status, titre, desc, date, destinataire, reponse }: {
  status: string;
  titre: string;
  desc: string;
  date: string;
  destinataire?: string;
  reponse?: { auteur: string; text: string };
}) {
  const s = getStatutStyle(status);
  return (
    <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.text, background: s.bg, padding: '3px 8px' }}>{s.label}</span>
        {date && <span style={{ fontSize: 11, color: '#94a3b8' }}>{date}</span>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginTop: 10 }}>{titre}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 5, lineHeight: 1.45 }}>{desc}</div>
      {destinataire && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 11, paddingTop: 11, borderTop: '1px solid #eef2f6' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Destinataire : {destinataire}</span>
        </div>
      )}
      {reponse && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '9px 11px', marginTop: 11 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>Réponse — {reponse.auteur}</div>
          <div style={{ fontSize: 12, color: '#166534', marginTop: 2, lineHeight: 1.4 }}>{reponse.text}</div>
        </div>
      )}
    </div>
  );
}
