import { create } from 'zustand'
import type { ObjectiveStatus, UserRole } from '@/domain/types'

interface Filters {
  pijler: string
  dienst: string
  status: ObjectiveStatus | ''
  verantwoordelijke: string
}

interface UIState {
  activePlanId: string | null
  setActivePlanId: (id: string | null) => void

  selectedTreeNode: { type: 'sd' | 'od' | 'action'; id: string } | null
  setSelectedTreeNode: (node: { type: 'sd' | 'od' | 'action'; id: string } | null) => void

  expandedSds: Set<string>
  toggleSdExpanded: (sdId: string) => void
  expandAll: () => void
  collapseAll: () => void

  filters: Filters
  setFilter: (key: keyof Filters, value: string) => void
  resetFilters: () => void

  viewMode: 'tree' | 'table'
  setViewMode: (mode: 'tree' | 'table') => void

  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const defaultFilters: Filters = {
  pijler: '',
  dienst: '',
  status: '',
  verantwoordelijke: '',
}

export const useUIStore = create<UIState>((set, get) => ({
  activePlanId: null,
  setActivePlanId: id => set({ activePlanId: id }),

  selectedTreeNode: null,
  setSelectedTreeNode: node => set({ selectedTreeNode: node }),

  expandedSds: new Set(),
  toggleSdExpanded: sdId => {
    const current = new Set(get().expandedSds)
    if (current.has(sdId)) current.delete(sdId)
    else current.add(sdId)
    set({ expandedSds: current })
  },
  expandAll: () => set({ expandedSds: new Set(['__all__']) }),
  collapseAll: () => set({ expandedSds: new Set() }),

  filters: defaultFilters,
  setFilter: (key, value) => set(s => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),

  viewMode: 'tree',
  setViewMode: mode => set({ viewMode: mode }),

  sidebarOpen: true,
  setSidebarOpen: open => set({ sidebarOpen: open }),
}))

// Auth store
interface AuthState {
  currentUserId: string
  currentUserName: string
  currentUserRole: UserRole
  setCurrentUser: (id: string, name: string, role: UserRole) => void
}

export const useAuthStore = create<AuthState>(set => ({
  currentUserId: 'admin-user',
  currentUserName: 'Admin Gebruiker',
  currentUserRole: 'admin',
  setCurrentUser: (id, name, role) => set({ currentUserId: id, currentUserName: name, currentUserRole: role }),
}))
