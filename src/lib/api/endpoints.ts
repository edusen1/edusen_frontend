import { apiClient } from './client';

// AUTH — /api/v1/auth/*
export const authApi = {
  login: (data: { login: string; password: string }) =>
    apiClient.post('/v1/auth/login', data),
  refresh: (data: { refreshToken: string }) =>
    apiClient.post('/v1/auth/refresh', data),
  logout: () => apiClient.post('/v1/auth/logout'),
  me: () => apiClient.get('/v1/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/v1/auth/change-password', data),
  forgotPassword: (email: string) =>
    apiClient.post('/v1/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post('/v1/auth/reset-password', data),
  updateProfile: (data: Partial<{ firstName: string; lastName: string; email: string; telephone: string }>) =>
    apiClient.patch('/v1/utilisateurs/me', data),
};

// ELEVE — /api/eleve/*
export const eleveApi = {
  profil: () => apiClient.get('/eleve/profil'),
  notes: (trimestre?: string) => apiClient.get('/eleve/notes', { params: { trimestre } }),
  bulletins: () => apiClient.get('/eleve/bulletins'),
  exportBulletin: (id: string) => apiClient.get(`/eleve/bulletins/${id}/export`, { responseType: 'blob' }),
  emploiDuTemps: () => apiClient.get('/eleve/emploi-du-temps'),
  absences: () => apiClient.get('/eleve/absences'),
  notifications: () => apiClient.get('/eleve/notifications'),
  marquerLu: (id: string) => apiClient.patch(`/eleve/notifications/${id}/lire`),
  toutLire: () => apiClient.post('/eleve/notifications/tout-lire'),
  reclamations: () => apiClient.get('/eleve/reclamations'),
  creerReclamation: (data: { motif: string; noteId?: string }) =>
    apiClient.post('/eleve/reclamations', data),
};

// PARENT — /api/parent/*
export const parentApi = {
  profil: () => apiClient.get('/parent/profil'),
  enfants: () => apiClient.get('/parent/enfants'),
  enfantProfil: (id: string) => apiClient.get(`/parent/enfants/${id}/profil`),
  enfantNotes: (id: string, trimestre?: string) =>
    apiClient.get(`/parent/enfants/${id}/notes`, { params: { trimestre } }),
  enfantBulletins: (id: string) => apiClient.get(`/parent/enfants/${id}/bulletins`),
  enfantEmploiDuTemps: (id: string) => apiClient.get(`/parent/enfants/${id}/emploi-du-temps`),
  enfantAbsences: (id: string) => apiClient.get(`/parent/enfants/${id}/absences`),
  paiements: () => apiClient.get('/parent/paiements'),
  notifications: () => apiClient.get('/parent/notifications'),
  reclamations: () => apiClient.get('/parent/reclamations'),
  creerReclamation: (data: unknown) => apiClient.post('/parent/reclamations', data),
};

// ENSEIGNANT (professeur) — /api/enseignant/*
export const professeurApi = {
  profil: () => apiClient.get('/enseignant/profil'),
  mesClasses: () => apiClient.get('/enseignant/classes-matieres'),
  classesMatieres: () => apiClient.get('/enseignant/classes-matieres'),
  paiements: () => apiClient.get('/v1/paiements', { params: { role: 'ENSEIGNANT' } }),
  saisirNotes: (data: unknown) => apiClient.post('/enseignant/notes', data),
  faireAppel: (data: unknown) => apiClient.post('/enseignant/appels', data),
  classeEleves: (classeId: string) =>
    apiClient.get('/admin/eleves', { params: { classeId } }),
  emploiDuTemps: () => apiClient.get('/enseignant/emploi-du-temps'),
  absences: () => apiClient.get('/enseignant/absences'),
  declarerAbsence: (data: unknown) => apiClient.post('/enseignant/absences', data),
  cahierTexte: (coursId?: string) =>
    apiClient.get('/enseignant/cahier-texte', { params: { coursId } }),
  creerCahierTexte: (data: unknown) => apiClient.post('/enseignant/cahier-texte', data),
  modifierCahierTexte: (id: string, data: unknown) =>
    apiClient.patch(`/enseignant/cahier-texte/${id}`, data),
};

// ADMIN — /api/admin/*  and  /api/v1/*
export const adminApi = {
  // Classes
  classes: (params?: Record<string, unknown>) => apiClient.get('/admin/classes', { params }),
  createClasse: (data: unknown) => apiClient.post('/admin/classes', data),
  updateClasse: (id: string, data: unknown) => apiClient.put(`/admin/classes/${id}`, data),
  deleteClasse: (id: string) => apiClient.delete(`/admin/classes/${id}`),
  classeEleves: (id: string) => apiClient.get('/admin/eleves', { params: { classeId: id } }),

  // Eleves
  eleves: (params?: Record<string, unknown>) => apiClient.get('/admin/eleves', { params }),
  createEleve: (data: unknown) => apiClient.post('/admin/eleves', data),
  updateEleve: (id: string, data: unknown) => apiClient.put(`/admin/eleves/${id}`, data),
  deleteEleve: (id: string) => apiClient.delete(`/admin/eleves/${id}`),

  // Parents
  parents: (params?: Record<string, unknown>) => apiClient.get('/admin/parents', { params }),
  createParent: (data: unknown) => apiClient.post('/admin/parents', data),
  updateParent: (id: string, data: unknown) => apiClient.put(`/admin/parents/${id}`, data),

  // Enseignants (professeurs)
  professeurs: (params?: Record<string, unknown>) => apiClient.get('/admin/enseignants', { params }),
  createProfesseur: (data: unknown) => apiClient.post('/admin/enseignants', data),
  updateProfesseur: (id: string, data: unknown) => apiClient.put(`/admin/enseignants/${id}`, data),
  deleteProfesseur: (id: string) => apiClient.delete(`/admin/enseignants/${id}`),

  // Matières
  matieres: (params?: Record<string, unknown>) => apiClient.get('/admin/matieres', { params }),
  createMatiere: (data: unknown) => apiClient.post('/admin/matieres', data),
  updateMatiere: (id: string, data: unknown) => apiClient.put(`/admin/matieres/${id}`, data),
  deleteMatiere: (id: string) => apiClient.delete(`/admin/matieres/${id}`),

  // Notes
  notes: (params?: Record<string, unknown>) => apiClient.get('/admin/notes', { params }),
  createNote: (data: unknown) => apiClient.post('/admin/notes', data),
  updateNote: (id: string, data: unknown) => apiClient.put(`/admin/notes/${id}`, data),
  deleteNote: (id: string) => apiClient.delete(`/admin/notes/${id}`),

  // Bulletins
  bulletins: (params?: Record<string, unknown>) => apiClient.get('/admin/bulletins', { params }),
  publishBulletins: (data: unknown) => apiClient.post('/admin/bulletins/generer', data),

  // Absences élèves
  absencesEleves: (params?: Record<string, unknown>) => apiClient.get('/admin/absences-eleves', { params }),
  createAbsence: (data: unknown) => apiClient.post('/admin/absences-eleves', data),
  updateAbsence: (id: string, data: unknown) => apiClient.put(`/admin/absences-eleves/${id}`, data),

  // Annonces / Communication
  annonces: (params?: Record<string, unknown>) => apiClient.get('/admin/annonces', { params }),
  createAnnonce: (data: unknown) => apiClient.post('/admin/annonces', data),
  updateAnnonce: (id: string, data: unknown) => apiClient.put(`/admin/annonces/${id}`, data),
  deleteAnnonce: (id: string) => apiClient.delete(`/admin/annonces/${id}`),

  // Réclamations
  reclamations: (params?: Record<string, unknown>) => apiClient.get('/admin/reclamations', { params }),
  updateReclamation: (id: string, data: unknown) => apiClient.put(`/admin/reclamations/${id}`, data),

  // Emplois du temps
  emploisDuTemps: (params?: Record<string, unknown>) => apiClient.get('/admin/emplois-du-temps', { params }),
  classeEmploiDuTemps: (classeId: string, params?: Record<string, unknown>) =>
    apiClient.get('/admin/emplois-du-temps', { params: { classeId, ...params } }),

  // Paiements (scolarité)
  paiements: (params?: Record<string, unknown>) => apiClient.get('/admin/paiements', { params }),
  createPaiement: (data: unknown) => apiClient.post('/admin/paiements', data),
  updatePaiement: (id: string, data: unknown) => apiClient.put(`/admin/paiements/${id}`, data),

  // Personnel (v1)
  personnel: (params?: Record<string, unknown>) => apiClient.get('/v1/personnel', { params }),
  createPersonnel: (data: unknown) => apiClient.post('/v1/personnel', data),
  updatePersonnel: (id: string, data: unknown) => apiClient.put(`/v1/personnel/${id}`, data),

  // Pointages (v1)
  pointages: (params?: Record<string, unknown>) => apiClient.get('/v1/pointages', { params }),
  createPointage: (data: unknown) => apiClient.post('/v1/pointages', data),

  // Absences personnel (v1)
  absencesPersonnel: (params?: Record<string, unknown>) => apiClient.get('/v1/absences-personnel', { params }),
  createAbsencePersonnel: (data: unknown) => apiClient.post('/v1/absences-personnel', data),

  // Convocations (v1)
  convocations: (params?: Record<string, unknown>) => apiClient.get('/v1/convocations', { params }),
  createConvocation: (data: unknown) => apiClient.post('/v1/convocations', data),
  updateConvocation: (id: string, data: unknown) => apiClient.put(`/v1/convocations/${id}`, data),

  // Stats globales
  stats: () => apiClient.get('/v1/stats/etablissement'),
  appbarSummary: () => apiClient.get('/v1/stats/etablissement'),
  statsMensuel: (params?: { annee?: string }) =>
    apiClient.get('/v1/stats/mensuel', { params }),

  // Inscriptions
  inscriptions: (params?: Record<string, unknown>) => apiClient.get('/v1/inscriptions', { params }),
  validerInscription: (id: string) => apiClient.post(`/v1/inscriptions/${id}/valider`),

  // Rapports
  rapports: () => apiClient.get('/admin/reports'),

  // Calendrier scolaire
  calendrierScolaire: (params?: Record<string, unknown>) => apiClient.get('/admin/calendrier-scolaire', { params }),

  // Examens
  examens: (params?: Record<string, unknown>) => apiClient.get('/admin/examens', { params }),
  createExamen: (data: unknown) => apiClient.post('/admin/examens', data),
  updateExamen: (id: string, data: unknown) => apiClient.put(`/admin/examens/${id}`, data),
  deleteExamen: (id: string) => apiClient.delete(`/admin/examens/${id}`),
  genererPvExamen: (id: string) => apiClient.post(`/admin/examens/${id}/pv`),
  publierResultatsExamen: (id: string) => apiClient.post(`/admin/examens/${id}/publier`),

  // Devoirs
  devoirs: (params?: Record<string, unknown>) => apiClient.get('/admin/devoirs', { params }),
  createDevoir: (data: unknown) => apiClient.post('/admin/devoirs', data),
  updateDevoir: (id: string, data: unknown) => apiClient.put(`/admin/devoirs/${id}`, data),
  deleteDevoir: (id: string) => apiClient.delete(`/admin/devoirs/${id}`),

  // Discipline
  discipline: (params?: Record<string, unknown>) => apiClient.get('/admin/discipline', { params }),
  createDiscipline: (data: unknown) => apiClient.post('/admin/discipline', data),
  updateDiscipline: (id: string, data: unknown) => apiClient.put(`/admin/discipline/${id}`, data),
  cloturerDiscipline: (id: string, data: unknown) =>
    apiClient.post(`/admin/discipline/${id}/cloturer`, data),

  // Documents officiels
  documents: (params?: Record<string, unknown>) => apiClient.get('/admin/documents', { params }),
  createDocument: (data: unknown) => apiClient.post('/admin/documents', data),
  updateDocument: (id: string, data: unknown) => apiClient.put(`/admin/documents/${id}`, data),
  deleteDocument: (id: string) => apiClient.delete(`/admin/documents/${id}`),
  publierDocument: (id: string) => apiClient.post(`/admin/documents/${id}/publier`),
  archiverDocument: (id: string) => apiClient.post(`/admin/documents/${id}/archiver`),

  // Bibliothèque
  ouvrages: (params?: Record<string, unknown>) => apiClient.get('/admin/bibliotheque/ouvrages', { params }),
  createOuvrage: (data: unknown) => apiClient.post('/admin/bibliotheque/ouvrages', data),
  emprunts: (params?: Record<string, unknown>) => apiClient.get('/admin/bibliotheque/emprunts', { params }),
  createEmprunt: (data: unknown) => apiClient.post('/admin/bibliotheque/emprunts', data),
  retournerEmprunt: (id: string) => apiClient.post(`/admin/bibliotheque/emprunts/${id}/retour`),

  // Santé scolaire
  consultations: (params?: Record<string, unknown>) => apiClient.get('/admin/sante/consultations', { params }),
  createConsultation: (data: unknown) => apiClient.post('/admin/sante/consultations', data),
  stockMedical: () => apiClient.get('/admin/sante/stock'),

  // Utilisateurs & Rôles
  utilisateurs: (params?: Record<string, unknown>) => apiClient.get('/v1/utilisateurs', { params }),
  createUtilisateur: (data: unknown) => apiClient.post('/v1/utilisateurs', data),
  updateUtilisateur: (id: string, data: unknown) => apiClient.put(`/v1/utilisateurs/${id}`, data),
  suspendreUtilisateur: (id: string) => apiClient.post(`/v1/utilisateurs/${id}/suspendre`),
  activerUtilisateur: (id: string) => apiClient.post(`/v1/utilisateurs/${id}/activer`),
  deleteUtilisateur: (id: string) => apiClient.delete(`/v1/utilisateurs/${id}`),

  // Journal d'audit
  auditLogs: (params?: Record<string, unknown>) => apiClient.get('/v1/audit-logs', { params }),

  // Archives
  archives: (params?: Record<string, unknown>) => apiClient.get('/admin/archives', { params }),
  restaurerArchive: (id: string) => apiClient.post(`/admin/archives/${id}/restaurer`),
};

// SURVEILLANT — /api/v1/* (RolesAllowed ADMIN + SURVEILLANT)
export const surveillantApi = {
  absencesEleves: (params?: Record<string, unknown>) => apiClient.get('/v1/absences-eleves', { params }),
  createAbsenceEleve: (data: unknown) => apiClient.post('/v1/absences-eleves', data),
  approuverAbsence: (id: string) => apiClient.post(`/v1/absences-eleves/${id}/approuver`, {}),
  rejeterAbsence: (id: string) => apiClient.post(`/v1/absences-eleves/${id}/rejeter`, {}),
  convocations: (params?: Record<string, unknown>) => apiClient.get('/v1/convocations', { params }),
  createConvocation: (data: unknown) => apiClient.post('/v1/convocations', data),
  compteRenduConvocation: (id: string, compteRendu: string) =>
    apiClient.patch(`/v1/convocations/${id}/compte-rendu`, { compteRendu }),
  deleteConvocation: (id: string) => apiClient.delete(`/v1/convocations/${id}`),
  eleves: (params?: Record<string, unknown>) => apiClient.get('/admin/eleves', { params }),
  classes: (params?: Record<string, unknown>) => apiClient.get('/admin/classes', { params }),
  parents: (params?: Record<string, unknown>) => apiClient.get('/admin/parents', { params }),
};

// CAISSE — /api/caisse/*
export const caisseApi = {
  paiements: (params?: Record<string, unknown>) => apiClient.get('/caisse/paiements', { params }),
  createPaiement: (data: unknown) => apiClient.post('/caisse/paiements', data),
  updatePaiement: (id: string, data: unknown) => apiClient.put(`/caisse/paiements/${id}`, data),
  inscriptions: (params?: Record<string, unknown>) => apiClient.get('/v1/inscriptions', { params }),
  validerInscription: (id: string) => apiClient.post(`/v1/inscriptions/${id}/valider`),
};

// PLATFORM — /api/platform/*
export const platformApi = {
  tenants: (params?: Record<string, unknown>) => apiClient.get('/platform/tenants', { params }),
  createTenant: (data: unknown) => apiClient.post('/platform/tenants', data),
  updateTenant: (id: string, data: unknown) => apiClient.put(`/platform/tenants/${id}`, data),
  suspendTenant: (id: string) => apiClient.post(`/platform/tenants/${id}/suspend`),
  reactivateTenant: (id: string) => apiClient.post(`/platform/tenants/${id}/reactivate`),
  utilisateurs: (params?: Record<string, unknown>) => apiClient.get('/platform/utilisateurs', { params }),
  stats: () => apiClient.get('/platform/stats'),
  auditLogs: (params?: Record<string, unknown>) => apiClient.get('/platform/audit-logs', { params }),
};

// CONFIGURATION
export const configApi = {
  ecole: () => apiClient.get('/v1/etablissements'),
  updateEcole: (data: unknown) => apiClient.put('/v1/etablissements', data),
};
