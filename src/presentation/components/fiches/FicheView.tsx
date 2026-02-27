import { useState } from 'react'
import { Plus, Trash2, Save, FileDown } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import clsx from 'clsx'
import { StatusBadge } from '../shared/StatusBadge'
import { StatusSelect } from '../shared/StatusBadge'
import { FormField, Input, Textarea, TagsInput } from '../shared/FormField'
import { ConfirmDialog } from '../shared/Modal'
import {
  useFiche,
  useSaveFiche,
  useFicheItems,
  useSaveFicheItem,
  useDeleteFicheItem,
} from '@/presentation/hooks/useData'
import { exportFiche } from '@/infrastructure/excel/ExcelService'
import type { FicheScope, ActionStatus, FicheItem } from '@/domain/types'
import { PageLoading } from '../shared/LoadingSpinner'

interface Props {
  planId: string
  scopeType: FicheScope
  scopeId: string
  scopeNr: string
  scopeTitle: string
}

export function FicheView({ planId, scopeType, scopeId, scopeNr, scopeTitle }: Props) {
  const { data: fiche, isLoading } = useFiche(planId, scopeType, scopeId)
  const { data: items = [] } = useFicheItems(fiche?.id ?? null)
  const saveFiche = useSaveFiche()
  const saveFicheItem = useSaveFicheItem()
  const deleteFicheItem = useDeleteFicheItem()

  const [ficheForm, setFicheForm] = useState({ visie: '', aanpak: '', eigenaars: [] as string[], status: 'niet_gestart' as ActionStatus })
  const [initialized, setInitialized] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Sync once fiche data arrives
  if (fiche && !initialized) {
    setFicheForm({ visie: fiche.visie, aanpak: fiche.aanpak, eigenaars: fiche.eigenaars, status: fiche.status })
    setInitialized(true)
  }

  const handleSaveFiche = async () => {
    await saveFiche.mutateAsync({
      ...(fiche ?? {}),
      ...ficheForm,
      planId,
      scopeType,
      scopeId,
    })
  }

  const handleAddItem = async () => {
    if (!fiche) {
      // Save fiche first
      const saved = await saveFiche.mutateAsync({ ...ficheForm, planId, scopeType, scopeId })
      await saveFicheItem.mutateAsync({
        ficheId: saved.id,
        sortOrder: 0,
      })
    } else {
      await saveFicheItem.mutateAsync({
        ficheId: fiche.id,
        sortOrder: items.length,
      })
    }
  }

  const handleItemChange = (item: FicheItem, key: keyof FicheItem, value: unknown) => {
    saveFicheItem.mutate({ ...item, [key]: value })
  }

  const handleExport = () => {
    exportFiche({
      ficheTitle: scopeTitle,
      scopeNr,
      visie: ficheForm.visie,
      aanpak: ficheForm.aanpak,
      items: items.map(i => ({
        titel: i.titel,
        startDate: i.startDate,
        tijdpad: i.tijdpad,
        uitvoerder: i.uitvoerder,
        gewenstResultaat: i.gewenstResultaat,
        opvolging: i.opvolging,
        status: i.status,
      })),
    })
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="space-y-6">
      {/* Meta */}
      <div className="bg-white rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 mr-2">
              {scopeType}
            </span>
            <span className="font-semibold text-gray-700">{scopeNr}</span>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={ficheForm.status} />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              <FileDown size={14} />
              Export
            </button>
            <button
              onClick={handleSaveFiche}
              disabled={saveFiche.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              <Save size={14} />
              {saveFiche.isPending ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status">
            <StatusSelect value={ficheForm.status} onChange={v => setFicheForm(f => ({ ...f, status: v }))} />
          </FormField>
          <FormField label="Eigenaar(s)" hint="Gescheiden door komma">
            <TagsInput value={ficheForm.eigenaars} onChange={v => setFicheForm(f => ({ ...f, eigenaars: v }))} />
          </FormField>
        </div>

        <FormField label="Visie / Context">
          <Textarea
            value={ficheForm.visie}
            onChange={e => setFicheForm(f => ({ ...f, visie: e.target.value }))}
            rows={3}
            placeholder="Beschrijf de visie en context…"
          />
        </FormField>

        <FormField label="Algemene aanpak">
          <Textarea
            value={ficheForm.aanpak}
            onChange={e => setFicheForm(f => ({ ...f, aanpak: e.target.value }))}
            rows={3}
            placeholder="Beschrijf de aanpak…"
          />
        </FormField>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Fiche-items / Subacties</h3>
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            <Plus size={14} />
            Item toevoegen
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Nog geen items. Klik op "Item toevoegen".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Titel / Fase', 'Start', 'Tijdpad', 'Uitvoerder', 'Gewenst resultaat', 'Opvolging', 'Status', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <FicheItemRow
                    key={item.id}
                    item={item}
                    onChange={(key, value) => handleItemChange(item, key, value)}
                    onDelete={() => setConfirmDelete(item.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Item verwijderen"
        message="Dit fiche-item permanent verwijderen?"
        confirmLabel="Verwijderen"
        danger
        onConfirm={() => {
          if (confirmDelete && fiche) {
            deleteFicheItem.mutate({ id: confirmDelete, ficheId: fiche.id })
          }
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function FicheItemRow({
  item,
  onChange,
  onDelete,
}: {
  item: FicheItem
  onChange: (key: keyof FicheItem, value: unknown) => void
  onDelete: () => void
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 py-1">
        <input
          value={item.titel}
          onChange={e => onChange('titel', e.target.value)}
          onBlur={e => onChange('titel', e.target.value)}
          className="w-full min-w-[160px] rounded border-0 bg-transparent px-1 py-0.5 text-sm focus:bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
          placeholder="Titel…"
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="date"
          value={item.startDate}
          onChange={e => onChange('startDate', e.target.value)}
          className="rounded border-0 bg-transparent px-1 py-0.5 text-sm focus:bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1">
        <input
          value={item.tijdpad}
          onChange={e => onChange('tijdpad', e.target.value)}
          className="w-full min-w-[100px] rounded border-0 bg-transparent px-1 py-0.5 text-sm focus:bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
          placeholder="Tijdpad…"
        />
      </td>
      <td className="px-2 py-1">
        <input
          value={item.uitvoerder}
          onChange={e => onChange('uitvoerder', e.target.value)}
          className="w-full min-w-[120px] rounded border-0 bg-transparent px-1 py-0.5 text-sm focus:bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
          placeholder="Uitvoerder…"
        />
      </td>
      <td className="px-2 py-1">
        <input
          value={item.gewenstResultaat}
          onChange={e => onChange('gewenstResultaat', e.target.value)}
          className="w-full min-w-[160px] rounded border-0 bg-transparent px-1 py-0.5 text-sm focus:bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
          placeholder="Resultaat…"
        />
      </td>
      <td className="px-2 py-1">
        <input
          value={item.opvolging}
          onChange={e => onChange('opvolging', e.target.value)}
          className="w-full min-w-[160px] rounded border-0 bg-transparent px-1 py-0.5 text-sm focus:bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
          placeholder="Opvolging…"
        />
      </td>
      <td className="px-2 py-1">
        <select
          value={item.status}
          onChange={e => onChange('status', e.target.value as ActionStatus)}
          className="rounded border border-gray-200 px-1.5 py-0.5 text-xs bg-white focus:ring-1 focus:ring-primary-400 focus:outline-none"
        >
          <option value="niet_gestart">Niet gestart</option>
          <option value="in_uitvoering">In uitvoering</option>
          <option value="afgerond">Afgerond</option>
          <option value="uitgesteld">Uitgesteld</option>
          <option value="geannuleerd">Geannuleerd</option>
        </select>
      </td>
      <td className="px-2 py-1">
        <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 rounded">
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}
