import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/users — Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''

    let whereClause: any = {}

    // Apply search filter
    if (search) {
      whereClause = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    // Apply role filter
    if (role && ['CUSTOMER', 'DRIVER', 'ADMIN'].includes(role)) {
      whereClause.role = role
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isAdmin: true,
        isDriverVerified: true,
        isDriverActive: true,
        driverRating: true,
        totalDeliveries: true,
        createdAt: true,
        updatedAt: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.user.count({ where: whereClause })

    return NextResponse.json(
      successResponse({ users, total, limit, offset }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching users:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// GET /api/users/[id] — Get single user (admin only)
export async function GET_USER(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Check if user is admin
    const adminCheck = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!adminCheck || adminCheck.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isAdmin: true,
        isDriverVerified: true,
        isDriverActive: true,
        driverRating: true,
        totalDeliveries: true,
        licenseNumber: true,
        licenseExpiry: true,
        vehicleType: true,
        vehiclePlate: true,
        profileImage: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
        // Related data
        addresses: true,
        deliveries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(user), { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// PATCH /api/users/[id] — Update user (admin only)
export async function PATCH_USER(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Check if user is admin
    const adminCheck = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!adminCheck || adminCheck.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { role, isDriverVerified, isDriverActive, isAdmin, emailNotifications, smsNotifications, pushNotifications } = body

    const updateData: any = {}
    if (role && ['CUSTOMER', 'DRIVER', 'ADMIN'].includes(role)) updateData.role = role
    if (typeof isDriverVerified === 'boolean') updateData.isDriverVerified = isDriverVerified
    if (typeof isDriverActive === 'boolean') updateData.isDriverActive = isDriverActive
    if (typeof isAdmin === 'boolean') updateData.isAdmin = isAdmin
    if (typeof emailNotifications === 'boolean') updateData.emailNotifications = emailNotifications
    if (typeof smsNotifications === 'boolean') updateData.smsNotifications = smsNotifications
    if (typeof pushNotifications === 'boolean') updateData.pushNotifications = pushNotifications

    if (Object.keys(updateData).length === 0) {
      const [response, status] = errorResponse('No valid fields to update', 400)
      return NextResponse.json(response, { status })
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isAdmin: true,
        isDriverVerified: true,
        isDriverActive: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(successResponse(updatedUser, 'User updated successfully'), { status: 200 })
  } catch (error) {
    console.error('Error updating user:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// DELETE /api/users/[id] — Delete user (admin only)
export async function DELETE_USER(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Check if user is admin
    const adminCheck = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!adminCheck || adminCheck.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    // Prevent deleting self
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })
    if (currentUser?.id === params.id) {
      const [response, status] = errorResponse('Cannot delete your own account', 400)
      return NextResponse.json(response, { status })
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json(successResponse(null, 'User deleted successfully'), { status: 200 })
  } catch (error) {
    console.error('Error deleting user:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
