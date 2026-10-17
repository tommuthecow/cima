import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuth = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')

  if (!isAuth && !isAuthPage && req.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
