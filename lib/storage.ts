import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

// Returns the public URL of the stored file.
// ponytail: local disk only; cloud phase = S3 PutObject when S3_BUCKET is set, URL from CDN_URL
export async function save(key: string, bytes: Buffer) {
  const file = path.join(process.cwd(), 'public', 'uploads', key)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, bytes)
  return `/uploads/${key}`
}
