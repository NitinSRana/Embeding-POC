import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose'

const priv = () => importPKCS8(process.env.JWT_PRIVATE_KEY!, 'ES256')
const pub = () => importSPKI(process.env.JWT_PUBLIC_KEY!, 'ES256')

export async function sign(tourId: string, ttl: string | number = '365d') {
  return new SignJWT({ tid: tourId }).setProtectedHeader({ alg: 'ES256' }).setExpirationTime(ttl).sign(await priv())
}

// Returns the tour id, or null for a bad signature, malformed token or expired JWT.
export async function verify(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, await pub(), { algorithms: ['ES256'] })
    return typeof payload.tid === 'string' ? payload.tid : null
  } catch {
    return null
  }
}
