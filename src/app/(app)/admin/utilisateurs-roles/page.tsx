'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'DIRECTEUR' | 'ADMIN' | 'ENSEIGNANT' | 'CAISSE' | 'SURVEILLANT' | 'BIBLIOTHECAIRE' | 'INFIRMIER' | 'PARENT' | 'ELEVE';
type StatutUser = 'ACTIF' | 'INACTIF' | 'SUSPENDU';

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: Role;
  statut: StatutUser;
  dateCreation: string;
  derniereConnexion?: string;
  permissions: string[];
}

// ─── Données statiques ────────────────────────────────────────────────────────
const PERMISSIONS_PAR_ROLE: Record<Role, string[]> = {
  DIRECTEUR: ['dashboard', 'eleves', 'inscriptions', 'classes', 'professeurs', 'personnel', 'notes', 'bulletins', 'examens', 'devoirs', 'absences', 'discipline', 'paiements', 'emplois-du-temps', 'communication', 'documents', 'rapports', 'utilisateurs', 'audit', 'parametres', 'bibliotheque', 'sante', 'archives', 'reclamations'],
  ADMIN: ['dashboard', 'eleves', 'inscriptions', 'classes', 'professeurs', 'personnel', 'notes', 'bulletins', 'examens', 'devoirs', 'absences', 'discipline', 'paiements', 'emplois-du-temps', 'communication', 'documents', 'rapports', 'parametres'],
  ENSEIGNANT: ['dashboard', 'notes', 'devoirs', 'absences-eleves', 'emplois-du-temps'],
  CAISSE: ['dashboard', 'paiements', 'rapports-financiers'],
  SURVEILLANT: ['dashboard', 'absences-eleves', 'absences-personnel', 'discipline', 'emplois-du-temps'],
  BIBLIOTHECAIRE: ['dashboard', 'bibliotheque'],
  INFIRMIER: ['dashboard', 'sante'],
  PARENT: ['dashboard-parent', 'notes-enfant', 'absences-enfant', 'paiements-enfant', 'communication'],
  ELEVE: ['dashboard-eleve', 'notes', 'emplois-du-temps', 'devoirs'],
};

const USERS_INIT: Utilisateur[] = [
  { id: 'u1', nom: 'DIALLO', prenom: 'Amadou', email: 'amadou.diallo@ecole.sn', telephone: '+221 77 000 0001', role: 'DIRECTEUR', statut: 'ACTIF', dateCreation: '2023-09-01', derniereConnexion: '2025-06-29T08:30', permissions: PERMISSIONS_PAR_ROLE['DIRECTEUR'] },
  { id: 'u2', nom: 'SOW', prenom: 'Fatou', email: 'fatou.sow@ecole.sn', telephone: '+221 78 000 0002', role: 'ADMIN', statut: 'ACTIF', dateCreation: '2023-09-01', derniereConnexion: '2025-06-29T09:15', permissions: PERMISSIONS_PAR_ROLE['ADMIN'] },
  { id: 'u3', nom: 'BA', prenom: 'Moussa', email: 'moussa.ba@ecole.sn', role: 'ENSEIGNANT', statut: 'ACTIF', dateCreation: '2023-09-05', derniereConnexion: '2025-06-28T16:00', permissions: PERMISSIONS_PAR_ROLE['ENSEIGNANT'] },
  { id: 'u4', nom: 'KANE', prenom: 'Aïssatou', email: 'aissatou.kane@ecole.sn', role: 'CAISSE', statut: 'ACTIF', dateCreation: '2024-01-15', derniereConnexion: '2025-06-29T10:00', permissions: PERMISSIONS_PAR_ROLE['CAISSE'] },
  { id: 'u5', nom: 'TRAORE', prenom: 'Ibrahima', email: 'ibrahima.traore@ecole.sn', role: 'SURVEILLANT', statut: 'ACTIF', dateCreation: '2024-09-01', derniereConnexion: '2025-06-28T18:00', permissions: PERMISSIONS_PAR_ROLE['SURVEILLANT'] },
  { id: 'u6', nom: 'COULIBALY', prenom: 'Mariama', email: 'mariama.c@ecole.sn', role: 'ENSEIGNANT', statut: 'SUSPENDU', dateCreation: '2023-09-05', derniereConnexion: '2025-05-10T11:00', permissions: [] },
  { id: 'u7', nom: 'BARRY', prenom: 'Seydou', email: 'seydou.barry@ecole.sn', role: 'BIBLIOTHECAIRE', statut: 'ACTIF', dateCreation: '2024-03-01', derniereConnexion: '2025-06-27T15:00', permissions: PERMISSIONS_PAR_ROLE['BIBLIOTHECAIRE'] },
  { id: 'u8', nom: 'CAMARA', prenom: 'Ndeye', email: 'ndeye.camara@ecole.sn', role: 'INFIRMIER', statut: 'INACTIF', dateCreation: '2024-09-01', permissions: [] },
];

const ROLE_LABELS: Record<Role, string> = { DIRECTEUR: 'Directeur', ADMIN: 'Administrateur', ENSEIGNANT: 'Enseignant', CAISSE: 'Caissier', SURVEILLANT: 'Surveillant', BIBLIOTHECAIRE: 'Bibliothécaire', INFIRMIER: 'Infirmier', PARENT: 'Parent', ELEVE: 'Élève' };
const ROLE_COLORS: Record<Role, string> = { DIRECTEUR: '#7c3aed', ADMIN: '#2563eb', ENSEIGNANT: '#0369a1', CAISSE: '#16a34a', SURVEILLANT: '#d97706', BIBLIOTHECAIRE: '#475569', INFIRMIER: '#dc2626', PARENT: '#94a3b8', ELEVE: '#64748b' };
const STATUT_LABELS: Record<StatutUser, string> = { ACTIF: 'Actif', INACTIF: 'Inactif', SUSPENDU: 'Suspendu' };
const STATUT_COLORS: Record<StatutUser, string> = { ACTIF: '#16a34a', INACTIF: '#94a3b8', SUSPENDU: '#dc2626' };

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

function initials(prenom: string, nom: string) {
  return (prenom[0] + nom[0]).toUpperCase();
}

export default function UtilisateursRolesPage() {
  const [users, setUsers] = useState<Utilisateur[]>(USERS_INIT);
  const [filtreRole, setFiltreRole] = useState('TOUS');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [recherche, setRecherche] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Utilisateur | null>(null);
  const [onglet, setOnglet] = useState<'liste' | 'roles'>('liste');

  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', role: 'ENSEIGNANT' as Role });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = users.filter(u => {
    if (filtreRole !== 'TOUS' && u.role !== filtreRole) return false;
    if (filtreStatut !== 'TOUS' && u.statut !== filtreStatut) return false;
    const q = recherche.toLowerCase();
    if (q && !u.nom.toLowerCase().includes(q) && !u.prenom.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    return true;
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nom.trim()) e.nom = 'Nom requis';
    if (!form.prenom.trim()) e.prenom = 'Prénom requis';
    if (!form.email.trim()) e.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    else if (users.some(u => u.email === form.email)) e.email = 'Cet email est déjà utilisé';
    return e;
  }

  function handleCreer() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const nouveau: Utilisateur = {
      id: 'u' + Date.now(),
      nom: form.nom.toUpperCase(),
      prenom: form.prenom,
      email: form.email,
      telephone: form.telephone || undefined,
      role: form.role,
      statut: 'ACTIF',
      dateCreation: new Date().toISOString().slice(0, 10),
      permissions: PERMISSIONS_PAR_ROLE[form.role],
    };
    setUsers([nouveau, ...users]);
    setShowModal(false);
    setForm({ nom: '', prenom: '', email: '', telephone: '', role: 'ENSEIGNANT' });
    setErrors({});
  }

  function handleSuspendre(id: string) {
    const u = users.find(x => x.id === id);
    if (u?.role === 'DIRECTEUR') { alert('Impossible de suspendre le compte Directeur.'); return; }
    if (!confirm('Suspendre cet utilisateur ? Il ne pourra plus se connecter.')) return;
    setUsers(users.map(x => x.id === id ? { ...x, statut: 'SUSPENDU', permissions: [] } : x));
    setDetail(null);
  }

  function handleActiver(id: string) {
    const u = users.find(x => x.id === id);
    if (!u) return;
    setUsers(users.map(x => x.id === id ? { ...x, statut: 'ACTIF', permissions: PERMISSIONS_PAR_ROLE[u.role] } : x));
    setDetail(null);
  }

  function handleSupprimer(id: string) {
    const u = users.find(x => x.id === id);
    if (u?.role === 'DIRECTEUR') { alert('Impossible de supprimer le compte Directeur.'); return; }
    if (u?.statut === 'ACTIF') { alert('Suspendez d\'abord l\'utilisateur avant de le supprimer.'); return; }
    if (!confirm('Supprimer définitivement cet utilisateur ?')) return;
    setUsers(users.filter(x => x.id !== id));
    setDetail(null);
  }

  const stats = { total: users.length, actifs: users.filter(u => u.statut === 'ACTIF').length, suspendus: users.filter(u => u.statut === 'SUSPENDU').length, inactifs: users.filter(u => u.statut === 'INACTIF').length };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Utilisateurs & Rôles</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Gestion des accès et des permissions</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + Nouvel utilisateur
        </button>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[{ label: 'Total', value: stats.total, color: '#0f172a' }, { label: 'Actifs', value: stats.actifs, color: '#16a34a' }, { label: 'Suspendus', value: stats.suspendus, color: '#dc2626' }, { label: 'Inactifs', value: stats.inactifs, color: '#94a3b8' }].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e6ebf1' }}>
          {(['liste', 'roles'] as const).map(o => (
            <button key={o} onClick={() => setOnglet(o)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: onglet === o ? 700 : 400, color: onglet === o ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: onglet === o ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2 }}>
              {o === 'liste' ? 'Liste des utilisateurs' : 'Matrice des rôles'}
            </button>
          ))}
        </div>

        {onglet === 'liste' && (
          <>
            {/* Filtres */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un utilisateur..." style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, flex: 1 }} />
              <select value={filtreRole} onChange={e => setFiltreRole(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
                <option value="TOUS">Tous les rôles</option>
                {(Object.keys(ROLE_LABELS) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
                <option value="TOUS">Tous les statuts</option>
                {(['ACTIF', 'SUSPENDU', 'INACTIF'] as StatutUser[]).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
              </select>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                    {['Utilisateur', 'Role', 'Statut', 'Dernière connexion', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun utilisateur trouvé</td></tr>
                  )}
                  {filtered.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setDetail(u)}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: ROLE_COLORS[u.role] + '20', color: ROLE_COLORS[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {initials(u.prenom, u.nom)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{u.prenom} {u.nom}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}><Badge label={ROLE_LABELS[u.role]} color={ROLE_COLORS[u.role]} /></td>
                      <td style={{ padding: '12px 14px' }}><Badge label={STATUT_LABELS[u.statut]} color={STATUT_COLORS[u.statut]} /></td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748b' }}>{u.derniereConnexion ? new Date(u.derniereConnexion).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {u.statut === 'ACTIF' && u.role !== 'DIRECTEUR' && (
                            <button onClick={() => handleSuspendre(u.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                              Suspendre
                            </button>
                          )}
                          {u.statut !== 'ACTIF' && (
                            <button onClick={() => handleActiver(u.id)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                              Activer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {onglet === 'roles' && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1', overflowX: 'auto' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #e6ebf1', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Matrice des permissions par rôle
            </div>
            <div style={{ padding: '0 18px 18px' }}>
              {(Object.keys(ROLE_LABELS) as Role[]).filter(r => r !== 'PARENT' && r !== 'ELEVE').map(role => (
                <div key={role} style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Badge label={ROLE_LABELS[role]} color={ROLE_COLORS[role]} />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>({PERMISSIONS_PAR_ROLE[role].length} module(s))</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PERMISSIONS_PAR_ROLE[role].map(p => (
                      <span key={p} style={{ background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '3px 8px', fontSize: 11 }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal création */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 460, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Nouvel utilisateur</span>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prénom *</label>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} placeholder="Prénom" style={{ width: '100%', border: `1px solid ${errors.prenom ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  {errors.prenom && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.prenom}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom *</label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Nom de famille" style={{ width: '100%', border: `1px solid ${errors.nom ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  {errors.nom && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.nom}</div>}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@ecole.sn" style={{ width: '100%', border: `1px solid ${errors.email ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.email && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.email}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Téléphone</label>
                <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="+221 XX XXX XX XX" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Rôle *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  {(Object.keys(ROLE_LABELS) as Role[]).filter(r => r !== 'DIRECTEUR').map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#166534' }}>
                Un email avec les identifiants de connexion sera envoyé automatiquement à l&apos;utilisateur.
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleCreer} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Créer l&apos;utilisateur</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 480, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Fiche utilisateur</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: ROLE_COLORS[detail.role] + '20', color: ROLE_COLORS[detail.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                  {initials(detail.prenom, detail.nom)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.prenom} {detail.nom}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Badge label={ROLE_LABELS[detail.role]} color={ROLE_COLORS[detail.role]} />
                    <Badge label={STATUT_LABELS[detail.statut]} color={STATUT_COLORS[detail.statut]} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
                <div><b>Email :</b> {detail.email}</div>
                {detail.telephone && <div><b>Téléphone :</b> {detail.telephone}</div>}
                <div><b>Créé le :</b> {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}</div>
                {detail.derniereConnexion && <div><b>Dernière connexion :</b> {new Date(detail.derniereConnexion).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
              </div>
              {detail.permissions.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Modules accessibles ({detail.permissions.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {detail.permissions.map(p => <span key={p} style={{ background: '#f1f5f9', color: '#475569', borderRadius: 4, padding: '3px 8px', fontSize: 11 }}>{p}</span>)}
                  </div>
                </div>
              )}
              {detail.statut === 'SUSPENDU' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#dc2626' }}>
                  Compte suspendu — accès révoqué
                </div>
              )}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {detail.statut === 'ACTIF' && detail.role !== 'DIRECTEUR' && (
                <button onClick={() => handleSuspendre(detail.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Suspendre</button>
              )}
              {detail.statut !== 'ACTIF' && (
                <>
                  <button onClick={() => handleActiver(detail.id)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Activer</button>
                  {detail.role !== 'DIRECTEUR' && <button onClick={() => handleSupprimer(detail.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Supprimer</button>}
                </>
              )}
              <button onClick={() => setDetail(null)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
