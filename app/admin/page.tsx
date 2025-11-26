'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'

type User = {
  id: string
  phone: string
  role: 'technician' | 'customer' | null
  createdAt: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId))
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  const getRoleBadge = (role: string | null) => {
    if (!role) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">No Role</span>
    }

    if (role === 'technician') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">🔧 Technician</span>
    }

    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">👤 Customer</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-navy to-blue-900 text-white p-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-blue-200">Manage all users</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-4">
            <div className="text-2xl font-bold text-primary-navy">{users.length}</div>
            <div className="text-xs text-gray-500">Total Users</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'technician').length}
            </div>
            <div className="text-xs text-gray-500">Technicians</div>
          </Card>
          <Card className="text-center py-4">
            <div className="text-2xl font-bold text-orange-600">
              {users.filter(u => u.role === 'customer').length}
            </div>
            <div className="text-xs text-gray-500">Customers</div>
          </Card>
        </div>

        {/* User List */}
        <h2 className="text-lg font-bold text-primary-navy mb-3">All Users</h2>

        {users.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">No users found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <Card key={user.id} className="!p-0 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg text-primary-navy">
                          {user.phone}
                        </span>
                        {getRoleBadge(user.role)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created: {format(new Date(user.createdAt), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {user.id}
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteUser(user.id)}
                      variant="ghost"
                      size="sm"
                      isLoading={deletingId === user.id}
                      className="text-status-danger hover:bg-red-50"
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
