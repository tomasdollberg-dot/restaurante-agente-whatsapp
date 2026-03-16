'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const googleSvg = (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const eyeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const eyeOffIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 5.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0120.71 15.68M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.88 9.88A3 3 0 0014.12 14.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    console.log('[LOGIN] signInWithPassword error:', error)

    if (error) {
      const m = error.message.toLowerCase()
      if (m.includes('email not confirmed')) {
        setError('Debes confirmar tu email antes de entrar. Revisa tu bandeja de entrada.')
      } else if (m.includes('invalid login credentials') || m.includes('invalid email or password')) {
        setError('Email o contraseña incorrectos.')
      } else {
        setError('Error inesperado. Inténtalo de nuevo.')
      }
      setLoading(false)
      return
    }

    const sessionResult = await supabase.auth.getSession()
    console.log('[LOGIN] getSession result:', JSON.stringify(sessionResult, null, 2))

    router.refresh()
    router.push('/dashboard')
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://solera-ia.vercel.app/auth/callback' },
    })
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0f0c08' }}>

      {/* ── LEFT PANEL (desktop only) ── */}
      <div
        className="hidden md:flex md:w-[45%] flex-col justify-between px-12 py-10 relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.12) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <p
          className="relative text-xs font-bold tracking-[0.35em] uppercase z-10"
          style={{ color: '#b8922a' }}
        >
          SOLERA
        </p>

        {/* Central block */}
        <div className="relative z-10 flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <h2
              className="leading-[1.1]"
              style={{ color: '#f5f0e8', fontWeight: 800, fontSize: '2.25rem', letterSpacing: '-0.03em' }}
            >
              Tu restaurante sigue funcionando.
            </h2>
            <p style={{ color: 'rgba(245,240,232,0.4)', fontSize: '14px' }}>
              El agente está activo y atendiendo a tus clientes ahora mismo.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-8">
            {[
              { value: '24/7', label: 'Siempre activo' },
              { value: '<2s', label: 'Responde al instante' },
              { value: '0', label: 'Reservas perdidas' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span
                  className="text-2xl font-bold"
                  style={{ color: '#b8922a', letterSpacing: '-0.02em' }}
                >
                  {stat.value}
                </span>
                <span style={{ color: 'rgba(245,240,232,0.35)', fontSize: '12px' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: '#22c55e' }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: '#22c55e' }}
            />
          </span>
          <p style={{ color: 'rgba(245,240,232,0.3)', fontSize: '12px' }}>
            Únete a los restaurantes que nunca pierden una reserva
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-hidden"
        style={{ background: '#0f0c08' }}
      >
        {/* Mobile-only decorative circles */}
        <div
          className="md:hidden pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="md:hidden pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative w-full max-w-sm flex flex-col gap-8">
          {/* Mobile logo */}
          <p
            className="md:hidden text-xs font-bold tracking-[0.35em] uppercase text-center"
            style={{ color: '#b8922a' }}
          >
            SOLERA
          </p>

          {/* Header */}
          <div className="text-center">
            <h1
              className="text-3xl leading-tight"
              style={{ color: '#f5f0e8', fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
              Inicia sesión en tu panel
            </p>
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
                  fontSize: '16px',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#b8922a')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
                  Contraseña
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ color: '#b8922a' }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f5f0e8',
                    fontSize: '16px',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#b8922a')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(245,240,232,0.35)' }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? eyeOffIcon : eyeIcon}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-50 mt-1"
              style={{ backgroundColor: '#b8922a' }}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>o</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 text-sm font-medium transition-opacity hover:opacity-80 active:opacity-60"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(245,240,232,0.5)',
            }}
          >
            {googleSvg}
            Continuar con Google
          </button>

          {/* Footer link */}
          <p className="text-center text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="font-semibold transition-opacity hover:opacity-80"
              style={{ color: '#b8922a' }}
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
