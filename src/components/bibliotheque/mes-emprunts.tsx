'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { formatDateFr } from '@/lib/display';

/**
 * « Ma bibliothèque » — vue partagée par l'élève et l'enseignant.
 *
 * Les données viennent de `/bibliotheque/mes-emprunts`, qui se fonde sur le
 * jeton : personne ne peut consulter les emprunts d'un autre.
 */

const B = '#e6ebf1';

interface Emprunt {
  id: string; statut: 'EN_COURS' | 'RENDU' | 'EN_RETARD' | 'PERDU';
  dateEmprunt: string; dureeJours: number; dateRetourPrevue: string;
  dateRetourReelle?: string | null; montantAmende?: number | null; joursRetard?: number;
  ouvrage?: { titre: string; auteur: string };
}

interface Donnees {
  enCours: Emprunt[];
  historique: Emprunt[];
  nbEnRetard: number;
  amendesDues: number;
}

const STATUT_LABELS: Record<Emprunt['statut'], string> = {
  EN_COURS: 'En cours', RENDU: 'Rendu', EN_RETARD: 'En retard', PERDU: 'Perdu',
};
const STATUT_COULEURS: Record<Emprunt['statut'], { bg: string; fg: string }> = {
  EN_COURS: { bg: '#eff6ff', fg: '#2563eb' },
  RENDU: { bg: '#dcfce7', fg: '#16a34a' },
  EN_RETARD: { bg: '#fee2e2', fg: '#dc2626' },
  PERDU: { bg: '#f1f5f9', fg: '#475569' },
};

/** Jours restants avant l'échéance ; négatif si dépassée. */
function joursRestants(date: string): number {
  const millisecondesParJour = 24 * 60 * 60 * 1000;
  return Math.ceil((new Date(date).getTime() - Date.now()) / millisecondesParJour);
}

export function MesEmprunts() {
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    apiClient.get('/bibliotheque/mes-emprunts')
      .then((r) => setDonnees(r.data as Donnees))
      .catch(() => setErreur(true))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;
  if (erreur || !donnees) {
    return (
      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Bibliothèque momentanément indisponible.
      </div>
    );
  }

  const { enCours, historique, nbEnRetard, amendesDues } = donnees;
  const bientot = enCours.filter((e) => e.statut === 'EN_COURS' && joursRestants(e.dateRetourPrevue) <= 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Alertes — le retard et la dette passent avant le reste. */}
      {nbEnRetard > 0 && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', padding: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
            {nbEnRetard === 1 ? '1 ouvrage en retard' : `${nbEnRetard} ouvrages en retard`}
          </div>
          <div style={{ fontSize: 12, color: '#991b1b', marginTop: 2 }}>
            Rapportez-les à la bibliothèque : des pénalités s&apos;appliquent par jour de retard,
            et vous ne pourrez pas emprunter à nouveau entre-temps.
          </div>
        </div>
      )}

      {nbEnRetard === 0 && bientot.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309' }}>
            {bientot.length === 1 ? 'Un retour approche' : `${bientot.length} retours approchent`}
          </div>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>
            {bientot.map((e) => e.ouvrage?.titre).filter(Boolean).join(' · ')}
          </div>
        </div>
      )}

      {amendesDues > 0 && (
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '12px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6d28d9' }}>
            {amendesDues.toLocaleString('fr-FR')} FCFA à régler
          </div>
          <div style={{ fontSize: 12, color: '#5b21b6', marginTop: 2 }}>
            Montant dû au titre des retards ou pertes. À régler auprès de la caisse.
          </div>
        </div>
      )}

      {/* Emprunts en cours */}
      <div style={{ background: '#fff', border: `1px solid ${B}` }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${B}`, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
          Emprunts en cours
        </div>
        {enCours.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun ouvrage emprunté.</div>
        ) : (
          enCours.map((e) => {
            const c = STATUT_COULEURS[e.statut];
            const restants = joursRestants(e.dateRetourPrevue);
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{e.ouvrage?.titre ?? '—'}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{e.ouvrage?.auteur ?? ''}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 150 }}>
                  <div style={{ fontSize: 12, color: e.statut === 'EN_RETARD' ? '#dc2626' : '#475569' }}>
                    À rendre le {formatDateFr(e.dateRetourPrevue)}
                  </div>
                  <div style={{ fontSize: 11, color: e.statut === 'EN_RETARD' ? '#dc2626' : '#94a3b8' }}>
                    {e.statut === 'EN_RETARD'
                      ? `${e.joursRetard ?? Math.abs(restants)} jour(s) de retard`
                      : restants <= 0 ? "Aujourd'hui" : `dans ${restants} jour(s)`}
                  </div>
                </div>
                <span style={{ background: c.bg, color: c.fg, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {STATUT_LABELS[e.statut]}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Historique */}
      <div style={{ background: '#fff', border: `1px solid ${B}` }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${B}`, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
          Historique
        </div>
        {historique.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun emprunt passé.</div>
        ) : (
          historique.map((e) => {
            const c = STATUT_COULEURS[e.statut];
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#0f172a' }}>{e.ouvrage?.titre ?? '—'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    Emprunté le {formatDateFr(e.dateEmprunt)}
                    {e.dateRetourReelle ? ` · rendu le ${formatDateFr(e.dateRetourReelle)}` : ''}
                  </div>
                </div>
                {e.montantAmende ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>{e.montantAmende.toLocaleString('fr-FR')} F</span>
                ) : null}
                <span style={{ background: c.bg, color: c.fg, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {STATUT_LABELS[e.statut]}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
