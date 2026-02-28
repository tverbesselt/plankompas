import { useNavigate } from 'react-router-dom'
import { Users, AlertCircle, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { Header } from '@/presentation/components/layout/Header'
import { PageLoading, EmptyState } from '@/presentation/components/shared/LoadingSpinner'
import { useAllDailyTasks, useAllWorkStreams, useWorkDomains } from '@/presentation/hooks/useData'
import { DAILY_TASK_STATUS_LABELS, DAILY_TASK_STATUS_COLORS } from '@/domain/types'
import type { DailyTask, DailyTaskStatus } from '@/domain/types'

function PersonCard({
  name,
  tasks,
  streamMap,
  domainMap,
}: {
  name: string
  tasks: DailyTask[]
  streamMap: Record<string, { name: string; domainId: string }>
  domainMap: Record<string, { name: string; id: string }>
}) {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const counts = {
    nieuw: tasks.filter(t => t.status === 'nieuw').length,
    bezig: tasks.filter(t => t.status === 'bezig').length,
    wachtend: tasks.filter(t => t.status === 'wachtend').length,
    afgerond: tasks.filter(t => t.status === 'afgerond').length,
  }
  const overdue = tasks.filter(t => t.deadline && t.deadline < today && t.status !== 'afgerond')
  const active = tasks.filter(t => t.status !== 'afgerond')

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gray-50 border-b flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">{name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-xs text-gray-500">
            {active.length} actieve {active.length === 1 ? 'taak' : 'taken'}
            {overdue.length > 0 && <span className="ml-2 text-red-600 font-medium flex items-center gap-0.5 inline-flex">
              <AlertCircle size={11} /> {overdue.length} vervallen
            </span>}
          </p>
        </div>
        {/* Status pills */}
        <div className="flex gap-1.5 shrink-0">
          {counts.bezig > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{counts.bezig} bezig</span>
          )}
          {counts.nieuw > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{counts.nieuw} nieuw</span>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="divide-y">
        {tasks.slice(0, 5).map(task => {
          const stream = streamMap[task.streamId]
          const domain = stream ? domainMap[stream.domainId] : undefined
          const isOverdue = task.deadline && task.deadline < today && task.status !== 'afgerond'
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
              onClick={() => domain && navigate(`/dagelijkse-werking/${domain.id}`)}
            >
              <span className={clsx('text-xs px-2 py-0.5 rounded-full shrink-0 font-medium', DAILY_TASK_STATUS_COLORS[task.status as DailyTaskStatus])}>
                {DAILY_TASK_STATUS_LABELS[task.status as DailyTaskStatus]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{task.title}</p>
                {domain && (
                  <p className="text-xs text-gray-400">{domain.name} › {stream?.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.deadline && (
                  <span className={clsx('text-xs', isOverdue ? 'text-red-600 font-medium' : 'text-gray-400')}>
                    {task.deadline}
                  </span>
                )}
                <ChevronRight size={13} className="text-gray-300 group-hover:text-primary-500" />
              </div>
            </div>
          )
        })}
        {tasks.length > 5 && (
          <div className="px-4 py-2 text-xs text-gray-400 text-center">
            + {tasks.length - 5} meer taken
          </div>
        )}
        {tasks.length === 0 && (
          <div className="px-4 py-4 text-xs text-gray-400 text-center">Geen taken toegewezen.</div>
        )}
      </div>
    </div>
  )
}

export function TeamOverviewPage() {
  const { data: allTasks = [], isLoading } = useAllDailyTasks()
  const { data: allStreams = [] } = useAllWorkStreams()
  const { data: domains = [] } = useWorkDomains()

  // Build lookup maps
  const streamMap = Object.fromEntries(allStreams.map(s => [s.id, { name: s.name, domainId: s.domainId }]))
  const domainMap = Object.fromEntries(domains.map(d => [d.id, { name: d.name, id: d.id }]))

  // Collect all unique team members from tasks
  const memberTaskMap: Record<string, DailyTask[]> = {}
  for (const task of allTasks) {
    for (const assignee of task.assignees) {
      if (!memberTaskMap[assignee]) memberTaskMap[assignee] = []
      memberTaskMap[assignee].push(task)
    }
  }
  const members = Object.keys(memberTaskMap).sort()

  const today = new Date().toISOString().slice(0, 10)
  const totalActive = allTasks.filter(t => t.status !== 'afgerond').length
  const totalOverdue = allTasks.filter(t => t.deadline && t.deadline < today && t.status !== 'afgerond').length

  if (isLoading) return <PageLoading />

  return (
    <div>
      <Header
        title="Gebruikersoverzicht"
        subtitle="Gebruikers en hun taakverdeling"
      />
      <div className="p-6">
        {/* Summary */}
        {allTasks.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white border rounded-lg px-4 py-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold text-gray-900">{members.length}</div>
              <div className="text-xs text-gray-500">Teamleden</div>
            </div>
            <div className="bg-white border rounded-lg px-4 py-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold text-gray-900">{totalActive}</div>
              <div className="text-xs text-gray-500">Actieve taken</div>
            </div>
            {totalOverdue > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center min-w-[80px]">
                <div className="text-2xl font-bold text-red-600">{totalOverdue}</div>
                <div className="text-xs text-red-500">Vervallen</div>
              </div>
            )}
          </div>
        )}

        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Geen teamleden gevonden"
            description="Voeg uitvoerders toe aan taken om het teamoverzicht te vullen."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {members.map(name => (
              <PersonCard
                key={name}
                name={name}
                tasks={memberTaskMap[name] ?? []}
                streamMap={streamMap}
                domainMap={domainMap}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
