'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

/**
 * Tarifs de la bibliothèque.
 *
 * Ces montants ne sont pas décoratifs : ils déterminent l'amende calculée au
 * retour d'un ouvrage en retard et la somme réclamée en cas de perte. Le calcul
 * se fait côté serveur à partir de ces valeurs, jamais dans l'écran.
 */

const B = '#e6ebf1';

interface Tarifs {
  dureeJoursDefaut: number;
  dureeJoursMax: number;
  penaliteParJour: number;
  penaliteMax: number;
  valeurRemplacementDefaut: number;
  prixEmprunt: number;
  abonnementMensuel: number;
}

const DEFAUTS: Tarifs = {
  dureeJoursDefaut: 14, dureeJoursMax: 60,
  penaliteParJour: 100, penaliteMax: 5000, valeurRemplacementDefaut: 10000,
  prixEmprunt: 0, abonnementMensuel: 0,
};

const inp: React.CSSProperties = { width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };
const aide: React.CSSProperties = { fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 };

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

  const fmt = (n: number) => n.toLocaleString('fr-FR');
  /** Nombre de jours au-delà duquel le plafond est atteint. */
  const joursAvantPlafond = tarifs.penaliteParJour > 0 && tarifs.penaliteMax > 0
    ? Math.ceil(tarifs.penaliteMax / tarifs.penaliteParJour)
    : null;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 18, lineHeight: 1.5 }}>
        Ces montants servent au calcul automatique des amendes : pénalité de retard au
        retour d&apos;un ouvrage, somme réclamée en cas de perte.
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Prix</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
          <div>
            <label style={lbl}>Prix par emprunt (FCFA)</label>
            <input type="number" min={0} value={tarifs.prixEmprunt} onChange={(e) => modifier('prixEmprunt', e.target.value)} style={inp} />
            <div style={aide}>Facturé à chaque prêt. 0 = emprunt gratuit.</div>
          </div>
          <div>
            <label style={lbl}>Abonnement mensuel (FCFA)</label>
            <input type="number" min={0} value={tarifs.abonnementMensuel} onChange={(e) => modifier('abonnementMensuel', e.target.value)} style={inp} />
            <div style={aide}>Dispense des frais par emprunt. 0 = aucun abonnement proposé.</div>
          </div>
        </div>
        {tarifs.prixEmprunt > 0 && tarifs.abonnementMensuel > 0 && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', border: `1px solid ${B}`, fontSize: 12, color: '#475569' }}>
            L&apos;abonnement devient avantageux à partir de{' '}
            <strong>{Math.ceil(tarifs.abonnementMensuel / tarifs.prixEmprunt)} emprunts</strong> par mois.
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Durée d&apos;emprunt</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
          <div>
            <label style={lbl}>Durée proposée par défaut (jours)</label>
            <input type="number" min={1} value={tarifs.dureeJoursDefaut} onChange={(e) => modifier('dureeJoursDefaut', e.target.value)} style={inp} />
            <div style={aide}>Valeur pré-remplie à l&apos;enregistrement d&apos;un emprunt.</div>
          </div>
          <div>
            <label style={lbl}>Durée maximale (jours)</label>
            <input type="number" min={1} value={tarifs.dureeJoursMax} onChange={(e) => modifier('dureeJoursMax', e.target.value)} style={inp} />
            <div style={aide}>Au-delà, l&apos;emprunt est refusé.</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Retard</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
          <div>
            <label style={lbl}>Pénalité par jour (FCFA)</label>
            <input type="number" min={0} value={tarifs.penaliteParJour} onChange={(e) => modifier('penaliteParJour', e.target.value)} style={inp} />
            <div style={aide}>Mettre 0 pour ne pas facturer les retards.</div>
          </div>
          <div>
            <label style={lbl}>Plafond de la pénalité (FCFA)</label>
            <input type="number" min={0} value={tarifs.penaliteMax} onChange={(e) => modifier('penaliteMax', e.target.value)} style={inp} />
            <div style={aide}>0 = pas de plafond.</div>
          </div>
        </div>
        {tarifs.penaliteParJour > 0 && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8fafc', border: `1px solid ${B}`, fontSize: 12, color: '#475569' }}>
            Un retard de 5 jours coûte <strong>{fmt(Math.min(5 * tarifs.penaliteParJour, tarifs.penaliteMax > 0 ? tarifs.penaliteMax : Infinity))} FCFA</strong>.
            {joursAvantPlafond !== null && <> Le plafond est atteint au bout de {joursAvantPlafond} jour(s).</>}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Perte d&apos;un ouvrage</div>
        <div style={{ maxWidth: 260 }}>
          <label style={lbl}>Valeur de remplacement par défaut (FCFA)</label>
          <input type="number" min={0} value={tarifs.valeurRemplacementDefaut} onChange={(e) => modifier('valeurRemplacementDefaut', e.target.value)} style={inp} />
          <div style={aide}>
            Utilisée uniquement si l&apos;ouvrage n&apos;a pas de valeur renseignée dans le catalogue.
            Renseigner la valeur ouvrage par ouvrage donne un montant plus juste.
          </div>
        </div>
      </div>

      <button onClick={enregistrer} disabled={enregistrement}
        style={{ height: 38, padding: '0 22px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: enregistrement ? 'wait' : 'pointer', opacity: enregistrement ? 0.7 : 1 }}>
        {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}
