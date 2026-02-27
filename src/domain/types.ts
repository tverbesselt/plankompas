// ─── Statussen ────────────────────────────────────────────────────────────────

export type ObjectiveStatus =
  | 'niet_gestart'
  | 'in_uitvoering'
  | 'afgerond'
  | 'uitgesteld'
  | 'geannuleerd';

export type ActionStatus = ObjectiveStatus;
export type FicheStatus = ObjectiveStatus;

export const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  niet_gestart: 'Niet gestart',
  in_uitvoering: 'In uitvoering',
  afgerond: 'Afgerond',
  uitgesteld: 'Uitgesteld',
  geannuleerd: 'Geannuleerd',
};

export const STATUS_COLORS: Record<ObjectiveStatus, string> = {
  niet_gestart: 'bg-gray-100 text-gray-700',
  in_uitvoering: 'bg-blue-100 text-blue-700',
  afgerond: 'bg-green-100 text-green-700',
  uitgesteld: 'bg-yellow-100 text-yellow-700',
  geannuleerd: 'bg-red-100 text-red-700',
};

// ─── Rollen ───────────────────────────────────────────────────────────────────

export type UserRole = 'viewer' | 'editor' | 'verantwoordelijke' | 'admin';

export const ROLE_LABELS: Record<UserRole, string> = {
  viewer: 'Viewer',
  editor: 'Editor',
  verantwoordelijke: 'Verantwoordelijke',
  admin: 'Admin',
};

// ─── Domein-entiteiten ────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface StrategicObjective {
  id: string;
  planId: string;
  nr: string;                    // '1', '2', …
  pijler: string;
  dienst: string;                // dienst / profiel
  rubriek: string;
  probleem: string;
  doel: string;
  meting: string;
  typeGoal: 'SD';                // vast
  verantwoordelijken: string[];
  uitvoerders: string[];
  startDate: string;             // ISO-datumstring YYYY-MM-DD
  endDate: string;
  adjustedEndDate: string;
  status: ObjectiveStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface OperationalObjective {
  id: string;
  planId: string;
  sdId: string;                  // parent SD
  nr: string;                    // '1.1', '1.2', …
  probleem: string;
  doel: string;
  meting: string;
  typeGoal: 'OD';
  verantwoordelijken: string[];
  uitvoerders: string[];
  startDate: string;
  endDate: string;
  adjustedEndDate: string;
  status: ObjectiveStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface Action {
  id: string;
  planId: string;
  odId: string;                  // parent OD
  title: string;
  verantwoordelijke: string;
  uitvoerders: string[];
  startDate: string;
  endDate: string;
  adjustedEndDate: string;
  status: ActionStatus;
  opmerkingen: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export type FicheScope = 'SD' | 'OD';

export interface ActionFiche {
  id: string;
  planId: string;
  scopeType: FicheScope;
  scopeId: string;               // id van SD of OD
  visie: string;
  aanpak: string;
  eigenaars: string[];
  status: FicheStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface FicheItem {
  id: string;
  ficheId: string;
  titel: string;
  startDate: string;
  tijdpad: string;
  uitvoerder: string;
  gewenstResultaat: string;
  opvolging: string;
  status: ActionStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  entityType: 'plan' | 'sd' | 'od' | 'action' | 'fiche' | 'ficheItem';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, unknown>;
  performedBy: string;
  performedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  scopes: string[];              // planId's waartoe de user toegang heeft
  isActive: boolean;
}
