/**
 * Route retirée du front tenant.
 *
 * L'administration de la plateforme (établissements, comptes plateforme,
 * supervision, audit) vit désormais dans l'application `edusen_plateforme`.
 * Le SUPER_ADMIN et le GESTIONNAIRE ne se connectent plus ici.
 *
 * Le code d'origine est conservé dans `_archive/platform-2026-08/tenants/page.tsx`.
 * Voir obsidian/super-admin/Super Admin - Vue d'ensemble.md
 */
import { PlatformMoved } from '@/components/layout/platform-moved';

export default function TenantsPage() {
  return <PlatformMoved />;
}
