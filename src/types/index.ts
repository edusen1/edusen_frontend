export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface Eleve {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  telephone?: string;
  matricule?: string;
  photoUrl?: string;
  classeId?: string;
  classe?: { id: string; nom: string };
  actif: boolean;
  genre?: string;
  dateNaissance?: string;
  adresse?: string;
}

export interface Classe {
  id: string;
  nom: string;
  niveau?: { id: string; nom: string };
  cycle?: { id: string; nom: string };
  anneeAcademique?: string;
  capacite?: number;
  enseignantPrincipal?: { id: string; firstName: string; lastName: string };
  _count?: { eleves: number };
}

export interface Note {
  id: string;
  valeur: number;
  coefficient?: number;
  trimestre?: string;
  type?: string;
  matiere?: { id: string; nom: string; coefficient: number };
  eleve?: { id: string; firstName: string; lastName: string };
  createdAt?: string;
}

export interface Bulletin {
  id: string;
  trimestre?: string;
  anneeAcademique?: string;
  moyenneGenerale?: number;
  rang?: number;
  statut?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  pdfUrl?: string;
  eleve?: { id: string; firstName: string; lastName: string; classe?: { nom: string } };
  createdAt?: string;
}

export interface Absence {
  id: string;
  date: string;
  duree?: number;
  motif?: string;
  justifiee?: boolean;
  statut?: 'EN_ATTENTE' | 'JUSTIFIEE' | 'NON_JUSTIFIEE';
  eleve?: { id: string; firstName: string; lastName: string; classe?: { nom: string } };
  matiere?: { id: string; nom: string };
  createdAt?: string;
}

export interface Annonce {
  id: string;
  titre: string;
  contenu: string;
  cible?: string;
  actif: boolean;
  dateExpiration?: string;
  createdAt?: string;
  auteur?: { firstName: string; lastName: string };
}

export interface Paiement {
  id: string;
  montant: number;
  type?: string;
  statut?: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
  datePaiement?: string;
  eleve?: { id: string; firstName: string; lastName: string; classe?: { nom: string } };
  description?: string;
  createdAt?: string;
}

export interface Reclamation {
  id: string;
  motif: string;
  statut?: 'NOUVEAU' | 'EN_COURS' | 'RESOLU';
  reponse?: string;
  eleve?: { id: string; firstName: string; lastName: string };
  note?: { id: string; valeur: number; matiere?: { nom: string } };
  createdAt?: string;
}

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  telephone?: string;
  role?: string;
  actif: boolean;
  poste?: string;
}

export interface Tenant {
  id: string;
  nom: string;
  ville?: string;
  email?: string;
  telephone?: string;
  logoUrl?: string;
  statut?: 'ACTIF' | 'SUSPENDU';
  abonnement?: string;
  createdAt?: string;
  _count?: { users: number; eleves: number };
}

export interface Notification {
  id: string;
  titre: string;
  contenu?: string;
  lu: boolean;
  type?: string;
  createdAt?: string;
}

export interface Matiere {
  id: string;
  nom: string;
  coefficient: number;
  description?: string;
}

export interface Professeur {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  telephone?: string;
  matieres?: Matiere[];
  actif: boolean;
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  telephone?: string;
  enfants?: Eleve[];
  actif: boolean;
}

export interface EmploiDuTemps {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  matiere?: { id: string; nom: string };
  classe?: { id: string; nom: string };
  professeur?: { id: string; firstName: string; lastName: string };
  salle?: string;
}

export interface Convocation {
  id: string;
  objet: string;
  date: string;
  heure?: string;
  statut?: 'EN_ATTENTE' | 'CONVOQUE' | 'PRESENTE' | 'ABSENT';
  eleve?: { id: string; firstName: string; lastName: string; classe?: { nom: string } };
  createdAt?: string;
}

export interface Inscription {
  id: string;
  statut?: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
  eleve?: { id: string; firstName: string; lastName: string };
  classe?: { id: string; nom: string };
  montantInscription?: number;
  createdAt?: string;
}
