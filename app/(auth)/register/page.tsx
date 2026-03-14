'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('user already registered') || m.includes('already registered')) return 'Ya existe una cuenta con este email.'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('invalid email')) return 'El formato del email no es válido.'
  if (m.includes('email not confirmed')) return 'Debes confirmar tu email antes de entrar.'
  return 'Error inesperado. Inténtalo de nuevo.'
}

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
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

  if (registered) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f0c08 0%, #1e1508 45%, #2d1f08 100%)' }}
      >
        {/* Decorative circles */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(184,146,42,0.3) 0%, transparent 70%)' }}
        />

        <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-6">
          {/* Logo */}
          <p
            className="text-xs font-bold tracking-[0.35em] uppercase"
            style={{ color: '#b8922a' }}
          >
            SOLERA
          </p>

          {/* Icon */}
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
            style={{ border: '1px solid rgba(184,146,42,0.25)', backgroundColor: 'rgba(184,146,42,0.06)' }}
          >
            ✉️
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1
              className="text-3xl leading-tight"
              style={{ color: '#f5f0e8', fontWeight: 800 }}
            >
              Ya casi estás dentro 🎉
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,240,232,0.55)' }}>
              Hemos enviado un enlace de confirmación a
            </p>
          </div>

          {/* Email pill */}
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'rgba(184,146,42,0.10)',
              border: '1px solid rgba(184,146,42,0.3)',
            }}
          >
            <span style={{ color: '#b8922a' }}>✉</span>
            <span style={{ color: '#f5f0e8' }}>{form.email}</span>
          </div>

          {/* Steps card */}
          <div
            className="w-full rounded-2xl p-5 text-left space-y-4"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
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
                <p className="text-sm" style={{ color: 'rgba(245,240,232,0.7)' }}>
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Footer resend */}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <span className="text-2xl">🍽️</span>
          </div>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Registra tu restaurante en Solera</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nombre del restaurante</Label>
              <Input
                id="restaurantName"
                name="restaurantName"
                placeholder="La Trattoria"
                value={form.restaurantName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Tu teléfono WhatsApp</Label>
              <Input
                id="ownerPhone"
                name="ownerPhone"
                type="tel"
                placeholder="+34 600 000 000"
                value={form.ownerPhone}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                El agente te enviará notificaciones aquí cuando no sepa responder
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@restaurante.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>

            <div className="flex items-center gap-3 w-full my-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">o continúa con</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: 'https://solera-ia.vercel.app/auth/callback' },
                })
              }}
              className="w-full flex items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <p className="text-sm text-muted-foreground text-center">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
