import fs from "fs"

async function downloadUrl5() {
  const url = "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/4c82798c-4a1f-4c15-b50c-2763ddb4a2e8/e1b0b8d8-85e0-427f-8d1c-e0ad17ccd673.png"
  const res = await fetch(url)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync("scratch/frame-5.png", buf)
  console.log("Saved scratch/frame-5.png, size:", buf.length)
}

downloadUrl5().catch(console.error)
