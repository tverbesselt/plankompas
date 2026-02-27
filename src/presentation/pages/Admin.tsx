import { useState } from 'react'
import { Plus, Pencil, Trash2, Users, Shield } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Modal } from '../components/shared/Modal'
import { ConfirmDialog } from '../components/shared/Modal'
import { FormField, Input, Select } from '../components/shared/FormField'
import { PageLoading } from '../components/shared/LoadingSpinner'
import { useUsers, useSaveUser, useDeleteUser, usePlans } from '../hooks/useData'
import { useAuthStore } from '../store/uiStore'
import { setCurrentUserId } from '@/infrastructure/auth/LocalAuthAdapter'
import type { User, UserRole } from '@/domain/types'
import { ROLE_LABELS } from '@/domain/types'

export function Admin() {
  const { data: users = [], isLoading } = useUsers()
  const { data: plans = [] } = usePlans()
  const saveUser = useSaveUser()
  const deleteUser = useDeleteUser()
  const { currentUserId, setCurrentUser } = useAuthStore()

  const [modal, setModal] = useState<{ type: 'new' | 'edit'; user?: User } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [form, setForm] = useState<Partial<User> & { name: string; email: string }>({
    name: '',
    email: '',
    role: 'viewer',
    scopes: [],
    isActive: true,
  })

  const openNew = () => {
    setForm({ name: '', email: '', role: 'viewer', scopes: [], isActive: true })
    setModal({ type: 'new' })
  }

  const openEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, role: user.role, scopes: user.scopes, isActive: user.isActive })
    setModal({ type: 'edit', user })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveUser.mutate(
      modal?.user ? { ...modal.user, ...form } : (form as typeof form & { name: string; email: string }),
      { onSuccess: () => setModal(null) }
    )
  }

  const handleSwitchUser = async (user: User) => {
    setCurrentUserId(user.id)
    setCurrentUser(user.id, user.name, user.role)
  }

  return (
    <div>
      <Header
        title="Beheer"
        actions={
          <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus size={14} />
            Gebruiker toevoegen
          </button>
        }
      />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Current user info */}
        <div className="bg-primary-50 rounded-xl border border-primary-200 p-4 flex items-center gap-3">
          <Shield size={20} className="text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-primary-800">Huidige gebruiker (lokale modus)</p>
            <p className="text-xs text-primary-600">
              In lokale modus kunt u van gebruiker wisselen om verschillende rollen te testen.
            </p>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800">Gebruikers ({users.length})</h3>
          </div>

          {isLoading ? <PageLoading /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Naam', 'E-mail', 'Rol', 'Actief', 'Actie'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className={user.id === currentUserId ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">Actief</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${roleColor(user.role)}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${user.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {user.isActive ? 'Ja' : 'Nee'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {user.id !== currentUserId && (
                            <button
                              onClick={() => handleSwitchUser(user)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Wissel
                            </button>
                          )}
                          <button onClick={() => openEdit(user)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={13} /></button>
                          <button onClick={() => setConfirmDelete(user)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Gebruiker bewerken' : 'Gebruiker toevoegen'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Naam" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </FormField>
          <FormField label="E-mailadres" required>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </FormField>
          <FormField label="Rol" required>
            <Select
              value={form.role ?? 'viewer'}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
              options={Object.entries(ROLE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </FormField>
          <FormField label="Actief">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive ?? true}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="rounded"
              />
              Gebruiker is actief
            </label>
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50">
              Annuleer
            </button>
            <button type="submit" disabled={saveUser.isPending} className="px-4 py-2 text-sm rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
              {saveUser.isPending ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Gebruiker verwijderen"
        message={`Gebruiker "${confirmDelete?.name}" verwijderen?`}
        confirmLabel="Verwijderen"
        danger
        onConfirm={() => { if (confirmDelete) deleteUser.mutate(confirmDelete.id); setConfirmDelete(null) }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function roleColor(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700',
    editor: 'bg-blue-100 text-blue-700',
    verantwoordelijke: 'bg-purple-100 text-purple-700',
    viewer: 'bg-gray-100 text-gray-600',
  }
  return map[role]
}
