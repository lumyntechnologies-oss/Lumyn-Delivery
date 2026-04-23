import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// POST /api/payouts — Create driver payout (after delivery completed)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { deliveryId, amount, currency = 'KES' } = body

    if (!deliveryId || !amount) {
      const [response, status] = errorResponse('deliveryId and amount are required', 400)
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin only', 403)
      return NextResponse.json(response, { status })
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { driver: true },
    })

    if (!delivery || !delivery.driverId) {
      const [response, status] = errorResponse('Delivery not found or no driver assigned', 404)
      return NextResponse.json(response, { status })
    }

    // Check if payout already exists
    const existing = await prisma.driverPayout.findUnique({
      where: { deliveryId },
    })

    if (existing) {
      const [response, status] = errorResponse('Payout already created for this delivery', 400)
      return NextResponse.json(response, { status })
    }

    // Create payout record
    const payout = await prisma.driverPayout.create({
      data: {
        driverId: delivery.driverId,
        deliveryId,
        amount,
        currency,
        status: 'PENDING',
        provider: 'pesapal', // Pesapal also supports payouts
      },
    })

    // TODO: Call Pesapal payout API to send money to driver

    return NextResponse.json(
      successResponse(payout, 'Driver payout created'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating payout:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// GET /api/payouts/:id/status — Check payout status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const { id } = await params

    const payout = await prisma.driverPayout.findUnique({
      where: { id },
      include: { driver: true, delivery: true },
    })

    if (!payout) {
      const [response, status] = errorResponse('Payout not found', 404)
      return NextResponse.json(response, { status })
    }

    // Check access (driver or admin)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || (user.id !== payout.driverId && user.role !== 'ADMIN')) {
      const [response, status] = errorResponse('Unauthorized', 403)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(payout), { status: 200 })
  } catch (error) {
    console.error('Error fetching payout:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
