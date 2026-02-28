/**
 * Firestore repository-implementaties voor alle 12 repository-interfaces.
 * Gebruikt de helpers uit firestoreHelpers.ts.
 */
import { where, orderBy, limit as firestoreLimit } from 'firebase/firestore'
import { getById, getAll, queryDocs, saveDoc, deleteById, deleteWhere } from './firestoreHelpers'
import type {
  PlanRepository,
  SdRepository,
  OdRepository,
  ActionRepository,
  FicheRepository,
  FicheItemRepository,
  AuditRepository,
  UserRepository,
  WorkDomainRepository,
  WorkStreamRepository,
  DailyTaskRepository,
  TaskItemRepository,
} from '@/application/ports/repositories'
import type {
  Plan,
  StrategicObjective,
  OperationalObjective,
  Action,
  ActionFiche,
  FicheItem,
  AuditLog,
  User,
  FicheScope,
  WorkDomain,
  WorkStream,
  DailyTask,
  TaskItem,
} from '@/domain/types'

// ─── Plans ────────────────────────────────────────────────────────────────────

export class FirestorePlanRepository implements PlanRepository {
  async getAll() { return getAll<Plan>('plans') }
  async getById(id: string) { return getById<Plan>('plans', id) }
  async save(plan: Plan) { return saveDoc('plans', plan) }
  async delete(id: string) { return deleteById('plans', id) }
}

// ─── Strategic Objectives ─────────────────────────────────────────────────────

export class FirestoreSdRepository implements SdRepository {
  async listByPlan(planId: string) {
    const items = await queryDocs<StrategicObjective>('strategicObjectives', where('planId', '==', planId))
    return items.sort((a, b) => {
      const [an] = a.nr.split('.').map(Number)
      const [bn] = b.nr.split('.').map(Number)
      return an - bn
    })
  }
  async getById(id: string) { return getById<StrategicObjective>('strategicObjectives', id) }
  async save(sd: StrategicObjective) { return saveDoc('strategicObjectives', sd) }
  async delete(id: string) { return deleteById('strategicObjectives', id) }
  async deleteByPlan(planId: string) { return deleteWhere('strategicObjectives', 'planId', planId) }
}

// ─── Operational Objectives ───────────────────────────────────────────────────

export class FirestoreOdRepository implements OdRepository {
  async listByPlan(planId: string) {
    const items = await queryDocs<OperationalObjective>('operationalObjectives', where('planId', '==', planId))
    return items.sort((a, b) => {
      const [a1, a2] = a.nr.split('.').map(Number)
      const [b1, b2] = b.nr.split('.').map(Number)
      if (a1 !== b1) return a1 - b1
      return (a2 ?? 0) - (b2 ?? 0)
    })
  }
  async listBySd(sdId: string) {
    const items = await queryDocs<OperationalObjective>('operationalObjectives', where('sdId', '==', sdId))
    return items.sort((a, b) => {
      const [, a2] = a.nr.split('.').map(Number)
      const [, b2] = b.nr.split('.').map(Number)
      return (a2 ?? 0) - (b2 ?? 0)
    })
  }
  async getById(id: string) { return getById<OperationalObjective>('operationalObjectives', id) }
  async save(od: OperationalObjective) { return saveDoc('operationalObjectives', od) }
  async delete(id: string) { return deleteById('operationalObjectives', id) }
  async deleteBySd(sdId: string) { return deleteWhere('operationalObjectives', 'sdId', sdId) }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export class FirestoreActionRepository implements ActionRepository {
  async listByPlan(planId: string) {
    return queryDocs<Action>('actions', where('planId', '==', planId))
  }
  async listByOd(odId: string) {
    return queryDocs<Action>('actions', where('odId', '==', odId))
  }
  async getById(id: string) { return getById<Action>('actions', id) }
  async save(action: Action) { return saveDoc('actions', action) }
  async delete(id: string) { return deleteById('actions', id) }
  async deleteByOd(odId: string) { return deleteWhere('actions', 'odId', odId) }
}

// ─── Fiches ───────────────────────────────────────────────────────────────────

export class FirestoreFicheRepository implements FicheRepository {
  async getByScope(planId: string, scopeType: FicheScope, scopeId: string) {
    const results = await queryDocs<ActionFiche>('actionFiches',
      where('planId', '==', planId),
      where('scopeType', '==', scopeType),
      where('scopeId', '==', scopeId),
    )
    return results[0]
  }
  async getById(id: string) { return getById<ActionFiche>('actionFiches', id) }
  async listByPlan(planId: string) {
    return queryDocs<ActionFiche>('actionFiches', where('planId', '==', planId))
  }
  async save(fiche: ActionFiche) { return saveDoc('actionFiches', fiche) }
  async delete(id: string) { return deleteById('actionFiches', id) }
}

// ─── Fiche Items ──────────────────────────────────────────────────────────────

export class FirestoreFicheItemRepository implements FicheItemRepository {
  async listByFiche(ficheId: string) {
    const items = await queryDocs<FicheItem>('ficheItems', where('ficheId', '==', ficheId))
    return items.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  async getById(id: string) { return getById<FicheItem>('ficheItems', id) }
  async save(item: FicheItem) { return saveDoc('ficheItems', item) }
  async delete(id: string) { return deleteById('ficheItems', id) }
  async deleteByFiche(ficheId: string) { return deleteWhere('ficheItems', 'ficheId', ficheId) }
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export class FirestoreAuditRepository implements AuditRepository {
  async log(entry: AuditLog) { return saveDoc('auditLogs', entry) }
  async listByEntity(entityId: string) {
    return queryDocs<AuditLog>('auditLogs',
      where('entityId', '==', entityId),
      orderBy('performedAt', 'desc'),
    )
  }
  async listRecent(limit = 50) {
    return queryDocs<AuditLog>('auditLogs',
      orderBy('performedAt', 'desc'),
      firestoreLimit(limit),
    )
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export class FirestoreUserRepository implements UserRepository {
  async getAll() { return getAll<User>('users') }
  async getById(id: string) { return getById<User>('users', id) }
  async getByEmail(email: string) {
    const results = await queryDocs<User>('users', where('email', '==', email))
    return results[0]
  }
  async save(user: User) { return saveDoc('users', user) }
  async delete(id: string) { return deleteById('users', id) }
}

// ─── Work Domains ─────────────────────────────────────────────────────────────

export class FirestoreWorkDomainRepository implements WorkDomainRepository {
  async getAll() { return getAll<WorkDomain>('workDomains') }
  async getById(id: string) { return getById<WorkDomain>('workDomains', id) }
  async save(domain: WorkDomain) { return saveDoc('workDomains', domain) }
  async delete(id: string) { return deleteById('workDomains', id) }
}

// ─── Work Streams ─────────────────────────────────────────────────────────────

export class FirestoreWorkStreamRepository implements WorkStreamRepository {
  async listByDomain(domainId: string) {
    return queryDocs<WorkStream>('workStreams', where('domainId', '==', domainId))
  }
  async listAll() { return getAll<WorkStream>('workStreams') }
  async getById(id: string) { return getById<WorkStream>('workStreams', id) }
  async save(stream: WorkStream) { return saveDoc('workStreams', stream) }
  async delete(id: string) { return deleteById('workStreams', id) }
  async deleteByDomain(domainId: string) { return deleteWhere('workStreams', 'domainId', domainId) }
}

// ─── Daily Tasks ──────────────────────────────────────────────────────────────

export class FirestoreDailyTaskRepository implements DailyTaskRepository {
  async listByStream(streamId: string) {
    return queryDocs<DailyTask>('dailyTasks', where('streamId', '==', streamId))
  }
  async listByAssignee(name: string) {
    return queryDocs<DailyTask>('dailyTasks', where('assignees', 'array-contains', name))
  }
  async listAll() { return getAll<DailyTask>('dailyTasks') }
  async getById(id: string) { return getById<DailyTask>('dailyTasks', id) }
  async save(task: DailyTask) { return saveDoc('dailyTasks', task) }
  async delete(id: string) { return deleteById('dailyTasks', id) }
  async deleteByStream(streamId: string) { return deleteWhere('dailyTasks', 'streamId', streamId) }
}

// ─── Task Items ───────────────────────────────────────────────────────────────

export class FirestoreTaskItemRepository implements TaskItemRepository {
  async listByTask(taskId: string) {
    const items = await queryDocs<TaskItem>('taskItems', where('taskId', '==', taskId))
    return items.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  async save(item: TaskItem) { return saveDoc('taskItems', item) }
  async delete(id: string) { return deleteById('taskItems', id) }
  async deleteByTask(taskId: string) { return deleteWhere('taskItems', 'taskId', taskId) }
}
