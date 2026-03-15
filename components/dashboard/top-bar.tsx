'use client'

import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/dashboard/reservations': 'Reservas',
  '/dashboard/menu': 'Menú',
  '/dashboard/hours': 'Horarios',
  '/dashboard/settings': 'Ajustes',
}

interface TopBarProps {
  todayCount: number
  pendingCount: number
  monthCount: number
}

export function TopBar({ todayCount, pendingCount, monthCount }: TopBarProps) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'Dashboard'

  const dateLabel = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div
      className="hidden md:flex items-center justify-between px-8 py-4 shrink-0"
      style={{
        backgroundColor: '#0f0c08',
        borderBottom: '1px solid rgba(184,146,42,0.1)',
      }}
    >
      {/* Left: date + page title */}
      <div>
        <p
          className="text-xs font-medium capitalize mb-0.5"
          style={{ color: '#b8922a' }}
        >
          {dateLabel}
        </p>
        <h1 className="text-lg font-bold" style={{ color: '#f5f0e8' }}>
          {title}
        </h1>
      </div>

      {/* Right: stats */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Hoy</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f0e8' }}>
            {todayCount}
          </p>
        </div>
        <div
          className="w-px h-8 self-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
        />
        <div className="text-right">
          <p className="text-xs" style={{ color: pendingCount > 0 ? '#fbbf24' : 'rgba(245,240,232,0.35)' }}>
            Pendientes
          </p>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: pendingCount > 0 ? '#d97706' : '#f5f0e8' }}
          >
            {pendingCount}
          </p>
        </div>
        <div
          className="w-px h-8 self-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
        />
        <div className="text-right">
          <p className="text-xs" style={{ color: 'rgba(245,240,232,0.35)' }}>Este mes</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: '#f5f0e8' }}>
            {monthCount}
          </p>
        </div>
      </div>
    </div>
  )
}
