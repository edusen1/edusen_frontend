import { ExternalLink, ShieldAlert } from 'lucide-react';

/**
 * L'administration de la plateforme a été déplacée dans l'application
 * `edusen_plateforme`. Ces routes sont conservées le temps de la transition
 * pour ne casser aucun lien existant, mais n'affichent plus de données.
 */
export function PlatformMoved() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <ShieldAlert size={20} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Espace déplacé</h2>
        <p className="mt-2 text-sm text-slate-600">
          L&apos;administration de la plateforme — établissements, comptes plateforme, supervision et journal
          d&apos;audit — dispose désormais de son propre espace, séparé de celui des établissements.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600">
          <ExternalLink size={14} />
          Edusen Plateforme
        </p>
      </div>
    </div>
  );
}
