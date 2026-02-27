import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderOpen, Pencil, Trash2, ArrowRight } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Modal } from '../components/shared/Modal'
import { ConfirmDialog } from '../components/shared/Modal'
import { FormField, Input, Textarea } from '../components/shared/FormField'
import { PageLoading } from '../components/shared/LoadingSpinner'
import { usePlans, useSavePlan, useDeletePlan } from '../hooks/useData'
import { useUIStore } from '../store/uiStore'
import type { Plan } from '@/domain/types'

export function ActionPlanList() {
  const navigate = useNavigate()
  const { data: plans = [], isLoading } = usePlans()
  const savePlan = useSavePlan()
  const deletePlan = useDeletePlan()
  const { setActivePlanId } = useUIStore()

  const [modal, setModal] = useState<{ type: 'new' | 'edit'; plan?: Plan } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null)

  const [form, setForm] = useState({ title: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, description: '' })

  const openNew = () => {
    setForm({ title: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, description: '' })
    setModal({ type: 'new' })
  }

  const openEdit = (plan: Plan) => {
    setForm({ title: plan.title, startYear: plan.startYear, endYear: plan.endYear, description: plan.description })
    setModal({ type: 'edit', plan })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    savePlan.mutate(
      modal?.plan ? { ...modal.plan, ...form } : form,
      { onSuccess: () => setModal(null) }
    )
  }

  const openPlan = (plan: Plan) => {
    setActivePlanId(plan.id)
    navigate(`/plannen/${plan.id}`)
  }

  return (
    <div>
      <Header
        title="Actieplannen"
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus size={14} />
            Nieuw plan
          </button>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <PageLoading />
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nog geen actieplannen</p>
            <p className="text-sm mt-1 mb-4">Maak je eerste plan aan</p>
            <button onClick={openNew} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
              Plan aanmaken
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl border hover:shadow-md transition-shadow p-5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                    <p className="text-sm text-gray-500">{plan.startYear} – {plan.endYear}</p>
                  </div>
                  {plan.isActive && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium">Actief</span>
                  )}
                </div>
                {plan.description && (
                  <p className="text-sm text-gray-600 mt-1 mb-3 line-clamp-2 flex-1">{plan.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(plan)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Bewerken"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(plan)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Verwijderen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => openPlan(plan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
                  >
                    Openen
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New/Edit modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Plan bewerken' : 'Nieuw actieplan'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Titel" required>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="bv. Actieplan 2025–2026" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Startjaar" required>
              <Input type="number" value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: +e.target.value }))} required min={2020} max={2040} />
            </FormField>
            <FormField label="Eindjaar" required>
              <Input type="number" value={form.endYear} onChange={e => setForm(f => ({ ...f, endYear: +e.target.value }))} required min={2020} max={2040} />
            </FormField>
          </div>
          <FormField label="Omschrijving">
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">
              Annuleer
            </button>
            <button type="submit" disabled={savePlan.isPending} className="px-4 py-2 text-sm rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
              {savePlan.isPending ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Plan verwijderen"
        message={`Plan "${confirmDelete?.title}" verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        danger
        onConfirm={() => {
          if (confirmDelete) deletePlan.mutate(confirmDelete.id)
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
