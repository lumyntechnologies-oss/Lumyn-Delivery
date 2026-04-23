import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// PATCH /api/drivers/[id] — Update driver (admin only)
export async function PATCH(
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
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { isDriverVerified, isDriverActive, driverRating, totalDeliveries } = body

    // Validate input
    if (isDriverVerified !== undefined && typeof isDriverVerified !== 'boolean') {
      const [response, status] = errorResponse('isDriverVerified must be a boolean', 400)
      return NextResponse.json(response, { status })
    }

    if (isDriverActive !== undefined && typeof isDriverActive !== 'boolean') {
      const [response, status] = errorResponse('isDriverActive must be a boolean', 400)
      return NextResponse.json(response, { status })
    }

    if (driverRating !== undefined && (typeof driverRating !== 'number' || driverRating < 0 || driverRating > 5)) {
      const [response, status] = errorResponse('driverRating must be a number between 0 and 5', 400)
      return NextResponse.json(response, { status })
    }

    if (totalDeliveries !== undefined && (typeof totalDeliveries !== 'number' || totalDeliveries < 0)) {
      const [response, status] = errorResponse('totalDeliveries must be a non-negative number', 400)
      return NextResponse.json(response, { status })
    }

    // Check if driver exists
    const driver = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, status] = errorResponse('Driver not found', 404)
      return NextResponse.json(response, { status })
    }

    // Update driver
    const updatedDriver = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(isDriverVerified !== undefined && { isDriverVerified }),
        ...(isDriverActive !== undefined && { isDriverActive }),
        ...(driverRating !== undefined && { driverRating }),
        ...(totalDeliveries !== undefined && { totalDeliveries }),
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        driverRating: true,
        totalDeliveries: true,
        isDriverVerified: true,
        isDriverActive: true,
        vehicleType: true,
        vehiclePlate: true,
        licenseNumber: true,
      },
    })

    return NextResponse.json(successResponse(updatedDriver, 'Driver updated successfully'), { status: 200 })
  } catch (error) {
    console.error('Error updating driver:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// DELETE /api/drivers/[id] — Delete driver (admin only)
export async function DELETE(
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
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    // Check if driver exists
    const driver = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, status] = errorResponse('Driver not found', 404)
      return NextResponse.json(response, { status })
    }

    // Remove driver role by setting role to CUSTOMER (preserve history)
    await prisma.user.update({
      where: { id: params.id },
      data: {
        role: 'CUSTOMER',
        isDriverActive: false,
        isDriverVerified: false,
        licenseNumber: null,
        licenseExpiry: null,
        vehicleType: null,
        vehiclePlate: null,
      },
    })

    return NextResponse.json(successResponse(null, 'Driver role removed successfully'), { status: 200 })
  } catch (error) {
    console.error('Error deleting driver:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
