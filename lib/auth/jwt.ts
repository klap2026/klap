import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key'
)

export interface JwtPayload {
  userId: string
  phone: string
  role: string | null
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JwtPayload
  } catch (err) {
    console.log('[JWT] Verification failed:', (err as Error).message)
    return null
  }
}
