import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail({ to, subject, html, text, from = 'Lumyn Delivery <noreply@lumyn-delivery.com>' }: EmailTemplate) {
  try {
    const data = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
    })

    console.log('Email sent:', data)
    return data
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export async function sendDeliveryAssignedEmail(customerEmail: string, driverName: string, deliveryDescription: string, deliveryId: string) {
  const subject = `Delivery Assigned: ${deliveryDescription}`
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #D4AF37;">Delivery Assigned!</h1>
      <p>Good news! A driver has been assigned to your delivery.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Delivery Details</h3>
        <p><strong>Description:</strong> ${deliveryDescription}</p>
        <p><strong>Driver:</strong> ${driverName}</p>
        <p><strong>Track your delivery:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/deliveries/${deliveryId}">View Live Map</a></p>
      </div>
      
      <p>Thank you for using Lumyn Delivery!</p>
    </div>
  `

  return sendEmail({ to: customerEmail, subject, html })
}

export async function sendDeliveryCompletedEmail(customerEmail: string, deliveryDescription: string, deliveryId: string) {
  const subject = `Delivered: ${deliveryDescription}`
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10B981;">Delivery Completed!</h1>
      <p>Your delivery has been successfully completed.</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Delivery Details</h3>
        <p><strong>Description:</strong> ${deliveryDescription}</p>
        <p><strong>Status:</strong> Delivered</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/deliveries/${deliveryId}">View receipt</a></p>
      </div>
      
      <p>Thanks for choosing Lumyn Delivery!</p>
    </div>
  `

  return sendEmail({ to: customerEmail, subject, html })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '')
}
