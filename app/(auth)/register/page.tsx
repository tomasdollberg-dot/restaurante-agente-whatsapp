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

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('user already registered') || m.includes('already registered')) return 'Ya existe una cuenta con este email.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('invalid email')) return 'El formato del email no es válido.'
  if (m.includes('email not confirmed')) return 'Debes confirmar tu email antes de entrar.'
  return 'Error inesperado. Inténtalo de nuevo.'
}

function DarkInput({
  id, name, type = 'text', placeholder, value, onChange, required, minLength,
}: {
  id: string; name: string; type?: string; placeholder: string
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; minLength?: number
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
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
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedComms, setAcceptedComms] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    restaurantName: '',
    ownerPhone: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(mapAuthError(signUpError.message))
      setLoading(false)
      return
    }

    localStorage.setItem('pending_restaurant_name', form.restaurantName)
    localStorage.setItem('pending_owner_phone', form.ownerPhone)
    setRegistered(true)
    setLoading(false)
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://solera-ia.vercel.app/auth/callback' },
    })
  }

  // ── Confirmation screen (unchanged) ──────────────────────────────────────
  if (registered) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 45%, #2d1f08 100%)' }}
      >
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.3) 0%, transparent 70%)' }}
        />

        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">
          <p className="text-xs font-bold tracking-[0.35em] uppercase" style={{ color: '#b8922a' }}>
            SOLERA
          </p>
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
            style={{ border: '1px solid rgba(184,146,42,0.25)', backgroundColor: 'rgba(184,146,42,0.06)' }}
          >
            ✉️
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl leading-tight" style={{ color: '#f5f0e8', fontWeight: 800 }}>
              Ya casi estás dentro 🎉
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>
              Hemos enviado un enlace de confirmación a
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'rgba(184,146,42,0.10)', border: '1px solid rgba(184,146,42,0.3)' }}
          >
            <span style={{ color: '#b8922a' }}>✉</span>
            <span style={{ color: '#f5f0e8' }}>{form.email}</span>
          </div>
          <div
            className="w-full rounded-2xl p-5 text-left space-y-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#b8922a' }}>
              A continuación
            </p>
            {[
              'Abre el email que te enviamos',
              'Haz clic en el enlace de confirmación',
              'Configura tu restaurante',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(184,146,42,0.2)', color: '#b8922a' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.7)' }}>{step}</p>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
            ¿No llegó?{' '}
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.resend({ type: 'signup', email: form.email })
              }}
              className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: '#b8922a' }}
            >
              Reenviar email
            </button>
          </p>
        </div>
      </div>
    )
  }

  // ── Register form ─────────────────────────────────────────────────────────
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
        {/* Header */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-xs font-bold tracking-[0.35em] uppercase" style={{ color: '#b8922a' }}>
            SOLERA
          </p>
          <div className="text-center">
            <h1 className="text-3xl leading-tight" style={{ color: '#f5f0e8', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Crea tu cuenta
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'rgba(245,240,232,0.4)' }}>
              Registra tu restaurante en Solera
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
            <label htmlFor="restaurantName" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
              Nombre del restaurante
            </label>
            <DarkInput id="restaurantName" name="restaurantName" placeholder="La Trattoria" value={form.restaurantName} onChange={handleChange} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ownerPhone" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
              Tu teléfono WhatsApp
            </label>
            <DarkInput id="ownerPhone" name="ownerPhone" type="tel" placeholder="+34 600 000 000" value={form.ownerPhone} onChange={handleChange} required />
            <p className="text-xs" style={{ color: 'rgba(245,240,232,0.3)' }}>
              El agente te enviará notificaciones aquí cuando no sepa responder
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
              Email
            </label>
            <DarkInput id="email" name="email" type="email" placeholder="tu@restaurante.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm" style={{ color: 'rgba(245,240,232,0.6)' }}>
              Contraseña
            </label>
            <DarkInput id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handleChange} required minLength={8} />
          </div>

          {/* Legal checkboxes */}
          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                className="mt-0.5 shrink-0 h-4 w-4 rounded"
                style={{ accentColor: '#b8922a' }}
              />
              <span className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>
                He leído y acepto los{' '}
                <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: '#b8922a' }}>
                  Términos de Servicio
                </a>
                {' '}y la{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-80" style={{ color: '#b8922a' }}>
                  Política de Privacidad
                </a>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedComms}
                onChange={(e) => setAcceptedComms(e.target.checked)}
                className="mt-0.5 shrink-0 h-4 w-4 rounded"
                style={{ accentColor: '#b8922a' }}
              />
              <span className="text-xs leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>
                Acepto recibir comunicaciones sobre novedades de Solera
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:opacity-75 disabled:opacity-50 mt-1"
            style={{ backgroundColor: '#b8922a' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm" style={{ color: 'rgba(245,240,232,0.35)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-semibold transition-opacity hover:opacity-80"
            style={{ color: '#b8922a' }}
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
