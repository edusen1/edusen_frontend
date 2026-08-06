/**
 * Helpers d'affichage.
 *
 * Règle : rien de brut ne doit atteindre l'écran — ni `[object Object]`,
 * ni UUID complet, ni date ISO. Ces trois défauts ont été relevés sur
 * les écrans Surveillance, Caisse, Convocations, Pointages et RH.
 */

export function entityLabel(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'object') return String(value);

  const record = value as Record<string, unknown>;
  const label = record.nom ?? record.libelle ?? record.name ?? record.label ?? record.code;
  return label == null || label === '' ? fallback : String(label);
}

export function classeLabel(value: unknown, fallback = '—'): string {
  return entityLabel(value, fallback);
}

/**
 * Nom d'une personne, quelle que soit la forme reçue.
 *
 * Accepte un objet (`{ prenom, nom }`, `{ firstName, lastName }`,
 * `{ eleve: {...} }`, `{ user: {...} }`) ou une chaîne déjà formatée.
 * Ne renvoie jamais `[object Object]`.
 */
export function personLabel(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value !== 'object') return String(value);

  const record = value as Record<string, unknown>;

  // Objet enveloppant : { eleve: {...} }, { user: {...} }, { personne: {...} }
  for (const key of ['eleve', 'user', 'utilisateur', 'personne', 'membre', 'professeur', 'parent', 'personnel']) {
    const nested = record[key];
    if (nested && typeof nested === 'object') {
      const label = personLabel(nested, '');
      if (label) return label;
    }
  }

  const prenom = record.prenom ?? record.firstName ?? '';
  const nom = record.nom ?? record.lastName ?? '';
  const complet = `${String(prenom)} ${String(nom)}`.trim();
  if (complet) return complet;

  for (const key of ['nomComplet', 'fullName', 'userNomComplet', 'libelle', 'name', 'email', 'matricule']) {
    const direct = record[key];
    if (typeof direct === 'string' && direct.trim()) return direct.trim();
  }

  return fallback;
}

/** Identifiant tronqué — un UUID complet dans un tableau n'aide personne. */
export function shortId(value: unknown, fallback = '—'): string {
  if (typeof value !== 'string' || !value) return fallback;
  return value.length > 12 ? `${value.slice(0, 8)}…` : value;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `jj/mm/aaaa` — jamais une chaîne ISO brute. */
export function formatDateFr(value: unknown, fallback = '—'): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString('fr-FR') : fallback;
}

/** `jj/mm/aaaa hh:mm` */
export function formatDateTimeFr(value: unknown, fallback = '—'): string {
  const date = toDate(value);
  return date
    ? `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : fallback;
}

/** Mois courant en toutes lettres, calculé depuis la date réelle. */
export function currentMonthLabel(date = new Date()): string {
  return date.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
}

/** Garde-fou générique : convertit n'importe quelle valeur en texte affichable. */
export function displayValue(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return entityLabel(value, fallback);
  return String(value);
}
