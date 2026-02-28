/**
 * HTTP repository implementations – call the local REST API (api/server.ts)
 * instead of Dexie/IndexedDB.
 *
 * Activate by setting VITE_API_URL in .env.local:
 *   VITE_API_URL=http://localhost:3001
 */
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

// ─── Core fetch helper ────────────────────────────────────────────────────────

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

async function http<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (res.status === 204) return undefined as T
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${msg}`)
  }
  // Response.json() is typed as Promise<unknown> in strict mode; cast via unknown
  return (await res.json()) as T
}

async function httpOrUndef<T>(path: string): Promise<T | undefined> {
  try { return await http<T>(path) } catch { return undefined }
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export class HttpPlanRepository implements PlanRepository {
  async getAll(): Promise<Plan[]> { return http<Plan[]>('/api/plans') }
  async getById(id: string): Promise<Plan | undefined> { return httpOrUndef<Plan>(`/api/plans/${id}`) }
  async save(plan: Plan): Promise<void> {
    await http<void>(`/api/plans/${plan.id}`, { method: 'PUT', body: JSON.stringify(plan) })
  }
  async delete(id: string): Promise<void> {
    await http<void>(`/api/plans/${id}`, { method: 'DELETE' })
  }
}

// ─── Strategic Objectives ─────────────────────────────────────────────────────

export class HttpSdRepository implements SdRepository {
  async listByPlan(planId: string): Promise<StrategicObjective[]> {
    const rows = await http<StrategicObjective[]>(`/api/sds?planId=${planId}`)
    return rows.sort((a, b) => {
      const [an] = a.nr.split('.').map(Number)
      const [bn] = b.nr.split('.').map(Number)
      return an - bn
    })
  }
  async getById(id: string): Promise<StrategicObjective | undefined> {
    return httpOrUndef<StrategicObjective>(`/api/sds/${id}`)
  }
  async save(sd: StrategicObjective): Promise<void> {
    await http<void>(`/api/sds/${sd.id}`, { method: 'PUT', body: JSON.stringify(sd) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/sds/${id}`, { method: 'DELETE' }) }
  async deleteByPlan(planId: string): Promise<void> {
    const rows = await this.listByPlan(planId)
    await Promise.all(rows.map(r => this.delete(r.id)))
  }
}

// ─── Operational Objectives ───────────────────────────────────────────────────

export class HttpOdRepository implements OdRepository {
  async listByPlan(planId: string): Promise<OperationalObjective[]> {
    const rows = await http<OperationalObjective[]>(`/api/ods?planId=${planId}`)
    return rows.sort((a, b) => {
      const [a1, a2] = a.nr.split('.').map(Number)
      const [b1, b2] = b.nr.split('.').map(Number)
      if (a1 !== b1) return a1 - b1
      return (a2 ?? 0) - (b2 ?? 0)
    })
  }
  async listBySd(sdId: string): Promise<OperationalObjective[]> {
    return http<OperationalObjective[]>(`/api/ods?sdId=${sdId}`)
  }
  async getById(id: string): Promise<OperationalObjective | undefined> {
    return httpOrUndef<OperationalObjective>(`/api/ods/${id}`)
  }
  async save(od: OperationalObjective): Promise<void> {
    await http<void>(`/api/ods/${od.id}`, { method: 'PUT', body: JSON.stringify(od) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/ods/${id}`, { method: 'DELETE' }) }
  async deleteBySd(sdId: string): Promise<void> {
    const rows = await this.listBySd(sdId)
    await Promise.all(rows.map(r => this.delete(r.id)))
  }
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export class HttpActionRepository implements ActionRepository {
  async listByPlan(planId: string): Promise<Action[]> {
    return http<Action[]>(`/api/actions?planId=${planId}`)
  }
  async listByOd(odId: string): Promise<Action[]> {
    return http<Action[]>(`/api/actions?odId=${odId}`)
  }
  async getById(id: string): Promise<Action | undefined> {
    return httpOrUndef<Action>(`/api/actions/${id}`)
  }
  async save(action: Action): Promise<void> {
    await http<void>(`/api/actions/${action.id}`, { method: 'PUT', body: JSON.stringify(action) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/actions/${id}`, { method: 'DELETE' }) }
  async deleteByOd(odId: string): Promise<void> {
    const rows = await this.listByOd(odId)
    await Promise.all(rows.map(r => this.delete(r.id)))
  }
}

// ─── Fiches ───────────────────────────────────────────────────────────────────

export class HttpFicheRepository implements FicheRepository {
  async getByScope(planId: string, scopeType: FicheScope, scopeId: string): Promise<ActionFiche | undefined> {
    const rows = await http<ActionFiche[]>(`/api/fiches?planId=${planId}&scopeType=${scopeType}&scopeId=${scopeId}`)
    return rows[0]
  }
  async getById(id: string): Promise<ActionFiche | undefined> {
    return httpOrUndef<ActionFiche>(`/api/fiches/${id}`)
  }
  async listByPlan(planId: string): Promise<ActionFiche[]> {
    return http<ActionFiche[]>(`/api/fiches?planId=${planId}`)
  }
  async save(fiche: ActionFiche): Promise<void> {
    await http<void>(`/api/fiches/${fiche.id}`, { method: 'PUT', body: JSON.stringify(fiche) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/fiches/${id}`, { method: 'DELETE' }) }
}

// ─── Fiche Items ──────────────────────────────────────────────────────────────

export class HttpFicheItemRepository implements FicheItemRepository {
  async listByFiche(ficheId: string): Promise<FicheItem[]> {
    return http<FicheItem[]>(`/api/fiche-items?ficheId=${ficheId}`)
  }
  async getById(id: string): Promise<FicheItem | undefined> {
    return httpOrUndef<FicheItem>(`/api/fiche-items/${id}`)
  }
  async save(item: FicheItem): Promise<void> {
    await http<void>(`/api/fiche-items/${item.id}`, { method: 'PUT', body: JSON.stringify(item) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/fiche-items/${id}`, { method: 'DELETE' }) }
  async deleteByFiche(ficheId: string): Promise<void> {
    const rows = await this.listByFiche(ficheId)
    await Promise.all(rows.map(r => this.delete(r.id)))
  }
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export class HttpAuditRepository implements AuditRepository {
  async log(entry: AuditLog): Promise<void> {
    await http<void>('/api/audit', { method: 'POST', body: JSON.stringify(entry) })
  }
  async listByEntity(entityId: string): Promise<AuditLog[]> {
    return http<AuditLog[]>(`/api/audit?entityId=${entityId}`)
  }
  async listRecent(limit = 50): Promise<AuditLog[]> {
    return http<AuditLog[]>(`/api/audit?limit=${limit}`)
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export class HttpUserRepository implements UserRepository {
  async getAll(): Promise<User[]> { return http<User[]>('/api/users') }
  async getById(id: string): Promise<User | undefined> { return httpOrUndef<User>(`/api/users/${id}`) }
  async getByEmail(email: string): Promise<User | undefined> {
    const all = await this.getAll()
    return all.find(u => u.email === email)
  }
  async save(user: User): Promise<void> {
    await http<void>(`/api/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/users/${id}`, { method: 'DELETE' }) }
}

// ─── Work Domains ─────────────────────────────────────────────────────────────

export class HttpWorkDomainRepository implements WorkDomainRepository {
  async getAll(): Promise<WorkDomain[]> { return http<WorkDomain[]>('/api/work-domains') }
  async getById(id: string): Promise<WorkDomain | undefined> { return httpOrUndef<WorkDomain>(`/api/work-domains/${id}`) }
  async save(domain: WorkDomain): Promise<void> {
    await http<void>(`/api/work-domains/${domain.id}`, { method: 'PUT', body: JSON.stringify(domain) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/work-domains/${id}`, { method: 'DELETE' }) }
}

// ─── Work Streams ─────────────────────────────────────────────────────────────

export class HttpWorkStreamRepository implements WorkStreamRepository {
  async listByDomain(domainId: string): Promise<WorkStream[]> {
    return http<WorkStream[]>(`/api/work-streams?domainId=${domainId}`)
  }
  async listAll(): Promise<WorkStream[]> { return http<WorkStream[]>('/api/work-streams') }
  async getById(id: string): Promise<WorkStream | undefined> { return httpOrUndef<WorkStream>(`/api/work-streams/${id}`) }
  async save(stream: WorkStream): Promise<void> {
    await http<void>(`/api/work-streams/${stream.id}`, { method: 'PUT', body: JSON.stringify(stream) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/work-streams/${id}`, { method: 'DELETE' }) }
  async deleteByDomain(domainId: string): Promise<void> {
    const rows = await this.listByDomain(domainId)
    await Promise.all(rows.map(r => this.delete(r.id)))
  }
}

// ─── Daily Tasks ──────────────────────────────────────────────────────────────

export class HttpDailyTaskRepository implements DailyTaskRepository {
  async listByStream(streamId: string): Promise<DailyTask[]> {
    return http<DailyTask[]>(`/api/daily-tasks?streamId=${streamId}`)
  }
  async listByAssignee(name: string): Promise<DailyTask[]> {
    return http<DailyTask[]>(`/api/daily-tasks?assignee=${encodeURIComponent(name)}`)
  }
  async listAll(): Promise<DailyTask[]> { return http<DailyTask[]>('/api/daily-tasks') }
  async getById(id: string): Promise<DailyTask | undefined> { return httpOrUndef<DailyTask>(`/api/daily-tasks/${id}`) }
  async save(task: DailyTask): Promise<void> {
    await http<void>(`/api/daily-tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/daily-tasks/${id}`, { method: 'DELETE' }) }
  async deleteByStream(streamId: string): Promise<void> {
    const rows = await this.listByStream(streamId)
    await Promise.all(rows.map(r => this.delete(r.id)))
  }
}

// ─── Task Items ───────────────────────────────────────────────────────────────

export class HttpTaskItemRepository implements TaskItemRepository {
  async listByTask(taskId: string): Promise<TaskItem[]> {
    return http<TaskItem[]>(`/api/task-items?taskId=${taskId}`)
  }
  async save(item: TaskItem): Promise<void> {
    await http<void>(`/api/task-items/${item.id}`, { method: 'PUT', body: JSON.stringify(item) })
  }
  async delete(id: string): Promise<void> { await http<void>(`/api/task-items/${id}`, { method: 'DELETE' }) }
  async deleteByTask(taskId: string): Promise<void> {
    const rows = await this.listByTask(taskId)
    await Promise.all(rows.map(r => this.delete(r.id)))
  }
}
