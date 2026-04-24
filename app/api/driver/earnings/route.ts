import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/driver/earnings — Get driver earnings statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    // Get driver profile
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, totalDeliveries: true, driverRating: true },
    })

    if (!user || user.role !== 'DRIVER') {
      const [response, status] = errorResponse('Only drivers can access earnings', 403)
      return NextResponse.json(response, { status })
    }

    // Get date ranges
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // Get all completed deliveries for this driver
    const completedDeliveries = await prisma.delivery.findMany({
      where: {
        driverId: user.id,
        status: 'DELIVERED',
      },
      select: {
        id: true,
        cost: true,
        tip: true,
        createdAt: true,
        deliveryTime: true,
        driverPayout: {
          select: {
            amount: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: { deliveryTime: 'desc' },
    })

    // Calculate earnings
    const totalEarnings = completedDeliveries.reduce((sum, d) => sum + d.cost, 0)
    const totalTips = completedDeliveries.reduce((sum, d) => sum + (d.tip || 0), 0)

    // Weekly earnings
    const weeklyDeliveries = completedDeliveries.filter(d =>
      d.deliveryTime && new Date(d.deliveryTime) >= weekStart
    )
    const weeklyEarnings = weeklyDeliveries.reduce((sum, d) => sum + d.cost, 0)

    // Monthly earnings
    const monthlyDeliveries = completedDeliveries.filter(d =>
      d.deliveryTime && new Date(d.deliveryTime) >= monthStart
    )
    const monthlyEarnings = monthlyDeliveries.reduce((sum, d) => sum + d.cost, 0)

    // Get payout history
    const payouts = await prisma.driverPayout.findMany({
      where: { driverId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0)
    const pendingPayouts = completedDeliveries
      .filter(d => !d.driverPayout || d.driverPayout.status === 'PENDING')
      .reduce((sum, d) => sum + d.cost, 0)

    const earningsData = {
      stats: {
        totalEarnings,
        totalTips,
        weeklyEarnings,
        monthlyEarnings,
        totalDeliveries: user.totalDeliveries,
        completedDeliveries: completedDeliveries.length,
        pendingPayouts,
        paidOut: totalPayouts,
      },
      recentDeliveries: completedDeliveries.slice(0, 10).map(d => ({
        id: d.id,
        cost: d.cost,
        tip: d.tip || 0,
        date: d.deliveryTime,
        payoutStatus: d.driverPayout?.status || 'PENDING',
      })),
      payouts,
    }

    return NextResponse.json(successResponse(earningsData, 'Earnings fetched'), { status: 200 })
  } catch (error) {
    console.error('Error fetching earnings:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
