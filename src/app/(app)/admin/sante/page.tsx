'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type TypeConsultation = 'SOIN' | 'URGENCE' | 'SUIVI' | 'VACCINATION' | 'VISITE_MEDICALE';
type StatutConsultation = 'EN_COURS' | 'TRAITE' | 'TRANSFERE' | 'RENVOYE_CHEZ';

interface Consultation {
  id: string;
  eleve: string;
  classe: string;
  typeConsultation: TypeConsultation;
  motif: string;
  statut: StatutConsultation;
  dateHeure: string;
  traitementApplique?: string;
  observations?: string;
  parentPrevenu: boolean;
}

interface StockItem {
  id: string;
  nom: string;
  categorie: 'MEDICAMENT' | 'MATERIEL' | 'CONSOMMABLE';
  quantite: number;
  seuilAlerte: number;
  unite: string;
  datePeremption?: string;
}

// ─── Données statiques ────────────────────────────────────────────────────────
const CONSULTATIONS_INIT: Consultation[] = [
  { id: 'c1', eleve: 'DIALLO Mohamed', classe: '6ème A', typeConsultation: 'SOIN', motif: 'Céphalée', statut: 'TRAITE', dateHeure: '2025-06-29T08:15', traitementApplique: 'Paracétamol 500mg', observations: 'Élève renvoyé en classe après 20 min de repos.', parentPrevenu: false },
  { id: 'c2', eleve: 'SOW Fatoumata', classe: '3ème B', typeConsultation: 'URGENCE', motif: 'Chute dans la cour — genou écorché', statut: 'TRAITE', dateHeure: '2025-06-29T09:45', traitementApplique: 'Désinfection + pansement', parentPrevenu: true },
  { id: 'c3', eleve: 'BARRY Mamadou', classe: '5ème A', typeConsultation: 'SOIN', motif: 'Douleurs abdominales', statut: 'RENVOYE_CHEZ', dateHeure: '2025-06-28T11:00', observations: 'Parent contacté et venu récupérer l\'élève.', parentPrevenu: true },
  { id: 'c4', eleve: 'CAMARA Aïssatou', classe: 'Terminale S1', typeConsultation: 'SUIVI', motif: 'Asthme — suivi trimestriel', statut: 'TRAITE', dateHeure: '2025-06-27T14:00', traitementApplique: 'Contrôle du protocole médical', parentPrevenu: false },
  { id: 'c5', eleve: 'TRAORE Ibrahima', classe: '4ème A', typeConsultation: 'URGENCE', motif: 'Malaise pendant le cours de sport', statut: 'TRANSFERE', dateHeure: '2025-06-26T10:30', observations: 'Transfert à la clinique — famille prévenue.', parentPrevenu: true },
];

const STOCK_INIT: StockItem[] = [
  { id: 's1', nom: 'Paracétamol 500mg', categorie: 'MEDICAMENT', quantite: 120, seuilAlerte: 30, unite: 'comprimés', datePeremption: '2026-08-31' },
  { id: 's2', nom: 'Ibuprofène 400mg', categorie: 'MEDICAMENT', quantite: 18, seuilAlerte: 20, unite: 'comprimés', datePeremption: '2025-12-31' },
  { id: 's3', nom: 'Pansements adhésifs', categorie: 'CONSOMMABLE', quantite: 85, seuilAlerte: 50, unite: 'unités' },
  { id: 's4', nom: 'Eau oxygénée 10 vol.', categorie: 'MEDICAMENT', quantite: 4, seuilAlerte: 5, unite: 'flacons', datePeremption: '2025-11-30' },
  { id: 's5', nom: 'Thermomètre', categorie: 'MATERIEL', quantite: 3, seuilAlerte: 2, unite: 'unités' },
  { id: 's6', nom: 'Gants stériles', categorie: 'CONSOMMABLE', quantite: 12, seuilAlerte: 20, unite: 'paires' },
  { id: 's7', nom: 'Soluté de réhydratation', categorie: 'MEDICAMENT', quantite: 24, seuilAlerte: 10, unite: 'sachets', datePeremption: '2026-06-30' },
  { id: 's8', nom: 'Antiseptique cutané', categorie: 'MEDICAMENT', quantite: 6, seuilAlerte: 3, unite: 'flacons', datePeremption: '2026-01-31' },
];

const TYPE_LABELS: Record<TypeConsultation, string> = { SOIN: 'Soin', URGENCE: 'Urgence', SUIVI: 'Suivi médical', VACCINATION: 'Vaccination', VISITE_MEDICALE: 'Visite médicale' };
const TYPE_COLORS: Record<TypeConsultation, string> = { SOIN: '#2563eb', URGENCE: '#dc2626', SUIVI: '#7c3aed', VACCINATION: '#16a34a', VISITE_MEDICALE: '#0369a1' };
const STATUT_LABELS: Record<StatutConsultation, string> = { EN_COURS: 'En cours', TRAITE: 'Traité', TRANSFERE: 'Transféré', RENVOYE_CHEZ: 'Renvoyé chez les parents' };
const STATUT_COLORS: Record<StatutConsultation, string> = { EN_COURS: '#d97706', TRAITE: '#16a34a', TRANSFERE: '#dc2626', RENVOYE_CHEZ: '#7c3aed' };

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{label}</span>;
}

export default function SantePage() {
  const [consultations, setConsultations] = useState<Consultation[]>(CONSULTATIONS_INIT);
  const [stock] = useState<StockItem[]>(STOCK_INIT);
  const [onglet, setOnglet] = useState<'consultations' | 'stock'>('consultations');
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Consultation | null>(null);

  const [form, setForm] = useState({
    eleve: '', classe: '', typeConsultation: 'SOIN' as TypeConsultation,
    motif: '', traitementApplique: '', observations: '',
    statut: 'TRAITE' as StatutConsultation, parentPrevenu: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const alertesStock = stock.filter(s => s.quantite <= s.seuilAlerte);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.eleve.trim()) e.eleve = 'Nom de l\'élève requis';
    if (!form.classe.trim()) e.classe = 'Classe requise';
    if (!form.motif.trim()) e.motif = 'Motif requis';
    return e;
  }

  function handleAjouter() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const nouvelle: Consultation = {
      id: 'c' + Date.now(),
      eleve: form.eleve, classe: form.classe,
      typeConsultation: form.typeConsultation, motif: form.motif,
      statut: form.statut,
      dateHeure: new Date().toISOString(),
      traitementApplique: form.traitementApplique || undefined,
      observations: form.observations || undefined,
      parentPrevenu: form.parentPrevenu,
    };
    setConsultations([nouvelle, ...consultations]);
    setShowModal(false);
    setForm({ eleve: '', classe: '', typeConsultation: 'SOIN', motif: '', traitementApplique: '', observations: '', statut: 'TRAITE', parentPrevenu: false });
    setErrors({});
  }

  const stats = {
    total: consultations.length,
    urgences: consultations.filter(c => c.typeConsultation === 'URGENCE').length,
    transferes: consultations.filter(c => c.statut === 'TRANSFERE').length,
    alertesStock: alertesStock.length,
  };

  const CLASSES = ['6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B', '3ème A', '3ème B', '2nde', '1ère S', 'Terminale S1', 'Terminale L'];

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Santé scolaire</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Consultations · Infirmerie · Stock médical</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + Enregistrer une consultation
        </button>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[{ label: 'Consultations totales', value: stats.total, color: '#0f172a' }, { label: 'Urgences', value: stats.urgences, color: '#dc2626' }, { label: 'Transferts', value: stats.transferes, color: '#d97706' }, { label: 'Alertes stock', value: stats.alertesStock, color: '#dc2626' }].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {alertesStock.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
            Stock faible : {alertesStock.map(s => s.nom).join(', ')} — veuillez renouveler
          </div>
        )}

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e6ebf1' }}>
          {(['consultations', 'stock'] as const).map(o => (
            <button key={o} onClick={() => setOnglet(o)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: onglet === o ? 700 : 400, color: onglet === o ? '#2563eb' : '#64748b', border: 'none', background: 'none', cursor: 'pointer', borderBottom: onglet === o ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2 }}>
              {o === 'consultations' ? `Consultations (${consultations.length})` : `Stock médical (${alertesStock.length} alerte${alertesStock.length > 1 ? 's' : ''})`}
            </button>
          ))}
        </div>

        {onglet === 'consultations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {consultations.map(c => (
              <div key={c.id} style={{ background: '#fff', border: `1px solid ${c.typeConsultation === 'URGENCE' ? '#fecaca' : '#e6ebf1'}`, padding: '14px 18px', cursor: 'pointer' }} onClick={() => setDetail(c)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.eleve}</span>
                      <Badge label={c.classe} color="#475569" />
                      <Badge label={TYPE_LABELS[c.typeConsultation]} color={TYPE_COLORS[c.typeConsultation]} />
                      <Badge label={STATUT_LABELS[c.statut]} color={STATUT_COLORS[c.statut]} />
                      {c.parentPrevenu && <Badge label="Parent prévenu" color="#16a34a" />}
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 5 }}><b>Motif :</b> {c.motif}</div>
                    {c.traitementApplique && <div style={{ fontSize: 12, color: '#64748b' }}><b>Traitement :</b> {c.traitementApplique}</div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      {new Date(c.dateHeure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {onglet === 'stock' && (
          <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                  {['Produit', 'Catégorie', 'Quantité', 'Seuil alerte', 'État', 'Péremption'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stock.map(s => {
                  const enAlerte = s.quantite <= s.seuilAlerte;
                  const perime = s.datePeremption && new Date(s.datePeremption) < new Date();
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: enAlerte ? '#fff8f8' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{s.nom}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge label={s.categorie === 'MEDICAMENT' ? 'Médicament' : s.categorie === 'MATERIEL' ? 'Matériel' : 'Consommable'} color={s.categorie === 'MEDICAMENT' ? '#dc2626' : s.categorie === 'MATERIEL' ? '#2563eb' : '#475569'} />
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: enAlerte ? '#dc2626' : '#0f172a' }}>
                        {s.quantite} {s.unite}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b' }}>{s.seuilAlerte} {s.unite}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {enAlerte
                          ? <Badge label="Stock faible" color="#dc2626" />
                          : <Badge label="OK" color="#16a34a" />
                        }
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: perime ? '#dc2626' : '#64748b', fontWeight: perime ? 600 : 400 }}>
                        {s.datePeremption ? new Date(s.datePeremption).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—'}
                        {perime && <span style={{ fontSize: 10, marginLeft: 4 }}>Expiré</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nouvelle consultation */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 500, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Enregistrer une consultation</span>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom de l&apos;élève *</label>
                  <input value={form.eleve} onChange={e => setForm({ ...form, eleve: e.target.value })} placeholder="Prénom Nom" style={{ width: '100%', border: `1px solid ${errors.eleve ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  {errors.eleve && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.eleve}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Classe *</label>
                  <select value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.classe ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    <option value="">Choisir</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.classe && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.classe}</div>}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type de consultation</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(Object.keys(TYPE_LABELS) as TypeConsultation[]).map(t => (
                    <button key={t} onClick={() => setForm({ ...form, typeConsultation: t })} style={{ padding: '5px 10px', border: `2px solid ${form.typeConsultation === t ? TYPE_COLORS[t] : '#e2e8f0'}`, borderRadius: 5, background: form.typeConsultation === t ? TYPE_COLORS[t] + '12' : '#fff', color: form.typeConsultation === t ? TYPE_COLORS[t] : '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Motif *</label>
                <input value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Motif de la consultation" style={{ width: '100%', border: `1px solid ${errors.motif ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.motif && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.motif}</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Traitement appliqué</label>
                <input value={form.traitementApplique} onChange={e => setForm({ ...form, traitementApplique: e.target.value })} placeholder="Médicament, soin..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Observations</label>
                <textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} rows={3} placeholder="Notes et observations..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Résultat de la consultation</label>
                <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value as StatutConsultation })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  {(Object.keys(STATUT_LABELS) as StatutConsultation[]).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={form.parentPrevenu} onChange={e => setForm({ ...form, parentPrevenu: e.target.checked })} />
                <span>Parent / tuteur prévenu</span>
              </label>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleAjouter} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 460, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Détail de la consultation</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={TYPE_LABELS[detail.typeConsultation]} color={TYPE_COLORS[detail.typeConsultation]} />
                <Badge label={STATUT_LABELS[detail.statut]} color={STATUT_COLORS[detail.statut]} />
                {detail.parentPrevenu && <Badge label="Parent prévenu" color="#16a34a" />}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.eleve}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{detail.classe}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#374151', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
                <div><b>Motif :</b> {detail.motif}</div>
                {detail.traitementApplique && <div><b>Traitement :</b> {detail.traitementApplique}</div>}
                {detail.observations && <div><b>Observations :</b> {detail.observations}</div>}
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(detail.dateHeure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
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
