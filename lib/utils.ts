import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Synchronously converts a base64 data URL to a binary Blob without triggering
 * network fetches or violating CSP connect-src restrictions.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",")
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg"
  const binaryStr = atob(parts[1])
  const len = binaryStr.length
  const u8arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}
