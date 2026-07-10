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
