import fs from "fs"

const urls = [
  "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/c9a9a05e-73ec-4df5-ad7c-1db33a50f9e8/9501a4d4-b6c8-41ea-9685-5787b6cdc236.png",
  "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/c9a9a05e-73ec-4df5-ad7c-1db33a50f9e8/c2a10f8a-ea39-4771-9dae-93183646f83c.png",
  "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/c9a9a05e-73ec-4df5-ad7c-1db33a50f9e8/84dd2ada-9e82-4348-8400-f1c12c1bab2b.png",
  "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/a936d35a-7b96-4360-82b9-de12467e6bc5/78f8efc9-72ce-410a-a9da-9e332a167e89.png",
  "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/c9a9a05e-73ec-4df5-ad7c-1db33a50f9e8/2e681340-d4c9-472c-922f-7abf00f00a5c.png",
  "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/4c82798c-4a1f-4c15-b50c-2763ddb4a2e8/e1b0b8d8-85e0-427f-8d1c-e0ad17ccd673.png"
]

async function inspectUrls() {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    try {
      const res = await fetch(url)
      const buf = Buffer.from(await res.arrayBuffer())
      console.log(`URL ${i}: status=${res.status}, size=${buf.length} bytes, contentType=${res.headers.get("content-type")}`)
      // First 16 bytes
      console.log(`Header hex: ${buf.slice(0, 16).toString("hex")}`)
      // Check PNG width & height in IHDR chunk (bytes 16-24)
      if (buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a") {
        const width = buf.readUInt32BE(16)
        const height = buf.readUInt32BE(20)
        console.log(`PNG dimensions: ${width}x${height}`)
      }
    } catch (e) {
      console.error(`URL ${i} error:`, e)
    }
  }
}

inspectUrls().catch(console.error)
