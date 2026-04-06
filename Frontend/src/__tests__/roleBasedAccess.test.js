import { describe, it, expect } from 'vitest'

// Role-based access helpers
const canManageTasks = (role) => role === 'admin' || role === 'project_admin'
const canManageNotes = (role) => role === 'admin'

describe('Role-based Access Control', () => {
  describe('canManageTasks', () => {
    it('returns true for admin role', () => {
      expect(canManageTasks('admin')).toBe(true)
    })

    it('returns true for project_admin role', () => {
      expect(canManageTasks('project_admin')).toBe(true)
    })

    it('returns false for member role', () => {
      expect(canManageTasks('member')).toBe(false)
    })

    it('returns false for undefined role', () => {
      expect(canManageTasks(undefined)).toBe(false)
    })

    it('returns false for null role', () => {
      expect(canManageTasks(null)).toBe(false)
    })
  })

  describe('canManageNotes', () => {
    it('returns true for admin role', () => {
      expect(canManageNotes('admin')).toBe(true)
    })

    it('returns false for project_admin role', () => {
      expect(canManageNotes('project_admin')).toBe(false)
    })

    it('returns false for member role', () => {
      expect(canManageNotes('member')).toBe(false)
    })

    it('returns false for undefined role', () => {
      expect(canManageNotes(undefined)).toBe(false)
    })

    it('returns false for null role', () => {
      expect(canManageNotes(null)).toBe(false)
    })
  })

  describe('Role hierarchy', () => {
    it('admin has all permissions', () => {
      expect(canManageTasks('admin')).toBe(true)
      expect(canManageNotes('admin')).toBe(true)
    })

    it('project_admin can manage tasks but not notes', () => {
      expect(canManageTasks('project_admin')).toBe(true)
      expect(canManageNotes('project_admin')).toBe(false)
    })

    it('member cannot manage tasks or notes', () => {
      expect(canManageTasks('member')).toBe(false)
      expect(canManageNotes('member')).toBe(false)
    })
  })
})
