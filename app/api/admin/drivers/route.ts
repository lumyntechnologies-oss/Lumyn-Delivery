import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/admin/drivers — Get all drivers with documents (admin only)
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
    const status = searchParams.get('status') || ''

    let whereClause: any = { role: 'DRIVER' }

    // Apply status filter
    if (status) {
      whereClause.applicationStatus = status
    }

    const drivers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        driverRating: true,
        totalDeliveries: true,
        isDriverVerified: true,
        isDriverActive: true,
        licenseNumber: true,
        licenseExpiry: true,
        vehicleType: true,
        vehicleMake: true,
        vehicleModel: true,
        vehicleYear: true,
        vehiclePlate: true,
        vehicleColor: true,
        bio: true,
        yearsOfExperience: true,
        languages: true,
        applicationStatus: true,
        onboardingCompleted: true,
        createdAt: true,
        driverDocuments: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.user.count({ where: whereClause })

    // Parse languages JSON
    const parsedDrivers = drivers.map(driver => ({
      ...driver,
      languages: driver.languages ? JSON.parse(driver.languages) : [],
    }))

    return NextResponse.json(
      successResponse({ drivers: parsedDrivers, total, limit, offset }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching drivers:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
