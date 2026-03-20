import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chispoa — Agente WhatsApp para restaurantes',
  description: 'Chispoa atiende el WhatsApp de tu restaurante mientras tú sirves en mesa. Reservas, alérgenos, horarios — gestionados al instante, las 24 horas del día.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
