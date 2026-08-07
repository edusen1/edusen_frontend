'use client';

import { ProfilUtilisateur } from '@/components/profil/profil-utilisateur';

/**
 * Cet écran dupliquait mot pour mot le profil des autres rôles, au libellé près.
 * Il repose désormais sur le composant partagé — c'est cette duplication qui
 * avait laissé caissier, comptable et sécurité sans page de profil.
 */
export default function RhProfilPage() {
  return <ProfilUtilisateur />;
}
