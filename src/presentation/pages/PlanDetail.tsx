import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, List, GitBranch, FileDown, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { Header } from '../components/layout/Header'
import { TreeView } from '../components/plans/TreeView'
import { TableView } from '../components/plans/TableView'
import { PageLoading } from '../components/shared/LoadingSpinner'
import { usePlan, useSDs, useODs, useActions } from '../hooks/useData'
import { useUIStore } from '../store/uiStore'
import { exportActionPlan } from '@/infrastructure/excel/ExcelService'

export function PlanDetail() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { viewMode, setViewMode } = useUIStore()

  const { data: plan, isLoading } = usePlan(planId ?? null)
  const { data: sds = [] } = useSDs(planId ?? null)
  const { data: ods = [] } = useODs(planId ?? null)
  const { data: actions = [] } = useActions(planId ?? null)

  if (isLoading) return <PageLoading />
  if (!plan) return <div className="p-6 text-gray-500">Plan niet gevonden.</div>

  const handleExport = () => {
    exportActionPlan({ planTitle: plan.title, sds, ods, actions })
  }

  return (
    <div>
      <Header
        title={plan.title}
        subtitle={`${plan.startYear} – ${plan.endYear}`}
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <ViewToggle
                active={viewMode === 'tree'}
                icon={GitBranch}
                label="Boom"
                onClick={() => setViewMode('tree')}
              />
              <ViewToggle
                active={viewMode === 'table'}
                icon={List}
                label="Tabel"
                onClick={() => setViewMode('table')}
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FileDown size={14} />
              Excel
            </button>
            <button
              onClick={() => navigate('/plannen')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft size={14} />
              Terug
            </button>
          </div>
        }
      />

      <div className="p-6">
        {viewMode === 'tree' ? (
          <TreeView planId={plan.id} />
        ) : (
          <TableView planId={plan.id} />
        )}
      </div>
    </div>
  )
}

function ViewToggle({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
