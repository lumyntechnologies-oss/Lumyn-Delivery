import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Lumyn Delivery - Fast, Reliable Deliveries',
  description: 'Lumyn Delivery provides fast and reliable delivery services for businesses and individuals.',
  generator: 'v0.app',
  keywords: ['delivery', 'logistics', 'shipping', 'lumyn'],
  authors: [{ name: 'Lumyn Delivery' }],
  icons: {
    icon: '/image1.png',
    apple: '/image2.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#121212',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="bg-background" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.jpg" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </body>
      </html>
    </ClerkProvider>
  )
}
