import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Simple SSE implementation for real-time delivery updates
// In production, consider using Pusher, Socket.io, or Keny

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deliveryId = searchParams.get('deliveryId')

    if (!deliveryId) {
      return new NextResponse(JSON.stringify({ error: 'deliveryId required' }), { status: 400 })
    }

    // Verify access to delivery
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), { status: 404 })
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        customer: true,
        driver: true,
        pickupAddress: true,
        dropoffAddress: true,
      },
    })

    if (!delivery) {
      return new NextResponse(JSON.stringify({ error: 'Delivery not found' }), { status: 404 })
    }

    // Check access
    const isAdmin = user.role === 'ADMIN'
    const isCustomer = user.role === 'CUSTOMER' && delivery.customerId === user.id
    const isDriver = user.role === 'DRIVER' && delivery.driverId === user.id

    if (!isAdmin && !isCustomer && !isDriver) {
      return new NextResponse(JSON.stringify({ error: 'Access denied' }), { status: 403 })
    }

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(message))
        }

        // Send initial delivery state
        send('delivery', {
          id: delivery.id,
          status: delivery.status,
          driver: delivery.driver ? {
            id: delivery.driver.id,
            firstName: delivery.driver.firstName,
            lastName: delivery.driver.lastName,
            driverRating: delivery.driver.driverRating,
            vehicleType: delivery.driver.vehicleType,
            vehiclePlate: delivery.driver.vehiclePlate,
          } : null,
        })

        // Keep connection alive with heartbeat every 30s
        const heartbeat = setInterval(() => {
          send('heartbeat', { timestamp: Date.now() })
        }, 30000)

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat)
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('SSE connection error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
