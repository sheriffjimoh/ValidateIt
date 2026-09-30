'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  planType?: string
  creditsUsed?: number
  creditsLimit?: number
}

export default function DashboardNav({ planType, creditsUsed = 0, creditsLimit = 3 }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { href: '/dashboard',        label: '⚡ Validate',    active: pathname === '/dashboard'        },
    { href: '/dashboard/saved',  label: '📂 Saved',       active: pathname === '/dashboard/saved'  },
    { href: '/dashboard/deep-dive',        label: '🔍 Deep Dive',   active: pathname === '/dashboard/deep-dive'    },
    { href: '/dashboard/plan',   label: '💳 Plan',        active: pathname === '/dashboard/plan'   },
  ]

  return (
    <header className="border-b border-ink/10 bg-white sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="shrink-0">
            <Image
              src="/logo.png"
              width={120}
              height={40}
              alt="ValidateIt"
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 bg-paper p-1 rounded-xl border border-ink/10">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all no-underline
                  ${link.active
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-ink/60 hover:text-ink'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {planType && (
              <span className="text-xs font-mono bg-lime/30 text-ink border border-lime/60 px-2.5 py-1 rounded-md whitespace-nowrap">
                {planType === 'free'
                  ? `Free · ${creditsUsed}/${creditsLimit}`
                  : 'Pro ✓'
                }
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-xs font-medium text-ink/50 hover:text-ink cursor-pointer bg-transparent border-0 font-sans"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer bg-transparent border-0"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-ink transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>

        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-ink/10 py-4 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold no-underline transition-all
                  ${link.active
                    ? 'bg-ink text-paper'
                    : 'text-ink/60 hover:text-ink hover:bg-ink/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-ink/10 mt-2 pt-4 flex items-center justify-between px-4">
              {planType && (
                <span className="text-xs font-mono bg-lime/30 text-ink border border-lime/60 px-2.5 py-1 rounded-md">
                  {planType === 'free'
                    ? `Free · ${creditsUsed}/${creditsLimit}`
                    : 'Pro ✓'
                  }
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="text-xs text-ink/50 hover:text-ink cursor-pointer bg-transparent border-0 font-sans"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}