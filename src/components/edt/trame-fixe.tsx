'use client';

import { heureDescente, libelleHeure, type CreneauGenere, type GrilleCycle } from '@/lib/grille-horaire';

/**
 * Emploi du temps du préscolaire et du primaire.
 *
 * À ces niveaux, un seul enseignant assure toutes les matières dans sa salle, et
 * la journée suit la trame de l'école. Saisir chaque créneau (jour, heures,
 * enseignant, salle) revenait donc à ressaisir des informations déjà connues.
 * Cette vue affiche la trame complète — cours, récréation, descente — et ne
 * demande que la matière.
 */

type EdtItem = {
  id: string; classeId: string; jourSemaine: string;
  heureDebut: string; heureFin: string; matiereId?: string;
};
type ClasseItem = { id: string; nom: string };

interface Props {
  jours: string[];
  creneauxParJour: Record<string, CreneauGenere[]>;
  grille: GrilleCycle;
  classes: ClasseItem[];
  edt: EdtItem[];
  /** Renvoie au minimum la matière du créneau ; l'appelant peut fournir plus. */
  getCreneauInfo: (e: EdtItem) => { matiere?: { libelle?: string } | null };
  onChoisirMatiere: (classeId: string, jour: string, creneau: CreneauGenere) => void;
  onSupprimer: (id: string) => void;
}

const B = '#e6ebf1';

export function TrameFixe({ jours, creneauxParJour, grille, classes, edt, getCreneauInfo, onChoisirMatiere, onSupprimer }: Props) {
  if (classes.length === 0) {
    return (
      <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        Aucune classe pour ce filtre.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {classes.map((classe) => (
        <div key={classe.id} style={{ background: '#fff', border: `1px solid ${B}` }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${B}`, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            {classe.nom}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 620 }}>
              <thead>
                <tr>
                  {jours.map((j) => (
                    <th key={j} style={{ padding: '10px 8px', background: '#f8fafc', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#475569', borderLeft: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
                      {j}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ verticalAlign: 'top' }}>
                  {jours.map((jour) => (
                    <td key={jour} style={{ padding: 8, borderLeft: `1px solid ${B}` }}>
                      {(creneauxParJour[jour] ?? []).map((creneau, i) => {
                        if (creneau.type === 'RECREATION') {
                          return (
                            <div key={i} style={{ marginBottom: 6, padding: '6px 8px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: 10, color: '#b45309', textAlign: 'center', fontWeight: 600 }}>
                              Récréation · {libelleHeure(creneau.heureDebut)}–{libelleHeure(creneau.heureFin)}
                            </div>
                          );
                        }

                        const existant = edt.find(
                          (e) => e.classeId === classe.id && e.jourSemaine === jour
                            && e.heureDebut === creneau.heureDebut && e.heureFin === creneau.heureFin,
                        );
                        const matiere = existant ? getCreneauInfo(existant).matiere?.libelle : null;

                        return (
                          <div key={i} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{creneau.libelle}</div>
                            {existant ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 8px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#1e40af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {matiere ?? 'Matière'}
                                </span>
                                <button
                                  onClick={() => onSupprimer(existant.id)}
                                  title="Retirer"
                                  style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => onChoisirMatiere(classe.id, jour, creneau)}
                                style={{ width: '100%', padding: '7px 8px', border: `1px dashed ${B}`, background: '#fff', color: '#94a3b8', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'center' }}
                              >
                                + Matière
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {(() => {
                        const fin = heureDescente(grille, jour);
                        return fin ? (
                          <div style={{ marginTop: 2, padding: '5px 8px', background: '#f1f5f9', fontSize: 10, color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                            Descente · {libelleHeure(fin)}
                          </div>
                        ) : null;
                      })()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
