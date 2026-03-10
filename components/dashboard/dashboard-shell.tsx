'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, CalendarCheck, UtensilsCrossed, Clock, Settings } from 'lucide-react'
import { Sidebar } from './sidebar'

const tabs = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/reservations', label: 'Reservas', icon: CalendarCheck },
  { href: '/dashboard/menu', label: 'Menú', icon: UtensilsCrossed },
  { href: '/dashboard/hours', label: 'Horarios', icon: Clock },
  { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
]

export function DashboardShell({
  restaurantName,
  children,
}: {
  restaurantName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div
      className="flex h-screen overflow-hidden bg-gray-50"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar restaurantName={restaurantName} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto w-full min-w-0 pb-16 md:pb-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex bg-white border-t border-gray-200 md:hidden">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center pt-2 pb-1 relative"
            >
              <Icon
                className="h-5 w-5 mb-0.5"
                style={{ color: isActive ? '#b8922a' : '#9ca3af' }}
              />
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: isActive ? '#b8922a' : '#9ca3af' }}
              >
                {label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                  style={{ backgroundColor: '#b8922a' }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
