import https from 'https'
import http from 'http'

const PESAPAL_BASE = process.env.PESAPAL_ENVIRONMENT === 'production'
  ? 'https://pay.pesapal.com/pesapalv3/api'
  : 'https://demo.pesapal.com/pesapalv3/api'

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY!
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET!

export interface PesapalPaymentRequest {
  amount: number
  currency: string
  description: string
  reference: string
  callbackUrl?: string
  cancellationUrl?: string
  email?: string
  firstName?: string
  lastName?: string
  metadata?: Record<string, any>
}

export interface PesapalPaymentResponse {
  orderId: string
  redirectUrl: string
  status: string
}

export interface PesapalIPNPayload {
  orderId: string
  amount: string
  status: string
  reference: string
  merchantReference: string
  paymentMethod: string
  currency: string
  payerEmail: string
  payerPhone: string
  payerName: string
  Fees: string
  netAmount: string
  paymentDate: string
  accounts?: any[]
}

// Get OAuth token (cached)
let cachedToken: string | null = null
let tokenExpiry: number | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken
  }

  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
    
    const postData = JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    })

    const options = {
      hostname: new URL(PESAPAL_BASE).hostname,
      path: '/api/Auth/RequestToken',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.token) {
            cachedToken = parsed.token
            tokenExpiry = now + (parsed.expiryInSeconds * 1000) - 60000 // 1min buffer
            resolve(parsed.token)
          } else {
            reject(new Error(`Pesapal auth failed: ${data}`))
          }
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

export async function createPesapalPayment(req: PesapalPaymentRequest): Promise<PesapalPaymentResponse> {
  const token = await getAccessToken()

  const postData = JSON.stringify({
    amount: req.amount,
    currency: req.currency || 'KES',
    description: req.description,
    reference: req.reference,
    callback_url: req.callbackUrl,
    cancel_url: req.cancellationUrl,
    email: req.email,
    first_name: req.firstName,
    last_name: req.lastName,
    metadata: req.metadata,
  })

  const options = {
    hostname: new URL(PESAPAL_BASE).hostname,
    path: '/api/Payments/PostPayment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(postData),
    },
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({
            orderId: parsed.orderId,
            redirectUrl: parsed.redirectUrl,
            status: parsed.status,
          })
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

export async function queryPesapalPayment(orderId: string): Promise<any> {
  const token = await getAccessToken()

  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(PESAPAL_BASE).hostname,
      path: `/api/Payments/GetPaymentStatus?orderId=${encodeURIComponent(orderId)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.end()
  })
}
