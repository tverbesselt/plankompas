import { useState } from 'react'
import { FormField, Input, Textarea, Select, TagsInput } from '../shared/FormField'
import { StatusSelect } from '../shared/StatusBadge'
import type { StrategicObjective, ObjectiveStatus } from '@/domain/types'

type FormData = Omit<StrategicObjective, 'id' | 'planId' | 'typeGoal' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>

interface Props {
  initial?: Partial<FormData>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  loading?: boolean
}

const PIJLERS = [
  'Onderwijs & Kwaliteit',
  'Organisatie & Personeel',
  'Communicatie & Samenwerking',
  'Financiën & Infrastructuur',
  'Digitalisering',
]

export function SDForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState<FormData>({
    nr: initial?.nr ?? '',
    pijler: initial?.pijler ?? '',
    dienst: initial?.dienst ?? '',
    rubriek: initial?.rubriek ?? '',
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
        <FormField label="NR" required>
          <Input value={form.nr} onChange={e => set('nr', e.target.value)} placeholder="1" required />
        </FormField>
        <FormField label="Status">
          <StatusSelect value={form.status} onChange={v => set('status', v)} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Pijler" required>
          <Select
            value={form.pijler}
            onChange={e => set('pijler', e.target.value)}
            options={PIJLERS.map(p => ({ value: p, label: p }))}
            placeholder="Kies een pijler"
            required
          />
        </FormField>
        <FormField label="Dienst / Profiel" required>
          <Input value={form.dienst} onChange={e => set('dienst', e.target.value)} required />
        </FormField>
      </div>

      <FormField label="Rubriek">
        <Input value={form.rubriek} onChange={e => set('rubriek', e.target.value)} />
      </FormField>

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
