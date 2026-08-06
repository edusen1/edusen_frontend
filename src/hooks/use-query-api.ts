'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  eleveApi, parentApi, professeurApi, adminApi,
  caisseApi, platformApi, authApi, surveillantApi,
} from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

export function extractApiMessage(error: unknown, fallback = 'Erreur'): string {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  return fallback;
}

/**
 * Déballe une réponse API quelle que soit sa forme.
 *
 * Le backend répond tantôt par un tableau nu (`[...]`), tantôt par une
 * enveloppe (`{ data: ... }`), tantôt par une page (`{ content: [...] }`).
 * Écrire `r.data?.data` ne marche que pour l'enveloppe : sur un tableau nu
 * cela renvoie `undefined`, et la page affiche un état vide alors que
 * l'API a bien répondu.
 *
 * C'est la cause du « 0 enfant scolarisé » de l'espace parent, alors que
 * `GET /parent/enfants` retournait bien les deux enfants.
 */
function unwrap<T = unknown>(response: { data: unknown }): T {
  const body = response?.data as
    | { data?: unknown; content?: unknown }
    | unknown[]
    | null
    | undefined;
  if (body === null || body === undefined) return body as T;
  if (Array.isArray(body)) return body as T;
  if (typeof body === 'object') {
    const envelope = body as { data?: unknown; content?: unknown };
    if (envelope.data !== undefined) return envelope.data as T;
    if (envelope.content !== undefined) return envelope.content as T;
  }
  return body as T;
}

// --- ELEVE HOOKS ---
export const useEleveProfil = () =>
  useQuery({ queryKey: ['eleve', 'profil'], queryFn: () => eleveApi.profil().then(unwrap) });
export const useEleveNotes = (trimestre?: string) =>
  useQuery({ queryKey: ['eleve', 'notes', trimestre], queryFn: () => eleveApi.notes(trimestre).then(unwrap) });
export const useEleveBulletins = () =>
  useQuery({ queryKey: ['eleve', 'bulletins'], queryFn: () => eleveApi.bulletins().then(unwrap) });
export const useEleveEmploiDuTemps = () =>
  useQuery({ queryKey: ['eleve', 'emploi-du-temps'], queryFn: () => eleveApi.emploiDuTemps().then(unwrap) });
export const useEleveAbsences = () =>
  useQuery({ queryKey: ['eleve', 'absences'], queryFn: () => eleveApi.absences().then(unwrap) });
export const useEleveNotifications = () =>
  useQuery({ queryKey: ['eleve', 'notifications'], queryFn: () => eleveApi.notifications().then(unwrap) });
export const useEleveReclamations = () =>
  useQuery({ queryKey: ['eleve', 'reclamations'], queryFn: () => eleveApi.reclamations().then(unwrap) });

export const useCreerReclamation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { motif: string; noteId?: string }) => eleveApi.creerReclamation(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eleve', 'reclamations'] }); toast.success('Réclamation envoyée'); },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });
};

export const useMarquerNotificationLue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eleveApi.marquerLu(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eleve', 'notifications'] }); },
  });
};

export const useToutLireNotifications = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => eleveApi.toutLire(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['eleve', 'notifications'] }); toast.success('Toutes les notifications marquées comme lues'); },
  });
};

// --- PARENT HOOKS ---
export const useParentEnfants = () =>
  useQuery({ queryKey: ['parent', 'enfants'], queryFn: () => parentApi.enfants().then(unwrap) });
export const useParentEnfantNotes = (id: string, trimestre?: string) =>
  useQuery({ queryKey: ['parent', 'enfant', id, 'notes', trimestre], queryFn: () => parentApi.enfantNotes(id, trimestre).then(unwrap), enabled: !!id });
export const useParentEnfantAbsences = (id: string) =>
  useQuery({ queryKey: ['parent', 'enfant', id, 'absences'], queryFn: () => parentApi.enfantAbsences(id).then(unwrap), enabled: !!id });
export const useParentEnfantBulletins = (id: string) =>
  useQuery({ queryKey: ['parent', 'enfant', id, 'bulletins'], queryFn: () => parentApi.enfantBulletins(id).then(unwrap), enabled: !!id });
export const useParentEnfantEmploiDuTemps = (id: string) =>
  useQuery({ queryKey: ['parent', 'enfant', id, 'emploi-du-temps'], queryFn: () => parentApi.enfantEmploiDuTemps(id).then(unwrap), enabled: !!id });
export const useParentPaiements = () =>
  useQuery({ queryKey: ['parent', 'paiements'], queryFn: () => parentApi.paiements().then(unwrap) });
export const useParentNotifications = () =>
  useQuery({ queryKey: ['parent', 'notifications'], queryFn: () => parentApi.notifications().then(unwrap) });
export const useParentReclamations = () =>
  useQuery({ queryKey: ['parent', 'reclamations'], queryFn: () => parentApi.reclamations().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useCreerReclamationParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => parentApi.creerReclamation(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parent', 'reclamations'] }); toast.success('Réclamation soumise'); },
    onError: () => toast.error('Erreur lors de la soumission'),
  });
};
export const useParentProfil = () =>
  useQuery({ queryKey: ['parent', 'profil'], queryFn: () => parentApi.profil().then(unwrap) });
export const useMarquerNotificationLueParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parentApi.marquerLu(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parent', 'notifications'] }); },
  });
};
export const useToutLireNotificationsParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => parentApi.toutLire(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parent', 'notifications'] }); toast.success('Toutes les notifications marquées comme lues'); },
  });
};

// --- PROFESSEUR HOOKS ---
export const useProfesseurMesClasses = () =>
  useQuery({ queryKey: ['professeur', 'mes-classes'], queryFn: () => professeurApi.mesClasses().then(unwrap) });
export const useProfesseurClassesMatieres = () =>
  useQuery({ queryKey: ['professeur', 'classes-matieres'], queryFn: () => professeurApi.classesMatieres().then(unwrap) });
export const useProfesseurPaiements = () =>
  useQuery({ queryKey: ['professeur', 'paiements'], queryFn: () => professeurApi.paiements().then(unwrap) });
export const useProfesseurEmploiDuTemps = () =>
  useQuery({ queryKey: ['professeur', 'emploi-du-temps'], queryFn: () => professeurApi.emploiDuTemps().then(unwrap) });
export const useProfesseurClasseEleves = (classeId: string) =>
  useQuery({ queryKey: ['professeur', 'classe', classeId, 'eleves'], queryFn: () => professeurApi.classeEleves(classeId).then(unwrap), enabled: !!classeId });
export const useProfesseurAbsences = () =>
  useQuery({ queryKey: ['professeur', 'absences'], queryFn: () => professeurApi.absences().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useDeclarerAbsenceProfesseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => professeurApi.declarerAbsence(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professeur', 'absences'] }); toast.success('Absence déclarée'); },
    onError: () => toast.error('Erreur lors de la déclaration'),
  });
};
export const useCahierTexte = (coursId?: string) =>
  useQuery({ queryKey: ['professeur', 'cahier-texte', coursId], queryFn: () => professeurApi.cahierTexte({ coursId }).then(unwrap) });
export const useCreerCahierTexte = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => professeurApi.creerCahierTexte(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professeur', 'cahier-texte'] }); toast.success('Entrée enregistrée'); },
    onError: () => toast.error('Erreur'),
  });
};

/**
 * `data` est la liste des statuts par élève. L'ancienne version l'étalait dans
 * un objet (`{ classeId, ...tableau }`), ce qui produisait `{0:…, 1:…}` et
 * vidait l'appel de son contenu ; le classeId part maintenant dans l'URL et la
 * liste dans `lignes`, seul champ que le backend lit pour les statuts.
 */
export const useFaireAppel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classeId, lignes, coursId, dateCours, heureDebut, session }: {
      classeId: string;
      lignes: { eleveId: string; statut: 'PRESENT' | 'ABSENT' | 'RETARD' }[];
      coursId?: string; dateCours?: string; heureDebut?: string; session?: string;
    }) => professeurApi.faireAppel(classeId, {
      classeId,
      coursId,
      dateCours: dateCours ?? new Date().toISOString().slice(0, 10),
      heureDebut,
      session: session ?? (new Date().getHours() < 13 ? 'MATIN' : 'APRES_MIDI'),
      lignes,
      absents: lignes.filter((l) => l.statut === 'ABSENT').map((l) => l.eleveId),
    }),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ['professeur', 'classe', v.classeId] });
      toast.success('Appel enregistré');
    },
    onError: (e) => toast.error(extractApiMessage(e, "Erreur lors de l'appel")),
  });
};

export const useSaisirNotes = () => {
  return useMutation({
    mutationFn: ({ classeId, matiereId, data }: { classeId: string; matiereId: string; data: unknown }) =>
      professeurApi.saisirNotes({ classeId, matiereId, ...(data as Record<string, unknown>) }),
    onSuccess: () => toast.success('Notes enregistrées'),
    onError: () => toast.error('Erreur lors de la saisie'),
  });
};

export const useProfesseurDiscipline = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['professeur', 'discipline', params], queryFn: () => professeurApi.discipline(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

export const useCreateProfesseurDiscipline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => professeurApi.createDiscipline(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professeur', 'discipline'] }); toast.success('Incident enregistré'); },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });
};

export const useCloturerProfesseurDiscipline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => professeurApi.cloturerDiscipline(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['professeur', 'discipline'] }); toast.success('Dossier clôturé'); },
    onError: () => toast.error('Erreur'),
  });
};

// --- ADMIN HOOKS ---
export const useAdminClasses = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'classes', params], queryFn: () => adminApi.classes(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminEleves = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'eleves', params], queryFn: () => adminApi.eleves(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminParents = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'parents', params], queryFn: () => adminApi.parents(params).then(r => r.data) });
export const useAdminProfesseurs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'professeurs', params], queryFn: () => adminApi.professeurs(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminMatieres = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'matieres', params], queryFn: () => adminApi.matieres(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminNotes = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'notes', params], queryFn: () => adminApi.notes(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminBulletins = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'bulletins', params], queryFn: () => adminApi.bulletins(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminAbsencesEleves = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'absences-eleves', params], queryFn: () => adminApi.absencesEleves(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminAbsencesElevesStats = () =>
  useQuery({ queryKey: ['admin', 'absences-eleves', 'stats'], queryFn: () => adminApi.absencesElevesStats().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminAbsencesElevesDemandes = () =>
  useQuery({ queryKey: ['admin', 'absences-eleves', 'demandes'], queryFn: () => adminApi.absencesElevesDemandes().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAbsencesStatsParCycle = () =>
  useQuery({ queryKey: ['admin', 'absences-eleves', 'stats', 'par-cycle'], queryFn: () => adminApi.absencesStatsParCycle().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAbsencesStatsParNiveau = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'absences-eleves', 'stats', 'par-niveau', params], queryFn: () => adminApi.absencesStatsParNiveau(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }), enabled: params !== undefined });
export const useAbsencesStatsParClasse = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'absences-eleves', 'stats', 'par-classe', params], queryFn: () => adminApi.absencesStatsParClasse(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }), enabled: params !== undefined });
export const useAbsencesEvolution = () =>
  useQuery({ queryKey: ['admin', 'absences-eleves', 'stats', 'evolution'], queryFn: () => adminApi.absencesEvolution().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAbsencesTopAbsents = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'absences-eleves', 'top-absents', params], queryFn: () => adminApi.absencesTopAbsents(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminAnnonces = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'annonces', params], queryFn: () => adminApi.annonces(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminAnneesAcademiques = () =>
  useQuery({ queryKey: ['admin', 'annees-academiques'], queryFn: () => adminApi.anneesAcademiques().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d ?? []); }) });
export const useAdminCommunications = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'communications', params], queryFn: () => adminApi.communications(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminReclamations = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'reclamations', params], queryFn: () => adminApi.reclamations(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminEmploisDuTemps = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'emplois-du-temps', params], queryFn: () => adminApi.emploisDuTemps(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminClasseEmploiDuTemps = (classeId: string) =>
  useQuery({ queryKey: ['admin', 'emplois-du-temps', 'classe', classeId], queryFn: () => adminApi.classeEmploiDuTemps(classeId).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }), enabled: !!classeId });
export const useAdminPaiements = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'paiements', params], queryFn: () => adminApi.paiements(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminPersonnel = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'personnel', params], queryFn: () => adminApi.personnel(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminConvocations = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'convocations', params], queryFn: () => adminApi.convocations(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminStats = () =>
  useQuery({ queryKey: ['admin', 'stats'], queryFn: () => adminApi.stats().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminStatsMensuel = (params?: { annee?: string }) =>
  useQuery({ queryKey: ['admin', 'stats-mensuel', params], queryFn: () => adminApi.statsMensuel(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAppbarSummary = () =>
  useQuery({ queryKey: ['appbar', 'summary'], queryFn: () => adminApi.appbarSummary().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminInscriptions = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'inscriptions', params], queryFn: () => adminApi.inscriptions(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminPointages = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'pointages', params], queryFn: () => adminApi.pointages(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminAbsencesPersonnel = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'absences-personnel', params], queryFn: () => adminApi.absencesPersonnel(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminCalendrierScolaire = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'calendrier-scolaire', params], queryFn: () => adminApi.calendrierScolaire(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminRapports = () =>
  useQuery({ queryKey: ['admin', 'rapports'], queryFn: () => adminApi.rapports().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Examens
export const useAdminExamens = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'examens', params], queryFn: () => adminApi.examens(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Devoirs
export const useAdminDevoirs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'devoirs', params], queryFn: () => adminApi.devoirs(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Discipline
export const useAdminDiscipline = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'discipline', params], queryFn: () => adminApi.discipline(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Bibliothèque
export const useAdminOuvrages = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'ouvrages', params], queryFn: () => adminApi.ouvrages(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminEmprunts = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'emprunts', params], queryFn: () => adminApi.emprunts(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Santé
export const useAdminConsultations = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'consultations', params], queryFn: () => adminApi.consultations(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useAdminStockMedical = () =>
  useQuery({ queryKey: ['admin', 'stock-medical'], queryFn: () => adminApi.stockMedical().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Utilisateurs
export const useAdminUtilisateurs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'utilisateurs', params], queryFn: () => adminApi.utilisateurs(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Audit
export const useAdminAuditLogs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'audit-logs', params], queryFn: () => adminApi.auditLogs(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Archives
export const useAdminArchives = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['admin', 'archives', params], queryFn: () => adminApi.archives(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

// Mutations admin existantes
export const useCreateEleve = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createEleve,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'eleves'] }); toast.success('Élève créé'); },
    onError: (err) => toast.error(extractApiMessage(err, 'Erreur lors de la création')),
  });
};
export const useUpdateEleve = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateEleve(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'eleves'] }); toast.success('Élève modifié'); },
    onError: (err) => toast.error(extractApiMessage(err, 'Erreur lors de la modification')),
  });
};
export const useDeleteEleve = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteEleve,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'eleves'] }); toast.success('Élève supprimé'); },
    onError: (err) => toast.error(extractApiMessage(err, 'Erreur lors de la suppression')),
  });
};
export const useCreateClasse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createClasse,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'classes'] }); toast.success('Classe créée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateClasse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateClasse(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'classes'] }); toast.success('Classe modifiée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteClasse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteClasse,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'classes'] }); toast.success('Classe supprimée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreateProfesseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createProfesseur,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'professeurs'] }); toast.success('Professeur créé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateProfesseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateProfesseur(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'professeurs'] }); toast.success('Professeur modifié'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteProfesseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteProfesseur,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'professeurs'] }); toast.success('Professeur supprimé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreateParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createParent,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'parents'] }); toast.success('Parent créé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateParent(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'parents'] }); toast.success('Parent modifié'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreateMatiere = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createMatiere,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'matieres'] }); toast.success('Matière créée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateMatiere = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateMatiere(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'matieres'] }); toast.success('Matière modifiée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteMatiere = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMatiere(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'matieres'] }); toast.success('Matière supprimée'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};
export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createNote,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notes'] }); toast.success('Note enregistrée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateNote(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notes'] }); toast.success('Note modifiée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteNote(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notes'] }); toast.success('Note supprimée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreateAnnonce = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createAnnonce,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'annonces'] }); toast.success('Annonce créée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateAnnonce = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateAnnonce(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'annonces'] }); toast.success('Annonce modifiée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteAnnonce = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteAnnonce,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'annonces'] }); toast.success('Annonce supprimée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreateCommunication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createCommunication,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'communications'] }); toast.success('Communication enregistrée'); },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });
};
export const usePreviewCommunicationDestinataires = () =>
  useMutation({ mutationFn: adminApi.previewCommunicationDestinataires });
export const useEnvoyerCommunication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.envoyerCommunication(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'communications'] }); toast.success('Communication envoyée'); },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });
};
export const useUpdateCommunication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateCommunication(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'communications'] }); toast.success('Communication modifiée'); },
    onError: () => toast.error('Erreur lors de la modification'),
  });
};
export const useDeleteCommunication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCommunication(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'communications'] }); toast.success('Communication supprimée'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};
export const useUpdateReclamation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateReclamation(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'reclamations'] }); toast.success('Réclamation mise à jour'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useRepondreReclamation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message, statut }: { id: string; message: string; statut?: string }) => adminApi.repondreReclamation(id, { message, statut }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'reclamations'] }); toast.success('Réponse envoyée'); },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });
};
export const useUpdateAbsence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateAbsence(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'absences-eleves'] }); toast.success('Absence mise à jour'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useAdminCreateAbsenceEleve = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => adminApi.createAbsence(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'absences-eleves'] }); toast.success('Absence déclarée'); },
    onError: () => toast.error('Erreur lors de la déclaration'),
  });
};
export const useApprouverAbsenceEleve = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.approuverAbsence(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'absences-eleves'] }); toast.success('Absence approuvée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useRejeterAbsenceEleve = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motifRejet }: { id: string; motifRejet?: string }) => adminApi.rejeterAbsence(id, motifRejet),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'absences-eleves'] }); toast.success('Absence rejetée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreateConvocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createConvocation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'convocations'] }); toast.success('Convocation créée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateConvocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateConvocation(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'convocations'] }); toast.success('Convocation modifiée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useAdminCompteRenduConvocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, compteRendu }: { id: string; compteRendu: string }) => adminApi.compteRenduConvocation(id, compteRendu),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'convocations'] }); toast.success('Compte-rendu enregistré'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useAdminDeleteConvocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteConvocation(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'convocations'] }); toast.success('Convocation supprimée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreatePointage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPointage,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'pointages'] }); toast.success('Pointage enregistré'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useValiderInscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.validerInscription(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'inscriptions'] }); qc.invalidateQueries({ queryKey: ['caisse', 'inscriptions'] }); toast.success('Inscription validée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const usePublishBulletins = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.publishBulletins,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'bulletins'] }); toast.success('Bulletins publiés'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreatePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPersonnel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'personnel'] }); toast.success('Personnel créé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdatePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updatePersonnel(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'personnel'] }); toast.success('Personnel modifié'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeletePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deletePersonnel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'personnel'] }); toast.success('Personnel supprimé'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};
export const useResetPersonnelCredentials = () => {
  return useMutation({
    mutationFn: (id: string) => adminApi.resetPersonnelCredentials(id),
    onSuccess: () => toast.success('Credentials réinitialisés et envoyés par email'),
    onError: () => toast.error('Erreur lors de la réinitialisation'),
  });
};
export const useCreateAbsencePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => adminApi.createAbsencePersonnel(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'absences-personnel'] }); toast.success('Absence déclarée'); },
    onError: () => toast.error('Erreur lors de la déclaration'),
  });
};
export const useValiderAbsencePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.validerAbsencePersonnel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'absences-personnel'] }); toast.success('Absence validée'); },
    onError: () => toast.error('Erreur lors de la validation'),
  });
};
export const useRefuserAbsencePersonnel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motifRefus }: { id: string; motifRefus?: string }) => adminApi.refuserAbsencePersonnel(id, motifRefus),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'absences-personnel'] }); toast.success('Absence refusée'); },
    onError: () => toast.error('Erreur lors du refus'),
  });
};

// Mutations examens
export const useCreateExamen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createExamen,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'examens'] }); toast.success('Examen créé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateExamen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateExamen(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'examens'] }); toast.success('Examen modifié'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteExamen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteExamen(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'examens'] }); toast.success('Examen supprimé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useGenererPvExamen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.genererPvExamen(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'examens'] }); toast.success('PV généré'); },
    onError: () => toast.error('Erreur'),
  });
};
export const usePublierResultatsExamen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.publierResultatsExamen(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'examens'] }); toast.success('Résultats publiés'); },
    onError: () => toast.error('Erreur'),
  });
};

// Mutations devoirs
export const useCreateDevoir = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createDevoir,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'devoirs'] }); toast.success('Devoir créé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateDevoir = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateDevoir(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'devoirs'] }); toast.success('Devoir modifié'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteDevoir = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteDevoir(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'devoirs'] }); toast.success('Devoir supprimé'); },
    onError: () => toast.error('Erreur'),
  });
};

// Mutations discipline
export const useCreateDiscipline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createDiscipline,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'discipline'] }); toast.success('Incident enregistré'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateDiscipline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.updateDiscipline(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'discipline'] }); toast.success('Dossier mis à jour'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCloturerDiscipline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => adminApi.cloturerDiscipline(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'discipline'] }); toast.success('Dossier clôturé'); },
    onError: () => toast.error('Erreur'),
  });
};

// Mutations bibliothèque
export const useCreateOuvrage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createOuvrage,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'ouvrages'] }); toast.success('Ouvrage ajouté'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useCreateEmprunt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createEmprunt,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'emprunts'] }); qc.invalidateQueries({ queryKey: ['admin', 'ouvrages'] }); toast.success('Emprunt enregistré'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useRetournerEmprunt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.retournerEmprunt(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'emprunts'] }); qc.invalidateQueries({ queryKey: ['admin', 'ouvrages'] }); toast.success('Retour enregistré'); },
    onError: () => toast.error('Erreur'),
  });
};

// Mutations santé
export const useCreateConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createConsultation,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'consultations'] }); toast.success('Consultation enregistrée'); },
    onError: () => toast.error('Erreur'),
  });
};

// Mutations utilisateurs
export const useCreateUtilisateur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createUtilisateur,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }); toast.success('Utilisateur créé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useSuspendreUtilisateur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendreUtilisateur(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }); toast.success('Utilisateur suspendu'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useActiverUtilisateur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.activerUtilisateur(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }); toast.success('Utilisateur activé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteUtilisateur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUtilisateur(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'utilisateurs'] }); toast.success('Utilisateur supprimé'); },
    onError: () => toast.error('Erreur'),
  });
};

// Mutation restauration archive
export const useRestaurerArchive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.restaurerArchive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'archives'] }); toast.success('Restauration lancée'); },
    onError: () => toast.error('Erreur lors de la restauration'),
  });
};

// --- CAISSE HOOKS ---
export const useCaissePaiements = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['caisse', 'paiements', params], queryFn: () => caisseApi.paiements(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useCaisseInscriptions = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['caisse', 'inscriptions', params], queryFn: () => caisseApi.inscriptions(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useCreateCaissePaiement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: caisseApi.createPaiement,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['caisse', 'paiements'] }); toast.success('Paiement enregistré'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateCaissePaiement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => caisseApi.updatePaiement(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['caisse', 'paiements'] }); toast.success('Paiement mis à jour'); },
    onError: () => toast.error('Erreur'),
  });
};

// --- PLATFORM HOOKS ---
export const usePlatformTenants = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['platform', 'tenants', params], queryFn: () => platformApi.tenants(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const usePlatformStats = () =>
  useQuery({ queryKey: ['platform', 'stats'], queryFn: () => platformApi.stats().then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const usePlatformAuditLogs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['platform', 'audit-logs', params], queryFn: () => platformApi.auditLogs(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const usePlatformUtilisateurs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['platform', 'utilisateurs', params], queryFn: () => platformApi.utilisateurs(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: platformApi.createTenant,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform', 'tenants'] }); toast.success('Établissement créé'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useUpdateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => platformApi.updateTenant(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform', 'tenants'] }); toast.success('Établissement modifié'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useSuspendTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.suspendTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform', 'tenants'] }); toast.success('Établissement suspendu'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useReactivateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformApi.reactivateTenant(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['platform', 'tenants'] }); toast.success('Établissement réactivé'); },
    onError: () => toast.error('Erreur'),
  });
};

// --- AUTH HOOKS ---
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => authApi.changePassword(data),
    onSuccess: () => toast.success('Mot de passe modifié'),
    onError: () => toast.error('Erreur lors du changement de mot de passe'),
  });
};
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (data: Partial<{ firstName: string; lastName: string; email: string; telephone: string }>) => authApi.updateProfile(data),
    onSuccess: () => toast.success('Profil mis à jour'),
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
};

// --- SURVEILLANT HOOKS ---
export const useSurveillantAbsences = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['surveillant', 'absences', params], queryFn: () => surveillantApi.absencesEleves(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

/** Cours programmés pour une date — base du pointage des enseignants. */
export const useCoursDuJour = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['surveillant', 'cours-du-jour', params], queryFn: () => surveillantApi.coursDuJour(params).then(unwrap) });

export const useMarquerPresenceProfesseur = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => surveillantApi.marquerPresenceProfesseur(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'cours-du-jour'] }); toast.success('Présence enregistrée'); },
    onError: (e) => toast.error(extractApiMessage(e, "Enregistrement impossible")),
  });
};
export const useSurveillantClasses = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['surveillant', 'classes', params], queryFn: () => surveillantApi.classes(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useSurveillantEleves = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['surveillant', 'eleves', params], queryFn: () => surveillantApi.eleves(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useSurveillantParents = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['surveillant', 'parents', params], queryFn: () => surveillantApi.parents(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useCreateAbsenceEleve = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => surveillantApi.createAbsenceEleve(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'absences'] }); toast.success('Absence enregistrée'); },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });
};
export const useApprouverAbsence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => surveillantApi.approuverAbsence(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'absences'] }); toast.success('Absence approuvée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useRejeterAbsence = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => surveillantApi.rejeterAbsence(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'absences'] }); toast.success('Absence rejetée'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useSurveillantConvocations = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['surveillant', 'convocations', params], queryFn: () => surveillantApi.convocations(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });
export const useCreateSurveillantConvocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => surveillantApi.createConvocation(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'convocations'] }); toast.success('Convocation créée'); },
    onError: () => toast.error('Erreur lors de la création'),
  });
};
export const useCompteRenduConvocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, compteRendu }: { id: string; compteRendu: string }) => surveillantApi.compteRenduConvocation(id, compteRendu),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'convocations'] }); toast.success('Compte-rendu enregistré'); },
    onError: () => toast.error('Erreur'),
  });
};
export const useDeleteConvocation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => surveillantApi.deleteConvocation(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'convocations'] }); toast.success('Convocation supprimée'); },
    onError: () => toast.error('Erreur'),
  });
};

export const useSurveillantDiscipline = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['surveillant', 'discipline', params], queryFn: () => surveillantApi.discipline(params).then(r => { const d = r.data; return Array.isArray(d) ? d : (d?.data ?? d?.content ?? d); }) });

export const useCreateSurveillantDiscipline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => surveillantApi.createDiscipline(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'discipline'] }); toast.success('Incident enregistré'); },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  });
};

export const useCloturerSurveillantDiscipline = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => surveillantApi.cloturerDiscipline(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['surveillant', 'discipline'] }); toast.success('Dossier clôturé'); },
    onError: () => toast.error('Erreur'),
  });
};
