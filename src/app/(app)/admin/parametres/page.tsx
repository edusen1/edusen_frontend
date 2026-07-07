'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Tab = 'annees' | 'cycles' | 'niveaux' | 'matieres' | 'batiments' | 'salles';

const TABS: { key: Tab; label: string }[] = [
  { key: 'annees', label: 'Années scolaires' },
  { key: 'cycles', label: 'Cycles' },
  { key: 'niveaux', label: 'Niveaux' },
  { key: 'matieres', label: 'Matières' },
  { key: 'batiments', label: 'Bâtiments' },
  { key: 'salles', label: 'Salles' },
];

const STATIC_ANNEES = [
  { id: 'a1', libelle: '2025-2026', dateDebut: '01/09/2025', dateFin: '30/06/2026', estCourante: true },
  { id: 'a2', libelle: '2024-2025', dateDebut: '01/09/2024', dateFin: '30/06/2025', estCourante: false },
  { id: 'a3', libelle: '2023-2024', dateDebut: '01/09/2023', dateFin: '30/06/2024', estCourante: false },
];

const STATIC_CYCLES = [
  { id: 'c1', code: 'PRI', libelle: 'Primaire', actif: true },
  { id: 'c2', code: 'COL', libelle: 'Collège', actif: true },
  { id: 'c3', code: 'LYC', libelle: 'Lycée', actif: true },
];

const STATIC_NIVEAUX = [
  { id: 'n1', code: 'CP', libelle: 'CP', cycleId: 'c1', cycleNom: 'Primaire', ordre: 1 },
  { id: 'n2', code: 'CE1', libelle: 'CE1', cycleId: 'c1', cycleNom: 'Primaire', ordre: 2 },
  { id: 'n3', code: 'CE2', libelle: 'CE2', cycleId: 'c1', cycleNom: 'Primaire', ordre: 3 },
  { id: 'n4', code: 'CM1', libelle: 'CM1', cycleId: 'c1', cycleNom: 'Primaire', ordre: 4 },
  { id: 'n5', code: 'CM2', libelle: 'CM2', cycleId: 'c1', cycleNom: 'Primaire', ordre: 5 },
  { id: 'n6', code: '6E', libelle: '6ème', cycleId: 'c2', cycleNom: 'Collège', ordre: 1 },
  { id: 'n7', code: '5E', libelle: '5ème', cycleId: 'c2', cycleNom: 'Collège', ordre: 2 },
  { id: 'n8', code: '4E', libelle: '4ème', cycleId: 'c2', cycleNom: 'Collège', ordre: 3 },
  { id: 'n9', code: '3E', libelle: '3ème', cycleId: 'c2', cycleNom: 'Collège', ordre: 4 },
  { id: 'n10', code: '2ND', libelle: '2nde', cycleId: 'c3', cycleNom: 'Lycée', ordre: 1 },
  { id: 'n11', code: '1RE', libelle: '1ère', cycleId: 'c3', cycleNom: 'Lycée', ordre: 2 },
  { id: 'n12', code: 'TLE', libelle: 'Terminale', cycleId: 'c3', cycleNom: 'Lycée', ordre: 3 },
];

const STATIC_MATIERES = [
  { id: 'm1', nom: 'Mathématiques', code: 'MATH', coefficient: 4, categorie: 'Sciences' },
  { id: 'm2', nom: 'Français', code: 'FR', coefficient: 4, categorie: 'Lettres' },
  { id: 'm3', nom: 'Histoire-Géographie', code: 'HG', coefficient: 2, categorie: 'Sciences Humaines' },
  { id: 'm4', nom: 'Sciences Physiques', code: 'PC', coefficient: 3, categorie: 'Sciences' },
  { id: 'm5', nom: 'SVT', code: 'SVT', coefficient: 2, categorie: 'Sciences' },
  { id: 'm6', nom: 'Anglais', code: 'ANG', coefficient: 2, categorie: 'Langues' },
  { id: 'm7', nom: 'EPS', code: 'EPS', coefficient: 1, categorie: 'Sport' },
  { id: 'm8', nom: 'Informatique', code: 'INFO', coefficient: 1, categorie: 'Sciences' },
];

const STATIC_BATIMENTS = [
  { id: 'b1', nom: 'Bâtiment A', adresse: 'Aile gauche', description: 'Collège — Rez-de-chaussée et 1er étage' },
  { id: 'b2', nom: 'Bâtiment B', adresse: 'Aile droite', description: 'Collège — Niveau supérieur' },
  { id: 'b3', nom: 'Bâtiment C', adresse: 'Centre', description: 'Lycée' },
  { id: 'b4', nom: 'Laboratoires', adresse: 'Fond du campus', description: 'Sciences et Informatique' },
];

const STATIC_SALLES = [
  { id: 's1', nom: 'Salle A01', capacite: 45, batimentId: 'b1', batimentNom: 'Bâtiment A', type: 'CLASSE' },
  { id: 's2', nom: 'Salle A02', capacite: 45, batimentId: 'b1', batimentNom: 'Bâtiment A', type: 'CLASSE' },
  { id: 's3', nom: 'Salle B04', capacite: 45, batimentId: 'b2', batimentNom: 'Bâtiment B', type: 'CLASSE' },
  { id: 's4', nom: 'Labo Sciences', capacite: 30, batimentId: 'b4', batimentNom: 'Laboratoires', type: 'LABORATOIRE' },
  { id: 's5', nom: 'Salle Informatique', capacite: 25, batimentId: 'b4', batimentNom: 'Laboratoires', type: 'SALLE_INFO' },
];

const SALLE_TYPES = ['CLASSE', 'LABORATOIRE', 'BIBLIOTHEQUE', 'SALLE_INFO', 'GYMNASE', 'AUTRE'];

function inputStyle(): React.CSSProperties {
  return { width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
}
function labelStyle(): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 };
}
function fieldWrap(mb = 14): React.CSSProperties {
  return { marginBottom: mb };
}

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<Tab>('annees');

  // Années
  const [annees] = useState(STATIC_ANNEES);
  const [showAnneeModal, setShowAnneeModal] = useState(false);
  const [anneeForm, setAnneeForm] = useState({ libelle: '', dateDebut: '', dateFin: '', estCourante: false });

  // Cycles
  const [cycles] = useState(STATIC_CYCLES);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editCycleId, setEditCycleId] = useState<string | null>(null);
  const [cycleForm, setCycleForm] = useState({ code: '', libelle: '', actif: true });

  // Niveaux
  const [niveaux] = useState(STATIC_NIVEAUX);
  const [showNiveauModal, setShowNiveauModal] = useState(false);
  const [editNiveauId, setEditNiveauId] = useState<string | null>(null);
  const [niveauForm, setNiveauForm] = useState({ code: '', libelle: '', cycleId: '', ordre: 1 });

  // Matières
  const [matieres] = useState(STATIC_MATIERES);
  const [showMatiereModal, setShowMatiereModal] = useState(false);
  const [editMatiereId, setEditMatiereId] = useState<string | null>(null);
  const [matiereForm, setMatiereForm] = useState({ nom: '', code: '', coefficient: 1, categorie: '' });

  // Bâtiments
  const [batiments] = useState(STATIC_BATIMENTS);
  const [showBatimentModal, setShowBatimentModal] = useState(false);
  const [editBatimentId, setEditBatimentId] = useState<string | null>(null);
  const [batimentForm, setBatimentForm] = useState({ nom: '', adresse: '', description: '' });

  // Salles
  const [salles] = useState(STATIC_SALLES);
  const [showSalleModal, setShowSalleModal] = useState(false);
  const [editSalleId, setEditSalleId] = useState<string | null>(null);
  const [salleForm, setSalleForm] = useState({ nom: '', capacite: '', batimentId: '', type: '' });

  const handleSave = (label: string, close: () => void) => {
    toast.success(label);
    close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', flexShrink: 0 }}>
        <div style={{ height: 62, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Paramètres</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Configuration de l&apos;établissement</div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 28px', gap: 0, borderTop: '1px solid #e6ebf1' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                height: 42, padding: '0 18px', border: 'none', background: 'transparent',
                fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400,
                color: activeTab === t.key ? '#2563eb' : '#64748b',
                borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>

        {/* ── ANNÉES ─────────────────────────────────────────────── */}
        {activeTab === 'annees' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#475569' }}>{annees.length} année(s) configurée(s)</span>
              <button onClick={() => setShowAnneeModal(true)} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Nouvelle année
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {annees.map((a) => (
                <div key={a.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{a.libelle}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', background: a.estCourante ? '#dcfce7' : '#f1f5f9', color: a.estCourante ? '#16a34a' : '#64748b' }}>
                        {a.estCourante ? 'Courante' : 'Archivée'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{a.dateDebut} → {a.dateFin}</div>
                  </div>
                  {!a.estCourante && (
                    <button onClick={() => toast.success(`Année ${a.libelle} activée`)} style={{ height: 32, padding: '0 14px', border: '1px solid #2563eb', background: '#fff', color: '#2563eb', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      Activer
                    </button>
                  )}
                  <button onClick={() => toast.info('Modification')} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CYCLES ─────────────────────────────────────────────── */}
        {activeTab === 'cycles' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#475569' }}>{cycles.length} cycle(s)</span>
              <button onClick={() => { setEditCycleId(null); setCycleForm({ code: '', libelle: '', actif: true }); setShowCycleModal(true); }} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Nouveau cycle
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 100px', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Code', 'Libellé', 'Statut', 'Actions'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {cycles.map((c, idx) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 100px', padding: '12px 18px', borderBottom: idx < cycles.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', display: 'inline-block' }}>{c.code}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.libelle}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.actif ? '#16a34a' : '#dc2626', background: c.actif ? '#dcfce7' : '#fee2e2', padding: '3px 8px', display: 'inline-block' }}>{c.actif ? 'Actif' : 'Inactif'}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditCycleId(c.id); setCycleForm({ code: c.code, libelle: c.libelle, actif: c.actif }); setShowCycleModal(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    </button>
                    <button onClick={() => toast.error('Suppression désactivée')} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NIVEAUX ─────────────────────────────────────────────── */}
        {activeTab === 'niveaux' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#475569' }}>{niveaux.length} niveau(x)</span>
              <button onClick={() => { setEditNiveauId(null); setNiveauForm({ code: '', libelle: '', cycleId: '', ordre: 1 }); setShowNiveauModal(true); }} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Nouveau niveau
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 80px 100px', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Code', 'Libellé', 'Cycle', 'Ordre', 'Actions'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {niveaux.map((n, idx) => (
                <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 80px 100px', padding: '11px 18px', borderBottom: idx < niveaux.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', display: 'inline-block' }}>{n.code}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{n.libelle}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{n.cycleNom}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{n.ordre}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditNiveauId(n.id); setNiveauForm({ code: n.code, libelle: n.libelle, cycleId: n.cycleId, ordre: n.ordre }); setShowNiveauModal(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    </button>
                    <button onClick={() => toast.error('Suppression désactivée')} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MATIÈRES ─────────────────────────────────────────────── */}
        {activeTab === 'matieres' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#475569' }}>{matieres.length} matière(s)</span>
              <button onClick={() => { setEditMatiereId(null); setMatiereForm({ nom: '', code: '', coefficient: 1, categorie: '' }); setShowMatiereModal(true); }} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Nouvelle matière
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 100px 100px', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Code', 'Nom', 'Catégorie', 'Coeff.', 'Actions'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {matieres.map((m, idx) => (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 130px 100px 100px', padding: '11px 18px', borderBottom: idx < matieres.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', display: 'inline-block' }}>{m.code}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{m.nom}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{m.categorie}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{m.coefficient}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditMatiereId(m.id); setMatiereForm({ nom: m.nom, code: m.code, coefficient: m.coefficient, categorie: m.categorie }); setShowMatiereModal(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    </button>
                    <button onClick={() => toast.error('Suppression désactivée')} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BÂTIMENTS ─────────────────────────────────────────────── */}
        {activeTab === 'batiments' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#475569' }}>{batiments.length} bâtiment(s)</span>
              <button onClick={() => { setEditBatimentId(null); setBatimentForm({ nom: '', adresse: '', description: '' }); setShowBatimentModal(true); }} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Nouveau bâtiment
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {batiments.map((b) => (
                <div key={b.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{b.nom}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{b.adresse}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditBatimentId(b.id); setBatimentForm({ nom: b.nom, adresse: b.adresse, description: b.description }); setShowBatimentModal(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                      <button onClick={() => toast.error('Suppression désactivée')} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{b.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SALLES ─────────────────────────────────────────────── */}
        {activeTab === 'salles' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: '#475569' }}>{salles.length} salle(s)</span>
              <button onClick={() => { setEditSalleId(null); setSalleForm({ nom: '', capacite: '', batimentId: '', type: '' }); setShowSalleModal(true); }} style={{ height: 36, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Nouvelle salle
              </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 100px', padding: '10px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                {['Salle', 'Bâtiment', 'Type', 'Capacité', 'Actions'].map((h) => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {salles.map((s, idx) => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 100px', padding: '11px 18px', borderBottom: idx < salles.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{s.nom}</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>{s.batimentNom}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '3px 8px', display: 'inline-block' }}>{s.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.capacite}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditSalleId(s.id); setSalleForm({ nom: s.nom, capacite: String(s.capacite), batimentId: s.batimentId, type: s.type }); setShowSalleModal(true); }} style={{ width: 28, height: 28, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    </button>
                    <button onClick={() => toast.error('Suppression désactivée')} style={{ width: 28, height: 28, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL ANNÉE ══ */}
      {showAnneeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nouvelle année scolaire</div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Libellé (ex: 2026-2027)</label>
              <input value={anneeForm.libelle} onChange={(e) => setAnneeForm((f) => ({ ...f, libelle: e.target.value }))} style={inputStyle()} placeholder="2026-2027" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle()}>Date de début</label>
                <input type="date" value={anneeForm.dateDebut} onChange={(e) => setAnneeForm((f) => ({ ...f, dateDebut: e.target.value }))} style={inputStyle()} />
              </div>
              <div>
                <label style={labelStyle()}>Date de fin</label>
                <input type="date" value={anneeForm.dateFin} onChange={(e) => setAnneeForm((f) => ({ ...f, dateFin: e.target.value }))} style={inputStyle()} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={anneeForm.estCourante} onChange={(e) => setAnneeForm((f) => ({ ...f, estCourante: e.target.checked }))} />
              Définir comme année courante
            </label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAnneeModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleSave('Année créée', () => setShowAnneeModal(false))} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL CYCLE ══ */}
      {showCycleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 440, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editCycleId ? 'Modifier le cycle' : 'Nouveau cycle'}</div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Code</label>
              <input value={cycleForm.code} onChange={(e) => setCycleForm((f) => ({ ...f, code: e.target.value }))} style={inputStyle()} placeholder="Ex: COL" />
            </div>
            <div style={fieldWrap(20)}>
              <label style={labelStyle()}>Libellé</label>
              <input value={cycleForm.libelle} onChange={(e) => setCycleForm((f) => ({ ...f, libelle: e.target.value }))} style={inputStyle()} placeholder="Ex: Collège" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCycleModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleSave(editCycleId ? 'Cycle modifié' : 'Cycle créé', () => setShowCycleModal(false))} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{editCycleId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL NIVEAU ══ */}
      {showNiveauModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 440, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editNiveauId ? 'Modifier le niveau' : 'Nouveau niveau'}</div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Code</label>
              <input value={niveauForm.code} onChange={(e) => setNiveauForm((f) => ({ ...f, code: e.target.value }))} style={inputStyle()} placeholder="Ex: 6E" />
            </div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Libellé</label>
              <input value={niveauForm.libelle} onChange={(e) => setNiveauForm((f) => ({ ...f, libelle: e.target.value }))} style={inputStyle()} placeholder="Ex: 6ème" />
            </div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Cycle</label>
              <select value={niveauForm.cycleId} onChange={(e) => setNiveauForm((f) => ({ ...f, cycleId: e.target.value }))} style={{ ...inputStyle(), background: '#fff' }}>
                <option value="">Sélectionner un cycle…</option>
                {STATIC_CYCLES.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>
            <div style={fieldWrap(20)}>
              <label style={labelStyle()}>Ordre</label>
              <input type="number" value={niveauForm.ordre} onChange={(e) => setNiveauForm((f) => ({ ...f, ordre: parseInt(e.target.value) || 1 }))} style={inputStyle()} min={1} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowNiveauModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleSave(editNiveauId ? 'Niveau modifié' : 'Niveau créé', () => setShowNiveauModal(false))} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{editNiveauId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL MATIÈRE ══ */}
      {showMatiereModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editMatiereId ? 'Modifier la matière' : 'Nouvelle matière'}</div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Nom</label>
              <input value={matiereForm.nom} onChange={(e) => setMatiereForm((f) => ({ ...f, nom: e.target.value }))} style={inputStyle()} placeholder="Ex: Mathématiques" />
            </div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Code</label>
              <input value={matiereForm.code} onChange={(e) => setMatiereForm((f) => ({ ...f, code: e.target.value }))} style={inputStyle()} placeholder="Ex: MATH" />
            </div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Catégorie</label>
              <input value={matiereForm.categorie} onChange={(e) => setMatiereForm((f) => ({ ...f, categorie: e.target.value }))} style={inputStyle()} placeholder="Ex: Sciences" />
            </div>
            <div style={fieldWrap(20)}>
              <label style={labelStyle()}>Coefficient</label>
              <select value={matiereForm.coefficient} onChange={(e) => setMatiereForm((f) => ({ ...f, coefficient: parseInt(e.target.value) }))} style={{ ...inputStyle(), background: '#fff' }}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMatiereModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleSave(editMatiereId ? 'Matière modifiée' : 'Matière créée', () => setShowMatiereModal(false))} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{editMatiereId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL BÂTIMENT ══ */}
      {showBatimentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editBatimentId ? 'Modifier le bâtiment' : 'Nouveau bâtiment'}</div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Nom</label>
              <input value={batimentForm.nom} onChange={(e) => setBatimentForm((f) => ({ ...f, nom: e.target.value }))} style={inputStyle()} placeholder="Ex: Bâtiment A" />
            </div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Adresse / Aile</label>
              <input value={batimentForm.adresse} onChange={(e) => setBatimentForm((f) => ({ ...f, adresse: e.target.value }))} style={inputStyle()} placeholder="Ex: Aile gauche" />
            </div>
            <div style={fieldWrap(20)}>
              <label style={labelStyle()}>Description</label>
              <input value={batimentForm.description} onChange={(e) => setBatimentForm((f) => ({ ...f, description: e.target.value }))} style={inputStyle()} placeholder="Ex: Collège — RDC et 1er étage" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBatimentModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleSave(editBatimentId ? 'Bâtiment modifié' : 'Bâtiment créé', () => setShowBatimentModal(false))} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{editBatimentId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL SALLE ══ */}
      {showSalleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>{editSalleId ? 'Modifier la salle' : 'Nouvelle salle'}</div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Nom</label>
              <input value={salleForm.nom} onChange={(e) => setSalleForm((f) => ({ ...f, nom: e.target.value }))} style={inputStyle()} placeholder="Ex: Salle A01" />
            </div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Capacité</label>
              <input type="number" value={salleForm.capacite} onChange={(e) => setSalleForm((f) => ({ ...f, capacite: e.target.value }))} style={inputStyle()} placeholder="Ex: 45" />
            </div>
            <div style={fieldWrap()}>
              <label style={labelStyle()}>Bâtiment</label>
              <select value={salleForm.batimentId} onChange={(e) => setSalleForm((f) => ({ ...f, batimentId: e.target.value }))} style={{ ...inputStyle(), background: '#fff' }}>
                <option value="">Sélectionner un bâtiment…</option>
                {STATIC_BATIMENTS.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </div>
            <div style={fieldWrap(20)}>
              <label style={labelStyle()}>Type</label>
              <select value={salleForm.type} onChange={(e) => setSalleForm((f) => ({ ...f, type: e.target.value }))} style={{ ...inputStyle(), background: '#fff' }}>
                <option value="">Sélectionner un type…</option>
                {SALLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSalleModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => handleSave(editSalleId ? 'Salle modifiée' : 'Salle créée', () => setShowSalleModal(false))} style={{ height: 38, padding: '0 20px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>{editSalleId ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
