'use client';

import { ProfilUtilisateur } from '@/components/profil/profil-utilisateur';

/**
 * Profil générique, utilisé comme destination de repli pour les rôles sans page
 * dédiée (comptable, sécurité, gestionnaire). Le repli précédent envoyait vers
 * `/professeur/profil`, qui répond 403 pour ces rôles.
 */
export default function ProfilPage() {
  return <ProfilUtilisateur />;
}
