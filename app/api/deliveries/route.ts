import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { validateDelivery } from '@/lib/validation'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'
import { rateLimitMiddleware, getRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let whereClause: any = {}

    // Filter based on user's role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    // Build filter based on role
    if (user.role === 'CUSTOMER') {
      whereClause.customerId = user.id
    } else if (user.role === 'DRIVER') {
      whereClause.driverId = user.id
    }
    // ADMIN can see all

    if (status) {
      whereClause.status = status
    }

    const deliveries = await prisma.delivery.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        pickupAddress: true,
        dropoffAddress: true,
        review: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.delivery.count({ where: whereClause })

    return NextResponse.json(
      successResponse({ deliveries, total, limit, offset }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await rateLimitMiddleware(request)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    
    // Validate input
    const validation = validateDelivery(body)
    if (!validation.success) {
      const [response, status] = errorResponse(
        `Validation error: ${validation.error.errors[0]?.message || 'Invalid input'}`, 
        400
      )
      return NextResponse.json(response, { status })
    }

    const { pickupAddressId, dropoffAddressId, description, cost, priority = 'NORMAL', notes, weight, dimensions } = validation.data

    // Get current user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    // Create delivery
    const delivery = await prisma.delivery.create({
      data: {
        customerId: user.id,
        pickupAddressId,
        dropoffAddressId,
        description,
        cost,
        priority,
        notes,
        weight,
        dimensions,
        status: 'PENDING',
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        pickupAddress: true,
        dropoffAddress: true,
      },
    })

    return NextResponse.json(successResponse(delivery, 'Delivery created successfully'), { status: 201 })
  } catch (error) {
    console.error('Error creating delivery:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
