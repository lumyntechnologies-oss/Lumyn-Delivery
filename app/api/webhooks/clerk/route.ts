import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { initializeUserInDatabase, isAdmin } from '@/lib/auth'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  if (!webhookSecret) {
    return new Response('Webhook secret is not configured', { status: 500 })
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If headers are missing, it's not a valid Svix webhook request
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    })
  }

  // Get body
  const body = await req.text()

  // Create a new Webhook instance with your secret
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Could not verify webhook', {
      status: 400,
    })
  }

  // Handle the event
  try {
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data

      const primaryEmail = email_addresses?.[0]?.email_address

      if (!primaryEmail) {
        console.error('No email address found for user', id)
        return new Response('Error: No email address found', { status: 400 })
      }

      await initializeUserInDatabase(
        id,
        primaryEmail,
        first_name || undefined,
        last_name || undefined
      )

      console.log(`User ${evt.type}: ${id}`)
    } else if (evt.type === 'user.deleted') {
      const { id } = evt.data
      console.log(`User deleted: ${id}`)
      // Note: We're not deleting the user from the database to maintain referential integrity
      // Instead, you might want to soft delete or keep the record for historical purposes
    }

    return new Response('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}
