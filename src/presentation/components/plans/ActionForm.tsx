import { useState } from 'react'
import { FormField, Input, Textarea, TagsInput } from '../shared/FormField'
import { StatusSelect } from '../shared/StatusBadge'
import type { Action } from '@/domain/types'

type FormData = Omit<Action, 'id' | 'planId' | 'odId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>

interface Props {
  initial?: Partial<FormData>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  loading?: boolean
}

export function ActionForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState<FormData>({
    title: initial?.title ?? '',
    verantwoordelijke: initial?.verantwoordelijke ?? '',
    uitvoerders: initial?.uitvoerders ?? [],
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    adjustedEndDate: initial?.adjustedEndDate ?? '',
    status: initial?.status ?? 'niet_gestart',
    opmerkingen: initial?.opmerkingen ?? '',
  })

  const set = (key: keyof FormData, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Titel / omschrijving" required>
        <Input value={form.title} onChange={e => set('title', e.target.value)} required />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Verantwoordelijke">
          <Input value={form.verantwoordelijke} onChange={e => set('verantwoordelijke', e.target.value)} />
        </FormField>
        <FormField label="Status">
          <StatusSelect value={form.status} onChange={v => set('status', v)} />
        </FormField>
      </div>

      <FormField label="Uitvoerder(s)" hint="Gescheiden door komma">
        <TagsInput value={form.uitvoerders} onChange={v => set('uitvoerders', v)} />
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Startdatum">
          <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </FormField>
        <FormField label="Einddatum">
          <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
        </FormField>
        <FormField label="Bijstelling einddatum">
          <Input type="date" value={form.adjustedEndDate} onChange={e => set('adjustedEndDate', e.target.value)} />
        </FormField>
      </div>

      <FormField label="Opmerkingen">
        <Textarea value={form.opmerkingen} onChange={e => set('opmerkingen', e.target.value)} rows={2} />
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">
          Annuleer
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Opslaan…' : 'Opslaan'}
        </button>
      </div>
    </form>
  )
}
