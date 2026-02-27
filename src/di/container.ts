import {
  DexiePlanRepository,
  DexieSdRepository,
  DexieOdRepository,
  DexieActionRepository,
  DexieFicheRepository,
  DexieFicheItemRepository,
  DexieAuditRepository,
  DexieUserRepository,
  DexieWorkDomainRepository,
  DexieWorkStreamRepository,
  DexieDailyTaskRepository,
  DexieTaskItemRepository,
} from '@/infrastructure/repositories/DexieRepositories'
import { LocalAuthAdapter } from '@/infrastructure/auth/LocalAuthAdapter'
import type { Container } from '@/application/ports/repositories'

// Composition root – swap implementations here to switch to Firebase
export const container: Container = {
  plans: new DexiePlanRepository(),
  sd: new DexieSdRepository(),
  od: new DexieOdRepository(),
  actions: new DexieActionRepository(),
  fiches: new DexieFicheRepository(),
  ficheItems: new DexieFicheItemRepository(),
  audit: new DexieAuditRepository(),
  users: new DexieUserRepository(),
  auth: new LocalAuthAdapter(),
  workDomains: new DexieWorkDomainRepository(),
  workStreams: new DexieWorkStreamRepository(),
  dailyTasks: new DexieDailyTaskRepository(),
  taskItems: new DexieTaskItemRepository(),
}
