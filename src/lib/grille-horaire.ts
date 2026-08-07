/**
 * Grille horaire de l'école — miroir de `grille-horaire.util.ts` côté backend.
 *
 * Au préscolaire et au primaire, la journée suit une trame fixe : matinée coupée
 * par une récréation, puis après-midi les jours pleins. L'emploi du temps n'a
 * donc pas à être saisi créneau par créneau : la trame est connue, seule la
 * matière change d'une case à l'autre. L'enseignant et la salle sont ceux de la
 * classe, puisqu'un instituteur assure toutes les matières dans sa salle.
 *
 * La grille est propre à chaque école (`GET /admin/configuration/grille-horaire`)
 * car les horaires varient d'un établissement à l'autre.
 */

export type TypeCreneau = 'COURS' | 'RECREATION';

export interface CreneauGenere {
  type: TypeCreneau;
  heureDebut: string;
  heureFin: string;
  libelle: string;
}

export interface GrilleCycle {
  joursAvecApresMidi: string[];
  joursMatinSeul: string[];
  matinDebut: string;
  matinFin: string;
  apresMidiDebut: string;
  apresMidiFin: string;
  recreationDebut: string;
  recreationMinutes: number;
}

export type GrilleHoraire = Record<string, GrilleCycle>;

/** Cycles dont l'emploi du temps suit une trame fixe. */
export const CYCLES_TRAME_FIXE = ['PRESCOLAIRE', 'MATERNELLE', 'CRECHE', 'PRIMAIRE', 'ELEMENTAIRE'];

export const GRILLE_PAR_DEFAUT: GrilleCycle = {
  joursAvecApresMidi: ['Lundi', 'Mardi', 'Jeudi', 'Vendredi'],
  joursMatinSeul: ['Mercredi'],
  matinDebut: '08:00',
  matinFin: '12:00',
  apresMidiDebut: '15:00',
  apresMidiFin: '17:00',
  recreationDebut: '10:00',
  recreationMinutes: 30,
};

function versMinutes(heure: string): number {
  const [h, m] = String(heure).split(':').map((v) => Number(v) || 0);
  return h * 60 + m;
}

function versHeure(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** « 08:00 » → « 8h », « 10:30 » → « 10h30 ». */
export function libelleHeure(heure: string): string {
  const [h, m] = String(heure).split(':');
  return Number(m) === 0 ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function grilleDuCycle(grille: GrilleHoraire | null | undefined, cycleCode: string): GrilleCycle {
  return { ...GRILLE_PAR_DEFAUT, ...(grille?.[cycleCode] ?? {}) };
}

export function cycleATrameFixe(cycleCode: string): boolean {
  return CYCLES_TRAME_FIXE.includes(cycleCode);
}

/**
 * Créneaux d'une journée. La récréation **scinde** la matinée au lieu de s'y
 * ajouter : posée hors de la matinée, elle est ignorée plutôt que de produire
 * des créneaux qui se chevauchent.
 */
export function genererCreneaux(grille: GrilleCycle, jour: string): CreneauGenere[] {
  const aApresMidi = grille.joursAvecApresMidi.includes(jour);
  const aMatinSeul = grille.joursMatinSeul.includes(jour);
  if (!aApresMidi && !aMatinSeul) return [];

  const creneaux: CreneauGenere[] = [];
  const debutMatin = versMinutes(grille.matinDebut);
  const finMatin = versMinutes(grille.matinFin);
  const debutRecre = versMinutes(grille.recreationDebut);
  const finRecre = debutRecre + (Number(grille.recreationMinutes) || 0);

  const cours = (debut: number, fin: number) => {
    if (fin <= debut) return;
    creneaux.push({
      type: 'COURS',
      heureDebut: versHeure(debut),
      heureFin: versHeure(fin),
      libelle: `${libelleHeure(versHeure(debut))}–${libelleHeure(versHeure(fin))}`,
    });
  };

  if (debutRecre > debutMatin && finRecre < finMatin) {
    cours(debutMatin, debutRecre);
    creneaux.push({ type: 'RECREATION', heureDebut: versHeure(debutRecre), heureFin: versHeure(finRecre), libelle: 'Récréation' });
    cours(finRecre, finMatin);
  } else {
    cours(debutMatin, finMatin);
  }

  if (aApresMidi) cours(versMinutes(grille.apresMidiDebut), versMinutes(grille.apresMidiFin));

  return creneaux;
}

/** Heure de fin de journée, pour afficher « Descente ». */
export function heureDescente(grille: GrilleCycle, jour: string): string | null {
  if (grille.joursAvecApresMidi.includes(jour)) return grille.apresMidiFin;
  if (grille.joursMatinSeul.includes(jour)) return grille.matinFin;
  return null;
}

/** Jours ouvrés de la grille, dans l'ordre de la semaine. */
export function joursOuvres(grille: GrilleCycle): string[] {
  const ordre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const tous = new Set([...grille.joursAvecApresMidi, ...grille.joursMatinSeul]);
  return ordre.filter((j) => tous.has(j));
}
