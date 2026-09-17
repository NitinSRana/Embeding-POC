// Token self-check: valid verifies, expired JWT fails, tampered fails. Run: npm run check
import assert from 'node:assert/strict'
process.loadEnvFile('.env.local')
const { sign, verify } = await import('../lib/token.ts')

const tid = crypto.randomUUID()
const good = await sign(tid)
assert.equal(await verify(good), tid, 'valid token')

assert.equal(await verify(await sign(tid, Math.floor(Date.now() / 1000) - 10)), null, 'expired token')

const [h, p, s] = good.split('.')
const forged = Buffer.from(JSON.stringify({ tid: crypto.randomUUID(), exp: 9999999999 })).toString('base64url')
assert.equal(await verify(`${h}.${forged}.${s}`), null, 'tampered payload')
assert.equal(await verify(`${h}.${p}.${s.slice(0, -2)}${s.at(-2) === 'A' ? 'B' : 'A'}${s.at(-1)}`), null, 'tampered signature')
assert.equal(await verify('garbage'), null, 'malformed')

// Keys pasted into a dashboard with literal "\n" instead of line breaks still work.
for (const k of ['JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY']) process.env[k] = process.env[k].replace(/\n/g, '\\n')
assert.equal(await verify(await sign(tid)), tid, 'keys with literal \\n')

console.log('token checks passed')
