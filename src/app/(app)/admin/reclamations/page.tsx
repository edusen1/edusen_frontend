'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminReclamations } from '@/hooks/use-query-api';

const STATIC_RECLAMATIONS = [
  { id: 'r1', auteur: 'Moussa Diallo', role: 'Élève', sujet: 'Erreur sur note Maths T1', statut: 'nouveau', date: '27/06/2026', noteAvant: 8, noteApres: null },
  { id: 'r2', auteur: 'Ibrahima Diallo', role: 'Parent', sujet: 'Absence injustifiée du 24 juin', statut: 'en_cours', date: '26/06/2026', noteAvant: null, noteApres: null },
  { id: 'r3', auteur: 'Fatou Sall', role: 'Élève', sujet: 'Demande de changement de classe', statut: 'nouveau', date: '25/06/2026', noteAvant: null, noteApres: null },
  { id: 'r4', auteur: 'Aminata Diop', role: 'Élève', sujet: 'Problème accès bulletin', statut: 'acceptee', date: '20/06/2026', noteAvant: 8, noteApres: 12 },
  { id: 'r5', auteur: 'Babacar Diop', role: 'Parent', sujet: 'Frais supplémentaires non justifiés', statut: 'rejetee', date: '18/06/2026', noteAvant: null, noteApres: null },
  { id: 'r6', auteur: 'Cheikh Fall', role: 'Élève', sujet: 'Note SVT incorrecte', statut: 'acceptee', date: '15/06/2026', noteAvant: 7, noteApres: 14 },
];

const STATUT_MAP: Record<string, { label: string; bg: string; color: string }> = {
  nouveau: { label: 'Nouveau', bg: '#eff6ff', color: '#2563eb' },
  en_cours: { label: 'En cours', bg: '#fef3c7', color: '#d97706' },
  acceptee: { label: 'Acceptée', bg: '#dcfce7', color: '#16a34a' },
  rejetee: { label: 'Rejetée', bg: '#fee2e2', color: '#dc2626' },
};

type Rec = Record<string, unknown>;

export default function ReclamationsAdminPage() {
  const { data } = useAdminReclamations();
  const rawList = Array.isArray(data) ? data : (data?.reclamations ?? data?.content ?? data?.data ?? []);
  const reclamations = rawList.length > 0 ? rawList : STATIC_RECLAMATIONS;

  const [filterStatut, setFilterStatut] = useState('');
  const [activeTab, setActiveTab] = useState<'en_attente' | 'historique'>('en_attente');
  const [showModal, setShowModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Rec | null>(null);
  const [reponse, setReponse] = useState('');
  const [decision, setDecision] = useState<'acceptee' | 'rejetee'>('acceptee');
  const [nouvelleNote, setNouvelleNote] = useState('');
  const [saving, setSaving] = useState(false);

  const pending = (reclamations as Rec[]).filter((r) => (r.statut as string) === 'nouveau' || (r.statut as string) === 'en_cours');
  const historique = (reclamations as Rec[]).filter((r) => (r.statut as string) === 'acceptee' || (r.statut as string) === 'rejetee');

  const filtered = (activeTab === 'en_attente' ? pending : historique).filter((r) => {
    return !filterStatut || r.statut === filterStatut;
  });

  const nbNouveau = (reclamations as Rec[]).filter((r) => r.statut === 'nouveau').length;
  const nbEnCours = (reclamations as Rec[]).filter((r) => r.statut === 'en_cours').length;
  const nbAcceptees = (reclamations as Rec[]).filter((r) => r.statut === 'acceptee').length;
  const nbRejetees = (reclamations as Rec[]).filter((r) => r.statut === 'rejetee').length;

  const openTraiter = (r: Rec) => {
    setSelectedRec(r);
    setReponse('');
    setDecision('acceptee');
    setNouvelleNote('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!reponse) { toast.error('La réponse est requise'); return; }
    setSaving(true);
    await new Promise((res) => setTimeout(res, 600));
    setSaving(false);
    setShowModal(false);
    toast.success(decision === 'acceptee' ? 'Réclamation acceptée' : 'Réclamation rejetée');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6ebf1', height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Réclamations</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{reclamations.length} total</div>
        {nbNouveau > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px' }}>{nbNouveau} nouveau{nbNouveau > 1 ? 'x' : ''}</span>
        )}
      </div>

      {/* Stats */}
      <div style={{ flexShrink: 0, padding: '18px 28px 0', display: 'flex', gap: 14 }}>
        {[
          { label: 'Nouveaux', val: nbNouveau, bg: '#eff6ff', color: '#2563eb' },
          { label: 'En cours', val: nbEnCours, bg: '#fef3c7', color: '#d97706' },
          { label: 'Acceptées', val: nbAcceptees, bg: '#dcfce7', color: '#16a34a' },
          { label: 'Rejetées', val: nbRejetees, bg: '#fee2e2', color: '#dc2626' },
        ].map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', border: '1px solid #e6ebf1', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 0, borderBottom: '1px solid #e6ebf1', background: '#fff', marginTop: 14 }}>
        {([
          { key: 'en_attente', label: `En attente (${pending.length})` },
          { key: 'historique', label: `Historique (${historique.length})` },
        ] as { key: 'en_attente' | 'historique'; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setFilterStatut(''); }}
            style={{ height: 42, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? '#2563eb' : '#64748b', borderBottom: activeTab === t.key ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        <div style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 100px 120px ' + (activeTab === 'historique' ? '140px ' : '') + '110px', padding: '11px 18px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
            {['Auteur', 'Sujet', 'Date', 'Statut', ...(activeTab === 'historique' ? ['Note avant/après'] : []), 'Actions'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>Aucune réclamation</div>
          )}

          {filtered.map((r, idx) => {
            const id = String(r.id ?? idx);
            const auteur = (r.auteur ?? '') as string;
            const role = (r.role ?? '') as string;
            const sujet = (r.sujet ?? '') as string;
            const date = (r.date ?? '') as string;
            const statut = (r.statut ?? 'nouveau') as string;
            const noteAvant = r.noteAvant as number | null;
            const noteApres = r.noteApres as number | null;
            const st = STATUT_MAP[statut] ?? STATUT_MAP.nouveau;
            const initials = auteur.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div
                key={id}
                style={{ display: 'grid', gridTemplateColumns: '200px 1fr 100px 120px ' + (activeTab === 'historique' ? '140px ' : '') + '110px', padding: '12px 18px', borderBottom: idx < filtered.length - 1 ? '1px solid #eef2f6' : 'none', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{auteur}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{role}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{sujet}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{date}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 8px', display: 'inline-block' }}>{st.label}</span>
                {activeTab === 'historique' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    {noteAvant !== null && noteApres !== null ? (
                      <>
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>{noteAvant}/20</span>
                        <span style={{ color: '#94a3b8' }}>→</span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>{noteApres}/20</span>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  {(statut === 'nouveau' || statut === 'en_cours') && (
                    <button
                      onClick={() => openTraiter(r)}
                      style={{ height: 30, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      Traiter
                    </button>
                  )}
                  {(statut === 'acceptee' || statut === 'rejetee') && (
                    <button
                      onClick={() => toast.success('Détails de la réclamation')}
                      style={{ height: 30, padding: '0 12px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      Voir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Traiter */}
      {showModal && selectedRec && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 520, boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e6ebf1' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Traiter la réclamation</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>"{selectedRec.sujet as string}"</div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {/* Info */}
              <div style={{ background: '#f8fafc', border: '1px solid #e6ebf1', padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <strong style={{ color: '#334155' }}>Auteur :</strong> {selectedRec.auteur as string} ({selectedRec.role as string})
                </div>
              </div>

              {/* Décision */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 8 }}>Décision</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['acceptee', 'rejetee'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDecision(d)}
                      style={{ flex: 1, height: 38, border: `2px solid ${decision === d ? (d === 'acceptee' ? '#16a34a' : '#dc2626') : '#d9e0e8'}`, background: decision === d ? (d === 'acceptee' ? '#f0fdf4' : '#fef2f2') : '#fff', color: decision === d ? (d === 'acceptee' ? '#16a34a' : '#dc2626') : '#64748b', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      {d === 'acceptee' ? '✓ Accepter' : '✗ Rejeter'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note correcte si acceptée et note existe */}
              {decision === 'acceptee' && (selectedRec.noteAvant as number | null) !== null && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
                    Note actuelle : <strong>{selectedRec.noteAvant as number}/20</strong> → Nouvelle note
                  </label>
                  <input
                    type="number"
                    value={nouvelleNote}
                    onChange={(e) => setNouvelleNote(e.target.value)}
                    min={0}
                    max={20}
                    placeholder="Ex: 12"
                    style={{ width: '100%', height: 38, border: '1px solid #d9e0e8', padding: '0 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Réponse */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Réponse / commentaire</label>
                <textarea
                  value={reponse}
                  onChange={(e) => setReponse(e.target.value)}
                  rows={4}
                  placeholder="Rédigez votre réponse à l'auteur de la réclamation…"
                  style={{ width: '100%', border: '1px solid #d9e0e8', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #e6ebf1' }}>
              <button onClick={() => setShowModal(false)} style={{ height: 38, padding: '0 16px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>Annuler</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ height: 38, padding: '0 20px', border: 'none', background: decision === 'acceptee' ? '#16a34a' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Enregistrement…' : decision === 'acceptee' ? 'Accepter & Répondre' : 'Rejeter & Répondre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
