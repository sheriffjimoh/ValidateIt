"use client"

import Link from 'next/link'
import  { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'


export default function HomeHeader() {

  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()    
      setUser(user ? user : null)
    }
    loadUser()
  }, [])

    return (
        <nav className="sticky top-0 z-50 border-b border-ink/[0.07] bg-paper/80 backdrop-blur-md">
  <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-2">
    
    {/* <Link href="/" className="flex items-center" >
      <Image 
        src="/logo.png"
        width={120}
        height={40}
        alt="ValidateIt Logo"
        className="h-18 w-auto object-contain"
      />
    </Link> */}

      <Link href="/" className="font-serif text-lg font-bold text-ink flex items-center ">
            <span className="bg-ink text-lime px-2 py-0.5 rounded text-xs font-mono font-bold">V</span>
            alidateIt
          </Link>
   
    {user ? (
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-[13px] font-medium text-ink/60 hover:text-ink">
          Dashboard
        </Link>
        <Link href="/api/auth/signout" className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-paper hover:opacity-90 transition-opacity">
          Sign out
        </Link>
      </div>
    ) : (
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-[13px] font-medium text-ink/60 hover:text-ink">
          Log in
        </Link>
        <Link href="/signup" className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-paper hover:opacity-90 transition-opacity">
          Get started →
        </Link>
      </div>
    )}
   
  </div>
</nav>
    )
    
    
}