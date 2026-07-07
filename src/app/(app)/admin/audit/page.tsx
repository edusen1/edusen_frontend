'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PUBLISH' | 'VALIDATE' | 'REJECT';
type Module = 'ELEVES' | 'INSCRIPTIONS' | 'NOTES' | 'BULLETINS' | 'PAIEMENTS' | 'UTILISATEURS' | 'PARAMETRES' | 'DOCUMENTS' | 'EXAMENS' | 'DISCIPLINE' | 'AUTH' | 'COMMUNICATION';

interface LogEntry {
  id: string;
  action: ActionType;
  module: Module;
  description: string;
  utilisateur: string;
  role: string;
  dateHeure: string;
  ip?: string;
  statut: 'SUCCESS' | 'FAILURE';
  details?: string;
}

// ─── Données statiques ────────────────────────────────────────────────────────
const LOGS_INIT: LogEntry[] = [
  { id: 'l1', action: 'LOGIN', module: 'AUTH', description: 'Connexion réussie', utilisateur: 'Amadou DIALLO', role: 'Directeur', dateHeure: '2025-06-29T08:30:14', ip: '192.168.1.10', statut: 'SUCCESS' },
  { id: 'l2', action: 'LOGIN', module: 'AUTH', description: 'Connexion réussie', utilisateur: 'Fatou SOW', role: 'Administrateur', dateHeure: '2025-06-29T09:15:03', ip: '192.168.1.12', statut: 'SUCCESS' },
  { id: 'l3', action: 'CREATE', module: 'ELEVES', description: 'Création d\'un nouvel élève', utilisateur: 'Fatou SOW', role: 'Administrateur', dateHeure: '2025-06-29T09:18:22', ip: '192.168.1.12', statut: 'SUCCESS', details: 'Élève : BARRY Mohamed — Classe : 6ème A' },
  { id: 'l4', action: 'VALIDATE', module: 'INSCRIPTIONS', description: 'Validation d\'une demande d\'inscription', utilisateur: 'Fatou SOW', role: 'Administrateur', dateHeure: '2025-06-29T09:35:10', ip: '192.168.1.12', statut: 'SUCCESS', details: 'Dossier #INS-2026-089' },
  { id: 'l5', action: 'UPDATE', module: 'NOTES', description: 'Modification d\'une note', utilisateur: 'Moussa BA', role: 'Enseignant', dateHeure: '2025-06-28T16:02:45', ip: '192.168.1.15', statut: 'SUCCESS', details: 'Élève : DIALLO Aïcha — Matière : Mathématiques — Note : 14 → 15' },
  { id: 'l6', action: 'PUBLISH', module: 'BULLETINS', description: 'Publication des bulletins T2', utilisateur: 'Amadou DIALLO', role: 'Directeur', dateHeure: '2025-06-28T11:00:00', ip: '192.168.1.10', statut: 'SUCCESS', details: '22 classes — 847 bulletins publiés' },
  { id: 'l7', action: 'CREATE', module: 'PAIEMENTS', description: 'Enregistrement d\'un paiement', utilisateur: 'Aïssatou KANE', role: 'Caissier', dateHeure: '2025-06-28T10:15:33', ip: '192.168.1.20', statut: 'SUCCESS', details: 'Élève : SOW Aminata — Montant : 125 000 MRU' },
  { id: 'l8', action: 'DELETE', module: 'DOCUMENTS', description: 'Suppression d\'un document', utilisateur: 'Fatou SOW', role: 'Administrateur', dateHeure: '2025-06-28T14:22:09', ip: '192.168.1.12', statut: 'SUCCESS', details: 'Document : Brouillon circulaire avril 2025' },
  { id: 'l9', action: 'LOGIN', module: 'AUTH', description: 'Tentative de connexion échouée', utilisateur: 'inconnu (mariama.c@ecole.sn)', role: '—', dateHeure: '2025-06-28T07:45:00', ip: '102.16.45.3', statut: 'FAILURE', details: 'Mot de passe incorrect — 3ème tentative' },
  { id: 'l10', action: 'EXPORT', module: 'ELEVES', description: 'Export de la liste des élèves', utilisateur: 'Fatou SOW', role: 'Administrateur', dateHeure: '2025-06-27T16:30:00', ip: '192.168.1.12', statut: 'SUCCESS', details: 'Format : Excel — 847 élèves' },
  { id: 'l11', action: 'UPDATE', module: 'PARAMETRES', description: 'Modification des paramètres école', utilisateur: 'Amadou DIALLO', role: 'Directeur', dateHeure: '2025-06-27T10:00:00', ip: '192.168.1.10', statut: 'SUCCESS', details: 'Champ modifié : frais_inscription' },
  { id: 'l12', action: 'PUBLISH', module: 'COMMUNICATION', description: 'Envoi d\'une notification collective', utilisateur: 'Amadou DIALLO', role: 'Directeur', dateHeure: '2025-06-27T09:00:00', ip: '192.168.1.10', statut: 'SUCCESS', details: 'Destinataires : 847 — Canal : WhatsApp' },
  { id: 'l13', action: 'CREATE', module: 'EXAMENS', description: 'Création d\'un examen', utilisateur: 'Fatou SOW', role: 'Administrateur', dateHeure: '2025-06-26T11:00:00', ip: '192.168.1.12', statut: 'SUCCESS', details: 'Examen : Brevet blanc — 3ème trimestre' },
  { id: 'l14', action: 'REJECT', module: 'DISCIPLINE', description: 'Clôture d\'un dossier disciplinaire', utilisateur: 'Amadou DIALLO', role: 'Directeur', dateHeure: '2025-06-26T14:00:00', ip: '192.168.1.10', statut: 'SUCCESS', details: 'Dossier #DISC-2025-003 — Sanction : Avertissement' },
  { id: 'l15', action: 'LOGIN', module: 'AUTH', description: 'Déconnexion', utilisateur: 'Aïssatou KANE', role: 'Caissier', dateHeure: '2025-06-29T07:00:00', ip: '192.168.1.20', statut: 'SUCCESS' },
];

const ACTION_LABELS: Record<ActionType, string> = { CREATE: 'Création', UPDATE: 'Modification', DELETE: 'Suppression', LOGIN: 'Connexion', LOGOUT: 'Déconnexion', EXPORT: 'Export', PUBLISH: 'Publication', VALIDATE: 'Validation', REJECT: 'Clôture/Rejet' };
const ACTION_COLORS: Record<ActionType, string> = { CREATE: '#16a34a', UPDATE: '#2563eb', DELETE: '#dc2626', LOGIN: '#475569', LOGOUT: '#94a3b8', EXPORT: '#0369a1', PUBLISH: '#7c3aed', VALIDATE: '#16a34a', REJECT: '#d97706' };
const MODULE_LABELS: Record<Module, string> = { ELEVES: 'Élèves', INSCRIPTIONS: 'Inscriptions', NOTES: 'Notes', BULLETINS: 'Bulletins', PAIEMENTS: 'Paiements', UTILISATEURS: 'Utilisateurs', PARAMETRES: 'Paramètres', DOCUMENTS: 'Documents', EXAMENS: 'Examens', DISCIPLINE: 'Discipline', AUTH: 'Authentification', COMMUNICATION: 'Communication' };

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

export default function AuditPage() {
  const [logs] = useState<LogEntry[]>(LOGS_INIT);
  const [filtreAction, setFiltreAction] = useState('TOUS');
  const [filtreModule, setFiltreModule] = useState('TOUS');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [recherche, setRecherche] = useState('');
  const [detail, setDetail] = useState<LogEntry | null>(null);

  const filtered = logs.filter(l => {
    if (filtreAction !== 'TOUS' && l.action !== filtreAction) return false;
    if (filtreModule !== 'TOUS' && l.module !== filtreModule) return false;
    if (filtreStatut !== 'TOUS' && l.statut !== filtreStatut) return false;
    const q = recherche.toLowerCase();
    if (q && !l.utilisateur.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q) && !(l.details || '').toLowerCase().includes(q)) return false;
    return true;
  });

  const stats = {
    total: logs.length,
    succes: logs.filter(l => l.statut === 'SUCCESS').length,
    echecs: logs.filter(l => l.statut === 'FAILURE').length,
    utilisateurs: new Set(logs.map(l => l.utilisateur)).size,
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Journal d&apos;audit</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Traçabilité complète des actions — lecture seule</div>
        </div>
        <button style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Exporter les logs
        </button>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[{ label: 'Total entrées', value: stats.total, color: '#0f172a' }, { label: 'Succès', value: stats.succes, color: '#16a34a' }, { label: 'Échecs', value: stats.echecs, color: '#dc2626' }, { label: 'Utilisateurs actifs', value: stats.utilisateurs, color: '#2563eb' }].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Alertes sécurité */}
        {logs.filter(l => l.statut === 'FAILURE').length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
            {logs.filter(l => l.statut === 'FAILURE').length} tentative(s) échouée(s) détectée(s) — vérifiez les logs d&apos;authentification
          </div>
        )}

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..." style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, flex: 1 }} />
          <select value={filtreAction} onChange={e => setFiltreAction(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Toutes les actions</option>
            {(Object.keys(ACTION_LABELS) as ActionType[]).map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
          </select>
          <select value={filtreModule} onChange={e => setFiltreModule(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Tous les modules</option>
            {(Object.keys(MODULE_LABELS) as Module[]).map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
          </select>
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Tous les statuts</option>
            <option value="SUCCESS">Succès</option>
            <option value="FAILURE">Échec</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#64748b' }}>{filtered.length} entrée(s)</div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Date & Heure', 'Action', 'Module', 'Description', 'Utilisateur', 'IP', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun log trouvé</td></tr>
              )}
              {filtered.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: l.statut === 'FAILURE' ? '#fff8f8' : 'transparent' }} onClick={() => setDetail(l)}>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                    {new Date(l.dateHeure).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    <span style={{ color: '#94a3b8', marginLeft: 4 }}>{new Date(l.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}><Badge label={ACTION_LABELS[l.action]} color={ACTION_COLORS[l.action]} /></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569' }}>{MODULE_LABELS[l.module]}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{l.utilisateur}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.role}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{l.ip || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: l.statut === 'SUCCESS' ? '#f0fdf4' : '#fef2f2', color: l.statut === 'SUCCESS' ? '#16a34a' : '#dc2626', border: `1px solid ${l.statut === 'SUCCESS' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                      {l.statut === 'SUCCESS' ? 'Succès' : 'Échec'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 480, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Détail du log</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={ACTION_LABELS[detail.action]} color={ACTION_COLORS[detail.action]} />
                <span style={{ background: detail.statut === 'SUCCESS' ? '#f0fdf4' : '#fef2f2', color: detail.statut === 'SUCCESS' ? '#16a34a' : '#dc2626', border: `1px solid ${detail.statut === 'SUCCESS' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                  {detail.statut === 'SUCCESS' ? 'Succès' : 'Échec'}
                </span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{detail.description}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
                <div><b>Module :</b> {MODULE_LABELS[detail.module]}</div>
                <div><b>Utilisateur :</b> {detail.utilisateur} ({detail.role})</div>
                <div><b>Date & Heure :</b> {new Date(detail.dateHeure).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                {detail.ip && <div><b>Adresse IP :</b> <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>{detail.ip}</code></div>}
                <div><b>Identifiant :</b> <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>{detail.id}</code></div>
              </div>
              {detail.details && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Détails supplémentaires</div>
                  <div style={{ background: '#f1f5f9', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>{detail.details}</div>
                </div>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setDetail(null)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
