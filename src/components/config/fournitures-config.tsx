'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

const B = '#e6ebf1';
const inp: React.CSSProperties = { width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };
const btnPrimaire: React.CSSProperties = { height: 34, padding: '0 16px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };
const btnSecondaire: React.CSSProperties = { height: 34, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };
const btnDanger: React.CSSProperties = { height: 28, padding: '0 10px', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };

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

export function FournituresConfig() {
  const [niveaux, setNiveaux] = useState<NiveauAvecFournitures[]>([]);
  const [chargement, setChargement] = useState(true);
  const [niveauOuvert, setNiveauOuvert] = useState<string | null>(null);
  const [modal, setModal] = useState<{ niveauId: string; fourniture?: Fourniture } | null>(null);
  const [form, setForm] = useState(FORM_VIDE);
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = useCallback(() => {
    setChargement(true);
    apiClient.get('/configuration/fournitures')
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : [];
        setNiveaux(data as NiveauAvecFournitures[]);
        if (data.length > 0 && !niveauOuvert) setNiveauOuvert((data[0] as NiveauAvecFournitures).id);
      })
      .catch(() => toast.error('Impossible de charger les fournitures'))
      .finally(() => setChargement(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ouvrirCreation = (niveauId: string) => {
    setForm(FORM_VIDE);
    setModal({ niveauId });
  };

  const ouvrirEdition = (niveauId: string, f: Fourniture) => {
    setForm({ nom: f.nom, quantite: String(f.quantite), description: f.description ?? '', obligatoire: f.obligatoire, ordre: String(f.ordre) });
    setModal({ niveauId, fourniture: f });
  };

  const fermerModal = () => setModal(null);

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
      fermerModal();
      charger();
    } catch {
      toast.error('Enregistrement impossible');
    }
    setEnregistrement(false);
  };

  const supprimer = async (id: string, nom: string) => {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    try {
      await apiClient.delete(`/configuration/fournitures/${id}`);
      toast.success('Fourniture supprimée');
      charger();
    } catch {
      toast.error('Suppression impossible');
    }
  };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;

  if (niveaux.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Aucun niveau configuré. Créez d&apos;abord des cycles et niveaux.</div>;
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18, lineHeight: 1.5 }}>
        Définissez la liste des fournitures par niveau. À l&apos;inscription d&apos;un élève, cette liste est envoyée
        automatiquement au(x) parent(s) par mail et WhatsApp.
      </div>

      {/* Onglets niveaux */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${B}`, marginBottom: 20, overflowX: 'auto' }}>
        {niveaux.map((n) => (
          <button key={n.id} onClick={() => setNiveauOuvert(n.id)}
            style={{
              height: 38, padding: '0 16px', border: 'none', background: 'none', fontFamily: 'inherit',
              fontSize: 13, fontWeight: niveauOuvert === n.id ? 700 : 400,
              color: niveauOuvert === n.id ? '#2563eb' : '#64748b',
              borderBottom: niveauOuvert === n.id ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            {n.libelle}
            {n.fournitures.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '1px 6px', fontWeight: 700 }}>
                {n.fournitures.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu du niveau actif */}
      {niveaux.filter((n) => n.id === niveauOuvert).map((niveau) => (
        <div key={niveau.id}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{niveau.libelle}</div>
            <button onClick={() => ouvrirCreation(niveau.id)} style={btnPrimaire}>+ Ajouter</button>
          </div>

          {niveau.fournitures.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13, border: `1px dashed ${B}` }}>
              Aucune fourniture pour ce niveau. Cliquez sur « + Ajouter » pour commencer.
            </div>
          ) : (
            <div style={{ border: `1px solid ${B}` }}>
              {/* En-tête */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 1fr 80px', gap: 0, padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${B}` }}>
                {['Article', 'Qté', 'Obligatoire', 'Remarque', ''].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</span>
                ))}
              </div>
              {niveau.fournitures.map((f, i) => (
                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 1fr 80px', gap: 0, padding: '10px 14px', borderBottom: i < niveau.fournitures.length - 1 ? `1px solid ${B}` : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{f.nom}</span>
                  <span style={{ fontSize: 13, color: '#334155' }}>{f.quantite}</span>
                  <span style={{ fontSize: 12, color: f.obligatoire ? '#16a34a' : '#64748b', fontWeight: 600 }}>{f.obligatoire ? 'Oui' : 'Non'}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{f.description ?? '—'}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => ouvrirEdition(niveau.id, f)} style={btnSecondaire}>Éditer</button>
                    <button onClick={() => void supprimer(f.id, f.nom)} style={btnDanger}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Modal ajout / édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 480 }}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${B}`, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {modal.fourniture ? 'Modifier la fourniture' : 'Ajouter une fourniture'}
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} placeholder="ex. Cahier grand format" style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Quantité</label>
                  <input type="number" min={1} value={form.quantite} onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Ordre d&apos;affichage</label>
                  <input type="number" min={0} value={form.ordre} onChange={(e) => setForm((f) => ({ ...f, ordre: e.target.value }))} style={inp} />
                </div>
              </div>
              <div>
                <label style={lbl}>Remarque (optionnel)</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="ex. Couverture bleue" style={inp} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="obligatoire" checked={form.obligatoire}
                  onChange={(e) => setForm((f) => ({ ...f, obligatoire: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="obligatoire" style={{ fontSize: 13, color: '#334155', cursor: 'pointer' }}>Obligatoire</label>
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${B}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={fermerModal} style={btnSecondaire}>Annuler</button>
              <button onClick={() => void enregistrer()} disabled={enregistrement}
                style={{ ...btnPrimaire, opacity: enregistrement ? 0.6 : 1 }}>
                {enregistrement ? 'Enregistrement…' : modal.fourniture ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
