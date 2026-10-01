import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type, credits_used, credits_limit, email, subscription_status')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col">
      <DashboardNav
        planType={profile?.plan_type}
        creditsUsed={profile?.credits_used}
        creditsLimit={profile?.credits_limit}
      />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-ink/10 py-5 text-center text-xs text-ink/40 bg-paper">
        © 2026 ValidateIt
      </footer>
    </div>
  )
}