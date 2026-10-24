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

async function checkSharesBucket() {
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets()
  console.log("Current buckets:", buckets?.map(b => ({ name: b.name, public: b.public })), bErr)

  let sharesBucket = buckets?.find(b => b.name === "shares")
  if (!sharesBucket) {
    console.log("Creating 'shares' bucket...")
    const res = await supabase.storage.createBucket("shares", {
      public: true,
      fileSizeLimit: 10485760
    })
    console.log("Create shares bucket:", res)
  } else {
    console.log("'shares' bucket already exists, public:", sharesBucket.public)
  }
}

checkSharesBucket().catch(console.error)
