import { createClient } from "@supabase/supabase-js"
import fs from "fs"

const envFile = fs.readFileSync(".env.local", "utf8")
const env = {}
envFile.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = match[2] || ""
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value.trim()
  }
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: frames, error } = await supabase
    .from("frames")
    .select("id, name, image_url, thumbnail_url, is_active, created_at")
    .ilike("name", "%Excellence%")
  console.log("Frames found:", frames, "Error:", error)
}

run().catch(console.error)

