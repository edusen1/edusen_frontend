export type UserRole =
  | 'SUPER_ADMIN'
  | 'GESTIONNAIRE'
  | 'ADMIN'
  | 'RH'
  | 'SURVEILLANT'
  | 'CAISSIER'
  | 'COMPTABLE'
  | 'ENSEIGNANT'
  | 'ELEVE'
  | 'PARENT';

export interface SessionUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  tenantId: string;
  avatar?: string;
}

export interface AuthSession {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string;
  exp: number;
  iat: number;
}
