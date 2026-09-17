// Prints .env.local lines: an ES256 key pair plus defaults.
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose'

const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true })
const oneLine = (pem) => JSON.stringify(pem.trim())
console.log(`ACCESS_CODE=deepvue
PUBLIC_BASE_URL=http://localhost:3000
JWT_PRIVATE_KEY=${oneLine(await exportPKCS8(privateKey))}
JWT_PUBLIC_KEY=${oneLine(await exportSPKI(publicKey))}
# DATABASE_URL=postgres://...   (unset = embedded PGlite in .pglite/)
# S3_BUCKET= / CDN_URL=         (cloud phase)`)
