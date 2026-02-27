import { useState } from 'react'
import { FormField, Input, Textarea, TagsInput } from '../shared/FormField'
import { StatusSelect } from '../shared/StatusBadge'
import type { OperationalObjective } from '@/domain/types'

type FormData = Omit<OperationalObjective, 'id' | 'planId' | 'sdId' | 'typeGoal' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>

interface Props {
  initial?: Partial<FormData>
  sdNr?: string
  onSubmit: (data: FormData) => void
  onCancel: () => void
  loading?: boolean
}

export function ODForm({ initial, sdNr, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState<FormData>({
    nr: initial?.nr ?? (sdNr ? `${sdNr}.` : ''),
    probleem: initial?.probleem ?? '',
    doel: initial?.doel ?? '',
    meting: initial?.meting ?? '',
    verantwoordelijken: initial?.verantwoordelijken ?? [],
    uitvoerders: initial?.uitvoerders ?? [],
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    adjustedEndDate: initial?.adjustedEndDate ?? '',
    status: initial?.status ?? 'niet_gestart',
    notes: initial?.notes ?? '',
  })

  const set = (key: keyof FormData, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="NR" required hint={sdNr ? `bv. ${sdNr}.1` : ''}>
          <Input value={form.nr} onChange={e => set('nr', e.target.value)} placeholder={sdNr ? `${sdNr}.1` : '1.1'} required />
        </FormField>
        <FormField label="Status">
          <StatusSelect value={form.status} onChange={v => set('status', v)} />
        </FormField>
      </div>

      <FormField label="Probleem" required>
        <Textarea value={form.probleem} onChange={e => set('probleem', e.target.value)} rows={3} required />
      </FormField>

      <FormField label="Doel" required>
        <Textarea value={form.doel} onChange={e => set('doel', e.target.value)} rows={3} required />
      </FormField>

      <FormField label="Meting">
        <Textarea value={form.meting} onChange={e => set('meting', e.target.value)} rows={2} />
      </FormField>

      <FormField label="Verantwoordelijke(n)" hint="Gescheiden door komma">
        <TagsInput value={form.verantwoordelijken} onChange={v => set('verantwoordelijken', v)} />
      </FormField>

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

      <FormField label="Notities">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
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
