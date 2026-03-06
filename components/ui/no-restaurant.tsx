import Link from 'next/link'

export function NoRestaurant() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium text-gray-800">Restaurante no configurado</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Antes de usar esta sección necesitas configurar la información de tu restaurante.
      </p>
      <Link
        href="/dashboard/settings"
        className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Ir a Configuración
      </Link>
    </div>
  )
}
