'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, Clock, CalendarCheck, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/reservations', label: 'Reservas', icon: CalendarCheck },
  { href: '/dashboard/menu', label: 'Menú', icon: UtensilsCrossed },
  { href: '/dashboard/hours', label: 'Horarios', icon: Clock },
  { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
]

export function Sidebar({ restaurantName, whatsappNumber, onClose }: { restaurantName: string; whatsappNumber?: string | null; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="flex h-screen w-60 flex-col"
      style={{
        backgroundColor: '#0f0c08',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo + restaurant name */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-2">
          <div style={{ width: '22px', height: '22px', background: '#FF5C1A', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 16 16" fill="none" style={{ width: '13px', height: '13px' }}>
              <path d="M9 2L4 9H8L6 14L13 7H9L9 2z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 900, fontSize: '14px', color: '#f5f0e8', letterSpacing: '-0.02em' }}>Chispoa</span>
        </div>
        {restaurantName && (
          <p
            className="mt-1.5 text-xs truncate"
            style={{ color: 'rgba(245,240,232,0.3)' }}
          >
            {restaurantName}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors relative"
              style={{
                color: isActive ? '#f5f0e8' : 'rgba(245,240,232,0.4)',
                backgroundColor: isActive ? 'rgba(255,92,26,0.15)' : 'transparent',
                borderLeft: isActive ? '2px solid #FF5C1A' : '2px solid transparent',
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: agent status + logout */}
      <div
        className="px-5 py-5 space-y-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Agente status badge */}
        <div className="flex items-center gap-2">
          {whatsappNumber ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Agente activo</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(245,240,232,0.2)' }} />
              <span className="text-xs" style={{ color: 'rgba(245,240,232,0.25)' }}>Sin configurar</span>
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 text-sm w-full transition-opacity hover:opacity-70"
          style={{ color: 'rgba(245,240,232,0.35)' }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
