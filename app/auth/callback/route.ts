import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const admin = createAdminClient()
        const { error: profileError } = await admin
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            plan_type: 'free',
            credits_used: 0,
            credits_limit: 3,
          }, { onConflict: 'id', ignoreDuplicates: true })

        if (profileError) {
          console.error('[auth/callback] profile provisioning failed:', profileError)
          return NextResponse.redirect(`${origin}/login?error=profile_setup_failed`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] code exchange failed:', error.message)
  }

  // Return to login page on error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

