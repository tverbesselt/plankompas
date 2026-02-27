import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Briefcase, Users, CheckSquare, ChevronRight, Pencil, Trash2, Archive } from 'lucide-react'
import clsx from 'clsx'
import { Header } from '@/presentation/components/layout/Header'
import { PageLoading, EmptyState } from '@/presentation/components/shared/LoadingSpinner'
import {
  useWorkDomains,
  useAllWorkStreams,
  useAllDailyTasks,
  useSaveWorkDomain,
  useDeleteWorkDomain,
} from '@/presentation/hooks/useData'
import { useAuthStore } from '@/presentation/store/uiStore'
import type { WorkDomain, WorkDomainStatus } from '@/domain/types'

// ─── Domain form modal ────────────────────────────────────────────────────────

function DomainModal({
  domain,
  onSave,
  onClose,
}: {
  domain?: WorkDomain
  onSave: (d: Partial<WorkDomain> & { name: string }) => void
  onClose: () => void
}) {
  const [name, setName] = useState(domain?.name ?? '')
  const [description, setDescription] = useState(domain?.description ?? '')
  const [owner, setOwner] = useState(domain?.owner ?? '')
  const [status, setStatus] = useState<WorkDomainStatus>(domain?.status ?? 'actief')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">{domain ? 'Werkdomein bewerken' : 'Nieuw werkdomein'}</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="bv. Professionalisering"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eigenaar</label>
            <input
              value={owner}
              onChange={e => setOwner(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="bv. Sofie Vermeersch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as WorkDomainStatus)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="actief">Actief</option>
              <option value="gepauzeerd">Gepauzeerd</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">
            Annuleren
          </button>
          <button
            onClick={() => {
              if (name.trim()) onSave({ ...domain, name: name.trim(), description, owner, status })
            }}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Domain card ──────────────────────────────────────────────────────────────

function DomainCard({
  domain,
  streamCount,
  taskCounts,
  isAdmin,
  onClick,
  onEdit,
  onDelete,
}: {
  domain: WorkDomain
  streamCount: number
  taskCounts: { nieuw: number; bezig: number; wachtend: number; afgerond: number }
  isAdmin: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const total = taskCounts.nieuw + taskCounts.bezig + taskCounts.wachtend + taskCounts.afgerond
  const progress = total > 0 ? Math.round((taskCounts.afgerond / total) * 100) : 0

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{domain.name}</h3>
              {domain.status === 'gepauzeerd' && (
                <span className="shrink-0 flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  <Archive size={10} /> Gepauzeerd
                </span>
              )}
            </div>
            {domain.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{domain.description}</p>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {domain.owner && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Users size={12} />
            <span>{domain.owner}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Briefcase size={12} />
            {streamCount} {streamCount === 1 ? 'stroom' : 'stromen'}
          </span>
          <span className="flex items-center gap-1">
            <CheckSquare size={12} />
            {total} taken
          </span>
        </div>

        {total > 0 && (
          <>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex gap-3 text-xs">
              {taskCounts.bezig > 0 && <span className="text-blue-600">{taskCounts.bezig} bezig</span>}
              {taskCounts.nieuw > 0 && <span className="text-gray-500">{taskCounts.nieuw} nieuw</span>}
              {taskCounts.wachtend > 0 && <span className="text-yellow-600">{taskCounts.wachtend} wachtend</span>}
              {taskCounts.afgerond > 0 && <span className="text-green-600">{taskCounts.afgerond} afgerond</span>}
            </div>
          </>
        )}
      </div>
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-primary-600 font-medium">
        <span>Bekijk werkdomeinen</span>
        <ChevronRight size={14} />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WorkDomainsPage() {
  const navigate = useNavigate()
  const { data: domains = [], isLoading } = useWorkDomains()
  const { data: allStreams = [] } = useAllWorkStreams()
  const { data: allTasks = [] } = useAllDailyTasks()
  const saveDomain = useSaveWorkDomain()
  const deleteDomain = useDeleteWorkDomain()
  const { currentUserRole } = useAuthStore()
  const isAdmin = currentUserRole === 'admin'

  const [modal, setModal] = useState<WorkDomain | 'new' | null>(null)

  // Build streamId → domainId map
  const streamDomainMap = Object.fromEntries(allStreams.map(s => [s.id, s.domainId]))

  // Per-domain stats
  const domainStats = Object.fromEntries(
    domains.map(d => {
      const domainStreamIds = new Set(allStreams.filter(s => s.domainId === d.id).map(s => s.id))
      const domainTasks = allTasks.filter(t => domainStreamIds.has(t.streamId))
      const streamCount = domainStreamIds.size
      const taskCounts = {
        nieuw: domainTasks.filter(t => t.status === 'nieuw').length,
        bezig: domainTasks.filter(t => t.status === 'bezig').length,
        wachtend: domainTasks.filter(t => t.status === 'wachtend').length,
        afgerond: domainTasks.filter(t => t.status === 'afgerond').length,
      }
      return [d.id, { streamCount, taskCounts }]
    })
  )

  if (isLoading) return <PageLoading />

  return (
    <div>
      <Header
        title="Dagelijkse werking"
        subtitle="Werkdomeinen en operationele taken"
        actions={
          isAdmin ? (
            <button
              onClick={() => setModal('new')}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Plus size={16} /> Werkdomein
            </button>
          ) : undefined
        }
      />

      <div className="p-6">
        {/* Summary bar */}
        {allTasks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Nieuw', count: allTasks.filter(t => t.status === 'nieuw').length, color: 'bg-gray-100 text-gray-700' },
              { label: 'Bezig', count: allTasks.filter(t => t.status === 'bezig').length, color: 'bg-blue-100 text-blue-700' },
              { label: 'Wachtend', count: allTasks.filter(t => t.status === 'wachtend').length, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Afgerond', count: allTasks.filter(t => t.status === 'afgerond').length, color: 'bg-green-100 text-green-700' },
            ].map(({ label, count, color }) => (
              <div key={label} className={clsx('rounded-lg px-4 py-3 text-center', color)}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs font-medium">{label}</div>
              </div>
            ))}
          </div>
        )}

        {domains.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Nog geen werkdomeinen"
            description={isAdmin ? 'Maak je eerste werkdomein aan.' : 'Vraag een beheerder om werkdomeinen aan te maken.'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map(domain => (
              <DomainCard
                key={domain.id}
                domain={domain}
                streamCount={domainStats[domain.id]?.streamCount ?? 0}
                taskCounts={domainStats[domain.id]?.taskCounts ?? { nieuw: 0, bezig: 0, wachtend: 0, afgerond: 0 }}
                isAdmin={isAdmin}
                onClick={() => navigate(`/dagelijkse-werking/${domain.id}`)}
                onEdit={() => setModal(domain)}
                onDelete={() => {
                  if (confirm(`Werkdomein "${domain.name}" en alle bijhorende stromen en taken verwijderen?`)) {
                    deleteDomain.mutate(domain.id)
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <DomainModal
          domain={modal === 'new' ? undefined : modal}
          onSave={data => {
            saveDomain.mutate(data)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
