'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type TypeOuvrage = 'MANUEL' | 'ROMAN' | 'DICTIONNAIRE' | 'ENCYCLOPEDIE' | 'REVUE' | 'MEMOIRE' | 'AUTRE';
type StatutOuvrage = 'DISPONIBLE' | 'EMPRUNTE' | 'RESERVE' | 'PERDU' | 'EN_REPARATION';

interface Ouvrage {
  id: string;
  titre: string;
  auteur: string;
  type: TypeOuvrage;
  isbn?: string;
  annee?: number;
  editeur?: string;
  nbExemplaires: number;
  nbDisponibles: number;
  statut: StatutOuvrage;
  matiere?: string;
  niveau?: string;
}

interface Emprunt {
  id: string;
  ouvrageId: string;
  ouvrageTitre: string;
  emprunteur: string;
  typeEmprunteur: 'ELEVE' | 'ENSEIGNANT';
  dateEmprunt: string;
  dateRetourPrevue: string;
  dateRetourReelle?: string;
  statut: 'EN_COURS' | 'RENDU' | 'EN_RETARD';
}

// ─── Données statiques ────────────────────────────────────────────────────────
const OUVRAGES_INIT: Ouvrage[] = [
  { id: 'o1', titre: 'Mathématiques 3ème', auteur: 'Collectif', type: 'MANUEL', isbn: '978-2-01-123456-7', annee: 2023, editeur: 'Hachette Éducation', nbExemplaires: 35, nbDisponibles: 22, statut: 'DISPONIBLE', matiere: 'Mathématiques', niveau: '3ème' },
  { id: 'o2', titre: 'Français — Terminale L', auteur: 'Collectif', type: 'MANUEL', annee: 2022, editeur: 'Nathan', nbExemplaires: 28, nbDisponibles: 28, statut: 'DISPONIBLE', matiere: 'Français', niveau: 'Terminale' },
  { id: 'o3', titre: 'Physique-Chimie 1ère S', auteur: 'Collectif', type: 'MANUEL', annee: 2023, editeur: 'Bordas', nbExemplaires: 30, nbDisponibles: 18, statut: 'DISPONIBLE', matiere: 'Physique-Chimie', niveau: '1ère' },
  { id: 'o4', titre: 'Le Petit Prince', auteur: 'Antoine de Saint-Exupéry', type: 'ROMAN', isbn: '978-2-07-040850-4', annee: 1943, editeur: 'Gallimard', nbExemplaires: 8, nbDisponibles: 3, statut: 'DISPONIBLE' },
  { id: 'o5', titre: 'Larousse 2025', auteur: 'Larousse', type: 'DICTIONNAIRE', annee: 2024, editeur: 'Larousse', nbExemplaires: 5, nbDisponibles: 5, statut: 'DISPONIBLE' },
  { id: 'o6', titre: 'Histoire-Géographie 6ème', auteur: 'Collectif', type: 'MANUEL', annee: 2021, editeur: 'Magnard', nbExemplaires: 40, nbDisponibles: 0, statut: 'EMPRUNTE', matiere: 'Histoire-Géographie', niveau: '6ème' },
  { id: 'o7', titre: 'L\'Aventure Ambiguë', auteur: 'Cheikh Hamidou Kane', type: 'ROMAN', annee: 1961, editeur: 'Julliard', nbExemplaires: 6, nbDisponibles: 6, statut: 'DISPONIBLE' },
  { id: 'o8', titre: 'Sciences de la Vie et de la Terre — 2nde', auteur: 'Collectif', type: 'MANUEL', annee: 2023, editeur: 'Belin', nbExemplaires: 32, nbDisponibles: 30, statut: 'DISPONIBLE', matiere: 'SVT', niveau: '2nde' },
];

const EMPRUNTS_INIT: Emprunt[] = [
  { id: 'e1', ouvrageId: 'o6', ouvrageTitre: 'Histoire-Géographie 6ème', emprunteur: 'DIALLO Mohamed (6ème A)', typeEmprunteur: 'ELEVE', dateEmprunt: '2025-06-01', dateRetourPrevue: '2025-06-30', statut: 'EN_COURS' },
  { id: 'e2', ouvrageId: 'o1', ouvrageTitre: 'Mathématiques 3ème', emprunteur: 'SOW Fatoumata (3ème B)', typeEmprunteur: 'ELEVE', dateEmprunt: '2025-06-10', dateRetourPrevue: '2025-06-24', statut: 'EN_RETARD' },
  { id: 'e3', ouvrageId: 'o4', ouvrageTitre: 'Le Petit Prince', emprunteur: 'BA Moussa (Enseignant)', typeEmprunteur: 'ENSEIGNANT', dateEmprunt: '2025-06-15', dateRetourPrevue: '2025-07-15', statut: 'EN_COURS' },
  { id: 'e4', ouvrageId: 'o4', ouvrageTitre: 'Le Petit Prince', emprunteur: 'CAMARA Aïcha (6ème B)', typeEmprunteur: 'ELEVE', dateEmprunt: '2025-05-20', dateRetourPrevue: '2025-06-10', dateRetourReelle: '2025-06-08', statut: 'RENDU' },
];

const TYPE_LABELS: Record<TypeOuvrage, string> = { MANUEL: 'Manuel scolaire', ROMAN: 'Roman', DICTIONNAIRE: 'Dictionnaire', ENCYCLOPEDIE: 'Encyclopédie', REVUE: 'Revue', MEMOIRE: 'Mémoire', AUTRE: 'Autre' };
const TYPE_COLORS: Record<TypeOuvrage, string> = { MANUEL: '#2563eb', ROMAN: '#7c3aed', DICTIONNAIRE: '#0369a1', ENCYCLOPEDIE: '#16a34a', REVUE: '#d97706', MEMOIRE: '#475569', AUTRE: '#94a3b8' };
const STATUT_O_LABELS: Record<StatutOuvrage, string> = { DISPONIBLE: 'Disponible', EMPRUNTE: 'Emprunté', RESERVE: 'Réservé', PERDU: 'Perdu', EN_REPARATION: 'En réparation' };
const STATUT_O_COLORS: Record<StatutOuvrage, string> = { DISPONIBLE: '#16a34a', EMPRUNTE: '#d97706', RESERVE: '#2563eb', PERDU: '#dc2626', EN_REPARATION: '#475569' };

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

export default function BibliothequePage() {
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>(OUVRAGES_INIT);
  const [emprunts, setEmprunts] = useState<Emprunt[]>(EMPRUNTS_INIT);
  const [onglet, setOnglet] = useState<'catalogue' | 'emprunts'>('catalogue');
  const [filtreType, setFiltreType] = useState('TOUS');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [recherche, setRecherche] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEmpruntModal, setShowEmpruntModal] = useState(false);
  const [detail, setDetail] = useState<Ouvrage | null>(null);

  const [form, setForm] = useState({ titre: '', auteur: '', type: 'MANUEL' as TypeOuvrage, isbn: '', annee: '', editeur: '', nbExemplaires: '1', matiere: '', niveau: '' });
  const [empruntForm, setEmpruntForm] = useState({ ouvrageId: '', emprunteur: '', typeEmprunteur: 'ELEVE' as 'ELEVE' | 'ENSEIGNANT', dateRetourPrevue: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredOuvrages = ouvrages.filter(o => {
    if (filtreType !== 'TOUS' && o.type !== filtreType) return false;
    if (filtreStatut !== 'TOUS' && o.statut !== filtreStatut) return false;
    const q = recherche.toLowerCase();
    if (q && !o.titre.toLowerCase().includes(q) && !o.auteur.toLowerCase().includes(q)) return false;
    return true;
  });

  const empruntsActifs = emprunts.filter(e => e.statut !== 'RENDU');
  const retards = emprunts.filter(e => e.statut === 'EN_RETARD');

  function validateOuvrage() {
    const e: Record<string, string> = {};
    if (!form.titre.trim()) e.titre = 'Titre requis';
    if (!form.auteur.trim()) e.auteur = 'Auteur requis';
    if (!form.nbExemplaires || parseInt(form.nbExemplaires) < 1) e.nbExemplaires = 'Au moins 1 exemplaire requis';
    return e;
  }

  function handleAjouter() {
    const e = validateOuvrage();
    if (Object.keys(e).length) { setErrors(e); return; }
    const n = parseInt(form.nbExemplaires);
    const nouveau: Ouvrage = {
      id: 'o' + Date.now(),
      titre: form.titre, auteur: form.auteur, type: form.type,
      isbn: form.isbn || undefined, annee: form.annee ? parseInt(form.annee) : undefined,
      editeur: form.editeur || undefined, nbExemplaires: n, nbDisponibles: n,
      statut: 'DISPONIBLE', matiere: form.matiere || undefined, niveau: form.niveau || undefined,
    };
    setOuvrages([nouveau, ...ouvrages]);
    setShowModal(false);
    setForm({ titre: '', auteur: '', type: 'MANUEL', isbn: '', annee: '', editeur: '', nbExemplaires: '1', matiere: '', niveau: '' });
    setErrors({});
  }

  function validateEmprunt() {
    const e: Record<string, string> = {};
    if (!empruntForm.ouvrageId) e.ouvrageId = 'Choisissez un ouvrage';
    if (!empruntForm.emprunteur.trim()) e.emprunteur = 'Nom de l\'emprunteur requis';
    if (!empruntForm.dateRetourPrevue) e.dateRetourPrevue = 'Date de retour requise';
    if (empruntForm.ouvrageId) {
      const o = ouvrages.find(x => x.id === empruntForm.ouvrageId);
      if (o && o.nbDisponibles === 0) e.ouvrageId = 'Aucun exemplaire disponible';
    }
    return e;
  }

  function handleEmprunt() {
    const e = validateEmprunt();
    if (Object.keys(e).length) { setErrors(e); return; }
    const ouvrage = ouvrages.find(x => x.id === empruntForm.ouvrageId)!;
    const nouvelEmprunt: Emprunt = {
      id: 'emp' + Date.now(),
      ouvrageId: empruntForm.ouvrageId,
      ouvrageTitre: ouvrage.titre,
      emprunteur: empruntForm.emprunteur,
      typeEmprunteur: empruntForm.typeEmprunteur,
      dateEmprunt: new Date().toISOString().slice(0, 10),
      dateRetourPrevue: empruntForm.dateRetourPrevue,
      statut: 'EN_COURS',
    };
    setEmprunts([nouvelEmprunt, ...emprunts]);
    setOuvrages(ouvrages.map(o => o.id === empruntForm.ouvrageId ? { ...o, nbDisponibles: o.nbDisponibles - 1, statut: o.nbDisponibles - 1 === 0 ? 'EMPRUNTE' : o.statut } : o));
    setShowEmpruntModal(false);
    setEmpruntForm({ ouvrageId: '', emprunteur: '', typeEmprunteur: 'ELEVE', dateRetourPrevue: '' });
    setErrors({});
  }

  function handleRetour(id: string) {
    const emp = emprunts.find(e => e.id === id)!;
    setEmprunts(emprunts.map(e => e.id === id ? { ...e, statut: 'RENDU', dateRetourReelle: new Date().toISOString().slice(0, 10) } : e));
    setOuvrages(ouvrages.map(o => o.id === emp.ouvrageId ? { ...o, nbDisponibles: o.nbDisponibles + 1, statut: 'DISPONIBLE' } : o));
  }

  const stats = { ouvrages: ouvrages.length, exemplaires: ouvrages.reduce((a, o) => a + o.nbExemplaires, 0), empruntsActifs: empruntsActifs.length, retards: retards.length };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Bibliothèque</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Catalogue · Emprunts · Retards</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowEmpruntModal(true)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Enregistrer un emprunt
          </button>
          <button onClick={() => setShowModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            + Ajouter un ouvrage
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[{ label: 'Titres au catalogue', value: stats.ouvrages, color: '#0f172a' }, { label: 'Total exemplaires', value: stats.exemplaires, color: '#2563eb' }, { label: 'Emprunts en cours', value: stats.empruntsActifs, color: '#d97706' }, { label: 'Retards', value: stats.retards, color: '#dc2626' }].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {retards.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
            {retards.length} emprunt(s) en retard — contactez les emprunteurs concernés
          </div>
        )}

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e6ebf1' }}>
          {(['catalogue', 'emprunts'] as const).map(o => (
            <button key={o} onClick={() => setOnglet(o)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: onglet === o ? 700 : 400, color: onglet === o ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: onglet === o ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2 }}>
              {o === 'catalogue' ? `Catalogue (${ouvrages.length})` : `Emprunts (${empruntsActifs.length} actifs)`}
            </button>
          ))}
        </div>

        {onglet === 'catalogue' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un ouvrage..." style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, flex: 1 }} />
              <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
                <option value="TOUS">Tous les types</option>
                {(Object.keys(TYPE_LABELS) as TypeOuvrage[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
                <option value="TOUS">Tous les statuts</option>
                {(Object.keys(STATUT_O_LABELS) as StatutOuvrage[]).map(s => <option key={s} value={s}>{STATUT_O_LABELS[s]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredOuvrages.length === 0 && (
                <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun ouvrage trouvé</div>
              )}
              {filteredOuvrages.map(o => (
                <div key={o.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', cursor: 'pointer' }} onClick={() => setDetail(o)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 52, background: TYPE_COLORS[o.type] + '15', border: `1px solid ${TYPE_COLORS[o.type]}30`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 20 }}>📚</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{o.titre}</span>
                        <Badge label={TYPE_LABELS[o.type]} color={TYPE_COLORS[o.type]} />
                        <Badge label={STATUT_O_LABELS[o.statut]} color={STATUT_O_COLORS[o.statut]} />
                        {o.niveau && <Badge label={o.niveau} color="#475569" />}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{o.auteur}{o.editeur && ` — ${o.editeur}`}{o.annee && ` (${o.annee})`}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                        <span>{o.nbDisponibles}/{o.nbExemplaires} disponible(s)</span>
                        {o.matiere && <span>{o.matiere}</span>}
                        {o.isbn && <span>ISBN : {o.isbn}</span>}
                      </div>
                    </div>
                    {/* Barre disponibilité */}
                    <div style={{ width: 80, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, textAlign: 'right' }}>{o.nbExemplaires > 0 ? Math.round((o.nbDisponibles / o.nbExemplaires) * 100) : 0}%</div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ height: '100%', background: o.nbDisponibles === 0 ? '#dc2626' : o.nbDisponibles < o.nbExemplaires / 2 ? '#d97706' : '#16a34a', width: `${o.nbExemplaires > 0 ? (o.nbDisponibles / o.nbExemplaires) * 100 : 0}%`, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {onglet === 'emprunts' && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                  {['Ouvrage', 'Emprunteur', 'Date emprunt', 'Retour prévu', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emprunts.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun emprunt</td></tr>
                )}
                {emprunts.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9', background: e.statut === 'EN_RETARD' ? '#fff8f8' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{e.ouvrageTitre}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{e.emprunteur}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{new Date(e.dateEmprunt).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: e.statut === 'EN_RETARD' ? '#dc2626' : '#64748b', fontWeight: e.statut === 'EN_RETARD' ? 600 : 400 }}>
                      {new Date(e.dateRetourPrevue).toLocaleDateString('fr-FR')}
                      {e.statut === 'EN_RETARD' && <span style={{ fontSize: 10, marginLeft: 4 }}>En retard</span>}
                      {e.dateRetourReelle && <div style={{ fontSize: 11, color: '#16a34a' }}>Rendu : {new Date(e.dateRetourReelle).toLocaleDateString('fr-FR')}</div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge label={e.statut === 'EN_COURS' ? 'En cours' : e.statut === 'RENDU' ? 'Rendu' : 'En retard'} color={e.statut === 'RENDU' ? '#16a34a' : e.statut === 'EN_RETARD' ? '#dc2626' : '#d97706'} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {e.statut !== 'RENDU' && (
                        <button onClick={() => handleRetour(e.id)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                          Marquer rendu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal ajout ouvrage */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Ajouter un ouvrage</span>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.titre ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.titre && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.titre}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Auteur *</label>
                <input value={form.auteur} onChange={e => setForm({ ...form, auteur: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.auteur ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.auteur && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.auteur}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TypeOuvrage })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    {(Object.keys(TYPE_LABELS) as TypeOuvrage[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nb exemplaires *</label>
                  <input type="number" min="1" value={form.nbExemplaires} onChange={e => setForm({ ...form, nbExemplaires: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.nbExemplaires ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  {errors.nbExemplaires && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.nbExemplaires}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Éditeur</label>
                  <input value={form.editeur} onChange={e => setForm({ ...form, editeur: e.target.value })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Année</label>
                  <input type="number" value={form.annee} onChange={e => setForm({ ...form, annee: e.target.value })} placeholder="2025" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Matière</label>
                  <input value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Niveau</label>
                  <input value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })} placeholder="6ème, 3ème..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleAjouter} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal emprunt */}
      {showEmpruntModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 440, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Enregistrer un emprunt</span>
              <button onClick={() => { setShowEmpruntModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ouvrage *</label>
                <select value={empruntForm.ouvrageId} onChange={e => setEmpruntForm({ ...empruntForm, ouvrageId: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.ouvrageId ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  <option value="">Choisir un ouvrage...</option>
                  {ouvrages.filter(o => o.nbDisponibles > 0).map(o => (
                    <option key={o.id} value={o.id}>{o.titre} ({o.nbDisponibles} dispo.)</option>
                  ))}
                </select>
                {errors.ouvrageId && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.ouvrageId}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type d&apos;emprunteur</label>
                <select value={empruntForm.typeEmprunteur} onChange={e => setEmpruntForm({ ...empruntForm, typeEmprunteur: e.target.value as 'ELEVE' | 'ENSEIGNANT' })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  <option value="ELEVE">Élève</option>
                  <option value="ENSEIGNANT">Enseignant</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom de l&apos;emprunteur *</label>
                <input value={empruntForm.emprunteur} onChange={e => setEmpruntForm({ ...empruntForm, emprunteur: e.target.value })} placeholder="Nom Prénom (Classe)" style={{ width: '100%', border: `1px solid ${errors.emprunteur ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.emprunteur && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.emprunteur}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date de retour prévue *</label>
                <input type="date" value={empruntForm.dateRetourPrevue} onChange={e => setEmpruntForm({ ...empruntForm, dateRetourPrevue: e.target.value })} min={new Date().toISOString().slice(0, 10)} style={{ width: '100%', border: `1px solid ${errors.dateRetourPrevue ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.dateRetourPrevue && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.dateRetourPrevue}</div>}
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowEmpruntModal(false); setErrors({}); }} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleEmprunt} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail ouvrage */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 440, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Fiche ouvrage</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={TYPE_LABELS[detail.type]} color={TYPE_COLORS[detail.type]} />
                <Badge label={STATUT_O_LABELS[detail.statut]} color={STATUT_O_COLORS[detail.statut]} />
                {detail.niveau && <Badge label={detail.niveau} color="#475569" />}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.titre}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
                <div><b>Auteur :</b> {detail.auteur}</div>
                {detail.editeur && <div><b>Éditeur :</b> {detail.editeur}</div>}
                {detail.annee && <div><b>Année :</b> {detail.annee}</div>}
                {detail.isbn && <div><b>ISBN :</b> {detail.isbn}</div>}
                {detail.matiere && <div><b>Matière :</b> {detail.matiere}</div>}
                <div><b>Exemplaires :</b> {detail.nbDisponibles} disponible(s) sur {detail.nbExemplaires}</div>
              </div>
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
