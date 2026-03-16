'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

const pageShell = (children: React.ReactNode) => (
  <div
    className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
    style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 60%, #0f0c08 100%)' }}
  >
    <div
      className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.18) 0%, transparent 70%)' }}
    />
    <div
      className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full"
      style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.12) 0%, transparent 70%)' }}
    />
    {children}
  </div>
)

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    const timeout = setTimeout(() => {
      setExpired(true)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Error al actualizar la contraseña. El enlace puede haber expirado.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  if (!ready && !expired) {
    return pageShell(
      <div className="relative flex flex-col items-center gap-4">
        <p className="text-xs font-bold tracking-[0.35em] uppercase" style={{ color: '#b8922a' }}>
          SOLERA
        </p>
        <p className="text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>Verificando enlace...</p>
      </div>
    )
  }

  if (expired && !ready) {
    return pageShell(
      <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">
        <p className="text-xs font-bold tracking-[0.35em] uppercase" style={{ color: '#b8922a' }}>
          SOLERA
        </p>

        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
          style={{ border: '1px solid rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.06)' }}
        >
          ⏱️
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl leading-tight" style={{ color: '#f5f0e8', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Enlace expirado
          </h1>
          <p className="text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
            El enlace ha expirado o ya fue usado. Solicita uno nuevo.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="w-full rounded-xl py-3 text-sm font-bold text-white text-center transition-opacity hover:opacity-90 active:opacity-75"
          style={{ backgroundColor: '#b8922a' }}
        >
          Solicitar nuevo enlace
        </Link>

        <p className="text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>
          <Link href="/login" className="font-semibold transition-opacity hover:opacity-80" style={{ color: '#b8922a' }}>
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    )
  }

  return pageShell(
    <div className="relative w-full max-w-sm flex flex-col gap-8">
      {/* Logo + header */}
      <div className="flex flex-col items-center gap-6">
        <p className="text-xs font-bold tracking-[0.35em] uppercase" style={{ color: '#b8922a' }}>
          SOLERA
        </p>
        <div className="text-center">
          <h1 className="text-3xl leading-tight" style={{ color: '#f5f0e8', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Nueva contraseña
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
            Elige una contraseña segura para tu cuenta.
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

        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f5f0e8',
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

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f5f0e8',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#b8922a')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
              style={{ color: 'rgba(245,240,232,0.35)' }}
              tabIndex={-1}
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirm ? eyeOffIcon : eyeIcon}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-50 mt-1"
          style={{ backgroundColor: '#b8922a' }}
        >
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}
