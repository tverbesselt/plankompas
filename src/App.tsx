import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './presentation/components/layout/Layout'
import { Dashboard } from './presentation/pages/Dashboard'
import { ActionPlanList } from './presentation/pages/ActionPlanList'
import { PlanDetail } from './presentation/pages/PlanDetail'
import { FicheDetail } from './presentation/pages/FicheDetail'
import { Reports } from './presentation/pages/Reports'
import { ImportExport } from './presentation/pages/ImportExport'
import { Admin } from './presentation/pages/Admin'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="plannen" element={<ActionPlanList />} />
        <Route path="plannen/:planId" element={<PlanDetail />} />
        <Route path="plannen/:planId/fiche/:scopeType/:scopeId" element={<FicheDetail />} />
        <Route path="rapporten" element={<Reports />} />
        <Route path="import-export" element={<ImportExport />} />
        <Route path="beheer" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
