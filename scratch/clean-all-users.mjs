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

async function cleanAllUsers() {
  console.log("Suppression de tous les utilisateurs et données associées...")

  // 1. Delete user_passwords
  const { error: pwErr } = await supabase.from("user_passwords").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  console.log("user_passwords cleared:", pwErr || "OK")

  // 2. Delete profiles
  const { error: prErr } = await supabase.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  console.log("profiles cleared:", prErr || "OK")

  // 3. Delete verification_tokens
  const { error: vtErr } = await supabase.schema("next_auth").from("verification_tokens").delete().neq("token", "dummy")
  console.log("verification_tokens cleared:", vtErr || "OK")

  // 4. Delete next_auth.accounts
  const { error: accErr } = await supabase.schema("next_auth").from("accounts").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  console.log("next_auth.accounts cleared:", accErr || "OK")

  // 5. Delete next_auth.users
  const { error: uErr } = await supabase.schema("next_auth").from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  console.log("next_auth.users cleared:", uErr || "OK")

  console.log("Nettoyage terminé avec succès !")
}

cleanAllUsers().catch(console.error)
