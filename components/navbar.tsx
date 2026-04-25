'use client'

import Link from 'next/link'
import { UserButton, useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const { isSignedIn, userId } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (userId && isSignedIn) {
      // Check if user is admin by verifying in the client
      const adminUserIds = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || []
      setIsAdmin(adminUserIds.includes(userId))
    }
  }, [userId, isSignedIn])

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white dark:bg-primary-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-accent-gold flex items-center justify-center">
              <span className="font-bold text-primary">L</span>
            </div>
            <span className="text-xl font-bold text-primary hidden sm:inline">Lumyn</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isSignedIn ? (
              <>
                <Link href="/deliveries" className="text-sm font-medium text-secondary hover:text-primary transition">
                  Deliveries
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-secondary hover:text-primary transition">
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/profile" className="text-sm font-medium text-secondary hover:text-primary transition">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm font-medium text-secondary hover:text-primary transition">
                  Sign In
                </Link>
                <Link href="/sign-up" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
            {/* Mobile App Download Button */}
            <Link 
              href="/mobile-app" 
              className="text-sm font-medium text-secondary hover:text-primary transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 2a2 2 0 012-2h5.5a.5.5 0 01.4.8l-1.5 2.5a.5.5 0 01-.8.4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-1.383a1 1 0 00.579-.293l1.5-2.5a1 1 0 00-.371-1.243V2z" />
              </svg>
              Download App
            </Link>
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {isSignedIn && <UserButton />}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-primary"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

         {/* Mobile Navigation */}
         {isMobileMenuOpen && (
           <div className="md:hidden border-t border-border py-4 space-y-3">
             {isSignedIn ? (
               <>
                 <Link
                   href="/deliveries"
                   className="block px-4 py-2 text-sm font-medium text-secondary hover:text-primary rounded-2xl hover:bg-secondary/5"
                 >
                   Deliveries
                 </Link>
                 {isAdmin && (
                   <Link
                     href="/admin"
                     className="block px-4 py-2 text-sm font-medium text-secondary hover:text-primary rounded-2xl hover:bg-secondary/5"
                   >
                     Admin Dashboard
                   </Link>
                 )}
                 <Link
                   href="/profile"
                   className="block px-4 py-2 text-sm font-medium text-secondary hover:text-primary rounded-2xl hover:bg-secondary/5"
                 >
                   Profile
                 </Link>
               </>
             ) : (
               <>
                 <Link
                   href="/sign-in"
                   className="block px-4 py-2 text-sm font-medium text-secondary hover:text-primary rounded-2xl hover:bg-secondary/5"
                 >
                   Sign In
                 </Link>
                 <Link
                   href="/sign-up"
                   className="block w-full text-center btn-primary text-sm"
                 >
                   Get Started
                 </Link>
               </>
             )}
             <Link
               href="/mobile-app"
               className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-secondary hover:text-primary rounded-2xl hover:bg-secondary/5"
             >
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                 <path d="M2 2a2 2 0 012-2h5.5a.5.5 0 01.4.8l-1.5 2.5a.5.5 0 01-.8.4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-1.383a1 1 0 00.579-.293l1.5-2.5a1 1 0 00-.371-1.243V2z" />
               </svg>
               Download Mobile App
             </Link>
           </div>
         )}
      </div>
    </nav>
  )
}
