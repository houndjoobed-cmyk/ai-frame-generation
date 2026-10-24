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

async function testAll() {
  console.log("Checking profiles:")
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*")
  console.log("profiles:", profiles, pErr)

  console.log("Checking user_passwords:")
  const { data: passwords, error: pwErr } = await supabase.from("user_passwords").select("*")
  console.log("passwords:", passwords, pwErr)

  console.log("Checking frames:")
  const { data: frames, error: fErr } = await supabase.from("frames").select("id, name").limit(3)
  console.log("frames:", frames, fErr)
}

testAll().catch(console.error)
