import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/driver/payouts — Get driver's payout history
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || user.role !== 'DRIVER') {
      const [response, status] = errorResponse('Only drivers can access payouts', 403)
      return NextResponse.json(response, { status })
    }

    const payouts = await prisma.driverPayout.findMany({
      where: { driverId: user.id },
      include: {
        delivery: {
          select: {
            id: true,
            description: true,
            cost: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const [totalPaidResult, pendingAmountResult] = await Promise.all([
      prisma.driverPayout.aggregate({
        where: { driverId: user.id, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.driverPayout.aggregate({
        where: { driverId: user.id, status: 'PENDING' },
        _sum: { amount: true },
      }),
    ])

    const totalPaid = totalPaidResult._sum.amount ?? 0
    const pendingAmount = pendingAmountResult._sum.amount ?? 0

    return NextResponse.json(
      successResponse({
        payouts,
        stats: { totalPaid, pendingAmount },
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching payouts:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
