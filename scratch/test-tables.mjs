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

async function testRpc() {
  // Check if we can list schemas or tables via rpc or if user_passwords exists in public
  console.log("Checking user_passwords table:")
  const { data: pw, error: pwError } = await supabase.from("user_passwords").select("*").limit(1)
  console.log("user_passwords:", { data: pw, error: pwError })

  console.log("Checking verification_tokens in public:")
  const { data: vt, error: vtError } = await supabase.from("verification_tokens").select("*").limit(1)
  console.log("verification_tokens in public:", { data: vt, error: vtError })
}

testRpc().catch(console.error)
