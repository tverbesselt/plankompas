import { useState } from 'react'
import { Pencil, Trash2, Plus, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { StatusBadge, StatusSelect } from '../shared/StatusBadge'
import { Modal } from '../shared/Modal'
import { ConfirmDialog } from '../shared/Modal'
import { SDForm } from './SDForm'
import { ODForm } from './ODForm'
import { ActionForm } from './ActionForm'
import {
  useSDs, useODs, useActions,
  useSaveSD, useSaveOD, useSaveAction,
  useDeleteSD, useDeleteOD, useDeleteAction,
  useBulkUpdateActions,
} from '@/presentation/hooks/useData'
import type { StrategicObjective, OperationalObjective, Action, ObjectiveStatus } from '@/domain/types'
import { PageLoading } from '../shared/LoadingSpinner'

interface Props {
  planId: string
}

export function TableView({ planId }: Props) {
  const navigate = useNavigate()
  const { data: sds = [], isLoading } = useSDs(planId)
  const { data: ods = [] } = useODs(planId)
  const { data: actions = [] } = useActions(planId)

  const saveSD = useSaveSD()
  const saveOD = useSaveOD()
  const saveAction = useSaveAction()
  const deleteSD = useDeleteSD()
  const deleteOD = useDeleteOD()
  const deleteAction = useDeleteAction()
  const bulkUpdate = useBulkUpdateActions()

  const [tab, setTab] = useState<'sd' | 'od' | 'actions'>('actions')
  const [modal, setModal] = useState<{
    type: 'edit-sd' | 'edit-od' | 'edit-action'
    sd?: StrategicObjective
    od?: OperationalObjective
    action?: Action
  } | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<ObjectiveStatus>('in_uitvoering')
  const [filterStatus, setFilterStatus] = useState<ObjectiveStatus | ''>('')
  const [filterOwner, setFilterOwner] = useState('')

  if (isLoading) return <PageLoading />

  const filteredActions = actions.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false
    if (filterOwner && !a.verantwoordelijke.toLowerCase().includes(filterOwner.toLowerCase())) return false
    return true
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(new Set(filteredActions.map(a => a.id)))
    else setSelected(new Set())
  }

  const handleBulkStatus = () => {
    const ids = Array.from(selected)
    bulkUpdate.mutate({ ids, updates: { status: bulkStatus }, planId }, {
      onSuccess: () => setSelected(new Set()),
    })
  }

  const odMap = Object.fromEntries(ods.map(o => [o.id, o]))
  const sdMap = Object.fromEntries(sds.map(s => [s.id, s]))

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['sd', 'od', 'actions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t === 'sd' ? 'Strategische doelstellingen' : t === 'od' ? 'Operationele doelstellingen' : 'Acties'}
          </button>
        ))}
      </div>

      {/* SD Table */}
      {tab === 'sd' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['NR', 'Pijler', 'Dienst', 'Doel', 'Verantwoordelijke(n)', 'Start', 'Einde', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sds.map(sd => (
                  <tr key={sd.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold text-primary-700">{sd.nr}</td>
                    <td className="px-3 py-2 text-gray-600">{sd.pijler}</td>
                    <td className="px-3 py-2 text-gray-600">{sd.dienst}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{sd.doel}</td>
                    <td className="px-3 py-2 text-gray-600">{sd.verantwoordelijken.join(', ')}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{sd.startDate}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{sd.adjustedEndDate || sd.endDate}</td>
                    <td className="px-3 py-2"><StatusBadge status={sd.status} size="sm" /></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/plannen/${planId}/fiche/SD/${sd.id}`)} className="p-1 text-gray-400 hover:text-purple-600"><FileText size={13} /></button>
                        <button onClick={() => setModal({ type: 'edit-sd', sd })} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
                        <button onClick={() => setConfirm({ message: `SD ${sd.nr} verwijderen?`, onConfirm: () => deleteSD.mutate({ id: sd.id, planId }) })} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OD Table */}
      {tab === 'od' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['NR', 'Parent SD', 'Doel', 'Verantwoordelijke(n)', 'Start', 'Einde', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ods.map(od => (
                  <tr key={od.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-blue-700">{od.nr}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{sdMap[od.sdId]?.nr} – {sdMap[od.sdId]?.pijler}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{od.doel}</td>
                    <td className="px-3 py-2 text-gray-600">{od.verantwoordelijken.join(', ')}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{od.startDate}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{od.adjustedEndDate || od.endDate}</td>
                    <td className="px-3 py-2"><StatusBadge status={od.status} size="sm" /></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/plannen/${planId}/fiche/OD/${od.id}`)} className="p-1 text-gray-400 hover:text-purple-600"><FileText size={13} /></button>
                        <button onClick={() => setModal({ type: 'edit-od', od, sd: sdMap[od.sdId] })} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
                        <button onClick={() => setConfirm({ message: `OD ${od.nr} verwijderen?`, onConfirm: () => deleteOD.mutate({ id: od.id, planId, sdId: od.sdId }) })} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions Table */}
      {tab === 'actions' && (
        <div className="space-y-3">
          {/* Filters + Bulk */}
          <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border px-4 py-3">
            <input
              value={filterOwner}
              onChange={e => setFilterOwner(e.target.value)}
              placeholder="Filter verantwoordelijke…"
              className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ObjectiveStatus | '')}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Alle statussen</option>
              <option value="niet_gestart">Niet gestart</option>
              <option value="in_uitvoering">In uitvoering</option>
              <option value="afgerond">Afgerond</option>
              <option value="uitgesteld">Uitgesteld</option>
              <option value="geannuleerd">Geannuleerd</option>
            </select>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">{selected.size} geselecteerd</span>
                <StatusSelect value={bulkStatus} onChange={setBulkStatus} className="text-sm" />
                <button onClick={handleBulkStatus} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
                  Status wijzigen
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-8 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.size === filteredActions.length && filteredActions.length > 0}
                        onChange={e => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    {['OD', 'Actie', 'Verantwoordelijke', 'Start', 'Einde', 'Status', ''].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredActions.map(action => (
                    <tr key={action.id} className={clsx('hover:bg-gray-50', selected.has(action.id) && 'bg-primary-50')}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(action.id)}
                          onChange={e => {
                            const next = new Set(selected)
                            if (e.target.checked) next.add(action.id)
                            else next.delete(action.id)
                            setSelected(next)
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 text-blue-600 font-medium whitespace-nowrap">{odMap[action.odId]?.nr}</td>
                      <td className="px-3 py-2 max-w-xs truncate">{action.title}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{action.verantwoordelijke}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{action.startDate}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{action.adjustedEndDate || action.endDate}</td>
                      <td className="px-3 py-2"><StatusBadge status={action.status} size="sm" /></td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => setModal({ type: 'edit-action', action, od: odMap[action.odId] })} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
                          <button onClick={() => setConfirm({ message: `Actie "${action.title}" verwijderen?`, onConfirm: () => deleteAction.mutate({ id: action.id, planId, odId: action.odId }) })} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modals */}
      <Modal open={modal?.type === 'edit-sd'} onClose={() => setModal(null)} title={`SD ${modal?.sd?.nr} bewerken`} size="lg">
        {modal?.sd && (
          <SDForm
            initial={modal.sd}
            onCancel={() => setModal(null)}
            loading={saveSD.isPending}
            onSubmit={data => saveSD.mutate({ ...modal.sd!, ...data }, { onSuccess: () => setModal(null) })}
          />
        )}
      </Modal>

      <Modal open={modal?.type === 'edit-od'} onClose={() => setModal(null)} title={`OD ${modal?.od?.nr} bewerken`} size="lg">
        {modal?.od && (
          <ODForm
            initial={modal.od}
            sdNr={modal.sd?.nr}
            onCancel={() => setModal(null)}
            loading={saveOD.isPending}
            onSubmit={data => saveOD.mutate({ ...modal.od!, ...data }, { onSuccess: () => setModal(null) })}
          />
        )}
      </Modal>

      <Modal open={modal?.type === 'edit-action'} onClose={() => setModal(null)} title="Actie bewerken" size="md">
        {modal?.action && modal?.od && (
          <ActionForm
            initial={modal.action}
            onCancel={() => setModal(null)}
            loading={saveAction.isPending}
            onSubmit={data => saveAction.mutate({ ...modal.action!, ...data }, { onSuccess: () => setModal(null) })}
          />
        )}
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
