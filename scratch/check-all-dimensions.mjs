import fs from "fs"
import { createClient } from "@supabase/supabase-js"

const envFile = fs.readFileSync(".env.local", "utf8")
const env = {}
envFile.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ""
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value.trim()
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function checkAllDimensions() {
  const { data: frames } = await supabase.from("frames").select("*")
  for (const f of frames) {
    const res = await fetch(f.image_url)
    const buf = Buffer.from(await res.arrayBuffer())
    const width = buf.readUInt32BE(16)
    const height = buf.readUInt32BE(20)
    console.log(`Frame "${f.name}": ${width}x${height} (ratio: ${(width/height).toFixed(3)})`)
  }
}

checkAllDimensions().catch(console.error)
