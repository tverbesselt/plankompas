import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Target,
  Crosshair,
  CheckSquare,
  Plus,
  Pencil,
  Trash2,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '../shared/StatusBadge'
import { Modal } from '../shared/Modal'
import { ConfirmDialog } from '../shared/Modal'
import { SDForm } from './SDForm'
import { ODForm } from './ODForm'
import { ActionForm } from './ActionForm'
import {
  useSDs,
  useODs,
  useActions,
  useSaveSD,
  useSaveOD,
  useSaveAction,
  useDeleteSD,
  useDeleteOD,
  useDeleteAction,
} from '@/presentation/hooks/useData'
import type { StrategicObjective, OperationalObjective, Action } from '@/domain/types'
import { PageLoading } from '../shared/LoadingSpinner'

interface Props {
  planId: string
}

export function TreeView({ planId }: Props) {
  const { data: sds = [], isLoading: loadingSDs } = useSDs(planId)
  const { data: ods = [] } = useODs(planId)
  const { data: actions = [] } = useActions(planId)

  const saveSD = useSaveSD()
  const saveOD = useSaveOD()
  const saveAction = useSaveAction()
  const deleteSD = useDeleteSD()
  const deleteOD = useDeleteOD()
  const deleteAction = useDeleteAction()

  const navigate = useNavigate()

  const [expandedSDs, setExpandedSDs] = useState<Set<string>>(new Set(sds.map(s => s.id)))
  const [expandedODs, setExpandedODs] = useState<Set<string>>(new Set())

  const [modal, setModal] = useState<{
    type: 'new-sd' | 'edit-sd' | 'new-od' | 'edit-od' | 'new-action' | 'edit-action'
    sd?: StrategicObjective
    od?: OperationalObjective
    action?: Action
  } | null>(null)

  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)

  if (loadingSDs) return <PageLoading />

  const toggleSD = (id: string) => {
    setExpandedSDs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleOD = (id: string) => {
    setExpandedODs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 text-sm text-gray-500">
          <span>{sds.length} SD</span>
          <span>·</span>
          <span>{ods.length} OD</span>
          <span>·</span>
          <span>{actions.length} Acties</span>
        </div>
        <button
          onClick={() => setModal({ type: 'new-sd' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={14} />
          Nieuwe SD
        </button>
      </div>

      {sds.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Target size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Geen strategische doelstellingen</p>
          <p className="text-sm mt-1">Klik op "Nieuwe SD" om te starten</p>
        </div>
      )}

      {/* Tree */}
      <div className="space-y-2">
        {sds.map(sd => {
          const sdODs = ods.filter(o => o.sdId === sd.id)
          const isExpanded = expandedSDs.has(sd.id)

          return (
            <div key={sd.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              {/* SD Row */}
              <div
                className="flex items-center gap-2 px-4 py-3 bg-primary-50 border-b border-primary-100 cursor-pointer group"
                onClick={() => toggleSD(sd.id)}
              >
                <button className="text-primary-400 shrink-0">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <Target size={16} className="text-primary-600 shrink-0" />
                <span className="text-xs font-bold text-primary-700 w-6 shrink-0">{sd.nr}</span>
                <span className="font-medium text-sm text-gray-900 flex-1 truncate">{sd.doel || '(geen doel)'}</span>
                <span className="text-xs text-gray-400 hidden sm:block mr-2">{sd.pijler}</span>
                <StatusBadge status={sd.status} size="sm" />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2" onClick={e => e.stopPropagation()}>
                  <ActionButton icon={FileText} onClick={() => navigate(`/plannen/${planId}/fiche/SD/${sd.id}`)} title="Actiefiche" />
                  <ActionButton icon={Plus} onClick={() => setModal({ type: 'new-od', sd })} title="Nieuwe OD" />
                  <ActionButton icon={Pencil} onClick={() => setModal({ type: 'edit-sd', sd })} title="Bewerken" />
                  <ActionButton
                    icon={Trash2}
                    danger
                    onClick={() => setConfirm({
                      message: `SD ${sd.nr} en alle onderliggende OD's en acties verwijderen?`,
                      onConfirm: () => deleteSD.mutate({ id: sd.id, planId }),
                    })}
                    title="Verwijderen"
                  />
                </div>
              </div>

              {/* ODs */}
              {isExpanded && (
                <div>
                  {sdODs.length === 0 && (
                    <div className="px-12 py-3 text-sm text-gray-400 italic">Geen operationele doelstellingen</div>
                  )}
                  {sdODs.map(od => {
                    const odActions = actions.filter(a => a.odId === od.id)
                    const isOdExpanded = expandedODs.has(od.id)
                    return (
                      <div key={od.id}>
                        {/* OD Row */}
                        <div
                          className="flex items-center gap-2 px-4 py-2.5 pl-10 bg-gray-50 border-b border-gray-100 cursor-pointer group"
                          onClick={() => toggleOD(od.id)}
                        >
                          <button className="text-gray-400 shrink-0">
                            {isOdExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <Crosshair size={14} className="text-blue-500 shrink-0" />
                          <span className="text-xs font-semibold text-blue-600 w-8 shrink-0">{od.nr}</span>
                          <span className="text-sm text-gray-800 flex-1 truncate">{od.doel || '(geen doel)'}</span>
                          <StatusBadge status={od.status} size="sm" />
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2" onClick={e => e.stopPropagation()}>
                            <ActionButton icon={FileText} onClick={() => navigate(`/plannen/${planId}/fiche/OD/${od.id}`)} title="Actiefiche" />
                            <ActionButton icon={Plus} onClick={() => setModal({ type: 'new-action', od })} title="Nieuwe actie" />
                            <ActionButton icon={Pencil} onClick={() => setModal({ type: 'edit-od', od, sd })} title="Bewerken" />
                            <ActionButton
                              icon={Trash2}
                              danger
                              onClick={() => setConfirm({
                                message: `OD ${od.nr} en alle acties verwijderen?`,
                                onConfirm: () => deleteOD.mutate({ id: od.id, planId, sdId: od.sdId }),
                              })}
                              title="Verwijderen"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        {isOdExpanded && (
                          <div>
                            {odActions.length === 0 && (
                              <div className="px-16 py-2 text-sm text-gray-400 italic">Geen acties</div>
                            )}
                            {odActions.map(action => (
                              <div
                                key={action.id}
                                className="flex items-center gap-2 px-4 py-2 pl-16 border-b border-gray-100 hover:bg-gray-50 group"
                              >
                                <CheckSquare size={13} className="text-green-500 shrink-0" />
                                <span className="text-sm text-gray-700 flex-1 truncate">{action.title}</span>
                                <span className="text-xs text-gray-400 hidden md:block">{action.verantwoordelijke}</span>
                                <span className="text-xs text-gray-400 hidden lg:block">
                                  {action.adjustedEndDate || action.endDate}
                                </span>
                                <StatusBadge status={action.status} size="sm" />
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                  <ActionButton icon={Pencil} onClick={() => setModal({ type: 'edit-action', action, od })} title="Bewerken" />
                                  <ActionButton
                                    icon={Trash2}
                                    danger
                                    onClick={() => setConfirm({
                                      message: `Actie "${action.title}" verwijderen?`,
                                      onConfirm: () => deleteAction.mutate({ id: action.id, planId, odId: od.id }),
                                    })}
                                    title="Verwijderen"
                                  />
                                </div>
                              </div>
                            ))}
                            <div
                              className="flex items-center gap-2 px-4 py-2 pl-16 text-sm text-primary-600 cursor-pointer hover:bg-primary-50"
                              onClick={() => setModal({ type: 'new-action', od })}
                            >
                              <Plus size={13} />
                              Actie toevoegen
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div
                    className="flex items-center gap-2 px-4 py-2 pl-10 text-sm text-blue-600 cursor-pointer hover:bg-blue-50"
                    onClick={() => setModal({ type: 'new-od', sd })}
                  >
                    <Plus size={13} />
                    OD toevoegen
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modals */}
      <Modal
        open={modal?.type === 'new-sd' || modal?.type === 'edit-sd'}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit-sd' ? `SD ${modal.sd?.nr} bewerken` : 'Nieuwe strategische doelstelling'}
        size="lg"
      >
        <SDForm
          initial={modal?.sd}
          onCancel={() => setModal(null)}
          loading={saveSD.isPending}
          onSubmit={data => {
            saveSD.mutate(
              modal?.sd ? { ...modal.sd, ...data } : { ...data, planId },
              { onSuccess: () => setModal(null) }
            )
          }}
        />
      </Modal>

      <Modal
        open={modal?.type === 'new-od' || modal?.type === 'edit-od'}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit-od' ? `OD ${modal.od?.nr} bewerken` : `Nieuwe OD onder SD ${modal?.sd?.nr}`}
        size="lg"
      >
        {modal?.sd || modal?.od ? (
          <ODForm
            initial={modal?.od}
            sdNr={modal?.sd?.nr}
            onCancel={() => setModal(null)}
            loading={saveOD.isPending}
            onSubmit={data => {
              const sdId = modal?.od?.sdId ?? modal?.sd?.id ?? ''
              saveOD.mutate(
                modal?.od ? { ...modal.od, ...data } : { ...data, planId, sdId },
                { onSuccess: () => setModal(null) }
              )
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={modal?.type === 'new-action' || modal?.type === 'edit-action'}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit-action' ? 'Actie bewerken' : `Nieuwe actie onder OD ${modal?.od?.nr}`}
        size="md"
      >
        {modal?.od ? (
          <ActionForm
            initial={modal?.action}
            onCancel={() => setModal(null)}
            loading={saveAction.isPending}
            onSubmit={data => {
              const odId = modal?.action?.odId ?? modal?.od?.id ?? ''
              saveAction.mutate(
                modal?.action ? { ...modal.action, ...data } : { ...data, planId, odId },
                { onSuccess: () => setModal(null) }
              )
            }}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Bevestig verwijdering"
        message={confirm?.message ?? ''}
        confirmLabel="Verwijderen"
        danger
        onConfirm={() => { confirm?.onConfirm(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

function ActionButton({
  icon: Icon,
  onClick,
  title,
  danger,
}: {
  icon: LucideIcon
  onClick: () => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={clsx(
        'p-1 rounded hover:bg-white',
        danger ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-gray-700'
      )}
    >
      <Icon size={13} />
    </button>
  )
}
