import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// GET /api/admin/payouts — Get all payouts (admin only)
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status')

    let whereClause: any = {}
    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam
    }

    const payouts = await prisma.driverPayout.findMany({
      where: whereClause,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        delivery: {
          select: {
            id: true,
            description: true,
            cost: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const summary = await prisma.driverPayout.groupBy({
      where: whereClause,
      by: ['status'],
      _sum: { amount: true },
      _count: { id: true },
    })

    return NextResponse.json(
      successResponse({ payouts, summary }),
      { status: 200 }
    )
  } catch (error) {
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
