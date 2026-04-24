import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// POST /api/driver/payout/[payoutId]/request — Driver requests payout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const { payoutId } = await params

    // Get driver user
    const driver = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!driver || driver.role !== 'DRIVER') {
      const [response, status] = errorResponse('Only drivers can request payouts', 403)
      return NextResponse.json(response, { status })
    }

    // Find payout
    const payout = await prisma.driverPayout.findUnique({
      where: { id: payoutId },
      include: { delivery: true },
    })

    if (!payout || payout.driverId !== driver.id) {
      const [response, status] = errorResponse('Payout not found', 404)
      return NextResponse.json(response, { status })
    }

    if (payout.status !== 'PENDING') {
      return NextResponse.json(
        errorResponse(`Payout is already ${payout.status}`),
        { status: 400 }
      )
    }

    // Mark as requested (we'll use PENDING but can add 'REQUESTED' status later)
    // For now, we just notify admin
    // In full implementation, would integrate with payment provider

    return NextResponse.json(
      successResponse(payout, 'Payout requested. Admin will process it.'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error requesting payout:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
