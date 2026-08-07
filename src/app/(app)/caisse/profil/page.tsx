'use client';

import { ProfilUtilisateur } from '@/components/profil/profil-utilisateur';

/** Le menu caisse pointait ici alors que la page n'existait pas — 404 en production. */
export default function CaisseProfilPage() {
  return <ProfilUtilisateur />;
}
