import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { blobEnabled } from '@/lib/storage'
import { EXT, MAX_PHOTO_BYTES } from '@/lib/images'

// Issues short-lived tokens so the browser uploads photos straight to Vercel Blob
// (Vercel caps request bodies at 4.5 MB). Behind the access code via proxy.ts.
export async function POST(request: Request) {
  if (!blobEnabled) return Response.json({ error: 'Blob storage not configured' }, { status: 501 })
  let body: HandleUploadBody
  try { body = await request.json() } catch { return Response.json({ error: 'Bad request' }, { status: 400 }) }
  try {
    return Response.json(await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('tours/')) throw new Error('Invalid upload path')
        return { allowedContentTypes: Object.keys(EXT), maximumSizeInBytes: MAX_PHOTO_BYTES, addRandomSuffix: true }
      },
      // No onUploadCompleted: the tour is created by /api/tours after all photos are up.
    }))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }
}
