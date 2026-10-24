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

async function checkUsers() {
  console.log("=== Checking next_auth.users ===")
  const { data: nextUsers, error: nuErr } = await supabase.schema("next_auth").from("users").select("*")
  console.log("next_auth.users:", nextUsers, nuErr)

  console.log("=== Checking public.profiles ===")
  const { data: profs, error: pErr } = await supabase.from("profiles").select("*")
  console.log("public.profiles:", profs, pErr)

  console.log("=== Checking public.user_passwords ===")
  const { data: pws, error: pwErr } = await supabase.from("user_passwords").select("*")
  console.log("public.user_passwords:", pws, pwErr)
}

checkUsers().catch(console.error)
