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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

console.log("Supabase URL:", supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function check() {
  console.log("--- 1. Testing query on public.profiles ---")
  const { data: profiles, error: profError } = await supabase.from("profiles").select("*").limit(3)
  console.log("profiles result:", { count: profiles?.length, error: profError })

  console.log("--- 2. Testing query on next_auth.users ---")
  const { data: users, error: userError } = await supabase.schema("next_auth").from("users").select("*").limit(3)
  console.log("next_auth.users result:", { count: users?.length, error: userError })

  console.log("--- 3. Testing query on public.users ---")
  const { data: pubUsers, error: pubUsersError } = await supabase.from("users").select("*").limit(3)
  console.log("public.users result:", { count: pubUsers?.length, error: pubUsersError })
}

check().catch(console.error)
