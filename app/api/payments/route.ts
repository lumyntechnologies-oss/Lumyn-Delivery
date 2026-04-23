import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { createPesapalPayment } from '@/lib/payments/pesapal'
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '@/lib/api-response'

// POST /api/payments — Create payment for a delivery
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      const [response, status] = unauthorizedResponse()
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { deliveryId, tipAmount = 0 } = body

    if (!deliveryId) {
      const [response, status] = errorResponse('deliveryId is required', 400)
      return NextResponse.json(response, { status })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, email: true, firstName: true, lastName: true, phone: true },
    })

    if (!user) {
      const [response, status] = errorResponse('User not found', 404)
      return NextResponse.json(response, { status })
    }

    if (user.role !== 'CUSTOMER') {
      const [response, status] = errorResponse('Only customers can make payments', 403)
      return NextResponse.json(response, { status })
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { customer: true, pickupAddress: true, dropoffAddress: true },
    })

    if (!delivery) {
      const [response, status] = errorResponse('Delivery not found', 404)
      return NextResponse.json(response, { status })
    }

    if (delivery.customerId !== user.id) {
      const [response, status] = errorResponse('Not authorized to pay for this delivery', 403)
      return NextResponse.json(response, { status })
    }

    if (delivery.paymentStatus === 'COMPLETED') {
      const [response, status] = errorResponse('Payment already completed', 400)
      return NextResponse.json(response, { status })
    }

    const totalAmount = delivery.cost + (parseFloat(tipAmount) || 0)

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        deliveryId,
        userId: user.id,
        type: 'DELIVERY_PAYMENT',
        amount: totalAmount,
        currency: 'KES', // TODO: make dynamic
        status: 'PENDING',
        provider: 'pesapal',
        metadata: {
          tip: tipAmount,
          deliveryDescription: delivery.description,
        },
      },
    })

    // Create Pesapal payment request
    const pesapalResponse = await createPesapalPayment({
      amount: totalAmount,
      currency: 'KES',
      description: `Lumyn Delivery: ${delivery.description}`,
      reference: payment.id,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payments/${payment.id}/confirm`,
      cancellationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/deliveries/${deliveryId}`,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      metadata: { deliveryId, tip: tipAmount },
    })

    // Update payment with Pesapal order ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerPaymentId: pesapalResponse.orderId },
    })

    // Update delivery payment intent ID
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        paymentIntentId: payment.id,
        paymentAmount: totalAmount,
        paymentStatus: 'PROCESSING',
      },
    })

    return NextResponse.json(
      successResponse({
        paymentId: payment.id,
        redirectUrl: pesapalResponse.redirectUrl,
      }, 'Payment initialized'),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating payment:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}

// GET /api/payments/:id — Get payment status
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { delivery: true },
    })

    if (!payment) {
      const [response, status] = errorResponse('Payment not found', 404)
      return NextResponse.json(response, { status })
    }

    // Check access (payment.user or delivery.customer or admin)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    })

    if (!user || (user.id !== payment.userId && user.role !== 'ADMIN')) {
      const [response, status] = errorResponse('Unauthorized', 403)
      return NextResponse.json(response, { status })
    }

    return NextResponse.json(successResponse(payment), { status: 200 })
  } catch (error) {
    console.error('Error fetching payment:', error)
    const [response, status] = serverErrorResponse()
    return NextResponse.json(response, { status })
  }
}
