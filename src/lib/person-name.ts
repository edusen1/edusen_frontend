/** Formate un prénom en mettant une majuscule après chaque espace, tiret ou apostrophe. */
export function formatFirstName(value: string): string {
  return value
    .toLocaleLowerCase('fr-FR')
    .replace(/(^|[\s'’-])(\p{L})/gu, (_match, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase('fr-FR')}`,
    );
}

/** Les noms de famille sont affichés et enregistrés en majuscules. */
export function formatLastName(value: string): string {
  return value.toLocaleUpperCase('fr-FR');
}