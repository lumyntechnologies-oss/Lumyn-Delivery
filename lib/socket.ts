import { createServer } from 'http'
import { parse } from 'url'
import { Server as NetServer } from 'net'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as IOServer } from 'socket.io'

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const httpServer = res.socket.server as any
    const io = new IOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    // Authentication middleware for Socket.io
    io.use(async (socket: any, next: any) => {
      const token = socket.handshake.auth?.token
      if (token) {
        // Verify Clerk token
        try {
          // You can verify the token here or pass through
          // For simplicity, we'll trust the token for now
          // In production, verify with Clerk API
          next()
        } catch (err) {
          next(new Error('Authentication error'))
        }
      } else {
        next(new Error('Authentication required'))
      }
    })

    // Connection handler
    io.on('connection', (socket: any) => {
      console.log('Client connected:', socket.id)

      // Join delivery room for updates
      socket.on('join-delivery', (deliveryId: string) => {
        socket.join(`delivery-${deliveryId}`)
        console.log(`Socket ${socket.id} joined delivery-${deliveryId}`)
      })

      // Join driver room (for new delivery assignments)
      socket.on('join-driver', (driverId: string) => {
        socket.join(`driver-${driverId}`)
        console.log(`Socket ${socket.id} joined driver-${driverId}`)
      })

      // Driver updates location
      socket.on('update-location', (data: { driverId: string; lat: number; lng: number }) => {
        // Broadcast to all clients interested in this driver
        socket.to(`driver-${data.driverId}`).emit('location-updated', {
          driverId: data.driverId,
          lat: data.lat,
          lng: data.lng,
        })
      })

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    res.socket.server.io = io
  }
  res.end()
}

export default SocketHandler
