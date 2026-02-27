import { useState, useRef } from 'react'
import { Upload, FileDown, AlertCircle, CheckCircle, FileUp } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { usePlans, useSaveSD, useSaveOD } from '../hooks/useData'
import { useUIStore } from '../store/uiStore'
import { importActionPlan, exportActionPlan } from '@/infrastructure/excel/ExcelService'
import { useSDs, useODs, useActions } from '../hooks/useData'
import type { ImportResult } from '@/infrastructure/excel/ExcelService'

export function ImportExport() {
  const { data: plans = [] } = usePlans()
  const { activePlanId, setActivePlanId } = useUIStore()
  const activePlan = plans.find(p => p.id === activePlanId) ?? plans[0] ?? null

  const { data: sds = [] } = useSDs(activePlan?.id ?? null)
  const { data: ods = [] } = useODs(activePlan?.id ?? null)
  const { data: actions = [] } = useActions(activePlan?.id ?? null)

  const saveSD = useSaveSD()
  const saveOD = useSaveOD()

  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'idle' | 'preview' | 'done'>('idle')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activePlan) return
    setImporting(true)
    try {
      const r = await importActionPlan(file, activePlan.id)
      setResult(r)
      setStep('preview')
    } catch (err) {
      setResult({ sds: [], ods: [], actions: [], errors: [String(err)], warnings: [] })
      setStep('preview')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleConfirmImport = async () => {
    if (!result || !activePlan) return
    setImporting(true)
    try {
      for (const sd of result.sds) {
        await saveSD.mutateAsync({ ...sd, planId: activePlan.id } as Parameters<typeof saveSD.mutateAsync>[0])
      }
      for (const od of result.ods) {
        if (od.sdId) {
          await saveOD.mutateAsync({ ...od, planId: activePlan.id } as Parameters<typeof saveOD.mutateAsync>[0])
        }
      }
      setStep('done')
    } catch (err) {
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  const handleExport = () => {
    if (!activePlan) return
    exportActionPlan({ planTitle: activePlan.title, sds, ods, actions })
  }

  return (
    <div>
      <Header
        title="Import / Export"
        actions={
          plans.length > 1 ? (
            <select
              value={activePlanId ?? ''}
              onChange={e => setActivePlanId(e.target.value)}
              className="text-sm rounded border border-gray-300 px-2 py-1.5"
            >
              {plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          ) : null
        }
      />

      <div className="p-6 max-w-3xl space-y-6">
        {/* Export card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileDown size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Exporteren naar Excel</h3>
              <p className="text-sm text-gray-600 mb-4">
                Exporteer het actieplan naar Excel. Het bestand bevat een overzichtsblad en een actiesblad.
              </p>
              {activePlan ? (
                <div className="mb-4 text-sm text-gray-500">
                  <span className="font-medium">{activePlan.title}</span>:
                  {' '}{sds.length} SD · {ods.length} OD · {actions.length} acties
                </div>
              ) : (
                <p className="text-sm text-orange-600 mb-4">Selecteer eerst een plan.</p>
              )}
              <button
                onClick={handleExport}
                disabled={!activePlan}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FileDown size={16} />
                Exporteren
              </button>
            </div>
          </div>
        </div>

        {/* Import card */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileUp size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Importeren vanuit Excel</h3>
              <p className="text-sm text-gray-600 mb-2">
                Upload een Excel-bestand met een kolom "Type doel" (waarden: SD of OD) en een kolom "NR".
              </p>
              <div className="text-xs text-gray-400 bg-gray-50 rounded p-3 mb-4 space-y-1">
                <p><strong>Vereiste kolommen:</strong> Type doel, NR, Doel, Probleem, Meting, Verantwoordelijke, Uitvoerder, Start, Einde, Status</p>
                <p><strong>Type doel waarden:</strong> SD, OD, ACTIE</p>
                <p><strong>Status waarden:</strong> Niet gestart, In uitvoering, Afgerond, Uitgesteld, Geannuleerd</p>
              </div>

              {!activePlan && <p className="text-sm text-orange-600 mb-4">Selecteer eerst een plan.</p>}

              {step === 'idle' && (
                <>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="import-file" />
                  <label
                    htmlFor="import-file"
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg cursor-pointer inline-flex ${
                      activePlan
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Upload size={16} />
                    {importing ? 'Analyseren…' : 'Excel uploaden'}
                  </label>
                </>
              )}

              {step === 'preview' && result && (
                <div className="space-y-4">
                  {result.errors.length > 0 && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
                      {result.errors.map((e, i) => (
                        <p key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          {e}
                        </p>
                      ))}
                    </div>
                  )}
                  {result.warnings.length > 0 && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 space-y-1">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-sm text-yellow-700 flex items-start gap-1.5">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="rounded-lg bg-gray-50 border p-4 text-sm space-y-1">
                    <p className="font-medium text-gray-800 mb-2">Voorvertoning import:</p>
                    <p>SD's gevonden: <strong>{result.sds.length}</strong></p>
                    <p>OD's gevonden: <strong>{result.ods.length}</strong></p>
                    <p>Acties gevonden: <strong>{result.actions.length}</strong></p>
                  </div>

                  {result.sds.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="text-xs w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">NR</th>
                            <th className="p-2 text-left">Doel</th>
                            <th className="p-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...result.sds, ...result.ods].slice(0, 15).map((item, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2 font-medium text-purple-600">{item.typeGoal}</td>
                              <td className="p-2">{item.nr}</td>
                              <td className="p-2 max-w-xs truncate">{item.doel}</td>
                              <td className="p-2">{item.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setStep('idle'); setResult(null) }}
                      className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
                    >
                      Annuleer
                    </button>
                    {result.errors.length === 0 && result.sds.length + result.ods.length > 0 && (
                      <button
                        onClick={handleConfirmImport}
                        disabled={importing}
                        className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {importing ? 'Importeren…' : `Importeer ${result.sds.length + result.ods.length} doelstellingen`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 'done' && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg p-3">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">Import geslaagd! Ga naar het plan om de data te bekijken.</span>
                  <button
                    onClick={() => { setStep('idle'); setResult(null) }}
                    className="ml-auto text-xs underline"
                  >
                    Opnieuw importeren
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Template info */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <AlertCircle size={16} />
            Tips voor compatibele Excel-bestanden
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Gebruik de kolom "Type doel" met waarden "SD", "OD" of "ACTIE"</li>
            <li>De NR van OD's bevat de SD-prefix (bv. 1.1, 1.2 voor SD 1)</li>
            <li>Datums in formaat YYYY-MM-DD of DD/MM/YYYY</li>
            <li>Meerdere waarden in een cel scheiden met komma (,)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
