import { Metadata } from 'next'
import Link from 'next/link'
import { Download, Smartphone, Shield, Zap, QrCode, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Download Lumyn Delivery Mobile App',
  description: 'Download the Lumyn Delivery Android app. Fast, reliable delivery services in your pocket.',
}

export default function MobileAppPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-white to-secondary/5 dark:from-primary-dark dark:via-primary-dark dark:to-primary-light">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white dark:bg-primary-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-accent-gold flex items-center justify-center">
                <span className="font-bold text-primary">L</span>
              </div>
              <span className="text-xl font-bold text-primary hidden sm:inline">Lumyn</span>
            </Link>
            <Link 
              href="/mobile-app" 
              className="text-sm font-medium text-primary"
            >
              Mobile App
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-accent-gold/20 rounded-2xl mb-6">
            <Smartphone className="h-8 w-8 text-accent-gold" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">
            Get Lumyn Delivery on Your Phone
          </h1>
          <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto mb-8">
            Experience the same powerful delivery management features in our native Android app. 
            Works offline, supports camera, GPS, and push notifications.
          </p>
        </section>

        {/* Download Card */}
        <section className="max-w-2xl mx-auto mb-16">
          <div className="card p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-accent-gold to-secondary rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 2a2 2 0 012-2h5.5a.5.5 0 01.4.8l-1.5 2.5a.5.5 0 01-.8.4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-1.383a1 1 0 00.579-.293l1.5-2.5a1 1 0 00-.371-1.243V2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Lumyn Delivery APK</h2>
              <p className="text-secondary mb-4">Version 1.0.0 • 13 MB • Android 8.0+</p>
              
              {/* QR Code Placeholder */}
              <div className="bg-white border-2 border-dashed border-secondary/30 rounded-xl p-6 mb-6 inline-block">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-secondary/30" />
                </div>
                <p className="text-xs text-secondary mt-2">Scan to download APK</p>
              </div>
            </div>

            {/* Download Button */}
            <a
              href="/LumynDelivery-debug.apk"
              download
              className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold mb-4"
            >
              <Download className="h-5 w-5" />
              Download APK
            </a>

            <p className="text-sm text-secondary">
              <Link 
                href="/LumynDelivery-debug.apk" 
                target="_blank"
                className="text-accent-gold hover:text-accent-gold-light flex items-center justify-center gap-1"
              >
                Open direct download link <ExternalLink className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </section>

        {/* Installation Instructions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-primary text-center mb-8">How to Install</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center p-6">
              <div className="mx-auto w-12 h-12 bg-accent-gold/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Download APK</h3>
              <p className="text-secondary text-sm">
                Tap the download button above or scan the QR code to get the APK file on your Android device.
              </p>
            </div>

            <div className="card text-center p-6">
              <div className="mx-auto w-12 h-12 bg-accent-gold/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Enable Unknown Sources</h3>
              <p className="text-secondary text-sm">
                Go to Settings → Security → Enable "Install from unknown sources" for your browser or file manager.
              </p>
            </div>

            <div className="card text-center p-6">
              <div className="mx-auto w-12 h-12 bg-accent-gold/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Install & Launch</h3>
              <p className="text-secondary text-sm">
                Open the downloaded APK, tap Install, then launch Lumyn Delivery and sign in to your account.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-primary text-center mb-8">Features in the Mobile App</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent-gold/20 rounded-lg">
                  <Shield className="h-6 w-6 text-accent-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Same Security</h3>
                  <p className="text-secondary text-sm">
                    Built with the same authentication (Clerk) and encryption as the web app.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent-teal/20 rounded-lg">
                  <svg className="h-6 w-6 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Camera Access</h3>
                  <p className="text-secondary text-sm">
                    Upload driver documents directly from your phone's camera.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">GPS Tracking</h3>
                  <p className="text-secondary text-sm">
                    Real-time location updates for drivers with live map integration.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-info/20 rounded-lg">
                  <svg className="h-6 w-6 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.293l1.706 1.706a1 1 0 001.414-1.414l-1.706-1.706V8a8 8 0 10-3.532 5.708A9.985 9.985 0 0010 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Push Notifications</h3>
                  <p className="text-secondary text-sm">
                    Get instant alerts for new deliveries and status changes.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-success/20 rounded-lg">
                  <Zap className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Fast & Offline</h3>
                  <p className="text-secondary text-sm">
                    Works offline with cached data. Syncs when you're back online.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">Mobile-First Design</h3>
                  <p className="text-secondary text-sm">
                    Optimized for touch with the same beautiful UI as the web app.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Web App */}
        <section className="text-center">
          <Link href="/" className="btn-secondary inline-flex items-center gap-2">
            Back to Web App
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8 bg-white dark:bg-primary-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-secondary text-sm">
            <p>&copy; 2024 Lumyn Delivery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}