'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import {
  CYCLES_TRAME_FIXE, GRILLE_PAR_DEFAUT, genererCreneaux, libelleHeure,
  type GrilleCycle, type GrilleHoraire,
} from '@/lib/grille-horaire';

/**
 * Paramétrage de la grille horaire, par cycle.
 *
 * Ne concerne que les cycles à trame fixe (préscolaire, primaire) : au collège
 * et au lycée, chaque créneau est saisi individuellement puisque les matières,
 * les enseignants et les salles changent d'une heure à l'autre.
 */

const B = '#e6ebf1';
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const LIBELLES_CYCLE: Record<string, string> = {
  PRESCOLAIRE: 'Préscolaire', MATERNELLE: 'Maternelle', CRECHE: 'Crèche',
  PRIMAIRE: 'Primaire', ELEMENTAIRE: 'Élémentaire',
};

const inp: React.CSSProperties = { width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };

export function HorairesConfig() {
  const [grille, setGrille] = useState<GrilleHoraire>({});
  const [cycle, setCycle] = useState('PRIMAIRE');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/configuration/grille-horaire')
      .then((r) => setGrille((r.data ?? {}) as GrilleHoraire))
      .catch(() => toast.error('Grille horaire indisponible'))
      .finally(() => setLoading(false));
  }, []);

  const actuelle: GrilleCycle = { ...GRILLE_PAR_DEFAUT, ...(grille[cycle] ?? {}) };

  const modifier = (champ: keyof GrilleCycle, valeur: unknown) => {
    setGrille((g) => ({ ...g, [cycle]: { ...actuelle, [champ]: valeur } }));
  };

  /** Un jour est soit en journée complète, soit en matinée seule, soit fermé. */
  const regimeDuJour = (jour: string): 'complet' | 'matin' | 'ferme' => {
    if (actuelle.joursAvecApresMidi.includes(jour)) return 'complet';
    if (actuelle.joursMatinSeul.includes(jour)) return 'matin';
    return 'ferme';
  };

  const changerRegime = (jour: string, regime: 'complet' | 'matin' | 'ferme') => {
    const complet = actuelle.joursAvecApresMidi.filter((j) => j !== jour);
    const matin = actuelle.joursMatinSeul.filter((j) => j !== jour);
    if (regime === 'complet') complet.push(jour);
    if (regime === 'matin') matin.push(jour);
    setGrille((g) => ({ ...g, [cycle]: { ...actuelle, joursAvecApresMidi: complet, joursMatinSeul: matin } }));
  };

  const enregistrer = async () => {
    if (actuelle.matinFin <= actuelle.matinDebut) { toast.error('La fin de matinée doit suivre le début'); return; }
    if (actuelle.apresMidiFin <= actuelle.apresMidiDebut) { toast.error("La fin d'après-midi doit suivre le début"); return; }
    if (actuelle.recreationDebut <= actuelle.matinDebut || actuelle.recreationDebut >= actuelle.matinFin) {
      toast.error('La récréation doit se situer dans la matinée'); return;
    }
    setSaving(true);
    try {
      const r = await apiClient.put('/admin/configuration/grille-horaire', { [cycle]: actuelle });
      setGrille((r.data ?? {}) as GrilleHoraire);
      toast.success('Grille horaire enregistrée');
    } catch { toast.error('Enregistrement impossible'); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>;

  const apercuJour = actuelle.joursAvecApresMidi[0] ?? actuelle.joursMatinSeul[0] ?? 'Lundi';

  return (
    <div style={{ maxWidth: 780 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
        Au préscolaire et au primaire, la journée suit une trame fixe : l&apos;emploi du temps
        ne demande alors que la matière, l&apos;enseignant et la salle étant ceux de la classe.
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={lbl}>Cycle</label>
        <select value={cycle} onChange={(e) => setCycle(e.target.value)} style={{ ...inp, width: 220, background: '#fff' }}>
          {CYCLES_TRAME_FIXE.map((c) => <option key={c} value={c}>{LIBELLES_CYCLE[c] ?? c}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Horaires</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
          <div><label style={lbl}>Début de matinée</label>
            <input type="time" value={actuelle.matinDebut} onChange={(e) => modifier('matinDebut', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Fin de matinée</label>
            <input type="time" value={actuelle.matinFin} onChange={(e) => modifier('matinFin', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Début d&apos;après-midi</label>
            <input type="time" value={actuelle.apresMidiDebut} onChange={(e) => modifier('apresMidiDebut', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Fin d&apos;après-midi</label>
            <input type="time" value={actuelle.apresMidiFin} onChange={(e) => modifier('apresMidiFin', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Début de récréation</label>
            <input type="time" value={actuelle.recreationDebut} onChange={(e) => modifier('recreationDebut', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Durée récréation (min)</label>
            <input type="number" min={5} max={120} value={actuelle.recreationMinutes} onChange={(e) => modifier('recreationMinutes', Number(e.target.value))} style={inp} /></div>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Jours de classe</div>
        {JOURS.map((jour) => (
          <div key={jour} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', borderBottom: `1px solid #f1f5f9` }}>
            <span style={{ width: 90, fontSize: 13, color: '#0f172a' }}>{jour}</span>
            {([['complet', 'Journée complète'], ['matin', 'Matinée seule'], ['ferme', 'Fermé']] as const).map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                <input type="radio" name={`regime-${jour}`} checked={regimeDuJour(jour) === val} onChange={() => changerRegime(jour, val)} />
                {label}
              </label>
            ))}
          </div>
        ))}
      </div>

      {/* Aperçu : le paramétrage est abstrait, la trame générée ne l'est pas. */}
      <div style={{ background: '#f8fafc', border: `1px solid ${B}`, padding: 18, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Aperçu — {apercuJour}</div>
        {genererCreneaux(actuelle, apercuJour).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0', color: c.type === 'RECREATION' ? '#b45309' : '#0f172a' }}>
            <span style={{ width: 110, color: '#94a3b8' }}>{libelleHeure(c.heureDebut)} – {libelleHeure(c.heureFin)}</span>
            <span>{c.type === 'RECREATION' ? 'Récréation' : 'Cours'}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0', color: '#64748b' }}>
          <span style={{ width: 110, color: '#94a3b8' }}>
            {libelleHeure(actuelle.joursAvecApresMidi.includes(apercuJour) ? actuelle.apresMidiFin : actuelle.matinFin)}
          </span>
          <span>Descente</span>
        </div>
      </div>

      <button onClick={enregistrer} disabled={saving}
        style={{ height: 38, padding: '0 22px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}
