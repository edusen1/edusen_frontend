/**
 * Recherche locale sur les personnes.
 *
 * Les écrans filtraient presque tous sur le seul nom. En pratique, un caissier
 * ou un surveillant cherche par **matricule** (c'est ce qui figure sur la carte
 * scolaire) ou par **téléphone** (c'est ce dont il dispose quand un parent
 * appelle). Ce helper centralise la règle pour éviter que chaque écran redéfinisse
 * un périmètre de recherche différent.
 */

/** Retire accents et casse pour que « Ndiaye » trouve « NDIAYE » et « Ndiayé ». */
export function normaliser(valeur: unknown): string {
  return String(valeur ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Ne garde que les chiffres — un numéro saisi « 77 123 45 67 » doit trouver
 * « +221771234567 ».
 */
function chiffres(valeur: unknown): string {
  return String(valeur ?? '').replace(/\D/g, '');
}

/** `true` si l'un des champs contient le terme recherché. */
export function correspond(terme: string, ...champs: unknown[]): boolean {
  const q = normaliser(terme);
  if (!q) return true;

  if (champs.some((c) => normaliser(c).includes(q))) return true;

  // Comparaison numérique séparée : la saisie et le stockage d'un téléphone
  // diffèrent presque toujours par les espaces, points et indicatif.
  const qChiffres = chiffres(terme);
  if (qChiffres.length >= 4) {
    return champs.some((c) => {
      const v = chiffres(c);
      return v.length >= 4 && v.includes(qChiffres);
    });
  }
  return false;
}

/**
 * Champs de recherche d'une personne, quelle que soit la forme renvoyée par
 * l'API (`firstName`/`lastName`, `prenom`/`nom`, ou objet imbriqué).
 */
export function champsPersonne(personne: unknown): unknown[] {
  if (!personne || typeof personne !== 'object') return [personne];
  const p = personne as Record<string, unknown>;
  const imbrique = (p.eleve ?? p.utilisateur ?? p.user ?? p.personnel ?? {}) as Record<string, unknown>;
  const source = Object.keys(imbrique).length > 0 ? { ...imbrique, ...p } : p;

  return [
    source.firstName, source.lastName, source.prenom, source.nom,
    source.matricule, source.numeroMatricule, source.numeroInscription,
    source.telephone, source.telephoneTravail,
    source.username, source.email,
  ];
}

/** Raccourci : recherche sur une personne, tous champs usuels compris. */
export function correspondPersonne(terme: string, personne: unknown, ...champsSupplementaires: unknown[]): boolean {
  return correspond(terme, ...champsPersonne(personne), ...champsSupplementaires);
}
