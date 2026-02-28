import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Users, Briefcase, CheckSquare, FolderOpen, User, LayoutDashboard } from 'lucide-react'
import clsx from 'clsx'
import {
  usePlans,
  useUsers,
  useAllDailyTasks,
  useWorkDomains,
  useAllWorkStreams,
  useSDs,
  useODs,
  useActions,
} from '@/presentation/hooks/useData'
import { useUIStore } from '@/presentation/store/uiStore'
import { STATUS_LABELS, DAILY_TASK_STATUS_LABELS } from '@/domain/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string
  category: string
  categoryIcon: React.ElementType
  title: string
  subtitle: string
  href: string
  highlight?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matches(q: string, ...fields: (string | string[] | undefined)[]): boolean {
  const lower = q.toLowerCase()
  for (const field of fields) {
    if (!field) continue
    if (Array.isArray(field)) {
      if (field.some(f => f.toLowerCase().includes(lower))) return true
    } else {
      if (field.toLowerCase().includes(lower)) return true
    }
  }
  return false
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { activePlanId } = useUIStore()

  // Data hooks
  const { data: plans = [] } = usePlans()
  const { data: users = [] } = useUsers()
  const { data: allTasks = [] } = useAllDailyTasks()
  const { data: workDomains = [] } = useWorkDomains()
  const { data: allStreams = [] } = useAllWorkStreams()
  const { data: sds = [] } = useSDs(activePlanId)
  const { data: ods = [] } = useODs(activePlanId)
  const { data: actions = [] } = useActions(activePlanId)

  // Build lookup maps
  const streamMap = Object.fromEntries(allStreams.map(s => [s.id, s]))
  const domainMap = Object.fromEntries(workDomains.map(d => [d.id, d]))
  const planMap = Object.fromEntries(plans.map(p => [p.id, p]))

  // Open/close
  const openSearch = useCallback(() => {
    setOpen(true)
    setQuery('')
  }, [])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (open) closeSearch()
        else openSearch()
      }
      if (e.key === 'Escape' && open) {
        closeSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, openSearch, closeSearch])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // ─── Build results ──────────────────────────────────────────────────────────

  const results: SearchResult[] = []
  const q = query.trim()

  if (q.length >= 2) {
    // Plans
    for (const plan of plans) {
      if (matches(q, plan.title, plan.description)) {
        results.push({
          id: plan.id,
          category: 'Actieplannen',
          categoryIcon: FolderOpen,
          title: plan.title,
          subtitle: `${plan.startYear}–${plan.endYear}`,
          href: `/plannen/${plan.id}`,
        })
      }
    }

    // Users
    for (const user of users) {
      if (matches(q, user.name, user.email)) {
        results.push({
          id: user.id,
          category: 'Gebruikers',
          categoryIcon: User,
          title: user.name,
          subtitle: user.email,
          href: '/beheer',
          highlight: user.name,
        })
      }
    }

    // Strategic Objectives (SDs) in active plan
    for (const sd of sds) {
      if (matches(q, sd.doel, sd.pijler, sd.dienst, sd.probleem, sd.verantwoordelijken, sd.uitvoerders)) {
        const plan = planMap[sd.planId]
        results.push({
          id: sd.id,
          category: `SD's (${plan?.title ?? ''})`,
          categoryIcon: LayoutDashboard,
          title: `SD ${sd.nr}: ${sd.doel}`,
          subtitle: [
            sd.verantwoordelijken.join(', '),
            STATUS_LABELS[sd.status],
          ].filter(Boolean).join(' · '),
          href: `/plannen/${sd.planId}`,
          highlight: sd.verantwoordelijken.filter(v => v.toLowerCase().includes(q.toLowerCase())).join(', '),
        })
      }
    }

    // Operational Objectives (ODs) in active plan
    for (const od of ods) {
      if (matches(q, od.doel, od.probleem, od.verantwoordelijken, od.uitvoerders)) {
        const plan = planMap[od.planId]
        results.push({
          id: od.id,
          category: `OD's (${plan?.title ?? ''})`,
          categoryIcon: LayoutDashboard,
          title: `OD ${od.nr}: ${od.doel}`,
          subtitle: [
            od.verantwoordelijken.join(', '),
            STATUS_LABELS[od.status],
          ].filter(Boolean).join(' · '),
          href: `/plannen/${od.planId}`,
          highlight: od.verantwoordelijken.filter(v => v.toLowerCase().includes(q.toLowerCase())).join(', '),
        })
      }
    }

    // Actions in active plan
    for (const action of actions) {
      if (matches(q, action.title, action.verantwoordelijke, action.uitvoerders, action.opmerkingen)) {
        const plan = planMap[action.planId]
        results.push({
          id: action.id,
          category: `Acties (${plan?.title ?? ''})`,
          categoryIcon: FolderOpen,
          title: action.title,
          subtitle: [
            action.verantwoordelijke,
            STATUS_LABELS[action.status],
          ].filter(Boolean).join(' · '),
          href: `/plannen/${action.planId}`,
          highlight: action.verantwoordelijke.toLowerCase().includes(q.toLowerCase())
            ? action.verantwoordelijke : undefined,
        })
      }
    }

    // Work Domains
    for (const domain of workDomains) {
      if (matches(q, domain.name, domain.owner, domain.description)) {
        results.push({
          id: domain.id,
          category: 'Werkdomeinen',
          categoryIcon: Briefcase,
          title: domain.name,
          subtitle: domain.owner ? `Eigenaar: ${domain.owner}` : '',
          href: `/dagelijkse-werking/${domain.id}`,
          highlight: domain.owner.toLowerCase().includes(q.toLowerCase()) ? domain.owner : undefined,
        })
      }
    }

    // Work Streams
    for (const stream of allStreams) {
      if (matches(q, stream.name, stream.verantwoordelijke)) {
        const domain = domainMap[stream.domainId]
        results.push({
          id: stream.id,
          category: 'Werkstromen',
          categoryIcon: Briefcase,
          title: stream.name,
          subtitle: [
            domain?.name,
            stream.verantwoordelijke ? `Verantwoordelijke: ${stream.verantwoordelijke}` : '',
          ].filter(Boolean).join(' · '),
          href: `/dagelijkse-werking/${stream.domainId}`,
          highlight: stream.verantwoordelijke.toLowerCase().includes(q.toLowerCase())
            ? stream.verantwoordelijke : undefined,
        })
      }
    }

    // Daily Tasks
    for (const task of allTasks) {
      if (matches(q, task.title, task.description, task.assignees, task.notes)) {
        const stream = streamMap[task.streamId]
        const domain = stream ? domainMap[stream.domainId] : undefined
        results.push({
          id: task.id,
          category: 'Dagelijkse taken',
          categoryIcon: CheckSquare,
          title: task.title,
          subtitle: [
            task.assignees.join(', '),
            DAILY_TASK_STATUS_LABELS[task.status],
            domain?.name,
          ].filter(Boolean).join(' · '),
          href: domain ? `/dagelijkse-werking/${domain.id}` : '/dagelijkse-werking',
          highlight: task.assignees.filter(a => a.toLowerCase().includes(q.toLowerCase())).join(', '),
        })
      }
    }
  }

  // Group by category
  const grouped: Record<string, SearchResult[]> = {}
  for (const r of results) {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category].push(r)
  }

  function handleSelect(href: string) {
    navigate(href)
    closeSearch()
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openSearch}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
        title="Zoeken (Ctrl+K)"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Zoeken...</span>
        <span className="hidden sm:inline text-xs bg-white border rounded px-1 py-0.5 font-mono text-gray-400 ml-1">Ctrl K</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeSearch() }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Zoek op naam, taak, plan, gebruiker..."
                className="flex-1 text-base outline-none text-gray-800 placeholder-gray-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              <button
                onClick={closeSearch}
                className="text-xs text-gray-400 border rounded px-1.5 py-0.5 font-mono hover:bg-gray-100"
              >
                Esc
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1">
              {q.length < 2 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  Typ minimaal 2 tekens om te zoeken
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Geen resultaten gevonden voor <strong>"{q}"</strong>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b">
                      {category} ({items.length})
                    </div>
                    {items.map(item => {
                      const Icon = item.categoryIcon
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.href)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 text-left border-b last:border-b-0 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-primary-100">
                            <Icon size={15} className="text-gray-500 group-hover:text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              <HighlightText text={item.title} query={q} />
                            </p>
                            {item.subtitle && (
                              <p className="text-xs text-gray-400 truncate">
                                <HighlightText text={item.subtitle} query={q} />
                              </p>
                            )}
                          </div>
                          {item.highlight && item.highlight !== item.title && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full shrink-0">
                              {item.highlight}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {results.length > 0 && (
              <div className="px-4 py-2 border-t bg-gray-50 flex justify-between text-xs text-gray-400">
                <span>{results.length} resultaten</span>
                <span>↵ om te openen · Esc om te sluiten</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Highlight matching text ──────────────────────────────────────────────────

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}
