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
import { LocalAuthAdapter } from '@/infrastructure/auth/LocalAuthAdapter'
import type { Container } from '@/application/ports/repositories'

/**
 * Composition root.
 *
 * By default the app uses Dexie (IndexedDB) – works offline, no server needed.
 *
 * To use the local REST API instead (api/server.ts on port 3001), create
 * a file `.env.local` in the project root containing:
 *
 *   VITE_API_URL=http://localhost:3001
 *
 * Then start both servers:
 *   npm run dev       (Vite frontend on port 5173)
 *   npm run api       (Express API on port 3001)
 */
const useApi = !!(import.meta.env.VITE_API_URL as string | undefined)

export const container: Container = useApi
  ? {
      // ── HTTP repositories (REST API backend) ─────────────────────────────────
      plans:       new HttpPlanRepository(),
      sd:          new HttpSdRepository(),
      od:          new HttpOdRepository(),
      actions:     new HttpActionRepository(),
      fiches:      new HttpFicheRepository(),
      ficheItems:  new HttpFicheItemRepository(),
      audit:       new HttpAuditRepository(),
      users:       new HttpUserRepository(),
      auth:        new LocalAuthAdapter(),
      workDomains: new HttpWorkDomainRepository(),
      workStreams:  new HttpWorkStreamRepository(),
      dailyTasks:  new HttpDailyTaskRepository(),
      taskItems:   new HttpTaskItemRepository(),
    }
  : {
      // ── Dexie repositories (IndexedDB – default) ─────────────────────────────
      plans:       new DexiePlanRepository(),
      sd:          new DexieSdRepository(),
      od:          new DexieOdRepository(),
      actions:     new DexieActionRepository(),
      fiches:      new DexieFicheRepository(),
      ficheItems:  new DexieFicheItemRepository(),
      audit:       new DexieAuditRepository(),
      users:       new DexieUserRepository(),
      auth:        new LocalAuthAdapter(),
      workDomains: new DexieWorkDomainRepository(),
      workStreams:  new DexieWorkStreamRepository(),
      dailyTasks:  new DexieDailyTaskRepository(),
      taskItems:   new DexieTaskItemRepository(),
    }
