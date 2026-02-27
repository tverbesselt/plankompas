import { useState } from 'react'
import { BarChart3, FileDown, Briefcase } from 'lucide-react'
import clsx from 'clsx'
import { Header } from '../components/layout/Header'
import { StatusBadge } from '../components/shared/StatusBadge'
import { PageLoading } from '../components/shared/LoadingSpinner'
import { usePlans, useDashboardStats, useWorkDomains, useAllWorkStreams, useAllDailyTasks } from '../hooks/useData'
import { useUIStore } from '../store/uiStore'
import { STATUS_LABELS, DAILY_TASK_STATUS_LABELS, DAILY_TASK_STATUS_COLORS } from '@/domain/types'
import type { ObjectiveStatus, DailyTaskStatus } from '@/domain/types'
import * as XLSX from 'xlsx'

const STATUSES: ObjectiveStatus[] = ['niet_gestart', 'in_uitvoering', 'afgerond', 'uitgesteld', 'geannuleerd']
const TASK_STATUSES: DailyTaskStatus[] = ['nieuw', 'bezig', 'wachtend', 'afgerond']

export function Reports() {
  const { data: plans = [] } = usePlans()
  const { activePlanId, setActivePlanId } = useUIStore()
  const activePlan = plans.find(p => p.id === activePlanId) ?? plans[0] ?? null

  const { data: stats, isLoading } = useDashboardStats(activePlan?.id ?? null)
  const [reportType, setReportType] = useState<'status' | 'owner' | 'gantt' | 'dagelijkse-werking'>('status')

  const handleExport = () => {
    if (!stats) return
    const wb = XLSX.utils.book_new()

    // Status overview
    const rows: unknown[][] = [
      ['Statusrapport – ' + (activePlan?.title ?? '')],
      [],
      ['Type', 'NR', 'Titel', 'Status', 'Verantwoordelijke', 'Einde'],
    ]
    for (const sd of stats.sds) {
      rows.push(['SD', sd.nr, sd.doel, STATUS_LABELS[sd.status], sd.verantwoordelijken.join(', '), sd.adjustedEndDate || sd.endDate])
    }
    for (const od of stats.ods) {
      rows.push(['OD', od.nr, od.doel, STATUS_LABELS[od.status], od.verantwoordelijken.join(', '), od.adjustedEndDate || od.endDate])
    }
    for (const a of stats.actions) {
      rows.push(['Actie', '', a.title, STATUS_LABELS[a.status], a.verantwoordelijke, a.adjustedEndDate || a.endDate])
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows as string[][]), 'Statusrapport')
    XLSX.writeFile(wb, `Rapport_${activePlan?.title?.replace(/[^a-z0-9]/gi, '_') ?? 'export'}.xlsx`)
  }

  return (
    <div>
      <Header
        title="Rapporten"
        actions={
          <div className="flex gap-2">
            {plans.length > 1 && (
              <select
                value={activePlanId ?? ''}
                onChange={e => setActivePlanId(e.target.value)}
                className="text-sm rounded border border-gray-300 px-2 py-1.5"
              >
                {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
            <button
              onClick={handleExport}
              disabled={!stats}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown size={14} />
              Excel
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Report type selector */}
        <div className="flex flex-wrap gap-2">
          {([
            ['status', 'Statusoverzicht'],
            ['owner', 'Per verantwoordelijke'],
            ['gantt', 'Tijdlijn (Gantt)'],
            ['dagelijkse-werking', 'Dagelijkse werking'],
          ] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              className={clsx(
                'px-4 py-2 text-sm rounded-lg font-medium transition-colors',
                reportType === t ? 'bg-primary-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {reportType === 'dagelijkse-werking' ? (
          <DailyWorkReport />
        ) : isLoading ? <PageLoading /> : !stats ? (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
            <p>Geen data beschikbaar</p>
          </div>
        ) : (
          <>
            {reportType === 'status' && <StatusReport stats={stats} />}
            {reportType === 'owner' && <OwnerReport stats={stats} />}
            {reportType === 'gantt' && <GanttReport stats={stats} />}
          </>
        )}
      </div>
    </div>
  )
}

function StatusReport({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>['data']> }) {
  return (
    <div className="space-y-4">
      {/* Summary bars */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'SD', items: stats.sds },
          { label: 'OD', items: stats.ods },
          { label: 'Acties', items: stats.actions },
        ].map(({ label, items }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">{label} ({items.length})</h3>
            {STATUSES.map(s => {
              const count = items.filter(i => i.status === s).length
              const pct = items.length > 0 ? (count / items.length) * 100 : 0
              return (
                <div key={s} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{STATUS_LABELS[s]}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusBarColor(s)}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* SD Detail table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Detail per SD</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['NR', 'Pijler', 'Doel', 'Verantwoordelijken', '# OD', '# Acties', '% Afgerond', 'Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.sds.map(sd => {
                const sdOds = stats.ods.filter(o => o.sdId === sd.id)
                const sdActions = stats.actions.filter(a => sdOds.some(o => o.id === a.odId))
                const done = sdActions.filter(a => a.status === 'afgerond').length
                const pct = sdActions.length > 0 ? Math.round((done / sdActions.length) * 100) : 0
                return (
                  <tr key={sd.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold text-primary-700">{sd.nr}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{sd.pijler}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{sd.doel}</td>
                    <td className="px-3 py-2 text-gray-600">{sd.verantwoordelijken.join(', ')}</td>
                    <td className="px-3 py-2 text-center">{sdOds.length}</td>
                    <td className="px-3 py-2 text-center">{sdActions.length}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={sd.status} size="sm" /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function OwnerReport({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>['data']> }) {
  const owners = [...new Set(stats.actions.map(a => a.verantwoordelijke).filter(Boolean))]

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {owners.map(owner => {
        const ownerActions = stats.actions.filter(a => a.verantwoordelijke === owner)
        const today = new Date().toISOString().slice(0, 10)
        const overdue = ownerActions.filter(a => {
          const end = a.adjustedEndDate || a.endDate
          return end && end < today && a.status !== 'afgerond'
        })
        return (
          <div key={owner} className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">{owner}</h3>
              <span className="text-xs text-gray-500">{ownerActions.length} acties</span>
            </div>
            {overdue.length > 0 && (
              <p className="text-xs text-red-600 mb-2">⚠ {overdue.length} achterstallig</p>
            )}
            <div className="space-y-1">
              {ownerActions.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-gray-700 flex-1 mr-2">{a.title}</span>
                  <StatusBadge status={a.status} size="sm" />
                </div>
              ))}
              {ownerActions.length > 6 && (
                <p className="text-xs text-gray-400">+{ownerActions.length - 6} meer</p>
              )}
            </div>
          </div>
        )
      })}
      {owners.length === 0 && (
        <div className="col-span-2 text-center py-10 text-gray-400">Geen verantwoordelijken gevonden</div>
      )}
    </div>
  )
}

function GanttReport({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>['data']> }) {
  // Simple visual Gantt – shows SDs and ODs with date bars
  const allDates = [...stats.sds, ...stats.ods]
    .flatMap(item => [item.startDate, item.endDate, item.adjustedEndDate])
    .filter(Boolean)
  if (allDates.length === 0) return <div className="text-center py-10 text-gray-400">Geen datums beschikbaar</div>

  const minDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())))
  const totalDays = Math.max((maxDate.getTime() - minDate.getTime()) / 86400000, 1)

  function pct(date: string) {
    if (!date) return 0
    return Math.min(100, Math.max(0, ((new Date(date).getTime() - minDate.getTime()) / 86400000 / totalDays) * 100))
  }
  function width(start: string, end: string) {
    if (!start || !end) return 0
    return Math.min(100 - pct(start), Math.max(2, ((new Date(end).getTime() - new Date(start).getTime()) / 86400000 / totalDays) * 100))
  }

  const sdColors: Record<string, string> = {}
  const palette = ['bg-purple-400', 'bg-blue-400', 'bg-teal-400', 'bg-indigo-400', 'bg-pink-400']
  stats.sds.forEach((sd, i) => { sdColors[sd.id] = palette[i % palette.length] })

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-5 py-3 border-b bg-gray-50 flex justify-between text-xs text-gray-500">
        <span>{minDate.toLocaleDateString('nl-BE')}</span>
        <span className="font-semibold text-gray-700">Tijdlijn</span>
        <span>{maxDate.toLocaleDateString('nl-BE')}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {stats.sds.map(sd => {
          const sdOds = stats.ods.filter(o => o.sdId === sd.id)
          return (
            <div key={sd.id}>
              {/* SD bar */}
              <div className="flex items-center px-4 py-2 gap-3">
                <span className="text-xs font-bold text-primary-700 w-10 shrink-0">{sd.nr}</span>
                <span className="text-xs text-gray-700 w-48 shrink-0 truncate">{sd.doel}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded relative">
                  <div
                    className={`absolute top-0.5 h-4 rounded ${sdColors[sd.id]} opacity-80`}
                    style={{ left: `${pct(sd.startDate)}%`, width: `${width(sd.startDate, sd.adjustedEndDate || sd.endDate)}%` }}
                  />
                </div>
              </div>
              {/* OD bars */}
              {sdOds.map(od => (
                <div key={od.id} className="flex items-center px-4 py-1.5 gap-3 pl-14 bg-gray-50">
                  <span className="text-xs text-blue-600 w-10 shrink-0">{od.nr}</span>
                  <span className="text-xs text-gray-600 w-40 shrink-0 truncate">{od.doel}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded relative">
                    <div
                      className="absolute top-0.5 h-3 rounded bg-blue-300 opacity-80"
                      style={{ left: `${pct(od.startDate)}%`, width: `${width(od.startDate, od.adjustedEndDate || od.endDate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function statusBarColor(s: ObjectiveStatus): string {
  const map: Record<ObjectiveStatus, string> = {
    niet_gestart: 'bg-gray-300',
    in_uitvoering: 'bg-blue-400',
    afgerond: 'bg-green-400',
    uitgesteld: 'bg-yellow-400',
    geannuleerd: 'bg-red-400',
  }
  return map[s]
}

function DailyWorkReport() {
  const { data: domains = [], isLoading: loadingDomains } = useWorkDomains()
  const { data: allStreams = [] } = useAllWorkStreams()
  const { data: allTasks = [] } = useAllDailyTasks()

  if (loadingDomains) return <PageLoading />

  const today = new Date().toISOString().slice(0, 10)
  const overdueTasks = allTasks.filter(t => t.deadline && t.deadline < today && t.status !== 'afgerond')

  // Per-domain stats
  const domainStats = domains.map(domain => {
    const domainStreamIds = new Set(allStreams.filter(s => s.domainId === domain.id).map(s => s.id))
    const tasks = allTasks.filter(t => domainStreamIds.has(t.streamId))
    const streamCount = domainStreamIds.size
    return { domain, streamCount, tasks }
  })

  // Capacity per person
  const personMap: Record<string, { bezig: number; nieuw: number; wachtend: number; total: number }> = {}
  for (const task of allTasks) {
    for (const name of task.assignees) {
      if (!personMap[name]) personMap[name] = { bezig: 0, nieuw: 0, wachtend: 0, total: 0 }
      personMap[name].total++
      if (task.status === 'bezig') personMap[name].bezig++
      else if (task.status === 'nieuw') personMap[name].nieuw++
      else if (task.status === 'wachtend') personMap[name].wachtend++
    }
  }
  const people = Object.entries(personMap).sort((a, b) => b[1].total - a[1].total)

  if (domains.length === 0) return (
    <div className="text-center py-16 text-gray-400">
      <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
      <p>Geen werkdomeinen beschikbaar</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TASK_STATUSES.map(status => (
          <div key={status} className={clsx('rounded-xl px-4 py-3 text-center', DAILY_TASK_STATUS_COLORS[status])}>
            <div className="text-2xl font-bold">{allTasks.filter(t => t.status === status).length}</div>
            <div className="text-xs font-medium">{DAILY_TASK_STATUS_LABELS[status]}</div>
          </div>
        ))}
      </div>

      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          ⚠ <strong>{overdueTasks.length}</strong> {overdueTasks.length === 1 ? 'taak is' : 'taken zijn'} vervallen (deadline overschreden)
        </div>
      )}

      {/* Per domain */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Overzicht per werkdomein</h3>
        </div>
        <div className="divide-y">
          {domainStats.map(({ domain, streamCount, tasks }) => {
            const total = tasks.length
            const done = tasks.filter(t => t.status === 'afgerond').length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            return (
              <div key={domain.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{domain.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{streamCount} stromen · {total} taken</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{pct}% afgerond</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  {TASK_STATUSES.map(s => {
                    const cnt = tasks.filter(t => t.status === s).length
                    return cnt > 0 ? (
                      <span key={s} className={clsx('px-1.5 py-0.5 rounded', DAILY_TASK_STATUS_COLORS[s])}>
                        {DAILY_TASK_STATUS_LABELS[s]}: {cnt}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Capacity per person */}
      {people.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Capaciteit per medewerker</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Naam', 'Bezig', 'Nieuw', 'Wachtend', 'Totaal'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {people.map(([name, c]) => (
                <tr key={name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{name}</td>
                  <td className="px-4 py-2.5">
                    {c.bezig > 0 ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.bezig}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {c.nieuw > 0 ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c.nieuw}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {c.wachtend > 0 ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{c.wachtend}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700">{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
