import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDeliveryStatusPush } from '@/lib/notifications/push'

// POST /api/payments/pesapal/ipn — Pesapal Instant Payment Notification webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Pesapal IPN received:', JSON.stringify(body, null, 2))

     const {
       orderId,
       amount,
       status,
       reference,
       merchantReference,
       paymentMethod = 'unknown',
       currency = 'KES',
       payerEmail = '',
       payerPhone = '',
       payerName = '',
       paymentDate = new Date().toISOString(),
     } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // Find payment by providerPaymentId (orderId from Pesapal)
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: orderId },
      include: { delivery: true },
    })

    if (!payment) {
      console.error(`Payment not found for Pesapal orderId: ${orderId}`)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status based on Pesapal status
    const newPaymentStatus = status === 'COMPLETED' ? 'COMPLETED' : 'FAILED'
    
    const currentMetadata = payment.metadata as Record<string, any> || {}
    
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newPaymentStatus,
        metadata: {
          ...currentMetadata,
          pesapalResponse: body,
          paymentMethod,
          payerEmail,
          payerPhone,
          payerName,
          paymentDate,
        },
      },
    })

    // Update delivery status
    if (newPaymentStatus === 'COMPLETED') {
      await prisma.delivery.update({
        where: { id: payment.deliveryId },
        data: {
          paymentStatus: 'COMPLETED',
          paymentMethod: paymentMethod,
        },
      })

      // Send push notification to customer
      await sendDeliveryStatusPush(payment.deliveryId, 'ASSIGNED') // Payment success, treat as assigned/confirmed
    }

    // Respond quickly to Pesapal
    return NextResponse.json({ status: 'OK' }, { status: 200 })
  } catch (error) {
    console.error('Pesapal IPN error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
