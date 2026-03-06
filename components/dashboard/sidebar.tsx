'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, Clock, CalendarCheck, Settings, LogOut, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menú', icon: UtensilsCrossed },
  { href: '/dashboard/hours', label: 'Horarios', icon: Clock },
  { href: '/dashboard/reservations', label: 'Reservas', icon: CalendarCheck },
  { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
]

export function Sidebar({ restaurantName }: { restaurantName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold leading-tight truncate">{restaurantName}</p>
          <p className="text-xs text-muted-foreground">RestauranteBot</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
