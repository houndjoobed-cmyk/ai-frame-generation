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

async function testAuthTables() {
  console.log("=== Testing all auth tables ===")
  
  // 1. next_auth.users
  const { data: users, error: uErr } = await supabase.schema("next_auth").from("users").select("id, email, name, emailVerified").limit(5)
  console.log("1. next_auth.users:", { count: users?.length, users, error: uErr })

  // 2. next_auth.accounts
  const { data: accounts, error: aErr } = await supabase.schema("next_auth").from("accounts").select("id, provider, providerAccountId").limit(5)
  console.log("2. next_auth.accounts:", { count: accounts?.length, error: aErr })

  // 3. next_auth.sessions
  const { data: sessions, error: sErr } = await supabase.schema("next_auth").from("sessions").select("id").limit(5)
  console.log("3. next_auth.sessions:", { count: sessions?.length, error: sErr })

  // 4. next_auth.verification_tokens
  const { data: tokens, error: tErr } = await supabase.schema("next_auth").from("verification_tokens").select("*").limit(5)
  console.log("4. next_auth.verification_tokens:", { count: tokens?.length, error: tErr })

  // 5. public.user_passwords
  const { data: pw, error: pwErr } = await supabase.from("user_passwords").select("id, user_id").limit(5)
  console.log("5. public.user_passwords:", { count: pw?.length, error: pwErr })

  // 6. public.profiles
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, user_id, display_name, role").limit(5)
  console.log("6. public.profiles:", { count: profiles?.length, error: pErr })
}

testAuthTables().catch(console.error)
