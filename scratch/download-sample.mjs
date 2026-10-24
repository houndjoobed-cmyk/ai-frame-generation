import fs from "fs"

async function sampleImage() {
  const url = "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/c9a9a05e-73ec-4df5-ad7c-1db33a50f9e8/9501a4d4-b6c8-41ea-9685-5787b6cdc236.png"
  const res = await fetch(url)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync("scratch/sample-frame.png", buf)
  console.log("Saved scratch/sample-frame.png, size:", buf.length)
}

sampleImage().catch(console.error)
