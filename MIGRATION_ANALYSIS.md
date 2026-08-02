# Analyse de Migration — noura-school-frontend → edusen_frontend

> Dernière mise à jour : 2026-06-29 (audit complet — batch 9 : espace RH complet)
> Référence Angular : `noura-school-frontend/`
> Cible Next.js : `edusen_frontend/`

---

## Légende
- ✅ **Fait** — page existante, fonctionnalités migrées, inline styles, API intégré
- ⚠️ **Partiel** — page existante mais contenu/fonctionnalités manquants
- ❌ **Manquant** — page absente du Next.js

---

## Pages publiques (non authentifiées)

| Page Angular | Route Next.js | Statut | Notes |
|---|---|---|---|
| `home.component` | `/` | ✅ **Fait** | Landing page complète : nav, hero, stats ticker, about, features, rôles, CTA, footer |
| `login.component` | `/login` | ✅ Fait | Connexion email/password, JWT, store Zustand |
| `bulletin-public.component` | `/bulletin/[token]` | ✅ **Fait** | OTP 6 chiffres → vérification → tableau notes complet + impression |
| `paiement-public.component` | `/paiement/[token]` | ✅ **Fait** | Affichage facture, montant, bouton Payer |
| `whatsapp-connect` | — | ❌ Manquant | Page de connexion WhatsApp (si applicable) |

---

## Espace Admin (`/admin/*`)

| Page Angular | Route Next.js | Statut | Ce qui manque |
|---|---|---|---|
| `dashboard-admin.component` | `/admin/dashboard` | ✅ **Fait** | KPIs live (useAdminStats), 7 sections dynamiques : absences, paiements, réclamations, convocations, inscriptions, annonces actives |
| `eleve.component` | `/admin/eleves` | ✅ **Fait** | Formulaire complet : 12 champs + genre + credentials banner après création |
| `classe.component` | `/admin/classes` | ✅ **Fait** | Formulaire complet : niveau, cycle, effectifMax, salleClasse, anneeScolaire + filtres |
| `enseignant.component` | `/admin/professeurs` | ✅ **Fait** | Formulaire complet : username, matricule, spécialité, adresse |
| `parents` | `/admin/parents` | ✅ **Fait** | Rewrite inline styles (était Shadcn), API `useAdminParents` + `useCreateParent` + `useUpdateParent`, search, modal create/edit |
| `personnel.component` | `/admin/personnel` | ✅ **Fait** | Type (5 types), salaire, matieres checkboxes, colonne salaire dans table |
| `inscription.component` | `/admin/inscriptions` | ✅ **Fait** | Modal transfert de classe ajouté, onglets, stats |
| `note.component` | `/admin/notes` | ✅ **Fait** | Rewrite inline styles, CRUD complet (create/update/delete), filtres classe/matière/trimestre/type, stats, export CSV |
| `bulletin.component` | `/admin/bulletins` | ✅ **Fait** | Réécrit inline styles, grille cartes, stats, prévisualisation PDF modal |
| `reclamation.component` | `/admin/reclamations` | ✅ **Fait** | Réécrit inline styles, stats 4 cartes, 2 onglets (en_attente/historique), note avant/après |
| `paiement.component` | `/admin/paiements` | ✅ **Fait** | 2 onglets : Liste (valider/rejeter) + Encaissement (form complet) |
| `absence-eleve.component` | `/admin/absences-eleves` | ✅ **Fait** | 2 onglets, 4 stats, filtres complets, modal déclarer, approuver/rejeter |
| `absence-personnel.component` | `/admin/absences-personnel` | ✅ **Fait** | Table + stats + valider/rejeter + modal déclarer absence |
| `annonce.component` | `/admin/annonces` | ✅ **Fait** | Stats, table, filtres, modal create/edit, toggle actif, delete |
| `convocation.component` | `/admin/convocations` | ✅ **Fait** | Stats 4 cartes, filtres, modal create/edit, clôturer, compte-rendu modal |
| `emploi-du-temps.component` | `/admin/emplois-du-temps` | ✅ **Fait** | Grille hebdo inline styles, filtre par classe, API `useAdminEmploisDuTemps` + `useAdminClasses` |
| `pointage.component` | `/admin/pointages` | ✅ **Fait** | Stats + table + modal pointer (statut/méthode/heures) + détail + export CSV |
| `matieres` (standalone) | `/admin/matieres` | ✅ Fait | Grid cartes, modal, hooks API |
| `cours` (standalone) | `/admin/cours` | ✅ Fait | Liste, filtres, modal |
| `profil.component` | `/admin/profil` | ✅ **Fait** | 3 onglets : Informations, Sécurité, Activité + bouton 2FA + historique |
| `parametres` | `/admin/parametres` | ⚠️ Partiel | 6 onglets inline styles — API non intégré (CRUD Années/Cycles/Niveaux/Matières/Bâtiments/Salles) |
| `configuration.component` | `/admin/configuration` | ✅ **Fait** | 5 onglets : Identité école, Apparence (13 palettes), Sections & Frais, **WhatsApp** (QR code, toggles), Coefficients |
| `document-templates` | `/admin/document-templates` | ⚠️ Partiel | Inline styles, filtres — 100% statique, pas d'API backend pour les modèles |
| `rapports` | `/admin/rapports` | ✅ Fait | API `useAdminRapports`, fallback statique, export PDF bouton |
| `calendrier-scolaire` | `/admin/calendrier-scolaire` | ✅ Fait | Calendrier mensuel interactif, API `useAdminCalendrierScolaire`, légende |

---

## Espace Enseignant (`/enseignant/*` → `/professeur/*`)

| Page Angular | Route Next.js | Statut | Notes |
|---|---|---|---|
| Dashboard enseignant | `/dashboard` | ✅ Fait | — |
| Mes classes | `/professeur/mes-classes` | ✅ **Fait** | API `useProfesseurMesClasses`, grid `auto-fill minmax(260px)` responsive, search câblé |
| Emploi du temps | `/professeur/emploi-du-temps` | ✅ **Fait** | Rewrite inline styles (était Shadcn), grille hebdo couleurs par classe, API `useProfesseurEmploiDuTemps`, détail modal, export CSV |
| Faire l'appel | `/professeur/appel` | ✅ **Fait** | API `useFaireAppel` + `useProfesseurClasseEleves`, stats flexWrap mobile, table overflow-x |
| Saisir les notes | `/professeur/saisir-notes` | ✅ **Fait** | API `useSaisirNotes`, filtre bar flexWrap, table overflow-x mobile, moyenne classe dynamique |
| Cahier de textes | `/professeur/cahier-de-textes` | ✅ **Fait** | Rewrite inline styles (était Shadcn), API `useCahierTexte` + `useCreerCahierTexte`, form : classe/date/contenu/observations |
| Absences | `/professeur/absences` | ✅ **Fait** | API `useProfesseurAbsences` + `useDeclarerAbsenceProfesseur`, form : dateDebut/dateFin/heureDebut/heureFin/typeAbsence/motif, flexWrap mobile |
| Paiements | `/professeur/paiements` | ✅ **Fait** | Colonnes : référence, heuresEffectuées, heuresDéduites, motifRejet ; modal détail complet, overflow-x mobile |
| Profil | `/professeur/profil` | ✅ **Fait** | 3 onglets : Informations, Sécurité (+ bouton 2FA), Activité (historique) ; layout flexWrap mobile |

---

## Espace Élève (`/eleve/*`)

| Page Angular | Route Next.js | Statut | Notes |
|---|---|---|---|
| Accueil | `/eleve/accueil` | ✅ **Fait** | 5 hooks connectés : `useEleveProfil`, `useEleveNotes` (moyenne/rang/dernières notes), `useEleveAbsences` (compteur), `useEleveEmploiDuTemps` (prochain cours), `useEleveNotifications` (badge + dernière notif) |
| Notes | `/eleve/notes` | ✅ Fait | `useEleveNotes(trimestre)`, trimestre selector, moyenne/rang API |
| Bulletins | `/eleve/bulletins` | ✅ Fait | `useEleveBulletins()`, download via `eleveApi.exportBulletin` |
| Emploi du temps | `/eleve/emploi-du-temps` | ✅ Fait | `useEleveEmploiDuTemps()`, day selector, couleurs par matière |
| Absences | `/eleve/absences` | ✅ Fait | `useEleveAbsences()`, stats 3 cartes, statuts JUSTIFIEE/RETARD/NON_JUSTIFIEE |
| Réclamations | `/eleve/reclamations` | ✅ Fait | `useEleveReclamations()` + `useCreerReclamation()`, modal bottom-sheet |
| Notifications | `/eleve/notifications` | ✅ Fait | `useEleveNotifications()` + `useToutLireNotifications()` + `useMarquerNotificationLue()` |
| Profil | `/eleve/profil` | ✅ **Fait** | Rewrite : supprimé `lucide-react`, grilles `auto-fill minmax` responsive, `useEleveProfil()` + `useChangePassword()` |

---

## Espace Parent (`/parent/*`)

| Page Angular | Route Next.js | Statut | Notes |
|---|---|---|---|
| Mes enfants | `/parent/enfants` | ✅ **Fait** | 4 hooks connectés (enfants, notes, absences, emploi-du-temps) + `useParentPaiements` pour onglet Paiements (était statique) + rendu planning par jour (était "Planning chargé") |
| Paiements | `/parent/paiements` | ✅ Fait | `useParentPaiements()`, solde dû calculé, badges payé/à payer |
| Réclamations | `/parent/reclamations` | ✅ **Fait** | Corrigé : utilisait `useEleveReclamations` (élève) → `useParentReclamations` + `useCreerReclamationParent` (endpoint `/parent/reclamations` ajouté) |
| Notifications | `/parent/notifications` | ✅ Fait | `useParentNotifications()`, marquer lue, tout lire |
| Profil | `/parent/profil` | ✅ **Fait** | Mobile : `flexWrap: 'wrap'` + `flex: '1 1 300px'` + grille `repeat(auto-fill, minmax(200px, 1fr))` + tab bar `overflowX: auto` |

---

## Espace Caisse

| Page Angular | Route Next.js | Statut | Notes |
|---|---|---|---|
| Caisse encaissement | `/caisse/encaissement` | ✅ **Fait** | **NOUVEAU** — Formulaire complet : élève, classe, type paiement, montant, mode, référence, date ; montants fréquents (25k–150k) ; panel "Transactions du jour" avec total live ; `useCreateCaissePaiement` |
| Caisse paiements | `/caisse/paiements` | ✅ **Fait** | API `useCaissePaiements` + `useUpdateCaissePaiement`, valider/rejeter, stats, overflow-x |
| Caisse historique | `/caisse/historique` | ✅ **Fait** | API `useCaissePaiements`, filtres date/mode/search, export CSV, 3 stats |
| Caisse inscriptions | `/caisse/inscriptions` | ✅ **Fait** | **NOUVEAU** — `useCaisseInscriptions` + `useValiderInscription` ; 4 stats ; filtres tous/EN_ATTENTE/VALIDEE ; table + modal détail ; valider par ligne ou depuis modal |
| Caisse salaires | `/caisse/salaires-professeurs` | ⚠️ Partiel | Statique — pas d'endpoint `/caisse/salaires` backend ; responsive : `flexWrap` stats + `overflowX: auto` table |

---

## Espace RH (`/rh/*` + `/admin/*` partagé)

| Page | Route Next.js | Statut | Notes |
|---|---|---|---|
| Dashboard RH | `/rh/dashboard` | ✅ **Fait** | **NOUVEAU** — KPIs : total personnel, absences du jour, présents aujourd'hui, taux de présence ; répartition par type (barres) ; pointages du jour ; absences récentes ; `useAdminPersonnel` + `useAdminAbsencesPersonnel` + `useAdminPointages` |
| Profil RH | `/rh/profil` | ✅ **Fait** | **NOUVEAU** — 2 onglets : Informations (nom/email/tél), Sécurité (change password + eye toggle inline SVG) ; `useUpdateProfile` + `useChangePassword` |
| Personnel | `/admin/personnel` | ✅ **Fait** | Responsive : `flexWrap` filtres + `overflowX: auto` + `minWidth: 900` table |
| Absences personnel | `/admin/absences-personnel` | ✅ **Fait** | `handleDeclarer` : remplacé fake `setTimeout` par vraie mutation `useCreateAbsencePersonnel` (hook ajouté) ; `flexWrap` stats + `overflowX: auto` + `minWidth: 760` table ; supprimé import `toast` inutilisé |
| Pointages | `/admin/pointages` | ✅ **Fait** | Responsive : `flexWrap` header + stats (`flex: '1 1 130px'`) + `overflowX: auto` + `minWidth: 840` table |
| Convocations | `/admin/convocations` | ✅ Lien ajouté | Accès via sidebar RH → `/admin/convocations` (page existante admin) |

**Sidebar RH** : 3 sections — (accueil) Dashboard, RESSOURCES HUMAINES (Personnel / Absences / Pointages / Convocations), COMPTE (Mon profil)

---

## Espace Surveillant

| Page Angular | Route Next.js | Statut | Notes |
|---|---|---|---|
| Surveillant absences | `/surveillant/absences` | ✅ **Fait** | Rewrite inline styles (était Shadcn), stats dynamiques, boutons justifié/non-justifié |
| Surveillant présences | `/surveillant/presences-professeurs` | ✅ **Fait** | Rewrite inline styles (était Shadcn), stats présent/absent/retard, boutons statut |
| Surveillant convocations | `/surveillant/convocations` | ✅ Fait | — |

---

## Espace Platform (super-admin)

| Page | Route Next.js | Statut | Notes |
|---|---|---|---|
| Tenants | `/platform/tenants` | ⚠️ Partiel | Shadcn — hooks `usePlatformTenants` existent mais non connectés |
| Stats platform | `/platform/stats` | ⚠️ Partiel | Shadcn — hook `usePlatformStats` existe mais non connecté |
| Audit logs | `/platform/audit-logs` | ⚠️ Partiel | Hook `usePlatformAuditLogs` existe, à vérifier |

---

## Sidebar — liens ajoutés

| Lien | Statut |
|---|---|
| `/admin/bulletins` | ✅ Ajouté dans PÉDAGOGIE |
| `/admin/matieres` | ✅ Ajouté dans PÉDAGOGIE |
| `/admin/cours` | ✅ Existant |
| `/admin/profil` | ✅ Existant |
| `/admin/parents` | ⚠️ À vérifier dans sidebar |

---

## Ce qui reste (priorité)

| Item | Priorité | Notes |
|---|---|---|
| Platform pages (Shadcn) | Haute | `/platform/tenants`, `/platform/stats`, `/platform/audit-logs` — hooks existent, réécrire en inline styles |
| Caisse salaires API | Moyenne | Pas d'endpoint backend `/caisse/salaires` — statique acceptable jusqu'à ajout côté backend |
| Profil enseignant 2FA | ~~Basse~~ | ✅ Fait — bouton 2FA + onglet Activité ajoutés |
| Elève accueil API | ~~Basse~~ | ✅ Fait — 5 hooks connectés |
| RH espace | ~~Haute~~ | ✅ Fait — dashboard + profil créés, 3 pages admin fixées (API + responsive) |
| Admin parametres API | Basse | CRUD Années/Cycles/Niveaux/Bâtiments/Salles non intégrés |
| WhatsApp connect | Très basse | Page si le backend a cette fonctionnalité |

---

## Notes techniques

- **Pattern inline styles** : tous les composants utilisent `style={{ ... }}` — pas de classes Tailwind, pas de composants Shadcn
- **Fallback statique** : si l'API retourne vide, afficher `STATIC_*` data
- **Design palette** : `#2563eb` (bleu primaire), `#0f172a` (texte foncé), `#64748b` (texte secondaire), `#e6ebf1` (bordures), `#f5f7fa` (fond), `#fff` (cartes)
- **Pages publiques** : pas de layout `(app)`, pas de sidebar — layout propre avec nav simple
