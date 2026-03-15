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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 60%, #0f0c08 100%)' }}
    >
      {/* Decorative circles */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm flex flex-col gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-6">
          <p
            className="text-xs font-bold tracking-[0.35em] uppercase"
            style={{ color: '#b8922a' }}
          >
            SOLERA
          </p>
          <div className="text-center">
            <h1 className="text-3xl leading-tight" style={{ color: '#f5f0e8', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
              Inicia sesión en tu panel de administración
            </p>
          </div>
        </div>

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 text-sm font-semibold text-gray-800 transition-opacity hover:opacity-90 active:opacity-75"
          style={{ backgroundColor: '#fff' }}
        >
          {googleSvg}
          Continuar con Google
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>o con email</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
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
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f5f0e8',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#b8922a')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
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
  )
}
