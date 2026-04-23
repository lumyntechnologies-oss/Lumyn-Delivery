'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'
import { Navbar } from '@/components/navbar'
import { User, Truck, Loader2 } from 'lucide-react'
import Link from 'next/link'

type UserRole = 'CUSTOMER' | 'DRIVER' | null

export default function CustomSignUpPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
  }

  const handleStart = () => {
    if (selectedRole) {
      // Store role preference in sessionStorage to use after sign-up
      sessionStorage.setItem('selectedRole', selectedRole)
      setIsLoading(true)
      // The Clerk SignUp component will be shown below
    }
  }

  // If role is selected, show Clerk sign-up with redirect to onboarding
  if (selectedRole) {
    const afterSignUpUrl = selectedRole === 'DRIVER' ? '/driver-onboarding' : '/welcome'

    return (
      <div className="min-h-screen bg-linear-to-b from-white via-white to-secondary/5 dark:from-primary-dark dark:via-primary-dark dark:to-primary-light">
        <Navbar />

        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setSelectedRole(null)}
              className="text-accent-gold hover:text-accent-gold-light text-sm font-medium flex items-center gap-2"
            >
              ← Back to role selection
            </button>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-none border border-border',
                formFieldInput: 'input-base',
                formFieldLabel: 'text-sm font-medium text-secondary',
                formButtonPrimary: 'btn-primary w-full',
                footerAction: 'text-secondary',
                headerTitle: 'text-primary',
                headerSubtitle: 'text-secondary',
              },
            }}
            path="/sign-up"
            routing="path"
            afterSignUpUrl={afterSignUpUrl}
          />
        </div>
      </div>
    )
  }

  // Role selection screen
  return (
    <div className="min-h-screen bg-linear-to-b from-white via-white to-secondary/5 dark:from-primary-dark dark:via-primary-dark dark:to-primary-light">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-4">
            Join Lumyn Delivery
          </h1>
          <p className="text-lg text-secondary">
            Choose how you want to use Lumyn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Card */}
          <button
            onClick={() => handleRoleSelect('CUSTOMER')}
            className="card text-left p-8 hover:border-accent-gold/50 hover:shadow-lg transition-all group"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-2xl bg-accent-gold/20 flex items-center justify-center group-hover:bg-accent-gold/30 transition-colors">
                  <User className="h-8 w-8 text-accent-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Customer</h2>
                  <p className="text-sm text-secondary">Send packages</p>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-secondary mb-4">
                  Book deliveries, track packages in real-time, and communicate with professional drivers.
                </p>
                <ul className="space-y-2 text-sm text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
                    Instant delivery quotes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
                    Real-time tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
                    Secure payments
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
                    Rating & reviews
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <span className="btn-primary w-full flex items-center justify-center gap-2">
                  {isLoading && selectedRole === 'CUSTOMER' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Continue as Customer
                </span>
              </div>
            </div>
          </button>

          {/* Driver Card */}
          <button
            onClick={() => handleRoleSelect('DRIVER')}
            className="card text-left p-8 hover:border-accent-teal/50 hover:shadow-lg transition-all group"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-2xl bg-accent-teal/20 flex items-center justify-center group-hover:bg-accent-teal/30 transition-colors">
                  <Truck className="h-8 w-8 text-accent-teal" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Driver</h2>
                  <p className="text-sm text-secondary">Earn money delivering</p>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-secondary mb-4">
                  Become a delivery partner, set your own schedule, and earn money on your terms.
                </p>
                <ul className="space-y-2 text-sm text-secondary">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-teal"></span>
                    Flexible hours & schedule
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-teal"></span>
                    Weekly payouts
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-teal"></span>
                    Bonuses & incentives
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-teal"></span>
                    24/7 support
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <span className="btn-primary bg-accent-teal hover:bg-accent-teal-light w-full flex items-center justify-center gap-2 text-white">
                  {isLoading && selectedRole === 'DRIVER' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Become a Driver
                </span>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-secondary mt-8">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-accent-gold hover:text-accent-gold-light font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
