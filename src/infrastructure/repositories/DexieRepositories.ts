import { db } from '../db/PlanKompasDB'
import type {
  PlanRepository,
  SdRepository,
  OdRepository,
  ActionRepository,
  FicheRepository,
  FicheItemRepository,
  AuditRepository,
  UserRepository,
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
} from '@/domain/types'

// ─── Plans ────────────────────────────────────────────────────────────────────

export class DexiePlanRepository implements PlanRepository {
  async getAll(): Promise<Plan[]> {
    return db.plans.toArray()
  }
  async getById(id: string): Promise<Plan | undefined> {
    return db.plans.get(id)
  }
  async save(plan: Plan): Promise<void> {
    await db.plans.put(plan)
  }
  async delete(id: string): Promise<void> {
    await db.plans.delete(id)
  }
}

// ─── Strategic Objectives ─────────────────────────────────────────────────────

export class DexieSdRepository implements SdRepository {
  async listByPlan(planId: string): Promise<StrategicObjective[]> {
    const items = await db.strategicObjectives.where('planId').equals(planId).toArray()
    return items.sort((a, b) => {
      const [an] = a.nr.split('.').map(Number)
      const [bn] = b.nr.split('.').map(Number)
      return an - bn
    })
  }
  async getById(id: string): Promise<StrategicObjective | undefined> {
    return db.strategicObjectives.get(id)
  }
  async save(sd: StrategicObjective): Promise<void> {
    await db.strategicObjectives.put(sd)
  }
  async delete(id: string): Promise<void> {
    await db.strategicObjectives.delete(id)
  }
  async deleteByPlan(planId: string): Promise<void> {
    await db.strategicObjectives.where('planId').equals(planId).delete()
  }
}

// ─── Operational Objectives ───────────────────────────────────────────────────

export class DexieOdRepository implements OdRepository {
  async listByPlan(planId: string): Promise<OperationalObjective[]> {
    const items = await db.operationalObjectives.where('planId').equals(planId).toArray()
    return items.sort((a, b) => {
      const [an1, an2] = a.nr.split('.').map(Number)
      const [bn1, bn2] = b.nr.split('.').map(Number)
      if (an1 !== bn1) return an1 - bn1
      return (an2 ?? 0) - (bn2 ?? 0)
    })
  }
  async listBySd(sdId: string): Promise<OperationalObjective[]> {
    const items = await db.operationalObjectives.where('sdId').equals(sdId).toArray()
    return items.sort((a, b) => {
      const [, an2] = a.nr.split('.').map(Number)
      const [, bn2] = b.nr.split('.').map(Number)
      return (an2 ?? 0) - (bn2 ?? 0)
    })
  }
  async getById(id: string): Promise<OperationalObjective | undefined> {
    return db.operationalObjectives.get(id)
  }
  async save(od: OperationalObjective): Promise<void> {
    await db.operationalObjectives.put(od)
  }
  async delete(id: string): Promise<void> {
    await db.operationalObjectives.delete(id)
  }
  async deleteBySd(sdId: string): Promise<void> {
    await db.operationalObjectives.where('sdId').equals(sdId).delete()
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export class DexieActionRepository implements ActionRepository {
  async listByPlan(planId: string): Promise<Action[]> {
    return db.actions.where('planId').equals(planId).toArray()
  }
  async listByOd(odId: string): Promise<Action[]> {
    return db.actions.where('odId').equals(odId).toArray()
  }
  async getById(id: string): Promise<Action | undefined> {
    return db.actions.get(id)
  }
  async save(action: Action): Promise<void> {
    await db.actions.put(action)
  }
  async delete(id: string): Promise<void> {
    await db.actions.delete(id)
  }
  async deleteByOd(odId: string): Promise<void> {
    await db.actions.where('odId').equals(odId).delete()
  }
}

// ─── Action Fiches ────────────────────────────────────────────────────────────

export class DexieFicheRepository implements FicheRepository {
  async getByScope(planId: string, scopeType: FicheScope, scopeId: string): Promise<ActionFiche | undefined> {
    return db.actionFiches
      .where('[planId+scopeType+scopeId]')
      .equals([planId, scopeType, scopeId])
      .first()
      .catch(() =>
        db.actionFiches
          .filter(f => f.planId === planId && f.scopeType === scopeType && f.scopeId === scopeId)
          .first()
      )
  }
  async getById(id: string): Promise<ActionFiche | undefined> {
    return db.actionFiches.get(id)
  }
  async listByPlan(planId: string): Promise<ActionFiche[]> {
    return db.actionFiches.where('planId').equals(planId).toArray()
  }
  async save(fiche: ActionFiche): Promise<void> {
    await db.actionFiches.put(fiche)
  }
  async delete(id: string): Promise<void> {
    await db.actionFiches.delete(id)
  }
}

// ─── Fiche Items ──────────────────────────────────────────────────────────────

export class DexieFicheItemRepository implements FicheItemRepository {
  async listByFiche(ficheId: string): Promise<FicheItem[]> {
    const items = await db.ficheItems.where('ficheId').equals(ficheId).toArray()
    return items.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  async getById(id: string): Promise<FicheItem | undefined> {
    return db.ficheItems.get(id)
  }
  async save(item: FicheItem): Promise<void> {
    await db.ficheItems.put(item)
  }
  async delete(id: string): Promise<void> {
    await db.ficheItems.delete(id)
  }
  async deleteByFiche(ficheId: string): Promise<void> {
    await db.ficheItems.where('ficheId').equals(ficheId).delete()
  }
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export class DexieAuditRepository implements AuditRepository {
  async log(entry: AuditLog): Promise<void> {
    await db.auditLogs.add(entry)
  }
  async listByEntity(entityId: string): Promise<AuditLog[]> {
    return db.auditLogs.where('entityId').equals(entityId).reverse().sortBy('performedAt')
  }
  async listRecent(limit = 50): Promise<AuditLog[]> {
    return db.auditLogs.orderBy('performedAt').reverse().limit(limit).toArray()
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export class DexieUserRepository implements UserRepository {
  async getAll(): Promise<User[]> {
    return db.users.toArray()
  }
  async getById(id: string): Promise<User | undefined> {
    return db.users.get(id)
  }
  async getByEmail(email: string): Promise<User | undefined> {
    return db.users.where('email').equals(email).first()
  }
  async save(user: User): Promise<void> {
    await db.users.put(user)
  }
  async delete(id: string): Promise<void> {
    await db.users.delete(id)
  }
}
