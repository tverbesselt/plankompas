import Dexie, { type Table } from 'dexie'
import type {
  Plan,
  StrategicObjective,
  OperationalObjective,
  Action,
  ActionFiche,
  FicheItem,
  AuditLog,
  User,
} from '@/domain/types'

export class PlanKompasDB extends Dexie {
  plans!: Table<Plan>
  strategicObjectives!: Table<StrategicObjective>
  operationalObjectives!: Table<OperationalObjective>
  actions!: Table<Action>
  actionFiches!: Table<ActionFiche>
  ficheItems!: Table<FicheItem>
  auditLogs!: Table<AuditLog>
  users!: Table<User>

  constructor() {
    super('PlanKompasDB')
    this.version(1).stores({
      plans: 'id, isActive',
      strategicObjectives: 'id, planId, nr, status, pijler, dienst',
      operationalObjectives: 'id, planId, sdId, nr, status',
      actions: 'id, planId, odId, status, verantwoordelijke',
      actionFiches: 'id, planId, scopeType, scopeId',
      ficheItems: 'id, ficheId, status, sortOrder',
      auditLogs: 'id, entityType, entityId, performedAt',
      users: 'id, email, role',
    })
  }
}

export const db = new PlanKompasDB()
