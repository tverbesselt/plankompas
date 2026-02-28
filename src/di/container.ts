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
import {
  HttpPlanRepository,
  HttpSdRepository,
  HttpOdRepository,
  HttpActionRepository,
  HttpFicheRepository,
  HttpFicheItemRepository,
  HttpAuditRepository,
  HttpUserRepository,
  HttpWorkDomainRepository,
  HttpWorkStreamRepository,
  HttpDailyTaskRepository,
  HttpTaskItemRepository,
} from '@/infrastructure/api/HttpRepositories'
import {
  FirestorePlanRepository,
  FirestoreSdRepository,
  FirestoreOdRepository,
  FirestoreActionRepository,
  FirestoreFicheRepository,
  FirestoreFicheItemRepository,
  FirestoreAuditRepository,
  FirestoreUserRepository,
  FirestoreWorkDomainRepository,
  FirestoreWorkStreamRepository,
  FirestoreDailyTaskRepository,
  FirestoreTaskItemRepository,
} from '@/infrastructure/firebase/FirestoreRepositories'
import { LocalAuthAdapter } from '@/infrastructure/auth/LocalAuthAdapter'
import type { Container } from '@/application/ports/repositories'

/**
 * Composition root.
 *
 * Priority:
 *   1. VITE_USE_FIRESTORE=true  → Cloud Firestore (online database)
 *   2. VITE_API_URL set         → Local REST API (api/server.ts on port 3001)
 *   3. Default                  → Dexie (IndexedDB – offline, no server)
 */
const useFirestore = import.meta.env.VITE_USE_FIRESTORE === 'true'
const useApi = !useFirestore && !!(import.meta.env.VITE_API_URL as string | undefined)

function buildContainer(): Container {
  if (useFirestore) {
    // ── Firestore repositories (Cloud Firestore) ──────────────────────────────
    const users = new FirestoreUserRepository()
    return {
      plans:       new FirestorePlanRepository(),
      sd:          new FirestoreSdRepository(),
      od:          new FirestoreOdRepository(),
      actions:     new FirestoreActionRepository(),
      fiches:      new FirestoreFicheRepository(),
      ficheItems:  new FirestoreFicheItemRepository(),
      audit:       new FirestoreAuditRepository(),
      users,
      auth:        new LocalAuthAdapter(users),
      workDomains: new FirestoreWorkDomainRepository(),
      workStreams:  new FirestoreWorkStreamRepository(),
      dailyTasks:  new FirestoreDailyTaskRepository(),
      taskItems:   new FirestoreTaskItemRepository(),
    }
  }

  if (useApi) {
    // ── HTTP repositories (REST API backend) ──────────────────────────────────
    const users = new HttpUserRepository()
    return {
      plans:       new HttpPlanRepository(),
      sd:          new HttpSdRepository(),
      od:          new HttpOdRepository(),
      actions:     new HttpActionRepository(),
      fiches:      new HttpFicheRepository(),
      ficheItems:  new HttpFicheItemRepository(),
      audit:       new HttpAuditRepository(),
      users,
      auth:        new LocalAuthAdapter(users),
      workDomains: new HttpWorkDomainRepository(),
      workStreams:  new HttpWorkStreamRepository(),
      dailyTasks:  new HttpDailyTaskRepository(),
      taskItems:   new HttpTaskItemRepository(),
    }
  }

  // ── Dexie repositories (IndexedDB – default) ─────────────────────────────
  const users = new DexieUserRepository()
  return {
    plans:       new DexiePlanRepository(),
    sd:          new DexieSdRepository(),
    od:          new DexieOdRepository(),
    actions:     new DexieActionRepository(),
    fiches:      new DexieFicheRepository(),
    ficheItems:  new DexieFicheItemRepository(),
    audit:       new DexieAuditRepository(),
    users,
    auth:        new LocalAuthAdapter(users),
    workDomains: new DexieWorkDomainRepository(),
    workStreams:  new DexieWorkStreamRepository(),
    dailyTasks:  new DexieDailyTaskRepository(),
    taskItems:   new DexieTaskItemRepository(),
  }
}

export const container: Container = buildContainer()
