/**
 * Lecture des réponses d'API côté écran.
 *
 * `unwrap` (dans `use-query-api`) déballe déjà l'enveloppe HTTP, mais renvoie un
 * type inconnu : chaque page le relisait alors à sa manière, avec des accès
 * directs (`data?.classes`, `data?.eleves`) que TypeScript rejette et des
 * transtypages recopiés d'un fichier à l'autre.
 *
 * Ces deux helpers donnent une lecture unique et typée.
 */

/** Objet exploitable, quel que soit ce que renvoie la requête. */
export function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : {};
}

/**
 * Liste exploitable. Accepte un tableau nu ou un objet contenant la liste sous
 * l'une des clés indiquées — les endpoints ne s'accordent pas sur ce point
 * (`{ classes }`, `{ eleves }`, `{ content }`, `{ data }`…).
 *
 * ```ts
 * const classes = asArray(data, 'classes', 'classesMatieres');
 * ```
 */
export function asArray<T = Record<string, unknown>>(data: unknown, ...cles: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  const record = asRecord(data);
  for (const cle of [...cles, 'content', 'data', 'items', 'results']) {
    const valeur = record[cle];
    if (Array.isArray(valeur)) return valeur as T[];
  }
  return [];
}
