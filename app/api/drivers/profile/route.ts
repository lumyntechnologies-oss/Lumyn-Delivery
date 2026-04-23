import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type { DeliveryStatus } from '@prisma/client'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        role: true,
        // Driver fields
        licenseNumber: true,
        licenseExpiry: true,
        vehicleType: true,
        vehiclePlate: true,
        isDriverVerified: true,
        isDriverActive: true,
        driverRating: true,
        totalDeliveries: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    if (user.role !== 'DRIVER') {
      const [response, status] = errorResponse('User is not a driver', 403)
      return NextResponse.json(response, { status })
    }

    // Calculate additional stats
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const activeStatuses: DeliveryStatus[] = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT']
    const activeCount = await prisma.delivery.count({
      where: {
        driverId: user.id,
        status: { in: activeStatuses },
      },
    })

    const todayDeliveries = await prisma.delivery.count({
      where: {
        driverId: user.id,
        createdAt: { gte: todayStart },
      },
    })

    const totalEarnings = await prisma.delivery.aggregate({
      where: {
        driverId: user.id,
        status: 'DELIVERED',
      },
      _sum: { cost: true },
    })

    const profileData = {
      ...user,
      stats: {
        totalJobs: user.totalDeliveries,
        active: activeCount,
        today: todayDeliveries,
        earnings: totalEarnings._sum.cost || 0,
        rating: user.driverRating || 0,
      },
    }

    return NextResponse.json(successResponse(profileData, 'Driver profile fetched'), { status: 200 })
  } catch (error) {
    console.error('Error fetching driver profile:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { licenseNumber, licenseExpiry, vehicleType, vehiclePlate } = body

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    if (user.role !== 'DRIVER') {
      const [response, status] = errorResponse('User is not a driver', 403)
      return NextResponse.json(response, { status })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        licenseNumber: licenseNumber || undefined,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : undefined,
        vehicleType: vehicleType || undefined,
        vehiclePlate: vehiclePlate || undefined,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        role: true,
        licenseNumber: true,
        licenseExpiry: true,
        vehicleType: true,
        vehiclePlate: true,
        isDriverVerified: true,
        isDriverActive: true,
        driverRating: true,
        totalDeliveries: true,
      },
    })

    return NextResponse.json(successResponse(updatedUser, 'Driver profile updated successfully'), { status: 200 })
  } catch (error) {
    console.error('Error updating driver profile:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
