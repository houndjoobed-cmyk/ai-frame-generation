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

async function testRegister() {
  const testEmail = `test_${Date.now()}@example.com`
  console.log("Simulating registration for:", testEmail)

  // 1. Insert user into next_auth.users
  const { data: user, error: uErr } = await supabase
    .schema("next_auth")
    .from("users")
    .insert({
      name: "Test User",
      email: testEmail,
      emailVerified: null,
      image: null
    })
    .select()
    .single()

  console.log("User creation:", { user, error: uErr })

  if (user) {
    // 2. Insert password
    const { data: pw, error: pwErr } = await supabase
      .from("user_passwords")
      .insert({
        user_id: user.id,
        password_hash: "mockhash123"
      })
      .select()
      .single()
    console.log("Password insertion:", { pw, error: pwErr })

    // 3. Insert verification token
    const token = `verify_${Date.now()}`
    const { data: vt, error: vtErr } = await supabase
      .schema("next_auth")
      .from("verification_tokens")
      .insert({
        identifier: testEmail,
        token,
        expires: new Date(Date.now() + 86400000).toISOString()
      })
      .select()
    console.log("Verification token insertion:", { vt, error: vtErr })

    // Clean up test user
    console.log("Cleaning up test user...")
    await supabase.from("user_passwords").delete().eq("user_id", user.id)
    await supabase.schema("next_auth").from("verification_tokens").delete().eq("identifier", testEmail)
    await supabase.schema("next_auth").from("users").delete().eq("id", user.id)
    console.log("Clean up done!")
  }
}

testRegister().catch(console.error)
