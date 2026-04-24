import { NextRequest, NextResponse } from 'next/server'
import { deliveryEvents } from '@/lib/sse'

export async function GET(request: NextRequest) {
  const deliveryId = request.nextUrl.searchParams.get('deliveryId')
  
  if (!deliveryId) {
    return NextResponse.json({ error: 'deliveryId is required' }, { status: 400 })
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Send initial connection message
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'connected', deliveryId, timestamp: Date.now() })}\n\n`))

  // Listen for delivery updates
  const handleUpdate = (data: any) => {
    if (data.deliveryId === deliveryId) {
      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'update', ...data })}\n\n`))
    }
  }

  const handleStatusChange = (data: any) => {
    if (data.deliveryId === deliveryId) {
      writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'statusChange', ...data })}\n\n`))
    }
  }

  deliveryEvents.on('deliveryUpdate', handleUpdate)
  deliveryEvents.on('statusChange', handleStatusChange)

  // Keep connection alive with ping every 30s
  const pingInterval = setInterval(() => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`))
  }, 30000)

  // Cleanup on close
  request.signal.addEventListener('abort', () => {
    clearInterval(pingInterval)
    deliveryEvents.off('deliveryUpdate', handleUpdate)
    deliveryEvents.off('statusChange', handleStatusChange)
    writer.close()
  })

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
