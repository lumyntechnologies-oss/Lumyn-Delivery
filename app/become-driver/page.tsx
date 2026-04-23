'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BecomeDriverPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new multi-step driver onboarding flow
    router.replace('/driver-onboarding')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold mx-auto mb-4"></div>
        <p className="text-secondary">Redirecting to driver onboarding...</p>
      </div>
    </div>
  )
}
