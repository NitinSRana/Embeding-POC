// Shared by the upload form (client) and the upload API (server).
// Raster formats only: SVG can carry script.
export const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024
export const MAX_PHOTOS = 40
