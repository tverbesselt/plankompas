import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuid } from 'uuid'
import { container } from '@/di/container'
import { useAuthStore } from '../store/uiStore'
import type {
  Plan,
  StrategicObjective,
  OperationalObjective,
  Action,
  ActionFiche,
  FicheItem,
  User,
  FicheScope,
  ObjectiveStatus,
  WorkDomain,
  WorkStream,
  DailyTask,
  DailyTaskStatus,
  TaskItem,
  WorkDomainStatus,
  WorkStreamType,
  WorkStreamPriority,
  TaskRecurrence,
} from '@/domain/types'

// ─── Plans ────────────────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => container.plans.getAll(),
  })
}

export function usePlan(id: string | null) {
  return useQuery({
    queryKey: ['plan', id],
    queryFn: () => container.plans.getById(id!),
    enabled: !!id,
  })
}

export function useSavePlan() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Partial<Plan> & { id?: string }) => {
      const now = new Date().toISOString()
      const plan: Plan = {
        id: data.id ?? uuid(),
        title: data.title ?? '',
        startYear: data.startYear ?? new Date().getFullYear(),
        endYear: data.endYear ?? new Date().getFullYear() + 1,
        description: data.description ?? '',
        isActive: data.isActive ?? true,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        createdBy: data.createdBy ?? currentUserId,
      }
      await container.plans.save(plan)
      return plan
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.plans.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

// ─── Strategic Objectives ─────────────────────────────────────────────────────

export function useSDs(planId: string | null) {
  return useQuery({
    queryKey: ['sds', planId],
    queryFn: () => container.sd.listByPlan(planId!),
    enabled: !!planId,
  })
}

export function useSD(id: string | null) {
  return useQuery({
    queryKey: ['sd', id],
    queryFn: () => container.sd.getById(id!),
    enabled: !!id,
  })
}

export function useSaveSD() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Partial<StrategicObjective> & { planId: string }) => {
      const now = new Date().toISOString()
      const sd: StrategicObjective = {
        id: data.id ?? uuid(),
        planId: data.planId,
        nr: data.nr ?? '1',
        pijler: data.pijler ?? '',
        dienst: data.dienst ?? '',
        rubriek: data.rubriek ?? '',
        probleem: data.probleem ?? '',
        doel: data.doel ?? '',
        meting: data.meting ?? '',
        typeGoal: 'SD',
        verantwoordelijken: data.verantwoordelijken ?? [],
        uitvoerders: data.uitvoerders ?? [],
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        adjustedEndDate: data.adjustedEndDate ?? '',
        status: data.status ?? 'niet_gestart',
        notes: data.notes ?? '',
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        createdBy: data.createdBy ?? currentUserId,
        updatedBy: currentUserId,
      }
      await container.sd.save(sd)
      await container.audit.log({
        id: uuid(),
        entityType: 'sd',
        entityId: sd.id,
        action: data.id ? 'update' : 'create',
        changes: {},
        performedBy: currentUserId,
        performedAt: now,
      })
      return sd
    },
    onSuccess: (sd) => {
      qc.invalidateQueries({ queryKey: ['sds', sd.planId] })
      qc.invalidateQueries({ queryKey: ['sd', sd.id] })
    },
  })
}

export function useDeleteSD() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, planId }: { id: string; planId: string }) => {
      // Cascade delete ODs and actions
      const ods = await container.od.listBySd(id)
      for (const od of ods) {
        await container.actions.deleteByOd(od.id)
      }
      await container.od.deleteBySd(id)
      await container.sd.delete(id)
      return planId
    },
    onSuccess: (planId) => {
      qc.invalidateQueries({ queryKey: ['sds', planId] })
      qc.invalidateQueries({ queryKey: ['ods', planId] })
      qc.invalidateQueries({ queryKey: ['actions', planId] })
    },
  })
}

// ─── Operational Objectives ───────────────────────────────────────────────────

export function useODs(planId: string | null) {
  return useQuery({
    queryKey: ['ods', planId],
    queryFn: () => container.od.listByPlan(planId!),
    enabled: !!planId,
  })
}

export function useODsBySd(sdId: string | null) {
  return useQuery({
    queryKey: ['ods-by-sd', sdId],
    queryFn: () => container.od.listBySd(sdId!),
    enabled: !!sdId,
  })
}

export function useOD(id: string | null) {
  return useQuery({
    queryKey: ['od', id],
    queryFn: () => container.od.getById(id!),
    enabled: !!id,
  })
}

export function useSaveOD() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Partial<OperationalObjective> & { planId: string; sdId: string }) => {
      const now = new Date().toISOString()
      const od: OperationalObjective = {
        id: data.id ?? uuid(),
        planId: data.planId,
        sdId: data.sdId,
        nr: data.nr ?? '',
        probleem: data.probleem ?? '',
        doel: data.doel ?? '',
        meting: data.meting ?? '',
        typeGoal: 'OD',
        verantwoordelijken: data.verantwoordelijken ?? [],
        uitvoerders: data.uitvoerders ?? [],
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        adjustedEndDate: data.adjustedEndDate ?? '',
        status: data.status ?? 'niet_gestart',
        notes: data.notes ?? '',
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        createdBy: data.createdBy ?? currentUserId,
        updatedBy: currentUserId,
      }
      await container.od.save(od)
      await container.audit.log({
        id: uuid(),
        entityType: 'od',
        entityId: od.id,
        action: data.id ? 'update' : 'create',
        changes: {},
        performedBy: currentUserId,
        performedAt: now,
      })
      return od
    },
    onSuccess: (od) => {
      qc.invalidateQueries({ queryKey: ['ods', od.planId] })
      qc.invalidateQueries({ queryKey: ['ods-by-sd', od.sdId] })
      qc.invalidateQueries({ queryKey: ['od', od.id] })
    },
  })
}

export function useDeleteOD() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, planId, sdId }: { id: string; planId: string; sdId: string }) => {
      await container.actions.deleteByOd(id)
      await container.od.delete(id)
      return { planId, sdId }
    },
    onSuccess: ({ planId, sdId }) => {
      qc.invalidateQueries({ queryKey: ['ods', planId] })
      qc.invalidateQueries({ queryKey: ['ods-by-sd', sdId] })
      qc.invalidateQueries({ queryKey: ['actions', planId] })
    },
  })
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export function useActions(planId: string | null) {
  return useQuery({
    queryKey: ['actions', planId],
    queryFn: () => container.actions.listByPlan(planId!),
    enabled: !!planId,
  })
}

export function useActionsByOd(odId: string | null) {
  return useQuery({
    queryKey: ['actions-by-od', odId],
    queryFn: () => container.actions.listByOd(odId!),
    enabled: !!odId,
  })
}

export function useSaveAction() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Partial<Action> & { planId: string; odId: string }) => {
      const now = new Date().toISOString()
      const action: Action = {
        id: data.id ?? uuid(),
        planId: data.planId,
        odId: data.odId,
        title: data.title ?? '',
        verantwoordelijke: data.verantwoordelijke ?? '',
        uitvoerders: data.uitvoerders ?? [],
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        adjustedEndDate: data.adjustedEndDate ?? '',
        status: data.status ?? 'niet_gestart',
        opmerkingen: data.opmerkingen ?? '',
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        createdBy: data.createdBy ?? currentUserId,
        updatedBy: currentUserId,
      }
      await container.actions.save(action)
      return action
    },
    onSuccess: (action) => {
      qc.invalidateQueries({ queryKey: ['actions', action.planId] })
      qc.invalidateQueries({ queryKey: ['actions-by-od', action.odId] })
    },
  })
}

export function useDeleteAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, planId, odId }: { id: string; planId: string; odId: string }) => {
      await container.actions.delete(id)
      return { planId, odId }
    },
    onSuccess: ({ planId, odId }) => {
      qc.invalidateQueries({ queryKey: ['actions', planId] })
      qc.invalidateQueries({ queryKey: ['actions-by-od', odId] })
    },
  })
}

export function useBulkUpdateActions() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async ({
      ids,
      updates,
      planId,
    }: {
      ids: string[]
      updates: Partial<Pick<Action, 'status' | 'verantwoordelijke' | 'endDate' | 'adjustedEndDate'>>
      planId: string
    }) => {
      const now = new Date().toISOString()
      for (const id of ids) {
        const action = await container.actions.getById(id)
        if (action) {
          await container.actions.save({ ...action, ...updates, updatedAt: now, updatedBy: currentUserId })
        }
      }
      return planId
    },
    onSuccess: (planId) => qc.invalidateQueries({ queryKey: ['actions', planId] }),
  })
}

// ─── Fiches ───────────────────────────────────────────────────────────────────

export function useFiche(planId: string | null, scopeType: FicheScope | null, scopeId: string | null) {
  return useQuery({
    queryKey: ['fiche', planId, scopeType, scopeId],
    queryFn: () => container.fiches.getByScope(planId!, scopeType!, scopeId!),
    enabled: !!planId && !!scopeType && !!scopeId,
  })
}

export function useFicheById(id: string | null) {
  return useQuery({
    queryKey: ['fiche-by-id', id],
    queryFn: () => container.fiches.getById(id!),
    enabled: !!id,
  })
}

export function useSaveFiche() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Partial<ActionFiche> & { planId: string; scopeType: FicheScope; scopeId: string }) => {
      const now = new Date().toISOString()
      const fiche: ActionFiche = {
        id: data.id ?? uuid(),
        planId: data.planId,
        scopeType: data.scopeType,
        scopeId: data.scopeId,
        visie: data.visie ?? '',
        aanpak: data.aanpak ?? '',
        eigenaars: data.eigenaars ?? [],
        status: data.status ?? 'niet_gestart',
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        createdBy: data.createdBy ?? currentUserId,
        updatedBy: currentUserId,
      }
      await container.fiches.save(fiche)
      return fiche
    },
    onSuccess: (fiche) => {
      qc.invalidateQueries({ queryKey: ['fiche', fiche.planId, fiche.scopeType, fiche.scopeId] })
      qc.invalidateQueries({ queryKey: ['fiche-by-id', fiche.id] })
    },
  })
}

// ─── Fiche Items ──────────────────────────────────────────────────────────────

export function useFicheItems(ficheId: string | null) {
  return useQuery({
    queryKey: ['fiche-items', ficheId],
    queryFn: () => container.ficheItems.listByFiche(ficheId!),
    enabled: !!ficheId,
  })
}

export function useSaveFicheItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<FicheItem> & { ficheId: string }) => {
      const now = new Date().toISOString()
      const item: FicheItem = {
        id: data.id ?? uuid(),
        ficheId: data.ficheId,
        titel: data.titel ?? '',
        startDate: data.startDate ?? '',
        tijdpad: data.tijdpad ?? '',
        uitvoerder: data.uitvoerder ?? '',
        gewenstResultaat: data.gewenstResultaat ?? '',
        opvolging: data.opvolging ?? '',
        status: data.status ?? 'niet_gestart',
        sortOrder: data.sortOrder ?? 0,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      }
      await container.ficheItems.save(item)
      return item
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['fiche-items', item.ficheId] })
    },
  })
}

export function useDeleteFicheItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ficheId }: { id: string; ficheId: string }) => {
      await container.ficheItems.delete(id)
      return ficheId
    },
    onSuccess: (ficheId) => qc.invalidateQueries({ queryKey: ['fiche-items', ficheId] }),
  })
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => container.users.getAll(),
  })
}

export function useSaveUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<User> & { name: string; email: string }) => {
      const user: User = {
        id: data.id ?? uuid(),
        name: data.name,
        email: data.email,
        role: data.role ?? 'viewer',
        scopes: data.scopes ?? [],
        isActive: data.isActive ?? true,
      }
      await container.users.save(user)
      return user
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => container.users.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export function useDashboardStats(planId: string | null) {
  return useQuery({
    queryKey: ['dashboard-stats', planId],
    queryFn: async () => {
      if (!planId) return null
      const [sds, ods, actions] = await Promise.all([
        container.sd.listByPlan(planId),
        container.od.listByPlan(planId),
        container.actions.listByPlan(planId),
      ])
      const today = new Date().toISOString().slice(0, 10)

      const overdue = actions.filter(a => {
        const end = a.adjustedEndDate || a.endDate
        return end && end < today && a.status !== 'afgerond' && a.status !== 'geannuleerd'
      })
      const noOwner = actions.filter(a => !a.verantwoordelijke)
      const sdCounts = {
        niet_gestart: sds.filter(s => s.status === 'niet_gestart').length,
        in_uitvoering: sds.filter(s => s.status === 'in_uitvoering').length,
        afgerond: sds.filter(s => s.status === 'afgerond').length,
        uitgesteld: sds.filter(s => s.status === 'uitgesteld').length,
      }
      const odCounts = {
        niet_gestart: ods.filter(o => o.status === 'niet_gestart').length,
        in_uitvoering: ods.filter(o => o.status === 'in_uitvoering').length,
        afgerond: ods.filter(o => o.status === 'afgerond').length,
        uitgesteld: ods.filter(o => o.status === 'uitgesteld').length,
      }
      const actionCounts = {
        niet_gestart: actions.filter(a => a.status === 'niet_gestart').length,
        in_uitvoering: actions.filter(a => a.status === 'in_uitvoering').length,
        afgerond: actions.filter(a => a.status === 'afgerond').length,
        uitgesteld: actions.filter(a => a.status === 'uitgesteld').length,
      }

      return { sds, ods, actions, overdue, noOwner, sdCounts, odCounts, actionCounts }
    },
    enabled: !!planId,
  })
}

export function useUpdateActionStatus() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async ({ id, status, planId }: { id: string; status: ObjectiveStatus; planId: string }) => {
      const action = await container.actions.getById(id)
      if (action) {
        await container.actions.save({ ...action, status, updatedAt: new Date().toISOString(), updatedBy: currentUserId })
      }
      return planId
    },
    onSuccess: (planId) => {
      qc.invalidateQueries({ queryKey: ['actions', planId] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats', planId] })
    },
  })
}

// ─── Dagelijkse werking – Work Domains ────────────────────────────────────────

export function useWorkDomains() {
  return useQuery({
    queryKey: ['workDomains'],
    queryFn: () => container.workDomains.getAll(),
  })
}

export function useWorkDomain(id: string | null) {
  return useQuery({
    queryKey: ['workDomain', id],
    queryFn: () => container.workDomains.getById(id!),
    enabled: !!id,
  })
}

export function useSaveWorkDomain() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Partial<WorkDomain> & { name: string }) => {
      const now = new Date().toISOString()
      const domain: WorkDomain = {
        id: data.id ?? uuid(),
        name: data.name,
        description: data.description ?? '',
        owner: data.owner ?? '',
        status: data.status ?? 'actief',
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        createdBy: data.createdBy ?? currentUserId,
      }
      await container.workDomains.save(domain)
      return domain
    },
    onSuccess: (domain) => {
      qc.invalidateQueries({ queryKey: ['workDomains'] })
      qc.invalidateQueries({ queryKey: ['workDomain', domain.id] })
    },
  })
}

export function useDeleteWorkDomain() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const streams = await container.workStreams.listByDomain(id)
      for (const stream of streams) {
        const tasks = await container.dailyTasks.listByStream(stream.id)
        for (const task of tasks) {
          await container.taskItems.deleteByTask(task.id)
        }
        await container.dailyTasks.deleteByStream(stream.id)
      }
      await container.workStreams.deleteByDomain(id)
      await container.workDomains.delete(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workDomains'] })
      qc.invalidateQueries({ queryKey: ['allWorkStreams'] })
      qc.invalidateQueries({ queryKey: ['allDailyTasks'] })
    },
  })
}

// ─── Dagelijkse werking – Work Streams ────────────────────────────────────────

export function useWorkStreams(domainId: string | null) {
  return useQuery({
    queryKey: ['workStreams', domainId],
    queryFn: () => container.workStreams.listByDomain(domainId!),
    enabled: !!domainId,
  })
}

export function useAllWorkStreams() {
  return useQuery({
    queryKey: ['allWorkStreams'],
    queryFn: () => container.workStreams.listAll(),
  })
}

export function useSaveWorkStream() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<WorkStream> & { domainId: string; name: string }) => {
      const now = new Date().toISOString()
      const stream: WorkStream = {
        id: data.id ?? uuid(),
        domainId: data.domainId,
        name: data.name,
        type: data.type ?? 'continu',
        priority: data.priority ?? 'normaal',
        verantwoordelijke: data.verantwoordelijke ?? '',
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      }
      await container.workStreams.save(stream)
      return stream
    },
    onSuccess: (stream) => {
      qc.invalidateQueries({ queryKey: ['workStreams', stream.domainId] })
      qc.invalidateQueries({ queryKey: ['allWorkStreams'] })
    },
  })
}

export function useDeleteWorkStream() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, domainId }: { id: string; domainId: string }) => {
      const tasks = await container.dailyTasks.listByStream(id)
      for (const task of tasks) {
        await container.taskItems.deleteByTask(task.id)
      }
      await container.dailyTasks.deleteByStream(id)
      await container.workStreams.delete(id)
      return domainId
    },
    onSuccess: (domainId) => {
      qc.invalidateQueries({ queryKey: ['workStreams', domainId] })
      qc.invalidateQueries({ queryKey: ['allWorkStreams'] })
      qc.invalidateQueries({ queryKey: ['allDailyTasks'] })
    },
  })
}

// ─── Dagelijkse werking – Daily Tasks ─────────────────────────────────────────

export function useDailyTasks(streamId: string | null) {
  return useQuery({
    queryKey: ['dailyTasks', streamId],
    queryFn: () => container.dailyTasks.listByStream(streamId!),
    enabled: !!streamId,
  })
}

export function useAllDailyTasks() {
  return useQuery({
    queryKey: ['allDailyTasks'],
    queryFn: () => container.dailyTasks.listAll(),
  })
}

export function useDailyTasksByAssignee(name: string | null) {
  return useQuery({
    queryKey: ['dailyTasksByAssignee', name],
    queryFn: () => container.dailyTasks.listByAssignee(name!),
    enabled: !!name,
  })
}

export function useSaveDailyTask() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async (data: Partial<DailyTask> & { streamId: string; title: string }) => {
      const now = new Date().toISOString()
      const task: DailyTask = {
        id: data.id ?? uuid(),
        streamId: data.streamId,
        title: data.title,
        description: data.description ?? '',
        assignees: data.assignees ?? [],
        startDate: data.startDate ?? '',
        deadline: data.deadline ?? '',
        status: data.status ?? 'nieuw',
        recurrence: data.recurrence ?? 'geen',
        notes: data.notes ?? '',
        sdId: data.sdId,
        odId: data.odId,
        actionId: data.actionId,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        createdBy: data.createdBy ?? currentUserId,
        updatedBy: currentUserId,
      }
      await container.dailyTasks.save(task)
      await container.audit.log({
        id: uuid(),
        entityType: 'dailyTask',
        entityId: task.id,
        action: data.id ? 'update' : 'create',
        changes: {},
        performedBy: currentUserId,
        performedAt: now,
      })
      return task
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['dailyTasks', task.streamId] })
      qc.invalidateQueries({ queryKey: ['allDailyTasks'] })
      qc.invalidateQueries({ queryKey: ['dailyTasksByAssignee'] })
    },
  })
}

export function useDeleteDailyTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, streamId }: { id: string; streamId: string }) => {
      await container.taskItems.deleteByTask(id)
      await container.dailyTasks.delete(id)
      return streamId
    },
    onSuccess: (streamId) => {
      qc.invalidateQueries({ queryKey: ['dailyTasks', streamId] })
      qc.invalidateQueries({ queryKey: ['allDailyTasks'] })
      qc.invalidateQueries({ queryKey: ['dailyTasksByAssignee'] })
    },
  })
}

export function useUpdateDailyTaskStatus() {
  const qc = useQueryClient()
  const { currentUserId } = useAuthStore()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DailyTaskStatus; streamId: string }) => {
      const now = new Date().toISOString()
      const task = await container.dailyTasks.getById(id)
      if (task) {
        await container.dailyTasks.save({ ...task, status, updatedAt: now, updatedBy: currentUserId })
        await container.audit.log({
          id: uuid(), entityType: 'dailyTask', entityId: id,
          action: 'status_change', changes: { status },
          performedBy: currentUserId, performedAt: now,
        })
      }
      return task?.streamId ?? ''
    },
    onSuccess: (streamId) => {
      if (streamId) qc.invalidateQueries({ queryKey: ['dailyTasks', streamId] })
      qc.invalidateQueries({ queryKey: ['allDailyTasks'] })
      qc.invalidateQueries({ queryKey: ['dailyTasksByAssignee'] })
    },
  })
}

// ─── Dagelijkse werking – Task Items ──────────────────────────────────────────

export function useTaskItems(taskId: string | null) {
  return useQuery({
    queryKey: ['taskItems', taskId],
    queryFn: () => container.taskItems.listByTask(taskId!),
    enabled: !!taskId,
  })
}

export function useSaveTaskItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<TaskItem> & { taskId: string; title: string }) => {
      const item: TaskItem = {
        id: data.id ?? uuid(),
        taskId: data.taskId,
        title: data.title,
        status: data.status ?? 'nieuw',
        uitvoerder: data.uitvoerder ?? '',
        sortOrder: data.sortOrder ?? 0,
      }
      await container.taskItems.save(item)
      return item
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ['taskItems', item.taskId] })
    },
  })
}

export function useDeleteTaskItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      await container.taskItems.delete(id)
      return taskId
    },
    onSuccess: (taskId) => qc.invalidateQueries({ queryKey: ['taskItems', taskId] }),
  })
}
