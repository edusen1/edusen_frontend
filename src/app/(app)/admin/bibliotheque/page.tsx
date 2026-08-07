'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { formatDateFr } from '@/lib/display';
import { correspond } from '@/lib/recherche';
import { SelecteurEmprunteur, type Emprunteur } from '@/components/bibliotheque/selecteur-emprunteur';

/**
 * Bibliothèque — catalogue et emprunts.
 *
 * Écran entièrement reconstruit : il reposait sur des données statiques, avec
 * des coins arrondis et un emoji absents du reste de l'application.
 */

const B = '#e6ebf1';

type TypeOuvrage = 'MANUEL' | 'ROMAN' | 'DICTIONNAIRE' | 'ENCYCLOPEDIE' | 'REVUE' | 'MEMOIRE' | 'AUTRE';
type StatutEmprunt = 'EN_COURS' | 'RENDU' | 'EN_RETARD' | 'PERDU';

interface Ouvrage {
  id: string; titre: string; auteur: string; type: TypeOuvrage;
  isbn?: string | null; annee?: number | null; editeur?: string | null;
  valeur?: number | null; nbExemplaires: number; nbDisponibles: number;
}

interface Emprunt {
  id: string; statut: StatutEmprunt; dateEmprunt: string; dureeJours: number;
  dateRetourPrevue: string; dateRetourReelle?: string | null;
  montantAmende?: number | null; joursRetard?: number;
  /** Renseigné une fois l'amende encaissée par la caisse. */
  paiementId?: string | null;
  typeEmprunteur?: 'ELEVE' | 'ENSEIGNANT';
  ouvrage?: { id: string; titre: string; auteur: string };
  emprunteur?: { id: string; firstName?: string; lastName?: string; matricule?: string; role?: string };
}

interface Tarifs {
  dureeJoursDefaut: number; dureeJoursMax: number;
  penaliteParJour: number; penaliteMax: number; valeurRemplacementDefaut: number;
}

interface Situation {
  nbEnCours: number; nbEnRetard: number; nbPertes: number;
  amendesDues: number; peutEmprunter: boolean;
  ouvragesEnCours: { id: string; titre: string; dateRetourPrevue: string; enRetard: boolean; joursRetard?: number }[];
  pertes: { id: string; titre: string; montantAmende?: number | null }[];
}

const TYPE_LABELS: Record<TypeOuvrage, string> = {
  MANUEL: 'Manuel', ROMAN: 'Roman', DICTIONNAIRE: 'Dictionnaire',
  ENCYCLOPEDIE: 'Encyclopédie', REVUE: 'Revue', MEMOIRE: 'Mémoire', AUTRE: 'Autre',
};
const STATUT_LABELS: Record<StatutEmprunt, string> = {
  EN_COURS: 'En cours', RENDU: 'Rendu', EN_RETARD: 'En retard', PERDU: 'Perdu',
};
const STATUT_COULEURS: Record<StatutEmprunt, { bg: string; fg: string }> = {
  EN_COURS: { bg: '#eff6ff', fg: '#2563eb' },
  RENDU: { bg: '#dcfce7', fg: '#16a34a' },
  EN_RETARD: { bg: '#fee2e2', fg: '#dc2626' },
  PERDU: { bg: '#f1f5f9', fg: '#475569' },
};

const inp: React.CSSProperties = { width: '100%', height: 36, border: `1px solid ${B}`, padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };
const btnPrimaire: React.CSSProperties = { height: 36, padding: '0 18px', border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' };
const btnSecondaire: React.CSSProperties = { height: 36, padding: '0 14px', border: `1px solid ${B}`, background: '#fff', color: '#334155', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' };

const FORM_OUVRAGE = { titre: '', auteur: '', type: 'MANUEL' as TypeOuvrage, isbn: '', annee: '', editeur: '', valeur: '', nbExemplaires: '1' };

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return <span style={{ background: bg, color: fg, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>;
}

function lire(d: unknown): Record<string, unknown>[] {
  if (Array.isArray(d)) return d as Record<string, unknown>[];
  const o = (d ?? {}) as Record<string, unknown>;
  return (Array.isArray(o.content) ? o.content : Array.isArray(o.data) ? o.data : []) as Record<string, unknown>[];
}

export default function BibliothequePage() {
  const [onglet, setOnglet] = useState<'catalogue' | 'emprunts'>('catalogue');
  const [ouvrages, setOuvrages] = useState<Ouvrage[]>([]);
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [tarifs, setTarifs] = useState<Tarifs | null>(null);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');

  const [modalOuvrage, setModalOuvrage] = useState(false);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [formOuvrage, setFormOuvrage] = useState(FORM_OUVRAGE);

  const [modalEmprunt, setModalEmprunt] = useState(false);
  const [emprunteur, setEmprunteur] = useState<Emprunteur | null>(null);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [chargementSituation, setChargementSituation] = useState(false);
  const [ouvrageId, setOuvrageId] = useState('');
  const [dureeJours, setDureeJours] = useState('14');
  const [enregistrement, setEnregistrement] = useState(false);

  /**
   * Situation de l'emprunteur dès qu'il est choisi : emprunts en cours, retards
   * et pertes. Le blocage pour retard doit être visible avant la validation,
   * pas découvert au moment de l'enregistrement.
   */
  useEffect(() => {
    if (!emprunteur) { setSituation(null); return; }
    setChargementSituation(true);
    apiClient.get(`/bibliotheque/emprunteurs/${emprunteur.id}/situation`)
      .then((r) => setSituation(r.data as Situation))
      .catch(() => setSituation(null))
      .finally(() => setChargementSituation(false));
  }, [emprunteur]);

  const charger = useCallback(() => {
    setChargement(true);
    Promise.all([
      apiClient.get('/bibliotheque/ouvrages', { params: { size: 500 } }).catch(() => ({ data: [] })),
      apiClient.get('/bibliotheque/emprunts').catch(() => ({ data: [] })),
      apiClient.get('/bibliotheque/tarifs').catch(() => ({ data: null })),
    ]).then(([o, e, t]) => {
      setOuvrages(lire(o.data) as unknown as Ouvrage[]);
      setEmprunts(lire(e.data) as unknown as Emprunt[]);
      if (t.data) {
        const tf = t.data as Tarifs;
        setTarifs(tf);
        setDureeJours(String(tf.dureeJoursDefaut));
      }
    }).finally(() => setChargement(false));
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const ouvragesFiltres = useMemo(() => ouvrages.filter((o) => {
    if (filtreType && o.type !== filtreType) return false;
    return correspond(recherche, o.titre, o.auteur, o.isbn, o.editeur);
  }), [ouvrages, filtreType, recherche]);

  const empruntsFiltres = useMemo(() => emprunts.filter((e) => {
    if (filtreStatut && e.statut !== filtreStatut) return false;
    const p = e.emprunteur;
    return correspond(recherche, e.ouvrage?.titre, p?.firstName, p?.lastName, p?.matricule);
  }), [emprunts, filtreStatut, recherche]);

  const nbRetards = emprunts.filter((e) => e.statut === 'EN_RETARD').length;
  const nbEnCours = emprunts.filter((e) => e.statut === 'EN_COURS' || e.statut === 'EN_RETARD').length;
  const amendesDues = emprunts.filter((e) => e.montantAmende).reduce((s, e) => s + (e.montantAmende ?? 0), 0);

  const nomEmprunteur = (e: Emprunt) =>
    `${e.emprunteur?.firstName ?? ''} ${e.emprunteur?.lastName ?? ''}`.trim() || '—';

  // ── Actions ─────────────────────────────────────────────────────

  const ouvrirCreation = () => { setEditionId(null); setFormOuvrage(FORM_OUVRAGE); setModalOuvrage(true); };
  const ouvrirEdition = (o: Ouvrage) => {
    setEditionId(o.id);
    setFormOuvrage({
      titre: o.titre, auteur: o.auteur, type: o.type,
      isbn: o.isbn ?? '', annee: o.annee ? String(o.annee) : '',
      editeur: o.editeur ?? '', valeur: o.valeur ? String(o.valeur) : '',
      nbExemplaires: String(o.nbExemplaires),
    });
    setModalOuvrage(true);
  };

  const enregistrerOuvrage = async () => {
    if (!formOuvrage.titre.trim()) { toast.error('Titre requis'); return; }
    if (!formOuvrage.auteur.trim()) { toast.error('Auteur requis'); return; }
    setEnregistrement(true);
    try {
      const corps = {
        ...formOuvrage,
        annee: formOuvrage.annee ? Number(formOuvrage.annee) : null,
        valeur: formOuvrage.valeur ? Number(formOuvrage.valeur) : null,
        nbExemplaires: Number(formOuvrage.nbExemplaires) || 1,
      };
      if (editionId) await apiClient.patch(`/bibliotheque/ouvrages/${editionId}`, corps);
      else await apiClient.post('/bibliotheque/ouvrages', corps);
      toast.success(editionId ? 'Ouvrage modifié' : 'Ouvrage ajouté');
      setModalOuvrage(false);
      charger();
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Enregistrement impossible');
    }
    setEnregistrement(false);
  };

  const archiver = async (o: Ouvrage) => {
    if (!confirm(`Retirer « ${o.titre} » du catalogue ?`)) return;
    try {
      await apiClient.delete(`/bibliotheque/ouvrages/${o.id}`);
      toast.success('Ouvrage retiré du catalogue');
      charger();
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Retrait impossible');
    }
  };

  const enregistrerEmprunt = async () => {
    if (!ouvrageId) { toast.error('Choisissez un ouvrage'); return; }
    if (!emprunteur) { toast.error('Choisissez un emprunteur'); return; }
    setEnregistrement(true);
    try {
      await apiClient.post('/bibliotheque/emprunts', {
        ouvrageId, emprunteurId: emprunteur.id, dureeJours: Number(dureeJours) || 14,
      });
      toast.success('Emprunt enregistré');
      setModalEmprunt(false);
      setEmprunteur(null); setOuvrageId('');
      setDureeJours(String(tarifs?.dureeJoursDefaut ?? 14));
      charger();
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Emprunt impossible');
    }
    setEnregistrement(false);
  };

  const retourner = async (e: Emprunt) => {
    try {
      const r = await apiClient.post(`/bibliotheque/emprunts/${e.id}/retour`, {});
      const amende = (r.data as { montantAmende?: number })?.montantAmende;
      toast.success(amende ? `Retour enregistré — amende de ${amende.toLocaleString('fr-FR')} FCFA` : 'Retour enregistré');
      charger();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Retour impossible');
    }
  };

  const reglerAmende = async (e: Emprunt) => {
    if (!confirm(`Encaisser ${e.montantAmende?.toLocaleString('fr-FR')} FCFA pour « ${e.ouvrage?.titre} » ?`)) return;
    try {
      await apiClient.post(`/bibliotheque/emprunts/${e.id}/amende/regler`, { modePaiement: 'ESPECES' });
      toast.success('Amende encaissée — paiement enregistré en caisse');
      charger();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Encaissement impossible');
    }
  };

  const declarerPerte = async (e: Emprunt) => {
    if (!confirm(`Déclarer « ${e.ouvrage?.titre} » perdu ? Une amende sera due par l'emprunteur.`)) return;
    try {
      await apiClient.post(`/bibliotheque/emprunts/${e.id}/perte`, {});
      toast.success('Perte enregistrée');
      charger();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Déclaration impossible');
    }
  };

  const dateRetourCalculee = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(dureeJours) || 0));
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [dureeJours]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${B}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 28px', height: 62, gap: 14 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Bibliothèque</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {ouvrages.length} titre(s) · {nbEnCours} emprunt(s) en cours
              {nbRetards > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}> · {nbRetards} en retard</span>}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setModalEmprunt(true)} style={btnSecondaire}>Nouvel emprunt</button>
            <button onClick={ouvrirCreation} style={btnPrimaire}>+ Ouvrage</button>
          </div>
        </div>
        <div style={{ display: 'flex', padding: '0 28px', borderTop: `1px solid ${B}` }}>
          {([['catalogue', 'Catalogue'], ['emprunts', 'Emprunts']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setOnglet(k)}
              style={{ height: 42, padding: '0 18px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: onglet === k ? 700 : 400, color: onglet === k ? '#2563eb' : '#64748b', borderBottom: onglet === k ? '2px solid #2563eb' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Indicateurs */}
      <div style={{ flexShrink: 0, padding: '16px 28px 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Titres', valeur: String(ouvrages.length), couleur: '#2563eb' },
          { label: 'Exemplaires', valeur: String(ouvrages.reduce((s, o) => s + o.nbExemplaires, 0)), couleur: '#0f172a' },
          { label: 'En cours', valeur: String(nbEnCours), couleur: '#d97706' },
          { label: 'En retard', valeur: String(nbRetards), couleur: nbRetards > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Amendes', valeur: `${amendesDues.toLocaleString('fr-FR')} F`, couleur: '#7c3aed' },
        ].map((k) => (
          <div key={k.label} style={{ flex: '1 1 130px', background: '#fff', border: `1px solid ${B}`, padding: '12px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.couleur }}>{k.valeur}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ flexShrink: 0, padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder={onglet === 'catalogue' ? 'Titre, auteur, ISBN…' : 'Ouvrage, nom ou matricule…'}
          style={{ ...inp, width: 280 }} />
        {onglet === 'catalogue' ? (
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} style={{ ...inp, width: 170, background: '#fff' }}>
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        ) : (
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} style={{ ...inp, width: 170, background: '#fff' }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 28px 28px' }}>
        {chargement ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
        ) : onglet === 'catalogue' ? (
          ouvragesFiltres.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              {ouvrages.length === 0 ? 'Aucun ouvrage au catalogue.' : 'Aucun ouvrage ne correspond à cette recherche.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: `1px solid ${B}` }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Titre', 'Auteur', 'Type', 'Éditeur', 'Disponibles', ''].map((h, i) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: i === 4 ? 'center' : 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', borderBottom: `1px solid ${B}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ouvragesFiltres.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{o.titre}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569' }}>{o.auteur}</td>
                    <td style={{ padding: '10px 12px' }}><Badge label={TYPE_LABELS[o.type]} bg="#f1f5f9" fg="#475569" /></td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{o.editeur ?? '—'}{o.annee ? ` (${o.annee})` : ''}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: o.nbDisponibles === 0 ? '#dc2626' : '#16a34a' }}>
                      {o.nbDisponibles} / {o.nbExemplaires}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => ouvrirEdition(o)} style={{ ...btnSecondaire, height: 28, padding: '0 10px', fontSize: 11, marginRight: 6 }}>Modifier</button>
                      <button onClick={() => archiver(o)} style={{ ...btnSecondaire, height: 28, padding: '0 10px', fontSize: 11, color: '#dc2626' }}>Retirer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          empruntsFiltres.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${B}`, padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              {emprunts.length === 0 ? 'Aucun emprunt enregistré.' : 'Aucun emprunt ne correspond à cette recherche.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: `1px solid ${B}` }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Ouvrage', 'Emprunteur', 'Emprunté le', 'Retour prévu', 'Statut', 'Amende', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', borderBottom: `1px solid ${B}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empruntsFiltres.map((e) => {
                  const c = STATUT_COULEURS[e.statut];
                  const actif = e.statut === 'EN_COURS' || e.statut === 'EN_RETARD';
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{e.ouvrage?.titre ?? '—'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569' }}>
                        {nomEmprunteur(e)}
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{e.emprunteur?.matricule ?? '—'}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{formatDateFr(e.dateEmprunt)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: e.statut === 'EN_RETARD' ? '#dc2626' : '#64748b' }}>
                        {formatDateFr(e.dateRetourPrevue)}
                        {e.statut === 'EN_RETARD' && e.joursRetard ? <div style={{ fontSize: 10, color: '#dc2626' }}>{e.joursRetard} j de retard</div> : null}
                      </td>
                      <td style={{ padding: '10px 12px' }}><Badge label={STATUT_LABELS[e.statut]} bg={c.bg} fg={c.fg} /></td>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: e.paiementId ? '#16a34a' : e.montantAmende ? '#dc2626' : '#94a3b8' }}>
                        {e.montantAmende ? `${e.montantAmende.toLocaleString('fr-FR')} F` : '—'}
                        {e.paiementId && <div style={{ fontSize: 10, fontWeight: 400, color: '#16a34a' }}>Réglée</div>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {actif && (
                          <>
                            <button onClick={() => retourner(e)} style={{ ...btnSecondaire, height: 28, padding: '0 10px', fontSize: 11, marginRight: 6 }}>Retour</button>
                            <button onClick={() => declarerPerte(e)} style={{ ...btnSecondaire, height: 28, padding: '0 10px', fontSize: 11, color: '#dc2626' }}>Perte</button>
                          </>
                        )}
                        {/* Encaissement réservé aux élèves : la caisse ne connaît
                            pas les paiements du personnel (cf. reglerAmende). */}
                        {!!e.montantAmende && !e.paiementId && e.typeEmprunteur === 'ELEVE' && (
                          <button onClick={() => reglerAmende(e)} style={{ ...btnSecondaire, height: 28, padding: '0 10px', fontSize: 11, color: '#16a34a', marginLeft: 6 }}>Encaisser</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Modal ouvrage */}
      {modalOuvrage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${B}`, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {editionId ? 'Modifier l\'ouvrage' : 'Nouvel ouvrage'}
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Titre <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={formOuvrage.titre} onChange={(e) => setFormOuvrage((f) => ({ ...f, titre: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Auteur <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={formOuvrage.auteur} onChange={(e) => setFormOuvrage((f) => ({ ...f, auteur: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Type</label>
                  <select value={formOuvrage.type} onChange={(e) => setFormOuvrage((f) => ({ ...f, type: e.target.value as TypeOuvrage }))} style={{ ...inp, background: '#fff' }}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div><label style={lbl}>Éditeur</label>
                  <input value={formOuvrage.editeur} onChange={(e) => setFormOuvrage((f) => ({ ...f, editeur: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Année</label>
                  <input type="number" value={formOuvrage.annee} onChange={(e) => setFormOuvrage((f) => ({ ...f, annee: e.target.value }))} style={inp} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>ISBN</label>
                  <input value={formOuvrage.isbn} onChange={(e) => setFormOuvrage((f) => ({ ...f, isbn: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Exemplaires</label>
                  <input type="number" min={1} value={formOuvrage.nbExemplaires} onChange={(e) => setFormOuvrage((f) => ({ ...f, nbExemplaires: e.target.value }))} style={inp} /></div>
                <div>
                  <label style={lbl}>Valeur (FCFA)</label>
                  <input type="number" value={formOuvrage.valeur} onChange={(e) => setFormOuvrage((f) => ({ ...f, valeur: e.target.value }))} style={inp} placeholder={String(tarifs?.valeurRemplacementDefaut ?? '')} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                La valeur sert de base à l&apos;amende en cas de perte.
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${B}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOuvrage(false)} style={btnSecondaire}>Annuler</button>
              <button onClick={enregistrerOuvrage} disabled={enregistrement} style={{ ...btnPrimaire, opacity: enregistrement ? 0.7 : 1 }}>
                {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal emprunt */}
      {modalEmprunt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${B}`, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Nouvel emprunt</div>
            <div style={{ padding: 22 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Ouvrage <span style={{ color: '#dc2626' }}>*</span></label>
                <select value={ouvrageId} onChange={(e) => setOuvrageId(e.target.value)} style={{ ...inp, background: '#fff' }}>
                  <option value="">— Choisir —</option>
                  {ouvrages.filter((o) => o.nbDisponibles > 0).map((o) => (
                    <option key={o.id} value={o.id}>{o.titre} — {o.auteur} ({o.nbDisponibles} dispo.)</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Emprunteur <span style={{ color: '#dc2626' }}>*</span></label>
                <SelecteurEmprunteur valeur={emprunteur} onChange={setEmprunteur} />

                {chargementSituation && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>Vérification de la situation…</div>
                )}

                {situation && (
                  <div style={{ marginTop: 8, border: `1px solid ${situation.peutEmprunter ? B : '#fecaca'}`, background: situation.peutEmprunter ? '#f8fafc' : '#fee2e2' }}>
                    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${situation.peutEmprunter ? B : '#fecaca'}` }}>
                      {[
                        { label: 'En cours', valeur: situation.nbEnCours, couleur: '#2563eb' },
                        { label: 'En retard', valeur: situation.nbEnRetard, couleur: situation.nbEnRetard > 0 ? '#dc2626' : '#16a34a' },
                        { label: 'Pertes', valeur: situation.nbPertes, couleur: situation.nbPertes > 0 ? '#b45309' : '#16a34a' },
                      ].map((k) => (
                        <div key={k.label} style={{ flex: 1, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: k.couleur }}>{k.valeur}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>{k.label}</div>
                        </div>
                      ))}
                    </div>

                    {!situation.peutEmprunter && (
                      <div style={{ padding: '8px 10px', fontSize: 11, color: '#991b1b', fontWeight: 600 }}>
                        Emprunt bloqué : un ouvrage est en retard et doit être rendu d&apos;abord.
                      </div>
                    )}

                    {situation.amendesDues > 0 && (
                      <div style={{ padding: '8px 10px', fontSize: 11, color: '#6d28d9', borderTop: '1px solid #f1f5f9' }}>
                        {situation.amendesDues.toLocaleString('fr-FR')} FCFA d&apos;amendes non réglées.
                      </div>
                    )}

                    {situation.ouvragesEnCours.length > 0 && (
                      <div style={{ padding: '8px 10px', borderTop: '1px solid #f1f5f9' }}>
                        {situation.ouvragesEnCours.map((o) => (
                          <div key={o.id} style={{ fontSize: 11, color: o.enRetard ? '#dc2626' : '#475569', padding: '1px 0' }}>
                            {o.titre} — {o.enRetard ? `${o.joursRetard ?? 0} j de retard` : `retour le ${formatDateFr(o.dateRetourPrevue)}`}
                          </div>
                        ))}
                      </div>
                    )}

                    {situation.pertes.length > 0 && (
                      <div style={{ padding: '8px 10px', borderTop: '1px solid #f1f5f9' }}>
                        {situation.pertes.map((p) => (
                          <div key={p.id} style={{ fontSize: 11, color: '#b45309', padding: '1px 0' }}>
                            Perdu : {p.titre}{p.montantAmende ? ` — ${p.montantAmende.toLocaleString('fr-FR')} F` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={lbl}>Durée de l&apos;emprunt (jours)</label>
                <input type="number" min={1} max={tarifs?.dureeJoursMax ?? 60} value={dureeJours}
                  onChange={(e) => setDureeJours(e.target.value)} style={{ ...inp, width: 140 }} />
                {/* La date découle de la durée : elle n'est jamais saisie. */}
                <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>
                  Retour attendu le <strong>{dateRetourCalculee}</strong>
                </div>
                {tarifs && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Maximum {tarifs.dureeJoursMax} jours · retard facturé {tarifs.penaliteParJour.toLocaleString('fr-FR')} F/jour
                    {tarifs.penaliteMax > 0 ? ` (plafond ${tarifs.penaliteMax.toLocaleString('fr-FR')} F)` : ''}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${B}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalEmprunt(false)} style={btnSecondaire}>Annuler</button>
              {/* Bloqué à l'écran comme au serveur : l'agent voit le refus avant
                  de cliquer, au lieu de le découvrir par un message d'erreur. */}
              <button
                onClick={enregistrerEmprunt}
                disabled={enregistrement || situation?.peutEmprunter === false}
                title={situation?.peutEmprunter === false ? 'Un ouvrage est en retard' : undefined}
                style={{ ...btnPrimaire, opacity: enregistrement || situation?.peutEmprunter === false ? 0.5 : 1, cursor: situation?.peutEmprunter === false ? 'not-allowed' : 'pointer' }}
              >
                {enregistrement ? 'Enregistrement…' : 'Enregistrer l\'emprunt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
