import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// PATCH /api/admin/payout/[payoutId]/status — Update payout status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })
    if (!user || user.role !== 'ADMIN') {
      const [response, status] = errorResponse('Admin access required', 403)
      return NextResponse.json(response, { status })
    }

    const { payoutId } = await params
    const body = await request.json()
    const { status: newStatus } = body

    if (!['PROCESSING', 'COMPLETED', 'FAILED'].includes(newStatus)) {
      return NextResponse.json(
        errorResponse('Invalid status. Use PROCESSING, COMPLETED, or FAILED'),
        { status: 400 }
      )
    }

    const payout = await prisma.driverPayout.update({
      where: { id: payoutId },
      data: {
        status: newStatus,
        ...(newStatus === 'COMPLETED' && { paidAt: new Date() }),
      },
      include: {
        driver: {
          select: { firstName: true, lastName: true, email: true },
        },
        delivery: {
          select: { id: true, description: true },
        },
      },
    })

    return NextResponse.json(
      successResponse(payout, `Payout marked as ${newStatus}`),
      { status: 200 }
    )
  } catch (error) {
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
