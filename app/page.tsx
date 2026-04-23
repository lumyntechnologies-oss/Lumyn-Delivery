import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Package, Users, Zap } from 'lucide-react'

async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/deliveries')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-secondary/5 dark:from-primary-dark dark:via-primary-dark dark:to-primary-light">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-primary mb-6 text-balance">
            Fast & Reliable Delivery Services
          </h1>
          <p className="text-lg sm:text-xl text-secondary mb-8 text-pretty max-w-2xl mx-auto">
            Lumyn Delivery connects you with professional drivers to get your packages delivered quickly and safely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="btn-primary px-8 py-3 text-lg font-semibold">
              Get Started Free
            </Link>
            <Link href="/sign-in" className="btn-secondary px-8 py-3 text-lg font-semibold">
              Sign In
            </Link>
          </div>

          <div className="mt-8 text-center">
            <span className="text-sm text-secondary">Are you a driver? </span>
            <Link href="/become-driver" className="text-accent-gold hover:text-accent-gold-light font-semibold">
              Sign Up as Driver
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-accent-gold" />
              </div>
            </div>
            <h3 class="text-xl font-bold text-primary mb-2">Lightning Fast</h3>
            <p class="text-secondary">Get deliveries completed in hours, not days. Real-time tracking and updates.</p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-2xl bg-accent-teal/20 flex items-center justify-center">
                <Users class="h-6 w-6 text-accent-teal" />
              </div>
            </div>
            <h3 class="text-xl font-bold text-primary mb-2">Professional Drivers</h3>
            <p class="text-secondary">All drivers are verified, insured, and trained to handle your packages with care.</p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-2xl bg-accent-gold/20 flex items-center justify-center">
                <Package class="h-6 w-6 text-accent-gold" />
              </div>
            </div>
            <h3 class="text-xl font-bold text-primary mb-2">Safe & Secure</h3>
            <p class="text-secondary">Full insurance coverage and GPS tracking for complete peace of mind.</p>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div class="bg-primary rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4">Ready to deliver with Lumyn?</h2>
          <p class="text-lg mb-8 opacity-90">Join thousands of customers and drivers already using Lumyn Delivery.</p>
          <Link href="/sign-up" class="inline-block bg-accent-gold hover:bg-accent-gold-light text-primary px-8 py-3 rounded-2xl font-semibold transition-all">
            Start Now
          </Link>
        </div>
      </section>

      <footer class="border-t border-border mt-16 py-8 bg-white dark:bg-primary-light">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="text-center text-secondary text-sm">
            <p>&copy; 2024 Lumyn Delivery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
