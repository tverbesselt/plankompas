import type { AuthPort } from '@/application/ports/repositories'
import type { User } from '@/domain/types'
import { db } from '../db/PlanKompasDB'

// In local mode we use a hardcoded "current user" stored in localStorage
const CURRENT_USER_KEY = 'plankompas_current_user'

export class LocalAuthAdapter implements AuthPort {
  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    if (stored) {
      try {
        const { id } = JSON.parse(stored) as { id: string }
        const user = await db.users.get(id)
        return user ?? null
      } catch {
        return null
      }
    }
    // Default to admin user
    const admin = await db.users.get('admin-user')
    if (admin) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: admin.id }))
    }
    return admin ?? null
  }

  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    if (user.role === 'admin') return true
    return user.role === role
  }

  async canAccessPlan(planId: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    if (user.role === 'admin') return true
    return user.scopes.includes(planId) || user.scopes.length === 0
  }
}

export function setCurrentUserId(id: string) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id }))
}
