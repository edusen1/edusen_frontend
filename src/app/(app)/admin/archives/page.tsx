'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type TypeArchive = 'ELEVE' | 'CLASSE' | 'ANNEE_SCOLAIRE' | 'BULLETIN' | 'DOCUMENT' | 'PAIEMENT';

interface Archive {
  id: string;
  type: TypeArchive;
  titre: string;
  description: string;
  anneeScolaire: string;
  dateArchivage: string;
  archiviePar: string;
  taille: string;
  nbElements?: number;
  restaurable: boolean;
}

// ─── Données statiques ────────────────────────────────────────────────────────
const ARCHIVES_INIT: Archive[] = [
  { id: 'a1', type: 'ANNEE_SCOLAIRE', titre: 'Année scolaire 2023-2024', description: 'Archivage complet de l\'année scolaire 2023-2024 : élèves, notes, bulletins, paiements, absences.', anneeScolaire: '2023-2024', dateArchivage: '2024-08-31', archiviePar: 'Amadou DIALLO', taille: '4.2 Go', nbElements: 812, restaurable: false },
  { id: 'a2', type: 'ANNEE_SCOLAIRE', titre: 'Année scolaire 2022-2023', description: 'Archivage complet de l\'année scolaire 2022-2023.', anneeScolaire: '2022-2023', dateArchivage: '2023-09-01', archiviePar: 'Amadou DIALLO', taille: '3.8 Go', nbElements: 774, restaurable: false },
  { id: 'a3', type: 'BULLETIN', titre: 'Bulletins T1 2024-2025', description: 'Bulletins du 1er trimestre 2024-2025 — 847 élèves', anneeScolaire: '2024-2025', dateArchivage: '2025-01-15', archiviePar: 'Fatou SOW', taille: '125 Mo', nbElements: 847, restaurable: true },
  { id: 'a4', type: 'BULLETIN', titre: 'Bulletins T2 2024-2025', description: 'Bulletins du 2ème trimestre 2024-2025 — 847 élèves', anneeScolaire: '2024-2025', dateArchivage: '2025-04-10', archiviePar: 'Fatou SOW', taille: '127 Mo', nbElements: 847, restaurable: true },
  { id: 'a5', type: 'ELEVE', titre: 'Élèves diplômés — BAC 2024', description: 'Dossiers des 87 élèves ayant obtenu leur baccalauréat en 2024.', anneeScolaire: '2023-2024', dateArchivage: '2024-07-15', archiviePar: 'Fatou SOW', taille: '56 Mo', nbElements: 87, restaurable: true },
  { id: 'a6', type: 'CLASSE', titre: 'Classes Terminale 2023-2024', description: 'Données complètes des 3 classes de Terminale de l\'année 2023-2024.', anneeScolaire: '2023-2024', dateArchivage: '2024-08-31', archiviePar: 'Amadou DIALLO', taille: '18 Mo', nbElements: 3, restaurable: false },
  { id: 'a7', type: 'PAIEMENT', titre: 'Paiements 2022-2023', description: 'Historique complet des paiements de frais scolaires 2022-2023.', anneeScolaire: '2022-2023', dateArchivage: '2023-09-01', archiviePar: 'Aïssatou KANE', taille: '2.3 Mo', nbElements: 2840, restaurable: false },
  { id: 'a8', type: 'DOCUMENT', titre: 'Documents officiels 2022-2023', description: 'Arrêtés, circulaires et conventions de l\'année 2022-2023.', anneeScolaire: '2022-2023', dateArchivage: '2023-09-05', archiviePar: 'Amadou DIALLO', taille: '85 Mo', nbElements: 24, restaurable: true },
];

const TYPE_LABELS: Record<TypeArchive, string> = { ELEVE: 'Élèves', CLASSE: 'Classes', ANNEE_SCOLAIRE: 'Année scolaire', BULLETIN: 'Bulletins', DOCUMENT: 'Documents', PAIEMENT: 'Paiements' };
const TYPE_COLORS: Record<TypeArchive, string> = { ELEVE: '#2563eb', CLASSE: '#7c3aed', ANNEE_SCOLAIRE: '#0f172a', BULLETIN: '#16a34a', DOCUMENT: '#0369a1', PAIEMENT: '#d97706' };
const TYPE_ICONS: Record<TypeArchive, string> = { ELEVE: '👤', CLASSE: '🏫', ANNEE_SCOLAIRE: '📅', BULLETIN: '📄', DOCUMENT: '📁', PAIEMENT: '💰' };

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

export default function ArchivesPage() {
  const [archives, setArchives] = useState<Archive[]>(ARCHIVES_INIT);
  const [filtreType, setFiltreType] = useState('TOUS');
  const [filtreAnnee, setFiltreAnnee] = useState('TOUTES');
  const [recherche, setRecherche] = useState('');
  const [detail, setDetail] = useState<Archive | null>(null);

  const annees = [...new Set(archives.map(a => a.anneeScolaire))].sort().reverse();

  const filtered = archives.filter(a => {
    if (filtreType !== 'TOUS' && a.type !== filtreType) return false;
    if (filtreAnnee !== 'TOUTES' && a.anneeScolaire !== filtreAnnee) return false;
    const q = recherche.toLowerCase();
    if (q && !a.titre.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
    return true;
  });

  function handleRestaurer(id: string) {
    const a = archives.find(x => x.id === id);
    if (!a?.restaurable) { alert('Cette archive ne peut pas être restaurée depuis l\'interface. Contactez l\'administrateur système.'); return; }
    if (!confirm('Restaurer cette archive ? Les données seront réintégrées dans le système actuel.')) return;
    alert('Restauration lancée. Vous serez notifié lorsqu\'elle sera terminée.');
  }

  function handleTelecharger(id: string) {
    alert('Génération du fichier d\'export en cours... Vous serez notifié quand il sera prêt.');
  }

  const totalTaille = archives.length; // simplified
  const stats = {
    total: archives.length,
    anneesScolaires: archives.filter(a => a.type === 'ANNEE_SCOLAIRE').length,
    bulletins: archives.filter(a => a.type === 'BULLETIN').reduce((s, a) => s + (a.nbElements || 0), 0),
    restaurables: archives.filter(a => a.restaurable).length,
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Archives</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Données archivées des années scolaires passées — lecture et restauration</div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#991b1b' }}>
          Zone protégée — lecture seule sauf restauration explicite
        </div>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[{ label: 'Archives totales', value: stats.total, color: '#0f172a' }, { label: 'Années scolaires', value: stats.anneesScolaires, color: '#475569' }, { label: 'Bulletins archivés', value: stats.bulletins.toLocaleString('fr-FR'), color: '#16a34a' }, { label: 'Restaurables', value: stats.restaurables, color: '#2563eb' }].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1e40af' }}>
          Les archives sont conservées selon la politique de rétention légale en vigueur (7 ans minimum pour les documents financiers, 10 ans pour les dossiers scolaires).
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher dans les archives..." style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, flex: 1 }} />
          <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Tous les types</option>
            {(Object.keys(TYPE_LABELS) as TypeArchive[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select value={filtreAnnee} onChange={e => setFiltreAnnee(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUTES">Toutes les années</option>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#64748b' }}>{filtered.length} archive(s)</div>
        </div>

        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucune archive trouvée</div>
          )}
          {filtered.map(a => (
            <div key={a.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 44, height: 44, background: TYPE_COLORS[a.type] + '15', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {TYPE_ICONS[a.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{a.titre}</span>
                    <Badge label={TYPE_LABELS[a.type]} color={TYPE_COLORS[a.type]} />
                    <Badge label={a.anneeScolaire} color="#475569" />
                    {a.restaurable && <Badge label="Restaurable" color="#2563eb" />}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 5 }}>{a.description}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
                    <span>Archivé le {new Date(a.dateArchivage).toLocaleDateString('fr-FR')}</span>
                    <span>Par {a.archiviePar}</span>
                    {a.nbElements !== undefined && <span>{a.nbElements.toLocaleString('fr-FR')} élément(s)</span>}
                    <span>{a.taille}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleTelecharger(a.id)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Exporter
                  </button>
                  {a.restaurable && (
                    <button onClick={() => handleRestaurer(a.id)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Restaurer
                    </button>
                  )}
                  <button onClick={() => setDetail(a)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Regroupement par année */}
        {filtreType === 'TOUS' && filtreAnnee === 'TOUTES' && recherche === '' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.07em', margin: '28px 0 12px', paddingBottom: 6, borderBottom: '1px solid #e6ebf1' }}>
              Résumé par année scolaire
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {annees.map(annee => {
                const archivesAnnee = archives.filter(a => a.anneeScolaire === annee);
                return (
                  <div key={annee} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', minWidth: 120 }}>{annee}</div>
                    <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                      {archivesAnnee.map(a => (
                        <Badge key={a.id} label={`${TYPE_ICONS[a.type]} ${TYPE_LABELS[a.type]}`} color={TYPE_COLORS[a.type]} />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{archivesAnnee.length} archive(s)</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 480, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Détail de l&apos;archive</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 24, textAlign: 'center' }}>{TYPE_ICONS[detail.type]}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Badge label={TYPE_LABELS[detail.type]} color={TYPE_COLORS[detail.type]} />
                <Badge label={detail.anneeScolaire} color="#475569" />
                {detail.restaurable && <Badge label="Restaurable" color="#2563eb" />}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>{detail.titre}</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, textAlign: 'center' }}>{detail.description}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
                <div><b>Date d&apos;archivage :</b> {new Date(detail.dateArchivage).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div><b>Archivé par :</b> {detail.archiviePar}</div>
                {detail.nbElements !== undefined && <div><b>Nombre d&apos;éléments :</b> {detail.nbElements.toLocaleString('fr-FR')}</div>}
                <div><b>Taille :</b> {detail.taille}</div>
                <div><b>Restaurable :</b> {detail.restaurable ? 'Oui' : 'Non (archivage définitif)'}</div>
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => handleTelecharger(detail.id)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Exporter</button>
              {detail.restaurable && <button onClick={() => handleRestaurer(detail.id)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Restaurer</button>}
              <button onClick={() => setDetail(null)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
