'use client';

import { useState } from 'react';

const TEMPLATES = [
  { id: 't1', nom: 'Bulletin de notes', categorie: 'Pédagogie', description: 'Bulletin trimestriel de résultats', format: 'PDF', derniereMaj: '15/09/2025' },
  { id: 't2', nom: 'Attestation de scolarité', categorie: 'Administratif', description: 'Attestation de présence dans l\'établissement', format: 'PDF', derniereMaj: '01/09/2025' },
  { id: 't3', nom: 'Convocation examen', categorie: 'Examens', description: 'Convocation pour les épreuves officielles', format: 'PDF', derniereMaj: '10/01/2026' },
  { id: 't4', nom: 'Certificat de bonne conduite', categorie: 'Administratif', description: 'Certificat délivré par la direction', format: 'PDF', derniereMaj: '01/09/2025' },
  { id: 't5', nom: 'Lettre aux parents', categorie: 'Communication', description: 'Modèle de courrier standard aux familles', format: 'DOCX', derniereMaj: '20/10/2025' },
  { id: 't6', nom: 'Rapport d\'incident', categorie: 'Vie scolaire', description: 'Signalement d\'incident disciplinaire', format: 'PDF', derniereMaj: '01/09/2025' },
  { id: 't7', nom: 'Fiche d\'inscription', categorie: 'Inscriptions', description: 'Formulaire d\'inscription annuelle', format: 'PDF', derniereMaj: '01/07/2025' },
  { id: 't8', nom: 'Reçu de paiement', categorie: 'Finances', description: 'Reçu pour les frais de scolarité', format: 'PDF', derniereMaj: '01/09/2025' },
];

const CATEGORIES = ['Pédagogie', 'Administratif', 'Examens', 'Communication', 'Vie scolaire', 'Inscriptions', 'Finances'];

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  Pédagogie: { bg: '#eff6ff', color: '#2563eb' },
  Administratif: { bg: '#f5f3ff', color: '#7c3aed' },
  Examens: { bg: '#fef3c7', color: '#d97706' },
  Communication: { bg: '#dcfce7', color: '#16a34a' },
  'Vie scolaire': { bg: '#ffedd5', color: '#c2410c' },
  Inscriptions: { bg: '#fce7f3', color: '#be185d' },
  Finances: { bg: '#ecfdf5', color: '#059669' },
};

export default function DocumentTemplatesPage() {
  const [filterCat, setFilterCat] = useState('');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter((t) => {
    const matchSearch = t.nom.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || t.categorie === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Modèles de documents</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{TEMPLATES.length} modèles</div>
        <button style={{ marginLeft: 'auto', height: 38, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
          + Ajouter un modèle
        </button>
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', flex: 1, maxWidth: 300 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un modèle…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0f172a', height: 36, background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ height: 38, border: '1px solid #d9e0e8', background: '#fff', padding: '0 12px', fontSize: 13, color: '#0f172a', fontFamily: 'inherit' }}>
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map((t) => {
            const catColor = CAT_COLORS[t.categorie] ?? { bg: '#f8fafc', color: '#475569' };
            return (
              <div key={t.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, background: catColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={catColor.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: catColor.color, background: catColor.bg, padding: '2px 8px' }}>{t.format}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t.nom}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{t.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #eef2f6' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Màj {t.derniereMaj}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ height: 28, padding: '0 10px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Modifier</button>
                    <button style={{ height: 28, padding: '0 10px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Utiliser</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
