import { useNavigate } from 'react-router-dom'
import {
  Target,
  Crosshair,
  CheckSquare,
  AlertTriangle,
  UserX,
  TrendingUp,
  Plus,
  FileUp,
  type LucideIcon,
} from 'lucide-react'
import { Header } from '../components/layout/Header'
import { StatusBadge } from '../components/shared/StatusBadge'
import { PageLoading } from '../components/shared/LoadingSpinner'
import { usePlans, useDashboardStats } from '../hooks/useData'
import { useUIStore, useAuthStore } from '../store/uiStore'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export function Dashboard() {
  const navigate = useNavigate()
  const { data: plans = [] } = usePlans()
  const { activePlanId, setActivePlanId } = useUIStore()
  const { currentUserRole } = useAuthStore()
  const isAdmin = currentUserRole === 'admin'
  const activePlan = plans.find(p => p.id === activePlanId) ?? plans[0] ?? null

  const { data: stats, isLoading } = useDashboardStats(activePlan?.id ?? null)

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle={activePlan ? `${activePlan.title} (${activePlan.startYear}–${activePlan.endYear})` : 'Geen actief plan'}
        actions={
          <div className="flex items-center gap-2">
            {plans.length > 1 && (
              <select
                value={activePlanId ?? ''}
                onChange={e => setActivePlanId(e.target.value)}
                className="text-sm rounded border border-gray-300 px-2 py-1.5"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            )}
            {isAdmin && (
              <button
                onClick={() => navigate('/plannen')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus size={14} />
                Nieuw plan
              </button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {!activePlan ? (
          <div className="text-center py-20 text-gray-400">
            <Target size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nog geen actieplan</p>
            <p className="text-sm mt-1 mb-4">
              {isAdmin ? 'Maak een nieuw plan aan om te starten' : 'Vraag een beheerder om een plan aan te maken'}
            </p>
            {isAdmin && (
              <button
                onClick={() => navigate('/plannen')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
              >
                Plan aanmaken
              </button>
            )}
          </div>
        ) : isLoading ? (
          <PageLoading />
        ) : stats ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Target}
                label="Strategische doelstellingen"
                counts={stats.sdCounts}
                total={stats.sds.length}
                color="purple"
              />
              <StatCard
                icon={Crosshair}
                label="Operationele doelstellingen"
                counts={stats.odCounts}
                total={stats.ods.length}
                color="blue"
              />
              <StatCard
                icon={CheckSquare}
                label="Acties"
                counts={stats.actionCounts}
                total={stats.actions.length}
                color="green"
              />
              <div className="bg-white rounded-xl border p-4 space-y-2">
                <div className="flex items-center gap-2 text-orange-500 mb-1">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-semibold text-gray-700">Signalen</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Achterstallig</span>
                  <span className={`font-bold ${stats.overdue.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.overdue.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Zonder eigenaar</span>
                  <span className={`font-bold ${stats.noOwner.length > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {stats.noOwner.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {stats.overdue.length > 0 && (
              <AlertPanel
                title="Achterstallige acties"
                icon={AlertTriangle}
                color="red"
                items={stats.overdue.map(a => ({
                  id: a.id,
                  label: a.title,
                  sub: `Einddatum: ${a.adjustedEndDate || a.endDate} · ${a.verantwoordelijke}`,
                  status: a.status,
                }))}
              />
            )}

            {stats.noOwner.length > 0 && (
              <AlertPanel
                title="Acties zonder verantwoordelijke"
                icon={UserX}
                color="orange"
                items={stats.noOwner.map(a => ({
                  id: a.id,
                  label: a.title,
                  sub: a.endDate ? `Einddatum: ${a.endDate}` : 'Geen einddatum',
                  status: a.status,
                }))}
              />
            )}

            {/* Quick actions */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-500" />
                Snelle acties
              </h3>
              <div className="flex flex-wrap gap-3">
                <QuickAction
                  label="Plan bekijken"
                  icon={Target}
                  onClick={() => navigate(`/plannen/${activePlan.id}`)}
                />
                <QuickAction
                  label="Rapporten"
                  icon={TrendingUp}
                  onClick={() => navigate('/rapporten')}
                />
                <QuickAction
                  label="Excel importeren"
                  icon={FileUp}
                  onClick={() => navigate('/import-export')}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  counts,
  total,
  color,
}: {
  icon: LucideIcon
  label: string
  counts: { niet_gestart: number; in_uitvoering: number; afgerond: number; uitgesteld: number }
  total: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    purple: 'text-purple-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
  }
  const progress = total > 0 ? Math.round((counts.afgerond / total) * 100) : 0

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className={colorMap[color]} />
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{total}</div>
      <div className="space-y-1 text-xs">
        <StatRow label="Niet gestart" value={counts.niet_gestart} color="text-gray-500" />
        <StatRow label="In uitvoering" value={counts.in_uitvoering} color="text-blue-600" />
        <StatRow label="Afgerond" value={counts.afgerond} color="text-green-600" />
        <StatRow label="Uitgesteld" value={counts.uitgesteld} color="text-yellow-600" />
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Voortgang</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function AlertPanel({
  title,
  icon: Icon,
  color,
  items,
}: {
  title: string
  icon: LucideIcon
  color: 'red' | 'orange'
  items: { id: string; label: string; sub: string; status: string }[]
}) {
  const colors = {
    red: { border: 'border-red-200', bg: 'bg-red-50', icon: 'text-red-500', title: 'text-red-800' },
    orange: { border: 'border-orange-200', bg: 'bg-orange-50', icon: 'text-orange-500', title: 'text-orange-800' },
  }
  const c = colors[color]

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <h3 className={`font-semibold ${c.title} flex items-center gap-2 mb-3`}>
        <Icon size={16} className={c.icon} />
        {title} ({items.length})
      </h3>
      <div className="space-y-2">
        {items.slice(0, 5).map(item => (
          <div key={item.id} className="flex items-start justify-between bg-white rounded p-2.5">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
            </div>
            <StatusBadge status={item.status as never} size="sm" />
          </div>
        ))}
        {items.length > 5 && (
          <p className="text-xs text-gray-500 text-center">+{items.length - 5} meer</p>
        )}
      </div>
    </div>
  )
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
