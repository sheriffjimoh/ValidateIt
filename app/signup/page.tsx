'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signupError) {
        setError(signupError.message)
      } else if (data.user?.identities?.length === 0) {
        setError('An account may already exist for this email. Try signing in instead.')
      } else if (data.session) {
        router.replace('/dashboard')
        router.refresh()
      } else if (data.user) {
        setConfirmSent(true)
      } else {
        setError('Supabase did not return a new user. Please try again or contact support.')
      }
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResendLoading(true)
    setResendMessage('')
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setResendMessage(resendError
        ? resendError.message
        : 'Confirmation request accepted. Check your inbox and spam folder.')
    } catch (resendError) {
      setResendMessage(resendError instanceof Error ? resendError.message : 'Could not resend the confirmation email.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (oauthError) setError(oauthError.message)
  }

  return (
    <div className="min-h-screen bg-paper font-sans flex flex-col">
      {/* Nav */}
       <nav className="border-b border-ink/[0.07] px-6  py-2 flex items-center justify-between max-w-5xl mx-auto w-full">
       <Link href="/" className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <span className="bg-ink text-lime px-2 py-0.5 rounded text-xs font-mono font-bold">V</span>
            ValidateIt
          </Link>
        <Link href="/login" className="text-[12px] text-ink/50 hover:text-ink">
          Have an account? <span className="font-bold text-ink underline">Log in</span>
        </Link>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-serif text-[28px] font-black text-ink mb-1">Create your account</h1>
            <p className="text-[13px] text-ink/50">Start validating ideas — 3 free searches/month.</p>
          </div>

          {confirmSent ? (
            <div className="bg-white p-8 rounded-2xl border border-ink/[0.08] shadow-sm text-center">
              <div className="text-3xl mb-3">📧</div>
              <h2 className="font-serif text-xl font-bold text-ink mb-2">Check your email</h2>
              <p className="text-[13px] text-ink/55 leading-relaxed">
                Supabase accepted a signup request for <strong className="text-ink">{email}</strong>.<br />
                If email confirmation is enabled, use the link in that message to activate your account. Check spam if it does not arrive.
              </p>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="mt-5 text-xs font-semibold text-ink underline underline-offset-4 disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend confirmation email'}
              </button>
              {resendMessage && <p role="status" className="mt-3 text-xs text-ink/55">{resendMessage}</p>}
              <Link href="/login" className="block mt-4 text-xs text-ink/55 underline">Back to sign in</Link>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-ink/[0.08] shadow-sm">
              {/* Google OAuth */}
              <button
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-2 border border-ink/15 rounded-xl py-3 text-[13px] font-semibold text-ink hover:bg-ink/[0.02] transition-colors mb-4 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-ink/[0.08]" />
                <span className="text-[11px] text-ink/30 font-medium">or</span>
                <div className="flex-1 h-px bg-ink/[0.08]" />
              </div>

              <form onSubmit={handleSignup} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full border border-ink/15 rounded-xl px-4 py-3 text-[13px] text-ink bg-paper/50 focus:outline-none focus:border-ink/40 placeholder:text-ink/30"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  required
                  minLength={6}
                  className="w-full border border-ink/15 rounded-xl px-4 py-3 text-[13px] text-ink bg-paper/50 focus:outline-none focus:border-ink/40 placeholder:text-ink/30"
                />

                {error && <p role="alert" className="text-[12px] text-red-500 font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-lime text-ink font-bold py-3 rounded-xl text-[13px] border border-ink/15 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create free account →'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
