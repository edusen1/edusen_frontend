'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

const B = '#e6ebf1';

interface Tarifs {
  dureeJoursDefaut: number;
  dureeJoursMax: number;
  penaliteParJour: number;
  penaliteMax: number;
  valeurRemplacementDefaut: number;
  prixEmprunt: number;
  abonnementMensuel: number;
  abonnementAnnuel: number;
}

const DEFAUTS: Tarifs = {
  dureeJoursDefaut: 14, dureeJoursMax: 60,
  penaliteParJour: 100, penaliteMax: 5000, valeurRemplacementDefaut: 10000,
  prixEmprunt: 0, abonnementMensuel: 0, abonnementAnnuel: 0,
};

const inp: React.CSSProperties = { width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };

export function BibliothequeConfig() {
  const [tarifs, setTarifs] = useState<Tarifs>(DEFAUTS);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    apiClient.get('/bibliotheque/tarifs')
      .then((r) => setTarifs({ ...DEFAUTS, ...(r.data as Partial<Tarifs>) }))
      .catch(() => toast.error('Tarifs indisponibles'))
      .finally(() => setChargement(false));
  }, []);

  const modifier = (champ: keyof Tarifs, valeur: string) => {
    setTarifs((t) => ({ ...t, [champ]: Number(valeur) || 0 }));
  };

  const enregistrer = async () => {
    if (tarifs.dureeJoursDefaut < 1) { toast.error('La durée par défaut doit être d’au moins 1 jour'); return; }
    if (tarifs.dureeJoursMax < tarifs.dureeJoursDefaut) {
      toast.error('La durée maximale ne peut pas être inférieure à la durée par défaut'); return;
    }
    if (tarifs.penaliteMax > 0 && tarifs.penaliteMax < tarifs.penaliteParJour) {
      toast.error('Le plafond ne peut pas être inférieur à la pénalité journalière'); return;
    }
    setEnregistrement(true);
    try {
      const r = await apiClient.put('/bibliotheque/tarifs', tarifs);
      setTarifs({ ...DEFAUTS, ...(r.data as Partial<Tarifs>) });
      toast.success('Tarifs enregistrés');
    } catch { toast.error('Enregistrement impossible'); }
    setEnregistrement(false);
  };

  if (chargement) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Emprunts</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          <div>
            <label style={lbl}>Durée par défaut (jours)</label>
            <input type="number" min={1} value={tarifs.dureeJoursDefaut} onChange={(e) => modifier('dureeJoursDefaut', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Durée maximale (jours)</label>
            <input type="number" min={1} value={tarifs.dureeJoursMax} onChange={(e) => modifier('dureeJoursMax', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Prix par emprunt (FCFA) — 0 = gratuit</label>
            <input type="number" min={0} value={tarifs.prixEmprunt} onChange={(e) => modifier('prixEmprunt', e.target.value)} style={inp} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Abonnements — 0 = non proposé</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          <div>
            <label style={lbl}>Abonnement mensuel (FCFA)</label>
            <input type="number" min={0} value={tarifs.abonnementMensuel} onChange={(e) => modifier('abonnementMensuel', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Abonnement annuel (FCFA)</label>
            <input type="number" min={0} value={tarifs.abonnementAnnuel} onChange={(e) => modifier('abonnementAnnuel', e.target.value)} style={inp} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Retard</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
          <div>
            <label style={lbl}>Pénalité par jour (FCFA) — 0 = aucune</label>
            <input type="number" min={0} value={tarifs.penaliteParJour} onChange={(e) => modifier('penaliteParJour', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Plafond pénalité (FCFA) — 0 = illimité</label>
            <input type="number" min={0} value={tarifs.penaliteMax} onChange={(e) => modifier('penaliteMax', e.target.value)} style={inp} />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Perte d&apos;un ouvrage</div>
        <div style={{ maxWidth: 260 }}>
          <label style={lbl}>Valeur de remplacement par défaut (FCFA)</label>
          <input type="number" min={0} value={tarifs.valeurRemplacementDefaut} onChange={(e) => modifier('valeurRemplacementDefaut', e.target.value)} style={inp} />
        </div>
      </div>

      <button onClick={enregistrer} disabled={enregistrement}
        style={{ height: 38, padding: '0 22px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: enregistrement ? 'wait' : 'pointer', opacity: enregistrement ? 0.7 : 1 }}>
        {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}
