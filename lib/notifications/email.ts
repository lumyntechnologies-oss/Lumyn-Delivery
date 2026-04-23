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

export async function sendDriverApplicationSubmittedEmail(email: string, name: string) {
  const subject = 'Driver Application Received - Lumyn Delivery'
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #D4AF37 0%, #f9f9f9 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #121212; margin: 0; font-size: 28px;">Application Received!</h1>
      </div>

      <div style="padding: 40px 20px;">
        <p>Hi ${name},</p>
        <p>Thank you for applying to become a Lumyn driver! Your application has been received and is now under review.</p>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What happens next?</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Our team will review your documents and information</li>
            <li>This typically takes 1-2 business days</li>
            <li>You'll receive an email with the decision</li>
            <li>Once approved, you can start accepting deliveries!</li>
          </ul>
        </div>

        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Thank you for joining the Lumyn family! 🚗</p>
      </div>
    </div>
  `

  return sendEmail({ to: email, subject, html })
}

export async function sendDriverApplicationApprovedEmail(email: string, name: string) {
  const subject = 'Application Approved! - Lumyn Delivery'
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981 0%, #f9f9f9 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #121212; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
        <p style="font-size: 18px; margin-top: 10px;">Your driver application has been approved!</p>
      </div>

      <div style="padding: 40px 20px;">
        <p>Hi ${name},</p>
        <p>We're thrilled to inform you that your driver application with Lumyn Delivery has been <strong>approved</strong>!</p>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>You're all set! Here's what you can do now:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Go online in your driver dashboard to start receiving deliveries</li>
            <li>Complete your profile with additional details</li>
            <li>Download the driver app for mobile (if applicable)</li>
            <li>Review our driver guidelines and policies</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/driver-dashboard"
             style="background: #D4AF37; color: #121212; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
            Go to Driver Dashboard
          </a>
        </div>

        <p>Welcome aboard! We can't wait to see you succeed.</p>
        <p>Best regards,<br>The Lumyn Team</p>
      </div>
    </div>
  `

  return sendEmail({ to: email, subject, html })
}

export async function sendDriverApplicationRejectedEmail(
  email: string,
  name: string,
  reason: string
) {
  const subject = 'Update on Your Driver Application - Lumyn Delivery'
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #EF4444 0%, #f9f9f9 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #121212; margin: 0; font-size: 28px;">Application Update</h1>
      </div>

      <div style="padding: 40px 20px;">
        <p>Hi ${name},</p>
        <p>Thank you for applying to become a Lumyn driver. After careful review, we're sorry to inform you that your application <strong>could not be approved</strong> at this time.</p>

        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #EF4444; margin-top: 0;">Reason:</h3>
          <p>${reason}</p>
        </div>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>What you can do next:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Review your application and correct any issues</li>
            <li>Update your information if needed</li>
            <li>Feel free to apply again in the future</li>
          </ul>
        </div>

        <p>If you believe this was a mistake or have questions, please don't hesitate to contact our support team.</p>
        <p>Thank you for your interest in Lumyn Delivery.</p>
      </div>
    </div>
  `

  return sendEmail({ to: email, subject, html })
}

