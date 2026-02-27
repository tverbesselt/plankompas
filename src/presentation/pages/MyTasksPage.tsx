import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Calendar, ChevronRight, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { Header } from '@/presentation/components/layout/Header'
import { PageLoading, EmptyState } from '@/presentation/components/shared/LoadingSpinner'
import {
  useDailyTasksByAssignee, useAllWorkStreams, useWorkDomains,
  useUpdateDailyTaskStatus, useSaveDailyTask,
} from '@/presentation/hooks/useData'
import { useAuthStore } from '@/presentation/store/uiStore'
import {
  DAILY_TASK_STATUS_LABELS, DAILY_TASK_STATUS_COLORS,
} from '@/domain/types'
import type { DailyTask, DailyTaskStatus } from '@/domain/types'

const STATUS_ORDER: DailyTaskStatus[] = ['bezig', 'wachtend', 'nieuw', 'afgerond']

function TaskCard({
  task,
  streamName,
  domainName,
  domainId,
}: {
  task: DailyTask
  streamName: string
  domainName: string
  domainId: string
}) {
  const navigate = useNavigate()
  const updateStatus = useUpdateDailyTaskStatus()
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.deadline && task.deadline < today && task.status !== 'afgerond'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', DAILY_TASK_STATUS_COLORS[task.status])}>
              {DAILY_TASK_STATUS_LABELS[task.status]}
            </span>
            <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
          </div>

          <button
            onClick={() => navigate(`/dagelijkse-werking/${domainId}`)}
            className="text-xs text-primary-600 hover:underline flex items-center gap-1 mt-1"
          >
            {domainName} › {streamName} <ChevronRight size={11} />
          </button>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            {task.deadline && (
              <span className={clsx('flex items-center gap-1', isOverdue && 'text-red-600 font-medium')}>
                {isOverdue && <AlertCircle size={11} />}
                <Calendar size={11} />
                {isOverdue ? `Vervallen: ${task.deadline}` : `Deadline: ${task.deadline}`}
              </span>
            )}
            {task.recurrence !== 'geen' && (
              <span className="text-gray-400">↻ {task.recurrence}</span>
            )}
          </div>

          {task.notes && (
            <p className="text-xs text-gray-500 italic mt-1 bg-yellow-50 px-2 py-1 rounded">{task.notes}</p>
          )}
        </div>

        {/* Quick status changer */}
        <div className="shrink-0">
          <select
            value={task.status}
            onChange={e => updateStatus.mutate({ id: task.id, status: e.target.value as DailyTaskStatus, streamId: task.streamId })}
            className="text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            {(Object.entries(DAILY_TASK_STATUS_LABELS) as [DailyTaskStatus, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export function MyTasksPage() {
  const { currentUserName } = useAuthStore()
  const { data: myTasks = [], isLoading } = useDailyTasksByAssignee(currentUserName)
  const { data: allStreams = [] } = useAllWorkStreams()
  const { data: domains = [] } = useWorkDomains()

  const [filterStatus, setFilterStatus] = useState<DailyTaskStatus | 'alle'>('alle')

  // Build lookup maps
  const streamMap = Object.fromEntries(allStreams.map(s => [s.id, s]))
  const domainMap = Object.fromEntries(domains.map(d => [d.id, d]))

  const filtered = filterStatus === 'alle'
    ? myTasks
    : myTasks.filter(t => t.status === filterStatus)

  const grouped = STATUS_ORDER.reduce<Record<string, DailyTask[]>>((acc, status) => {
    if (filterStatus !== 'alle' && filterStatus !== status) return acc
    const items = filtered.filter(t => t.status === status)
    if (items.length > 0) acc[status] = items
    return acc
  }, {})

  const overdueCount = myTasks.filter(t => {
    const today = new Date().toISOString().slice(0, 10)
    return t.deadline && t.deadline < today && t.status !== 'afgerond'
  }).length

  if (isLoading) return <PageLoading />

  return (
    <div>
      <Header
        title="Mijn taken"
        subtitle={`Taken toegewezen aan ${currentUserName}`}
      />
      <div className="p-6">
        {/* Stats */}
        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={() => setFilterStatus('alle')}
            className={clsx(
              'px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors',
              filterStatus === 'alle' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            Alle ({myTasks.length})
          </button>
          {STATUS_ORDER.map(status => {
            const count = myTasks.filter(t => t.status === status).length
            if (count === 0) return null
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={clsx(
                  'px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors',
                  filterStatus === status
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                {DAILY_TASK_STATUS_LABELS[status]} ({count})
              </button>
            )
          })}
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle size={14} /> {overdueCount} vervallen
            </span>
          )}
        </div>

        {myTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Geen taken gevonden"
            description="Er zijn momenteel geen taken aan jou toegewezen."
          />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Geen taken met deze status.</p>
        ) : (
          <div className="space-y-6">
            {(Object.entries(grouped) as [DailyTaskStatus, DailyTask[]][]).map(([status, tasks]) => (
              <div key={status}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className={clsx('inline-block w-2 h-2 rounded-full', {
                    'bg-gray-400': status === 'nieuw',
                    'bg-blue-500': status === 'bezig',
                    'bg-yellow-500': status === 'wachtend',
                    'bg-green-500': status === 'afgerond',
                  })} />
                  {DAILY_TASK_STATUS_LABELS[status]} — {tasks.length}
                </h3>
                <div className="space-y-2">
                  {tasks.map(task => {
                    const stream = streamMap[task.streamId]
                    const domain = stream ? domainMap[stream.domainId] : undefined
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        streamName={stream?.name ?? ''}
                        domainName={domain?.name ?? ''}
                        domainId={domain?.id ?? ''}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
