import { NextResponse, type NextRequest } from 'next/server'

// MIDDLEWARE DESACTIVADO TEMPORALMENTE
// Se desactiva para verificar que el resto de la app funciona correctamente.
// TODO: reactivar la lógica de autenticación.

// // El nombre de la cookie de sesión de Supabase se deriva del hostname del proyecto:
// // sb-{project_ref}-auth-token (puede estar dividida en chunks: .0, .1, ...)
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
// const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)/)?.[1] ?? ''
// const SESSION_COOKIE = `sb-${projectRef}-auth-token`

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl
//   const cookies = request.cookies.getAll()
//   const hasSession = cookies.some(
//     (c) => c.name === SESSION_COOKIE || c.name.startsWith(`${SESSION_COOKIE}.`)
//   )
//
//   if (!hasSession && pathname.startsWith('/dashboard')) {
//     const url = request.nextUrl.clone()
//     url.pathname = '/login'
//     return NextResponse.redirect(url)
//   }
//
//   if (hasSession && (pathname === '/login' || pathname === '/register')) {
//     const url = request.nextUrl.clone()
//     url.pathname = '/dashboard'
//     return NextResponse.redirect(url)
//   }
//
//   return NextResponse.next()
// }

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/whatsapp)(?!$).*)',
  ],
}
