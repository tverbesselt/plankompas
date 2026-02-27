import {
  DexiePlanRepository,
  DexieSdRepository,
  DexieOdRepository,
  DexieActionRepository,
  DexieFicheRepository,
  DexieFicheItemRepository,
  DexieAuditRepository,
  DexieUserRepository,
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
}
