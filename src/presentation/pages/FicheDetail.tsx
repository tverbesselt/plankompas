import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { FicheView } from '../components/fiches/FicheView'
import { PageLoading } from '../components/shared/LoadingSpinner'
import { useSD, useOD, usePlan } from '../hooks/useData'
import type { FicheScope } from '@/domain/types'

export function FicheDetail() {
  const { planId, scopeType, scopeId } = useParams<{
    planId: string
    scopeType: string
    scopeId: string
  }>()
  const navigate = useNavigate()

  const isSd = scopeType === 'SD'
  const { data: sd, isLoading: loadSD } = useSD(isSd ? (scopeId ?? null) : null)
  const { data: od, isLoading: loadOD } = useOD(!isSd ? (scopeId ?? null) : null)
  const { data: plan } = usePlan(planId ?? null)

  const loading = isSd ? loadSD : loadOD
  const scope = isSd ? sd : od
  const scopeNr = scope?.nr ?? ''
  const scopeTitle = scope?.doel ?? ''

  if (loading) return <PageLoading />
  if (!scope || !planId) return <div className="p-6 text-gray-500">Doelstelling niet gevonden.</div>

  return (
    <div>
      <Header
        title={`Actiefiche – ${scopeType} ${scopeNr}`}
        subtitle={scope.doel}
        actions={
          <button
            onClick={() => navigate(`/plannen/${planId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            Terug naar plan
          </button>
        }
      />
      <div className="p-6">
        <FicheView
          planId={planId}
          scopeType={scopeType as FicheScope}
          scopeId={scopeId ?? ''}
          scopeNr={scopeNr}
          scopeTitle={scopeTitle}
        />
      </div>
    </div>
  )
}
