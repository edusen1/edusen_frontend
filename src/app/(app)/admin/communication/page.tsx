'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Canal = 'NOTIFICATION' | 'SMS' | 'EMAIL' | 'WHATSAPP';
type Statut = 'PLANIFIE' | 'ENVOYE' | 'ECHEC' | 'BROUILLON';
type Cible = 'TOUS' | 'ELEVES' | 'PARENTS' | 'ENSEIGNANTS' | 'PERSONNEL' | 'RH' | 'COMPTABLES' | 'SURVEILLANTS' | 'SECURITE' | 'CLASSE';

interface Message {
  id: string;
  titre: string;
  contenu: string;
  canal: Canal;
  cible: Cible;
  classeId?: string;
  statut: Statut;
  dateEnvoi?: string;
  dateCreation: string;
  nbDestinataires: number;
  nbLus?: number;
  auteur: string;
}

// ─── Données statiques ────────────────────────────────────────────────────────
const CLASSES = ['6ème A', '6ème B', '5ème A', '5ème B', '4ème A', '4ème B', '3ème A', '3ème B', '2nde', '1ère S', 'Terminale S1', 'Terminale L'];

const MESSAGES_INIT: Message[] = [
  { id: 'm1', titre: 'Réunion parents d\'élèves — 3ème trimestre', contenu: 'Nous vous informons qu\'une réunion parents-enseignants se tiendra le vendredi 4 juillet 2025 à 15h00 dans la salle polyvalente.', canal: 'NOTIFICATION', cible: 'PARENTS', statut: 'ENVOYE', dateEnvoi: '2025-06-20T10:00', dateCreation: '2025-06-19', nbDestinataires: 312, nbLus: 198, auteur: 'Direction' },
  { id: 'm2', titre: 'Rappel : remise des bulletins', contenu: 'Les bulletins du 3ème trimestre seront disponibles à partir du lundi 30 juin. Merci de vous présenter au secrétariat.', canal: 'SMS', cible: 'PARENTS', statut: 'ENVOYE', dateEnvoi: '2025-06-25T08:30', dateCreation: '2025-06-24', nbDestinataires: 312, auteur: 'Direction' },
  { id: 'm3', titre: 'Fermeture exceptionnelle', contenu: 'L\'établissement sera fermé le mercredi 2 juillet pour travaux de maintenance. Les cours reprennent le jeudi 3 juillet.', canal: 'WHATSAPP', cible: 'TOUS', statut: 'ENVOYE', dateEnvoi: '2025-06-28T09:00', dateCreation: '2025-06-27', nbDestinataires: 847, auteur: 'Direction' },
  { id: 'm4', titre: 'Convocation conseil de classe — 3ème B', contenu: 'Le conseil de classe de 3ème B se tiendra le mardi 1er juillet à 10h. Merci aux délégués parents d\'être présents.', canal: 'EMAIL', cible: 'CLASSE', classeId: '3ème B', statut: 'ENVOYE', dateEnvoi: '2025-06-26T14:00', dateCreation: '2025-06-25', nbDestinataires: 28, nbLus: 22, auteur: 'Direction' },
  { id: 'm5', titre: 'Réunion pédagogique — Juillet', contenu: 'Une réunion pédagogique aura lieu le vendredi 5 juillet à 9h en salle des professeurs. Présence obligatoire.', canal: 'NOTIFICATION', cible: 'ENSEIGNANTS', statut: 'PLANIFIE', dateEnvoi: '2025-07-04T18:00', dateCreation: '2025-06-29', nbDestinataires: 48, auteur: 'Direction' },
  { id: 'm6', titre: 'Brouillon — rentrée scolaire 2025-2026', contenu: 'Chers parents, nous sommes heureux de vous informer que la rentrée scolaire 2025-2026 aura lieu le...', canal: 'SMS', cible: 'PARENTS', statut: 'BROUILLON', dateCreation: '2025-06-29', nbDestinataires: 0, auteur: 'Direction' },
];

const CANAL_LABELS: Record<Canal, string> = { NOTIFICATION: 'Notification', SMS: 'SMS', EMAIL: 'E-mail', WHATSAPP: 'WhatsApp' };
const CANAL_COLORS: Record<Canal, string> = { NOTIFICATION: '#7c3aed', SMS: '#0369a1', EMAIL: '#2563eb', WHATSAPP: '#16a34a' };
const STATUT_LABELS: Record<Statut, string> = { PLANIFIE: 'Planifié', ENVOYE: 'Envoyé', ECHEC: 'Échec', BROUILLON: 'Brouillon' };
const STATUT_COLORS: Record<Statut, string> = { PLANIFIE: '#d97706', ENVOYE: '#16a34a', ECHEC: '#dc2626', BROUILLON: '#94a3b8' };
const CIBLE_LABELS: Record<Cible, string> = {
  TOUS: 'Tous',
  ELEVES: 'Élèves',
  PARENTS: 'Parents',
  ENSEIGNANTS: 'Enseignants',
  PERSONNEL: 'Personnel',
  RH: 'RH',
  COMPTABLES: 'Comptables',
  SURVEILLANTS: 'Surveillants',
  SECURITE: 'Sécurité',
  CLASSE: 'Classe',
};

// ─── Composants ───────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ background: color + '18', color, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {label}
    </span>
  );
}

export default function CommunicationPage() {
  const [messages, setMessages] = useState<Message[]>(MESSAGES_INIT);
  const [filtreStatut, setFiltreStatut] = useState<string>('TOUS');
  const [filtreCanal, setFiltreCanal] = useState<string>('TOUS');
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState<Message | null>(null);

  const [form, setForm] = useState({
    titre: '', contenu: '', canal: 'NOTIFICATION' as Canal,
    cible: 'TOUS' as Cible, classeId: '', dateEnvoi: '', envoiImmediat: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = messages.filter((m) => {
    if (filtreStatut !== 'TOUS' && m.statut !== filtreStatut) return false;
    if (filtreCanal !== 'TOUS' && m.canal !== filtreCanal) return false;
    return true;
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!form.titre.trim()) e.titre = 'Titre requis';
    if (!form.contenu.trim()) e.contenu = 'Contenu requis';
    if (form.cible === 'CLASSE' && !form.classeId) e.classeId = 'Choisissez une classe';
    if (!form.envoiImmediat && !form.dateEnvoi) e.dateEnvoi = 'Date d\'envoi requise';
    if (!form.envoiImmediat && form.dateEnvoi) {
      if (new Date(form.dateEnvoi) <= new Date()) e.dateEnvoi = 'La date planifiée doit être dans le futur';
    }
    return e;
  }

  function handleEnvoyer(brouillon = false) {
    if (!brouillon) {
      const e = validate();
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    const nb = form.cible === 'TOUS' ? 847 : form.cible === 'PARENTS' ? 312 : form.cible === 'ELEVES' ? 847 : form.cible === 'ENSEIGNANTS' ? 48 : form.cible === 'PERSONNEL' ? 14 : form.cible === 'RH' ? 3 : form.cible === 'COMPTABLES' ? 2 : form.cible === 'SURVEILLANTS' ? 6 : form.cible === 'SECURITE' ? 4 : 28;
    const nouveau: Message = {
      id: 'm' + Date.now(),
      titre: form.titre,
      contenu: form.contenu,
      canal: form.canal,
      cible: form.cible,
      classeId: form.cible === 'CLASSE' ? form.classeId : undefined,
      statut: brouillon ? 'BROUILLON' : form.envoiImmediat ? 'ENVOYE' : 'PLANIFIE',
      dateEnvoi: brouillon ? undefined : form.envoiImmediat ? new Date().toISOString() : form.dateEnvoi,
      dateCreation: new Date().toISOString().slice(0, 10),
      nbDestinataires: brouillon ? 0 : nb,
      auteur: 'Direction',
    };
    setMessages([nouveau, ...messages]);
    setShowModal(false);
    setForm({ titre: '', contenu: '', canal: 'NOTIFICATION', cible: 'TOUS', classeId: '', dateEnvoi: '', envoiImmediat: true });
    setErrors({});
  }

  function handleSupprimer(id: string) {
    const m = messages.find(x => x.id === id);
    if (m && m.statut === 'ENVOYE') { alert('Impossible de supprimer un message déjà envoyé.'); return; }
    if (!confirm('Supprimer ce message ?')) return;
    setMessages(messages.filter(x => x.id !== id));
  }

  const stats = {
    total: messages.length,
    envoyes: messages.filter(m => m.statut === 'ENVOYE').length,
    planifies: messages.filter(m => m.statut === 'PLANIFIE').length,
    brouillons: messages.filter(m => m.statut === 'BROUILLON').length,
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Communication</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Notifications · SMS · E-mail · WhatsApp</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          + Nouveau message
        </button>
      </div>

      <div style={{ padding: '20px 28px 0' }}>
        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total messages', value: stats.total, color: '#0f172a' },
            { label: 'Envoyés', value: stats.envoyes, color: '#16a34a' },
            { label: 'Planifiés', value: stats.planifies, color: '#d97706' },
            { label: 'Brouillons', value: stats.brouillons, color: '#94a3b8' },
          ].map(k => (
            <div key={k.label} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', flex: 1 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Tous les statuts</option>
            {(['ENVOYE', 'PLANIFIE', 'BROUILLON', 'ECHEC'] as Statut[]).map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
          </select>
          <select value={filtreCanal} onChange={e => setFiltreCanal(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 12px', fontSize: 13, background: '#fff' }}>
            <option value="TOUS">Tous les canaux</option>
            {(['NOTIFICATION', 'SMS', 'EMAIL', 'WHATSAPP'] as Canal[]).map(c => <option key={c} value={c}>{CANAL_LABELS[c]}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center' }}>
            {filtered.length} message(s)
          </div>
        </div>

        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Aucun message trouvé
            </div>
          )}
          {filtered.map(m => (
            <div key={m.id} style={{ background: '#fff', border: '1px solid #e6ebf1', padding: '14px 18px', cursor: 'pointer' }} onClick={() => setDetail(m)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{m.titre}</span>
                    <Badge label={CANAL_LABELS[m.canal]} color={CANAL_COLORS[m.canal]} />
                    <Badge label={STATUT_LABELS[m.statut]} color={STATUT_COLORS[m.statut]} />
                    <Badge label={m.cible === 'CLASSE' ? m.classeId || 'Classe' : CIBLE_LABELS[m.cible]} color="#475569" />
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.contenu}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
                    <span>{m.auteur}</span>
                    {m.dateEnvoi && <span>{m.statut === 'PLANIFIE' ? 'Planifié le ' : 'Envoyé le '}{new Date(m.dateEnvoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                    {m.nbDestinataires > 0 && <span>{m.nbDestinataires} destinataire(s)</span>}
                    {m.nbLus !== undefined && <span>{m.nbLus} lu(s) ({Math.round((m.nbLus / m.nbDestinataires) * 100)}%)</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  {m.statut !== 'ENVOYE' && (
                    <button onClick={() => handleSupprimer(m.id)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 5, padding: '5px 10px', fontSize: 12, cursor: 'pointer' }}>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nouveau message */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 560, maxHeight: '90vh', overflowY: 'auto', borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Nouveau message</span>
              <button onClick={() => { setShowModal(false); setErrors({}); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Canal */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Canal *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['NOTIFICATION', 'SMS', 'EMAIL', 'WHATSAPP'] as Canal[]).map(c => (
                    <button key={c} onClick={() => setForm({ ...form, canal: c })} style={{ flex: 1, padding: '8px 4px', border: `2px solid ${form.canal === c ? CANAL_COLORS[c] : '#e2e8f0'}`, borderRadius: 6, background: form.canal === c ? CANAL_COLORS[c] + '12' : '#fff', color: form.canal === c ? CANAL_COLORS[c] : '#64748b', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      {CANAL_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Titre */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Titre du message" style={{ width: '100%', border: `1px solid ${errors.titre ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                {errors.titre && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.titre}</div>}
              </div>
              {/* Contenu */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Contenu *</label>
                <textarea value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })} rows={5} placeholder="Rédigez votre message..." style={{ width: '100%', border: `1px solid ${errors.contenu ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                {errors.contenu && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.contenu}</div>}
                {form.canal === 'SMS' && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{form.contenu.length}/160 caractères (SMS)</div>}
              </div>
              {/* Cible */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Destinataires *</label>
                <select value={form.cible} onChange={e => setForm({ ...form, cible: e.target.value as Cible })} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                  {(['TOUS', 'PARENTS', 'ELEVES', 'ENSEIGNANTS', 'PERSONNEL', 'RH', 'COMPTABLES', 'SURVEILLANTS', 'SECURITE', 'CLASSE'] as Cible[]).map(c => (
                    <option key={c} value={c}>{CIBLE_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              {form.cible === 'CLASSE' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Classe *</label>
                  <select value={form.classeId} onChange={e => setForm({ ...form, classeId: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.classeId ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13 }}>
                    <option value="">Choisir une classe</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.classeId && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.classeId}</div>}
                </div>
              )}
              {/* Envoi */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.envoiImmediat} onChange={e => setForm({ ...form, envoiImmediat: e.target.checked })} />
                  <span>Envoyer immédiatement</span>
                </label>
                {!form.envoiImmediat && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date et heure d&apos;envoi *</label>
                    <input type="datetime-local" value={form.dateEnvoi} onChange={e => setForm({ ...form, dateEnvoi: e.target.value })} style={{ width: '100%', border: `1px solid ${errors.dateEnvoi ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    {errors.dateEnvoi && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.dateEnvoi}</div>}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => handleEnvoyer(true)} style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#475569', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Sauvegarder brouillon
              </button>
              <button onClick={() => handleEnvoyer(false)} style={{ background: CANAL_COLORS[form.canal], color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {form.envoiImmediat ? 'Envoyer maintenant' : 'Planifier l\'envoi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 520, borderRadius: 8, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #e6ebf1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Détail du message</span>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={CANAL_LABELS[detail.canal]} color={CANAL_COLORS[detail.canal]} />
                <Badge label={STATUT_LABELS[detail.statut]} color={STATUT_COLORS[detail.statut]} />
                <Badge label={detail.cible === 'CLASSE' ? detail.classeId || 'Classe' : CIBLE_LABELS[detail.cible]} color="#475569" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{detail.titre}</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '12px 14px' }}>{detail.contenu}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748b' }}>
                <div><b>Auteur :</b> {detail.auteur}</div>
                <div><b>Créé le :</b> {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}</div>
                {detail.dateEnvoi && <div><b>{detail.statut === 'PLANIFIE' ? 'Planifié le' : 'Envoyé le'} :</b> {new Date(detail.dateEnvoi).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                {detail.nbDestinataires > 0 && <div><b>Destinataires :</b> {detail.nbDestinataires}</div>}
                {detail.nbLus !== undefined && <div><b>Lus :</b> {detail.nbLus} ({Math.round((detail.nbLus / detail.nbDestinataires) * 100)}%)</div>}
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
