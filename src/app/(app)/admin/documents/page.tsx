'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type TypeDoc = 'ARRETE' | 'CIRCULAIRE' | 'CONVENTION' | 'REGLEMENT' | 'COMPTE_RENDU' | 'RAPPORT' | 'ATTESTATION' | 'AUTRE';
type StatutDoc = 'BROUILLON' | 'PUBLIE' | 'ARCHIVE';
type AccesDoc = 'PRIVE' | 'INTERNE' | 'PUBLIC';

interface Document {
  id: string;
  titre: string;
  type: TypeDoc;
  statut: StatutDoc;
  acces: AccesDoc;
  description?: string;
  dateCreation: string;
  datePublication?: string;
  auteur: string;
  taille: string;
  format: string;
  tags: string[];
}

// ─── Données statiques ────────────────────────────────────────────────────────
const DOCS_INIT: Document[] = [
  { id: 'd1', titre: 'Règlement intérieur 2025-2026', type: 'REGLEMENT', statut: 'PUBLIE', acces: 'PUBLIC', description: 'Règlement intérieur de l\'établissement en vigueur pour l\'année scolaire 2025-2026.', dateCreation: '2025-09-01', datePublication: '2025-09-05', auteur: 'Direction', taille: '1.2 Mo', format: 'PDF', tags: ['règlement', 'vie scolaire'] },
  { id: 'd2', titre: 'Projet d\'établissement 2024-2027', type: 'RAPPORT', statut: 'PUBLIE', acces: 'INTERNE', description: 'Document stratégique définissant les axes de développement de l\'établissement.', dateCreation: '2024-09-10', datePublication: '2024-09-15', auteur: 'Direction', taille: '3.4 Mo', format: 'PDF', tags: ['stratégie', 'projet'] },
  { id: 'd3', titre: 'Convention partenariat Université XY', type: 'CONVENTION', statut: 'PUBLIE', acces: 'INTERNE', dateCreation: '2025-01-12', datePublication: '2025-01-15', auteur: 'Direction', taille: '840 Ko', format: 'PDF', tags: ['partenariat'] },
  { id: 'd4', titre: 'Compte-rendu Conseil d\'Administration — Mai 2025', type: 'COMPTE_RENDU', statut: 'PUBLIE', acces: 'INTERNE', dateCreation: '2025-05-28', datePublication: '2025-06-02', auteur: 'Secrétariat', taille: '560 Ko', format: 'DOCX', tags: ['CA', 'conseil'] },
  { id: 'd5', titre: 'Rapport d\'activités 2024-2025', type: 'RAPPORT', statut: 'BROUILLON', acces: 'PRIVE', description: 'Rapport annuel d\'activités en cours de rédaction.', dateCreation: '2025-06-20', auteur: 'Direction', taille: '2.1 Mo', format: 'DOCX', tags: ['rapport annuel'] },
  { id: 'd6', titre: 'Arrêté n°2024-08 — Autorisation d\'ouverture', type: 'ARRETE', statut: 'ARCHIVE', acces: 'PRIVE', dateCreation: '2024-08-20', datePublication: '2024-08-22', auteur: 'Ministère', taille: '320 Ko', format: 'PDF', tags: ['autorisation', 'officiel'] },
  { id: 'd7', titre: 'Circulaire rentrée 2025-2026', type: 'CIRCULAIRE', statut: 'PUBLIE', acces: 'INTERNE', dateCreation: '2025-08-15', datePublication: '2025-08-20', auteur: 'Direction', taille: '180 Ko', format: 'PDF', tags: ['rentrée'] },
  { id: 'd8', titre: 'Modèle attestation de scolarité', type: 'ATTESTATION', statut: 'PUBLIE', acces: 'INTERNE', dateCreation: '2025-09-01', datePublication: '2025-09-01', auteur: 'Secrétariat', taille: '95 Ko', format: 'DOCX', tags: ['modèle', 'attestation'] },
];

const TYPE_LABELS: Record<TypeDoc, string> = { ARRETE: 'Arrêté', CIRCULAIRE: 'Circulaire', CONVENTION: 'Convention', REGLEMENT: 'Règlement', COMPTE_RENDU: 'Compte-rendu', RAPPORT: 'Rapport', ATTESTATION: 'Attestation', AUTRE: 'Autre' };
const TYPE_COLORS: Record<TypeDoc, string> = { ARRETE: '#dc2626', CIRCULAIRE: '#2563eb', CONVENTION: '#7c3aed', REGLEMENT: '#0369a1', COMPTE_RENDU: '#475569', RAPPORT: '#16a34a', ATTESTATION: '#d97706', AUTRE: '#94a3b8' };
const STATUT_LABELS: Record<StatutDoc, string> = { BROUILLON: 'Brouillon', PUBLIE: 'Publié', ARCHIVE: 'Archivé' };
const STATUT_COLORS: Record<StatutDoc, string> = { BROUILLON: '#94a3b8', PUBLIE: '#16a34a', ARCHIVE: '#d97706' };
const ACCES_LABELS: Record<AccesDoc, string> = { PRIVE: 'Privé', INTERNE: 'Interne', PUBLIC: 'Public' };
const ACCES_COLORS: Record<AccesDoc, string> = { PRIVE: '#dc2626', INTERNE: '#d97706', PUBLIC: '#16a34a' };
const FORMATS: Record<string, string> = { PDF: '#dc2626', DOCX: '#2563eb', XLSX: '#16a34a', PPTX: '#d97706' };

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

function FormatBadge({ format }: { format: string }) {
  const color = FORMATS[format] || '#94a3b8';
  return <span style={{ background: color, color: '#fff', borderRadius: 3, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>{format}</span>;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>(DOCS_INIT);
  const [filtreType, setFiltreType] = useState('TOUS');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [recherche, setRecherche] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Document | null>(null);

  const [form, setForm] = useState({
    titre: '', type: 'RAPPORT' as TypeDoc, acces: 'INTERNE' as AccesDoc,
    description: '', format: 'PDF', tags: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = docs.filter(d => {
    if (filtreType !== 'TOUS' && d.type !== filtreType) return false;
    if (filtreStatut !== 'TOUS' && d.statut !== filtreStatut) return false;
    if (recherche && !d.titre.toLowerCase().includes(recherche.toLowerCase()) && !d.tags.some(t => t.includes(recherche.toLowerCase()))) return false;
    return true;
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.titre.trim()) e.titre = 'Titre requis';
    return e;
  }

  function handleAjouter(publier = false) {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const nouveau: Document = {
      id: 'd' + Date.now(),
      titre: form.titre,
      type: form.type,
      statut: publier ? 'PUBLIE' : 'BROUILLON',
      acces: form.acces,
      description: form.description || undefined,
      dateCreation: new Date().toISOString().slice(0, 10),
      datePublication: publier ? new Date().toISOString().slice(0, 10) : undefined,
      auteur: 'Direction',
      taille: '0 Ko',
      format: form.format,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setDocs([nouveau, ...docs]);
    setShowModal(false);
    setForm({ titre: '', type: 'RAPPORT', acces: 'INTERNE', description: '', format: 'PDF', tags: '' });
    setErrors({});
  }

  function handlePublier(id: string) {
    setDocs(docs.map(d => d.id === id ? { ...d, statut: 'PUBLIE', datePublication: new Date().toISOString().slice(0, 10) } : d));
    if (detail?.id === id) setDetail({ ...detail, statut: 'PUBLIE', datePublication: new Date().toISOString().slice(0, 10) });
  }

  function handleArchiver(id: string) {
    if (!confirm('Archiver ce document ? Il ne sera plus visible par les utilisateurs.')) return;
    setDocs(docs.map(d => d.id === id ? { ...d, statut: 'ARCHIVE' } : d));
    setDetail(null);
  }

  function handleSupprimer(id: string) {
    const d = docs.find(x => x.id === id);
    if (d?.statut === 'PUBLIE') { alert('Impossible de supprimer un document publié. Archivez-le d\'abord.'); return; }
    if (!confirm('Supprimer définitivement ce document ?')) return;
    setDocs(docs.filter(x => x.id !== id));
    setDetail(null);
  }

  const stats = { total: docs.length, publies: docs.filter(d => d.statut === 'PUBLIE').length, brouillons: docs.filter(d => d.statut === 'BROUILLON').length, archives: docs.filter(d => d.statut === 'ARCHIVE').length };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Documents officiels</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Règlements · Arrêtés · Conventions · Rapports</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + Ajouter un document
        </button>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[{ label: 'Total', value: stats.total, color: '#0f172a' }, { label: 'Publiés', value: stats.publies, color: '#16a34a' }, { label: 'Brouillons', value: stats.brouillons, color: '#94a3b8' }, { label: 'Archivés', value: stats.archives, color: '#d97706' }].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un document..." style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, flex: 1 }} />
          <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Tous les types</option>
            {(Object.keys(TYPE_LABELS) as TypeDoc[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Tous les statuts</option>
            {(['BROUILLON', 'PUBLIE', 'ARCHIVE'] as StatutDoc[]).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#64748b' }}>{filtered.length} document(s)</div>
        </div>

        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Aucun document trouvé
            </div>
          )}
          {filtered.map(d => (
            <div key={d.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', cursor: 'pointer' }} onClick={() => setDetail(d)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: (FORMATS[d.format] || '#94a3b8') + '15', border: `1px solid ${FORMATS[d.format] || '#94a3b8'}30`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FormatBadge format={d.format} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{d.titre}</span>
                    <Badge label={TYPE_LABELS[d.type]} color={TYPE_COLORS[d.type]} />
                    <Badge label={STATUT_LABELS[d.statut]} color={STATUT_COLORS[d.statut]} />
                    <Badge label={ACCES_LABELS[d.acces]} color={ACCES_COLORS[d.acces]} />
                  </div>
                  {d.description && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</div>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                    <span>{d.auteur}</span>
                    <span>Créé le {new Date(d.dateCreation).toLocaleDateString('fr-FR')}</span>
                    {d.datePublication && <span>Publié le {new Date(d.datePublication).toLocaleDateString('fr-FR')}</span>}
                    <span>{d.taille}</span>
                    {d.tags.length > 0 && <span>{d.tags.map(t => '#' + t).join(' ')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  {d.statut === 'BROUILLON' && (
                    <button onClick={() => handlePublier(d.id)} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Publier
                    </button>
                  )}
                  {d.statut === 'PUBLIE' && (
                    <button onClick={() => handleArchiver(d.id)} style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#d97706', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Archiver
                    </button>
                  )}
                  {d.statut !== 'PUBLIE' && (
                    <button onClick={() => handleSupprimer(d.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal ajout */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Nouveau document</span>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre du document" style={{ width: '100%', border: `1px solid ${errors.titre ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.titre && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.titre}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TypeDoc })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    {(Object.keys(TYPE_LABELS) as TypeDoc[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Format</label>
                  <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    {['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Accès</label>
                <select value={form.acces} onChange={e => setForm({ ...form, acces: e.target.value as AccesDoc })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  <option value="PRIVE">Privé (direction uniquement)</option>
                  <option value="INTERNE">Interne (tout le personnel)</option>
                  <option value="PUBLIC">Public (parents et élèves)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Description du document (optionnel)" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tags (séparés par des virgules)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="ex : rentrée, officiel, 2025" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => handleAjouter(false)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Sauvegarder brouillon
              </button>
              <button onClick={() => handleAjouter(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Ajouter et publier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Détail du document</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <FormatBadge format={detail.format} />
                <Badge label={TYPE_LABELS[detail.type]} color={TYPE_COLORS[detail.type]} />
                <Badge label={STATUT_LABELS[detail.statut]} color={STATUT_COLORS[detail.statut]} />
                <Badge label={ACCES_LABELS[detail.acces]} color={ACCES_COLORS[detail.acces]} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.titre}</div>
              {detail.description && <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{detail.description}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#64748b' }}>
                <div><b>Auteur :</b> {detail.auteur}</div>
                <div><b>Créé le :</b> {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}</div>
                {detail.datePublication && <div><b>Publié le :</b> {new Date(detail.datePublication).toLocaleDateString('fr-FR')}</div>}
                <div><b>Taille :</b> {detail.taille}</div>
                {detail.tags.length > 0 && <div><b>Tags :</b> {detail.tags.map(t => '#' + t).join(', ')}</div>}
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {detail.statut === 'BROUILLON' && <button onClick={() => handlePublier(detail.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Publier</button>}
              {detail.statut === 'PUBLIE' && <button onClick={() => handleArchiver(detail.id)} style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Archiver</button>}
              {detail.statut !== 'PUBLIE' && <button onClick={() => handleSupprimer(detail.id)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Supprimer</button>}
              <button onClick={() => setDetail(null)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
