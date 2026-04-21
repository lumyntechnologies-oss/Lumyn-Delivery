import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export async function getClerkUser() {
  return auth()
}

export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function isAdmin(userId: string) {
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
  return adminUserIds.includes(userId)
}

export async function checkAdminAccess() {
  const { userId } = await auth()

  if (!userId) {
    return false
  }

  return isAdmin(userId)
}

export async function getUserRole(clerkId: string): Promise<UserRole | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true },
    })
    return user?.role || null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

export async function initializeUserInDatabase(userId: string, email: string, firstName?: string, lastName?: string) {
  try {
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || []
    const isAdminUser = adminUserIds.includes(userId)

    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      },
      create: {
        clerkId: userId,
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role: isAdminUser ? UserRole.ADMIN : UserRole.CUSTOMER,
        isAdmin: isAdminUser,
      },
    })

    return user
  } catch (error) {
    console.error('Error initializing user:', error)
    throw error
  }
}
