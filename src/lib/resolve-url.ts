const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export function resolveStorageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}/storage/file?key=${encodeURIComponent(url)}`;
}
