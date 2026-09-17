import { NextResponse, type NextRequest } from 'next/server'

// Shared access code as HTTP Basic Auth (any username). The viewer, beacon and assets stay public.
export function proxy(req: NextRequest) {
  if (!process.env.ACCESS_CODE) {
    // Fail closed when deployed: a missing env var must not open the admin pages to the internet.
    if (process.env.VERCEL) return new NextResponse('ACCESS_CODE is not configured', { status: 503 })
    return NextResponse.next() // local dev without a code = open access
  }
  const [, b64] = (req.headers.get('authorization') ?? '').split(' ')
  const pass = b64 ? atob(b64).split(':').slice(1).join(':') : ''
  if (pass === process.env.ACCESS_CODE) return NextResponse.next()
  return new NextResponse('Access code required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="DeepVue POC"' },
  })
}

export const config = {
  matcher: ['/((?!t/|api/e|api/health|_next/|uploads/|favicon.ico).*)'],
}
