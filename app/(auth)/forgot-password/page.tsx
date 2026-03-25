'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://chispoa-ia.vercel.app/reset-password',
    })

    if (error) {
      setError('Error al enviar el email. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 60%, #0f0c08 100%)' }}
      >
        <div
          className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,92,26,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,92,26,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">
          <div className="flex items-center gap-2">
            <div style={{ width: '24px', height: '24px', background: '#FF5C1A', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '14px', height: '14px' }}>
                <path d="M9 2L4 9H8L6 14L13 7H9L9 2z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: '16px', color: '#f5f0e8', letterSpacing: '-0.02em' }}>Chispoa</span>
          </div>

          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
            style={{ border: '1px solid rgba(255,92,26,0.25)', backgroundColor: 'rgba(255,92,26,0.06)' }}
          >
            ✉️
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl leading-tight" style={{ color: '#f5f0e8', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Revisa tu email
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>
              Hemos enviado un enlace de restablecimiento a
            </p>
          </div>

          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'rgba(255,92,26,0.10)',
              border: '1px solid rgba(255,92,26,0.3)',
            }}
          >
            <span style={{ color: '#FF5C1A' }}>✉</span>
            <span style={{ color: '#f5f0e8' }}>{email}</span>
          </div>

          <div
            className="w-full rounded-2xl p-5 text-left flex flex-col gap-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#FF5C1A' }}>
              A continuación
            </p>
            {[
              'Abre el email que te enviamos',
              'Haz clic en el enlace de restablecimiento',
              'Elige tu nueva contraseña',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(255,92,26,0.2)', color: '#FF5C1A' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.7)' }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
            ¿No llegó?{' '}
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: 'https://chispoa-ia.vercel.app/reset-password',
                })
              }}
              className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: '#FF5C1A' }}
            >
              Reenviar email
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 60%, #0f0c08 100%)' }}
    >
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,92,26,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,92,26,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm flex flex-col gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div style={{ width: '24px', height: '24px', background: '#FF5C1A', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 16 16" fill="none" style={{ width: '14px', height: '14px' }}>
                <path d="M9 2L4 9H8L6 14L13 7H9L9 2z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: '16px', color: '#f5f0e8', letterSpacing: '-0.02em' }}>Chispoa</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl leading-tight" style={{ color: '#f5f0e8', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Restablecer contraseña
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@restaurante.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f5f0e8',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF5C1A')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-50 mt-1"
            style={{ backgroundColor: '#FF5C1A' }}
          >
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        {/* Back to login */}
        <p className="text-center text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>
          <Link
            href="/login"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: '#FF5C1A' }}
          >
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
