'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Search, Loader } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  isAdmin: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

   const fetchUsers = async () => {
     try {
       const response = await fetch(`/api/users?limit=50&search=${encodeURIComponent(searchTerm)}`)
       const data = await response.json()
       if (data.success && data.data) {
         setUsers(data.data.users || [])
       } else {
         setUsers([])
       }
     } catch (error) {
       console.error('Error fetching users:', error)
       setUsers([])
     } finally {
       setLoading(false)
     }
   }

   useEffect(() => {
     if (!userId) {
       router.push('/sign-in')
       return
     }

     const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || []
     if (!adminUserIds.includes(userId)) {
       router.push('/deliveries')
       return
     }

     fetchUsers()
   }, [userId, router])

   useEffect(() => {
     // Refetch when search changes (with debounce)
     const timeoutId = setTimeout(() => {
       fetchUsers()
     }, 300)
     return () => clearTimeout(timeoutId)
   }, [searchTerm])

   const filteredUsers = users

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin" className="text-accent-gold hover:text-accent-gold-light mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <h1 className="section-title mb-8">Manage Users</h1>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-3 h-5 w-5 text-secondary" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-base w-full pl-12"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 text-accent-gold animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-secondary">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Name</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Email</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Role</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Joined</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/5">
                    <td className="py-4 px-4 text-primary">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-4 px-4 text-secondary text-sm">{user.email}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <span className="badge badge-info">{user.role}</span>
                        {user.isAdmin && <span className="badge badge-warning">Admin</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-secondary text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <button className="text-accent-gold hover:text-accent-gold-light text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
