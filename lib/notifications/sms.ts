import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER!,
      to,
    })

    return { success: true, sid: result.sid }
  } catch (error: any) {
    console.error('Twilio SMS error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendDeliveryUpdateSMS(phoneNumber: string, driverName: string, status: string, deliveryId: string) {
  const statusMessages = {
    ASSIGNED: `Driver ${driverName} has been assigned to your delivery. Track live: ${process.env.NEXT_PUBLIC_APP_URL}/deliveries/${deliveryId}`,
    PICKED_UP: `Driver ${driverName} has picked up your package. On the way!`,
    IN_TRANSIT: `Your delivery is in transit. ETA updating soon.`,
    DELIVERED: `Your delivery has been completed. Thank you for using Lumyn Delivery!`,
  }

  const message = statusMessages[status as keyof typeof statusMessages] || `Delivery status updated to ${status}`

  return sendSMS(phoneNumber, message)
}
