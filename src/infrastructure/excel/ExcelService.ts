import * as XLSX from 'xlsx'
import { v4 as uuid } from 'uuid'
import type {
  StrategicObjective,
  OperationalObjective,
  Action,
  ObjectiveStatus,
} from '@/domain/types'

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportData {
  planTitle: string
  sds: StrategicObjective[]
  ods: OperationalObjective[]
  actions: Action[]
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    niet_gestart: 'Niet gestart',
    in_uitvoering: 'In uitvoering',
    afgerond: 'Afgerond',
    uitgesteld: 'Uitgesteld',
    geannuleerd: 'Geannuleerd',
  }
  return map[status] ?? status
}

export function exportActionPlan(data: ExportData): void {
  const wb = XLSX.utils.book_new()

  // ── Overzicht sheet ──────────────────────────────────────────────────────
  const overviewRows: (string | number)[][] = [
    ['PlanKompas – Actieplan Export'],
    [data.planTitle],
    ['Geëxporteerd op:', new Date().toLocaleDateString('nl-BE')],
    [],
    ['NR', 'TYPE', 'Pijler / Dienst', 'Doel', 'Verantwoordelijke(n)', 'Start', 'Einde', 'Status'],
  ]

  for (const sd of data.sds) {
    overviewRows.push([
      sd.nr,
      'SD',
      `${sd.pijler} / ${sd.dienst}`,
      sd.doel,
      sd.verantwoordelijken.join(', '),
      sd.startDate,
      sd.adjustedEndDate || sd.endDate,
      statusLabel(sd.status),
    ])
    const ods = data.ods.filter(o => o.sdId === sd.id)
    for (const od of ods) {
      overviewRows.push([
        od.nr,
        'OD',
        '',
        od.doel,
        od.verantwoordelijken.join(', '),
        od.startDate,
        od.adjustedEndDate || od.endDate,
        statusLabel(od.status),
      ])
      const acts = data.actions.filter(a => a.odId === od.id)
      for (const act of acts) {
        overviewRows.push([
          '',
          'ACTIE',
          '',
          act.title,
          act.verantwoordelijke,
          act.startDate,
          act.adjustedEndDate || act.endDate,
          statusLabel(act.status),
        ])
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(overviewRows)
  ws['!cols'] = [{ wch: 8 }, { wch: 8 }, { wch: 25 }, { wch: 45 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Actieplan')

  // ── Acties sheet ─────────────────────────────────────────────────────────
  const actionRows: (string | number)[][] = [
    ['NR OD', 'Actie', 'Verantwoordelijke', 'Uitvoerders', 'Start', 'Einde', 'Bijstelling', 'Status', 'Opmerkingen'],
  ]
  for (const od of data.ods) {
    for (const act of data.actions.filter(a => a.odId === od.id)) {
      actionRows.push([
        od.nr,
        act.title,
        act.verantwoordelijke,
        act.uitvoerders.join(', '),
        act.startDate,
        act.endDate,
        act.adjustedEndDate,
        statusLabel(act.status),
        act.opmerkingen,
      ])
    }
  }
  const ws2 = XLSX.utils.aoa_to_sheet(actionRows)
  ws2['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 35 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Acties')

  XLSX.writeFile(wb, `Actieplan_${data.planTitle.replace(/[^a-z0-9]/gi, '_')}.xlsx`)
}

// ─── Import ───────────────────────────────────────────────────────────────────

export interface ImportResult {
  sds: Partial<StrategicObjective>[]
  ods: Partial<OperationalObjective>[]
  actions: Partial<Action>[]
  errors: string[]
  warnings: string[]
}

function parseStatus(raw: string): ObjectiveStatus {
  const map: Record<string, ObjectiveStatus> = {
    'niet gestart': 'niet_gestart',
    'in uitvoering': 'in_uitvoering',
    afgerond: 'afgerond',
    uitgesteld: 'uitgesteld',
    geannuleerd: 'geannuleerd',
  }
  return map[raw.toLowerCase().trim()] ?? 'niet_gestart'
}

export function importActionPlan(file: File, planId: string): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: true })

        const result: ImportResult = { sds: [], ods: [], actions: [], errors: [], warnings: [] }
        const now = new Date().toISOString()

        // Try to find the main sheet
        const sheetName = wb.SheetNames.find(n =>
          ['actieplan', 'plan', 'doelstellingen', 'overzicht'].some(k => n.toLowerCase().includes(k))
        ) ?? wb.SheetNames[0]

        if (!sheetName) {
          result.errors.push('Geen bruikbare sheet gevonden in het Excel-bestand.')
          return resolve(result)
        }

        const ws = wb.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

        // Map column names (flexible matching)
        function col(row: Record<string, unknown>, ...keys: string[]): string {
          for (const k of keys) {
            const found = Object.keys(row).find(rk => rk.toLowerCase().includes(k.toLowerCase()))
            if (found) return String(row[found]).trim()
          }
          return ''
        }

        const sdMap = new Map<string, string>() // nr -> id

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          const type = col(row, 'type', 'Type doel').toUpperCase()
          const nr = col(row, 'nr', 'NR', 'nummer')

          if (type === 'SD') {
            const id = uuid()
            sdMap.set(nr, id)
            result.sds.push({
              id,
              planId,
              nr,
              pijler: col(row, 'pijler'),
              dienst: col(row, 'dienst', 'profiel'),
              rubriek: col(row, 'rubriek'),
              probleem: col(row, 'probleem'),
              doel: col(row, 'doel'),
              meting: col(row, 'meting'),
              typeGoal: 'SD',
              verantwoordelijken: col(row, 'verantwoordelijke').split(/[,;]/).map(s => s.trim()).filter(Boolean),
              uitvoerders: col(row, 'uitvoerder').split(/[,;]/).map(s => s.trim()).filter(Boolean),
              startDate: col(row, 'start'),
              endDate: col(row, 'einde', 'einddatum'),
              adjustedEndDate: col(row, 'bijstelling'),
              status: parseStatus(col(row, 'status')),
              notes: col(row, 'opmerking', 'nota'),
              createdAt: now,
              updatedAt: now,
              createdBy: 'import',
              updatedBy: '',
            })
          } else if (type === 'OD') {
            // Parent SD: first part of nr (e.g. "1.2" -> "1")
            const sdNr = nr.split('.')[0]
            const sdId = sdMap.get(sdNr)
            if (!sdId) {
              result.warnings.push(`Rij ${i + 2}: OD ${nr} heeft geen gekende parent SD (${sdNr}).`)
            }
            const id = uuid()
            result.ods.push({
              id,
              planId,
              sdId: sdId ?? '',
              nr,
              probleem: col(row, 'probleem'),
              doel: col(row, 'doel'),
              meting: col(row, 'meting'),
              typeGoal: 'OD',
              verantwoordelijken: col(row, 'verantwoordelijke').split(/[,;]/).map(s => s.trim()).filter(Boolean),
              uitvoerders: col(row, 'uitvoerder').split(/[,;]/).map(s => s.trim()).filter(Boolean),
              startDate: col(row, 'start'),
              endDate: col(row, 'einde', 'einddatum'),
              adjustedEndDate: col(row, 'bijstelling'),
              status: parseStatus(col(row, 'status')),
              notes: col(row, 'opmerking', 'nota'),
              createdAt: now,
              updatedAt: now,
              createdBy: 'import',
              updatedBy: '',
            })
          } else if (type === 'ACTIE') {
            // actions reference OD by nr
            result.actions.push({
              id: uuid(),
              planId,
              odId: '',  // will be resolved later
              title: col(row, 'actie', 'titel', 'omschrijving'),
              verantwoordelijke: col(row, 'verantwoordelijke'),
              uitvoerders: col(row, 'uitvoerder').split(/[,;]/).map(s => s.trim()).filter(Boolean),
              startDate: col(row, 'start'),
              endDate: col(row, 'einde'),
              adjustedEndDate: col(row, 'bijstelling'),
              status: parseStatus(col(row, 'status')),
              opmerkingen: col(row, 'opmerking'),
              createdAt: now,
              updatedAt: now,
              createdBy: 'import',
              updatedBy: '',
            })
          }
        }

        if (result.sds.length === 0 && result.ods.length === 0) {
          result.warnings.push(
            'Geen SD of OD gevonden. Zorg dat de kolom "Type doel" de waarden "SD" of "OD" bevat.'
          )
        }

        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen.'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── Fiche export ─────────────────────────────────────────────────────────────

export interface FicheExportData {
  ficheTitle: string
  scopeNr: string
  visie: string
  aanpak: string
  items: {
    titel: string
    startDate: string
    tijdpad: string
    uitvoerder: string
    gewenstResultaat: string
    opvolging: string
    status: string
  }[]
}

export function exportFiche(data: FicheExportData): void {
  const wb = XLSX.utils.book_new()

  const rows: (string | number)[][] = [
    [`Actiefiche – ${data.ficheTitle}`],
    [`NR: ${data.scopeNr}`],
    [],
    ['Visie / Context'],
    [data.visie],
    [],
    ['Aanpak'],
    [data.aanpak],
    [],
    ['Fiche-items / Subacties'],
    ['Titel / Fase', 'Start', 'Tijdpad', 'Uitvoerder', 'Gewenst resultaat', 'Opvolging', 'Status'],
  ]

  for (const item of data.items) {
    rows.push([
      item.titel,
      item.startDate,
      item.tijdpad,
      item.uitvoerder,
      item.gewenstResultaat,
      item.opvolging,
      statusLabel(item.status),
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 30 }, { wch: 35 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Actiefiche')
  XLSX.writeFile(wb, `Actiefiche_${data.scopeNr}_${data.ficheTitle.replace(/[^a-z0-9]/gi, '_')}.xlsx`)
}
