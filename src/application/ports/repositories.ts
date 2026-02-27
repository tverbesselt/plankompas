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

// ─── Repository interfaces ────────────────────────────────────────────────────

export interface PlanRepository {
  getAll(): Promise<Plan[]>
  getById(id: string): Promise<Plan | undefined>
  save(plan: Plan): Promise<void>
  delete(id: string): Promise<void>
}

export interface SdRepository {
  listByPlan(planId: string): Promise<StrategicObjective[]>
  getById(id: string): Promise<StrategicObjective | undefined>
  save(sd: StrategicObjective): Promise<void>
  delete(id: string): Promise<void>
  deleteByPlan(planId: string): Promise<void>
}

export interface OdRepository {
  listByPlan(planId: string): Promise<OperationalObjective[]>
  listBySd(sdId: string): Promise<OperationalObjective[]>
  getById(id: string): Promise<OperationalObjective | undefined>
  save(od: OperationalObjective): Promise<void>
  delete(id: string): Promise<void>
  deleteBySd(sdId: string): Promise<void>
}

export interface ActionRepository {
  listByPlan(planId: string): Promise<Action[]>
  listByOd(odId: string): Promise<Action[]>
  getById(id: string): Promise<Action | undefined>
  save(action: Action): Promise<void>
  delete(id: string): Promise<void>
  deleteByOd(odId: string): Promise<void>
}

export interface FicheRepository {
  getByScope(planId: string, scopeType: FicheScope, scopeId: string): Promise<ActionFiche | undefined>
  getById(id: string): Promise<ActionFiche | undefined>
  listByPlan(planId: string): Promise<ActionFiche[]>
  save(fiche: ActionFiche): Promise<void>
  delete(id: string): Promise<void>
}

export interface FicheItemRepository {
  listByFiche(ficheId: string): Promise<FicheItem[]>
  getById(id: string): Promise<FicheItem | undefined>
  save(item: FicheItem): Promise<void>
  delete(id: string): Promise<void>
  deleteByFiche(ficheId: string): Promise<void>
}

export interface AuditRepository {
  log(entry: AuditLog): Promise<void>
  listByEntity(entityId: string): Promise<AuditLog[]>
  listRecent(limit?: number): Promise<AuditLog[]>
}

export interface UserRepository {
  getAll(): Promise<User[]>
  getById(id: string): Promise<User | undefined>
  getByEmail(email: string): Promise<User | undefined>
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
}

// ─── Auth port ────────────────────────────────────────────────────────────────

export interface AuthPort {
  getCurrentUser(): Promise<User | null>
  hasRole(role: string): Promise<boolean>
  canAccessPlan(planId: string): Promise<boolean>
}

// ─── Dagelijkse werking repositories ─────────────────────────────────────────

export interface WorkDomainRepository {
  getAll(): Promise<WorkDomain[]>
  getById(id: string): Promise<WorkDomain | undefined>
  save(domain: WorkDomain): Promise<void>
  delete(id: string): Promise<void>
}

export interface WorkStreamRepository {
  listByDomain(domainId: string): Promise<WorkStream[]>
  listAll(): Promise<WorkStream[]>
  getById(id: string): Promise<WorkStream | undefined>
  save(stream: WorkStream): Promise<void>
  delete(id: string): Promise<void>
  deleteByDomain(domainId: string): Promise<void>
}

export interface DailyTaskRepository {
  listByStream(streamId: string): Promise<DailyTask[]>
  listByAssignee(name: string): Promise<DailyTask[]>
  listAll(): Promise<DailyTask[]>
  getById(id: string): Promise<DailyTask | undefined>
  save(task: DailyTask): Promise<void>
  delete(id: string): Promise<void>
  deleteByStream(streamId: string): Promise<void>
}

export interface TaskItemRepository {
  listByTask(taskId: string): Promise<TaskItem[]>
  save(item: TaskItem): Promise<void>
  delete(id: string): Promise<void>
  deleteByTask(taskId: string): Promise<void>
}

// ─── Container ────────────────────────────────────────────────────────────────

export interface Container {
  plans: PlanRepository
  sd: SdRepository
  od: OdRepository
  actions: ActionRepository
  fiches: FicheRepository
  ficheItems: FicheItemRepository
  audit: AuditRepository
  users: UserRepository
  auth: AuthPort
  workDomains: WorkDomainRepository
  workStreams: WorkStreamRepository
  dailyTasks: DailyTaskRepository
  taskItems: TaskItemRepository
}
