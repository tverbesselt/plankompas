import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus, ChevronLeft, Pencil, Trash2, Users, Calendar, ChevronDown, ChevronRight,
  Tag, AlertCircle, Check, Square,
} from 'lucide-react'
import clsx from 'clsx'
import { Header } from '@/presentation/components/layout/Header'
import { PageLoading, EmptyState } from '@/presentation/components/shared/LoadingSpinner'
import {
  useWorkDomain, useSaveWorkDomain, useDeleteWorkDomain,
  useWorkStreams, useSaveWorkStream, useDeleteWorkStream,
  useDailyTasks, useSaveDailyTask, useDeleteDailyTask, useUpdateDailyTaskStatus,
  useTaskItems, useSaveTaskItem, useDeleteTaskItem,
} from '@/presentation/hooks/useData'
import { useAuthStore } from '@/presentation/store/uiStore'
import {
  DAILY_TASK_STATUS_LABELS, DAILY_TASK_STATUS_COLORS,
  WORK_STREAM_TYPE_LABELS, WORK_STREAM_PRIORITY_LABELS, WORK_STREAM_PRIORITY_COLORS,
} from '@/domain/types'
import type {
  WorkDomain, WorkStream, DailyTask, TaskItem,
  DailyTaskStatus, WorkStreamType, WorkStreamPriority, TaskRecurrence,
} from '@/domain/types'

// ─── Forms ────────────────────────────────────────────────────────────────────

function StreamModal({
  stream, domainId, onSave, onClose,
}: {
  stream?: WorkStream; domainId: string
  onSave: (s: Partial<WorkStream> & { domainId: string; name: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(stream?.name ?? '')
  const [type, setType] = useState<WorkStreamType>(stream?.type ?? 'continu')
  const [priority, setPriority] = useState<WorkStreamPriority>(stream?.priority ?? 'normaal')
  const [verantwoordelijke, setVerantwoordelijke] = useState(stream?.verantwoordelijke ?? '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">{stream ? 'Werkstroom bewerken' : 'Nieuwe werkstroom'}</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="bv. Nascholing plannen" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value as WorkStreamType)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="continu">Continu</option>
                <option value="periodiek">Periodiek</option>
                <option value="ad-hoc">Ad-hoc</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteit</label>
              <select value={priority} onChange={e => setPriority(e.target.value as WorkStreamPriority)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="laag">Laag</option>
                <option value="normaal">Normaal</option>
                <option value="hoog">Hoog</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verantwoordelijke</label>
            <input value={verantwoordelijke} onChange={e => setVerantwoordelijke(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Naam verantwoordelijke" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Annuleren</button>
          <button
            onClick={() => { if (name.trim()) onSave({ ...stream, domainId, name: name.trim(), type, priority, verantwoordelijke }) }}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskModal({
  task, streamId, onSave, onClose,
}: {
  task?: DailyTask; streamId: string
  onSave: (t: Partial<DailyTask> & { streamId: string; title: string }) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [assigneesStr, setAssigneesStr] = useState((task?.assignees ?? []).join(', '))
  const [deadline, setDeadline] = useState(task?.deadline ?? '')
  const [startDate, setStartDate] = useState(task?.startDate ?? '')
  const [status, setStatus] = useState<DailyTaskStatus>(task?.status ?? 'nieuw')
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(task?.recurrence ?? 'geen')
  const [notes, setNotes] = useState(task?.notes ?? '')

  const assignees = assigneesStr.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-gray-900">{task ? 'Taak bewerken' : 'Nieuwe taak'}</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Uitvoerders (komma-gescheiden)</label>
            <input value={assigneesStr} onChange={e => setAssigneesStr(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="bv. Jan Peeters, Marie Claes" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as DailyTaskStatus)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {(Object.entries(DAILY_TASK_STATUS_LABELS) as [DailyTaskStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Herhaling</label>
              <select value={recurrence} onChange={e => setRecurrence(e.target.value as TaskRecurrence)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="geen">Geen</option>
                <option value="wekelijks">Wekelijks</option>
                <option value="maandelijks">Maandelijks</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Annuleren</button>
          <button
            onClick={() => { if (title.trim()) onSave({ ...task, streamId, title: title.trim(), description, assignees, deadline, startDate, status, recurrence, notes }) }}
            disabled={!title.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Task items checklist ─────────────────────────────────────────────────────

function TaskItemsList({ taskId }: { taskId: string }) {
  const { data: items = [] } = useTaskItems(taskId)
  const saveItem = useSaveTaskItem()
  const deleteItem = useDeleteTaskItem()
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = () => {
    const title = newTitle.trim()
    if (!title) return
    saveItem.mutate({ taskId, title, sortOrder: items.length })
    setNewTitle('')
  }

  return (
    <div className="mt-3 space-y-1">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2 group">
          <button
            onClick={() => saveItem.mutate({ ...item, status: item.status === 'afgerond' ? 'nieuw' : 'afgerond' })}
            className="text-primary-600 hover:text-primary-800 shrink-0"
          >
            {item.status === 'afgerond' ? <Check size={15} /> : <Square size={15} className="text-gray-400" />}
          </button>
          <span className={clsx('text-xs flex-1', item.status === 'afgerond' && 'line-through text-gray-400')}>
            {item.title}
          </span>
          <button
            onClick={() => deleteItem.mutate({ id: item.id, taskId })}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <div className="flex gap-1 mt-1">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="+ Item toevoegen..."
          className="flex-1 text-xs border-b border-gray-200 focus:border-primary-400 outline-none py-1 bg-transparent"
        />
        {newTitle && (
          <button onClick={handleAdd} className="text-xs text-primary-600 font-medium px-1">Voeg toe</button>
        )}
      </div>
    </div>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({
  task, isAdmin, canEdit, onEdit, onDelete,
}: {
  task: DailyTask
  isAdmin: boolean
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const updateStatus = useUpdateDailyTaskStatus()
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.deadline && task.deadline < today && task.status !== 'afgerond'

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', DAILY_TASK_STATUS_COLORS[task.status])}>
          {DAILY_TASK_STATUS_LABELS[task.status]}
        </span>

        <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{task.title}</span>

        <div className="flex items-center gap-2 shrink-0">
          {isOverdue && <AlertCircle size={14} className="text-red-500" />}
          {task.deadline && (
            <span className={clsx('text-xs', isOverdue ? 'text-red-600 font-medium' : 'text-gray-400')}>
              {task.deadline}
            </span>
          )}
          {canEdit && (
            <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
              <button onClick={onEdit} className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                <Pencil size={12} />
              </button>
              <button onClick={onDelete} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t bg-gray-50">
          <div className="flex flex-wrap gap-3 pt-2 text-xs text-gray-500">
            {task.assignees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users size={11} /> {task.assignees.join(', ')}
              </span>
            )}
            {task.startDate && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {task.startDate}
                {task.deadline && ` → ${task.deadline}`}
              </span>
            )}
            {task.recurrence !== 'geen' && (
              <span className="flex items-center gap-1">
                <Tag size={11} /> {task.recurrence}
              </span>
            )}
          </div>

          {task.description && <p className="text-xs text-gray-600 mt-2">{task.description}</p>}
          {task.notes && <p className="text-xs text-gray-500 italic mt-1 bg-yellow-50 px-2 py-1 rounded">{task.notes}</p>}

          {/* Quick status update */}
          {canEdit && (
            <div className="mt-2">
              <label className="text-xs text-gray-500 mr-2">Status:</label>
              <select
                value={task.status}
                onChange={e => updateStatus.mutate({ id: task.id, status: e.target.value as DailyTaskStatus, streamId: task.streamId })}
                className="text-xs border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {(Object.entries(DAILY_TASK_STATUS_LABELS) as [DailyTaskStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          )}

          <TaskItemsList taskId={task.id} />
        </div>
      )}
    </div>
  )
}

// ─── Stream panel ─────────────────────────────────────────────────────────────

function StreamPanel({
  stream, isAdmin, currentUserName, onEditStream, onDeleteStream,
}: {
  stream: WorkStream
  isAdmin: boolean
  currentUserName: string
  onEditStream: () => void
  onDeleteStream: () => void
}) {
  const [open, setOpen] = useState(true)
  const [taskModal, setTaskModal] = useState<DailyTask | 'new' | null>(null)

  const { data: tasks = [] } = useDailyTasks(stream.id)
  const saveTask = useSaveDailyTask()
  const deleteTask = useDeleteDailyTask()

  const canEdit = isAdmin || stream.verantwoordelijke === currentUserName

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b cursor-pointer" onClick={() => setOpen(!open)}>
        <button className="text-gray-400 shrink-0">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{stream.name}</h4>
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', WORK_STREAM_PRIORITY_COLORS[stream.priority])}>
              {WORK_STREAM_PRIORITY_LABELS[stream.priority]}
            </span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {WORK_STREAM_TYPE_LABELS[stream.type]}
            </span>
          </div>
          {stream.verantwoordelijke && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Users size={10} /> {stream.verantwoordelijke}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-500 shrink-0">{tasks.length} {tasks.length === 1 ? 'taak' : 'taken'}</span>
        {isAdmin && (
          <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={onEditStream} className="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50">
              <Pencil size={13} />
            </button>
            <button onClick={onDeleteStream} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="p-3 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">Nog geen taken in deze stroom.</p>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                canEdit={canEdit}
                onEdit={() => setTaskModal(task)}
                onDelete={() => {
                  if (confirm(`Taak "${task.title}" verwijderen?`)) {
                    deleteTask.mutate({ id: task.id, streamId: stream.id })
                  }
                }}
              />
            ))
          )}
          {canEdit && (
            <button
              onClick={() => setTaskModal('new')}
              className="w-full text-xs text-primary-600 hover:text-primary-800 py-2 border border-dashed border-primary-300 rounded-lg hover:bg-primary-50 flex items-center justify-center gap-1"
            >
              <Plus size={13} /> Taak toevoegen
            </button>
          )}
        </div>
      )}

      {taskModal !== null && (
        <TaskModal
          task={taskModal === 'new' ? undefined : taskModal}
          streamId={stream.id}
          onSave={data => {
            saveTask.mutate(data)
            setTaskModal(null)
          }}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WorkDomainDetail() {
  const { domainId } = useParams<{ domainId: string }>()
  const navigate = useNavigate()
  const { data: domain, isLoading } = useWorkDomain(domainId ?? null)
  const { data: streams = [] } = useWorkStreams(domainId ?? null)
  const saveDomain = useSaveWorkDomain()
  const deleteDomain = useDeleteWorkDomain()
  const saveStream = useSaveWorkStream()
  const deleteStream = useDeleteWorkStream()

  const { currentUserRole, currentUserName } = useAuthStore()
  const isAdmin = currentUserRole === 'admin'

  const [editDomain, setEditDomain] = useState(false)
  const [streamModal, setStreamModal] = useState<WorkStream | 'new' | null>(null)

  if (isLoading) return <PageLoading />
  if (!domain) return (
    <div className="p-6">
      <p className="text-gray-500">Werkdomein niet gevonden.</p>
      <button onClick={() => navigate('/dagelijkse-werking')} className="mt-2 text-primary-600 hover:underline text-sm">
        ← Terug
      </button>
    </div>
  )

  return (
    <div>
      <Header
        title={domain.name}
        subtitle={domain.description || 'Werkdomein detail'}
        actions={
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => setEditDomain(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-gray-50"
                >
                  <Pencil size={14} /> Bewerken
                </button>
                <button
                  onClick={() => setStreamModal('new')}
                  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
                >
                  <Plus size={16} /> Werkstroom
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="p-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/dagelijkse-werking')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-4"
        >
          <ChevronLeft size={16} /> Dagelijkse werking
        </button>

        {/* Domain info bar */}
        <div className="bg-white rounded-xl border p-4 mb-5 flex flex-wrap gap-4 items-center">
          {domain.owner && (
            <span className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users size={14} className="text-primary-600" /> <span className="font-medium">Eigenaar:</span> {domain.owner}
            </span>
          )}
          <span className={clsx(
            'text-xs font-medium px-2.5 py-1 rounded-full',
            domain.status === 'actief' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          )}>
            {domain.status === 'actief' ? 'Actief' : 'Gepauzeerd'}
          </span>
          <span className="text-sm text-gray-500">{streams.length} {streams.length === 1 ? 'werkstroom' : 'werkstromen'}</span>
          {isAdmin && (
            <button
              onClick={() => {
                if (confirm(`Werkdomein "${domain.name}" en alle bijhorende data verwijderen?`)) {
                  deleteDomain.mutate(domain.id)
                  navigate('/dagelijkse-werking')
                }
              }}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              <Trash2 size={12} /> Verwijderen
            </button>
          )}
        </div>

        {/* Streams */}
        {streams.length === 0 ? (
          <EmptyState
            title="Geen werkstromen"
            description={isAdmin ? 'Voeg een werkstroom toe om taken te beheren.' : 'Geen werkstromen gevonden.'}
          />
        ) : (
          <div className="space-y-4">
            {streams.map(stream => (
              <StreamPanel
                key={stream.id}
                stream={stream}
                isAdmin={isAdmin}
                currentUserName={currentUserName}
                onEditStream={() => setStreamModal(stream)}
                onDeleteStream={() => {
                  if (confirm(`Werkstroom "${stream.name}" en alle bijhorende taken verwijderen?`)) {
                    deleteStream.mutate({ id: stream.id, domainId: domain.id })
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Domain edit modal */}
      {editDomain && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Werkdomein bewerken</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {[
                { label: 'Naam', value: domain.name, key: 'name' },
                { label: 'Beschrijving', value: domain.description, key: 'description' },
                { label: 'Eigenaar', value: domain.owner, key: 'owner' },
              ].map(({ label, value, key }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    defaultValue={value}
                    id={`edit-${key}`}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={() => setEditDomain(false)} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">
                Annuleren
              </button>
              <button
                onClick={() => {
                  const name = (document.getElementById('edit-name') as HTMLInputElement).value.trim()
                  const description = (document.getElementById('edit-description') as HTMLInputElement).value
                  const owner = (document.getElementById('edit-owner') as HTMLInputElement).value
                  if (name) {
                    saveDomain.mutate({ ...domain, name, description, owner })
                    setEditDomain(false)
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stream modal */}
      {streamModal !== null && (
        <StreamModal
          stream={streamModal === 'new' ? undefined : streamModal}
          domainId={domain.id}
          onSave={data => {
            saveStream.mutate(data)
            setStreamModal(null)
          }}
          onClose={() => setStreamModal(null)}
        />
      )}
    </div>
  )
}
