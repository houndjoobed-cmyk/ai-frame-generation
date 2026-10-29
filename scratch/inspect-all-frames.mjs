import { createClient } from "@supabase/supabase-js"
import fs from "fs"

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

async function inspectAll() {
  const { data: frames } = await supabase.from("frames").select("id, name, image_url").limit(10)
  for (const f of frames || []) {
    if (!f.image_url) continue
    const res = await fetch(f.image_url)
    const buf = Buffer.from(await res.arrayBuffer())
    const w = buf.readUInt32BE(16)
    const h = buf.readUInt32BE(20)
    console.log(`${f.name} (${f.id}): ${w} x ${h}, size: ${buf.length}`)
  }
}

inspectAll().catch(console.error)
