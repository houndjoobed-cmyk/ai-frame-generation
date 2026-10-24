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

async function checkFrames() {
  const { data: frames, error } = await supabase.from("frames").select("*")
  console.log("Frames count:", frames?.length, error)
  frames?.forEach(f => {
    console.log(`Frame: ${f.name} | ID: ${f.id} | URL: ${f.image_url} | width: ${f.width} | height: ${f.height}`)
  })
}

checkFrames().catch(console.error)
