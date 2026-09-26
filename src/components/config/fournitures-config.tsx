'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

interface Fourniture {
  id: string;
  nom: string;
  quantite: number;
  description: string | null;
  obligatoire: boolean;
  ordre: number;
}

interface NiveauAvecFournitures {
  id: string;
  libelle: string;
  code: string;
  ordre: number;
  fournitures: Fourniture[];
}

const FORM_VIDE = { nom: '', quantite: '1', description: '', obligatoire: true, ordre: '0' };

const inp: React.CSSProperties = {
  width: '100%', height: 30, border: '1px solid #d9e0e8',
  padding: '0 8px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};

export function FournituresConfig() {
  const [niveaux, setNiveaux] = useState<NiveauAvecFournitures[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modal, setModal] = useState<{ niveauId: string; fourniture?: Fourniture } | null>(null);
  const [form, setForm] = useState(FORM_VIDE);
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    apiClient.get('/configuration/fournitures')
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : [];
        setNiveaux(data as NiveauAvecFournitures[]);
      })
      .catch(() => toast.error('Impossible de charger les fournitures'))
      .finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirCreation = (niveauId: string) => { setForm(FORM_VIDE); setModal({ niveauId }); };

  const ouvrirEdition = (niveauId: string, f: Fourniture) => {
    setForm({ nom: f.nom, quantite: String(f.quantite), description: f.description ?? '', obligatoire: f.obligatoire, ordre: String(f.ordre) });
    setModal({ niveauId, fourniture: f });
  };

  const enregistrer = async () => {
    if (!modal) return;
    if (!form.nom.trim()) { toast.error('Nom requis'); return; }
    setEnregistrement(true);
    const payload = {
      niveauId: modal.niveauId,
      nom: form.nom.trim(),
      quantite: Number(form.quantite) || 1,
      description: form.description.trim() || null,
      obligatoire: form.obligatoire,
      ordre: Number(form.ordre) || 0,
    };
    try {
      if (modal.fourniture) {
        await apiClient.put(`/configuration/fournitures/${modal.fourniture.id}`, payload);
        toast.success('Fourniture modifiée');
      } else {
        await apiClient.post('/configuration/fournitures', payload);
        toast.success('Fourniture ajoutée');
      }
      setModal(null);
      charger();
    } catch { toast.error('Enregistrement impossible'); }
    setEnregistrement(false);
  };

  const supprimer = async (id: string, nom: string) => {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    try {
      await apiClient.delete(`/configuration/fournitures/${id}`);
      toast.success('Fourniture supprimée');
      charger();
    } catch { toast.error('Suppression impossible'); }
  };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;

  if (niveaux.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun niveau configuré. Créez d&apos;abord des cycles et niveaux.</div>;
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18, lineHeight: 1.5 }}>
        Définissez la liste des fournitures scolaires par niveau. À l&apos;inscription d&apos;un élève, cette liste est
        envoyée automatiquement au(x) parent(s) par mail et WhatsApp.
      </div>

      {/* Une carte par niveau */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {niveaux.map((niveau) => (
          <div key={niveau.id} style={{ background: '#fff', border: '1px solid #e6ebf1' }}>
            {/* En-tête carte */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e6ebf1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{niveau.libelle}</span>
                <span style={{ fontSize: 11, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', fontWeight: 600 }}>{niveau.code}</span>
                {niveau.fournitures.length > 0 && (
                  <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '2px 7px', fontWeight: 700 }}>
                    {niveau.fournitures.length} article{niveau.fournitures.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => ouvrirCreation(niveau.id)}
                style={{ height: 30, padding: '0 12px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                + Ajouter
              </button>
            </div>

            {/* Tableau fournitures */}
            {niveau.fournitures.length === 0 ? (
              <div style={{ padding: '20px 20px', color: '#94a3b8', fontSize: 12 }}>
                Aucune fourniture — cliquez sur « + Ajouter » pour en créer.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 1fr 100px', padding: '8px 20px', background: '#f8fafc', borderBottom: '1px solid #e6ebf1' }}>
                  {['Article', 'Qté', 'Obligatoire', 'Remarque', ''].map((h) => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                  ))}
                </div>
                {niveau.fournitures.map((f, i) => (
                  <div key={f.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 70px 90px 1fr 100px',
                    padding: '10px 20px', alignItems: 'center',
                    borderBottom: i < niveau.fournitures.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{f.nom}</span>
                    <span style={{ fontSize: 13, color: '#334155' }}>{f.quantite}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: f.obligatoire ? '#16a34a' : '#64748b', background: f.obligatoire ? '#dcfce7' : '#f1f5f9', padding: '2px 7px', width: 'fit-content' }}>
                      {f.obligatoire ? 'Obligatoire' : 'Facultatif'}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{f.description ?? '—'}</span>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => ouvrirEdition(niveau.id, f)}
                        style={{ height: 28, padding: '0 10px', fontSize: 11, fontWeight: 600, color: '#2563eb', border: '1px solid #bfdbfe', background: '#eff6ff', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Modifier
                      </button>
                      <button onClick={() => void supprimer(f.id, f.nom)}
                        style={{ height: 28, padding: '0 10px', fontSize: 11, fontWeight: 600, color: '#dc2626', border: '1px solid #fecaca', background: '#fff1f2', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Modal ajout / édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 460 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6ebf1', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {modal.fourniture ? 'Modifier la fourniture' : 'Ajouter une fourniture'}
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="ex. Cahier grand format" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Quantité</label>
                  <input type="number" min={1} value={form.quantite} onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Ordre d&apos;affichage</label>
                  <input type="number" min={0} value={form.ordre} onChange={(e) => setForm((f) => ({ ...f, ordre: e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Remarque (optionnel)</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="ex. Couverture bleue" style={inp} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.obligatoire}
                  onChange={(e) => setForm((f) => ({ ...f, obligatoire: e.target.checked }))}
                  style={{ width: 15, height: 15 }} />
                <span style={{ fontSize: 13, color: '#334155' }}>Obligatoire</span>
              </label>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e6ebf1', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)}
                style={{ height: 32, padding: '0 14px', border: '1px solid #d9e0e8', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={() => void enregistrer()} disabled={enregistrement}
                style={{ height: 32, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: enregistrement ? 'wait' : 'pointer', opacity: enregistrement ? 0.7 : 1 }}>
                {enregistrement ? 'Enregistrement…' : modal.fourniture ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
