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

async function testUpdate() {
  console.log("Updating with fileSizeLimit (camelCase)...")
  const res1 = await supabase.storage.updateBucket("frames", {
    public: true,
    fileSizeLimit: 10485760 // 10MB
  })
  console.log("res1:", res1)

  const { data: bucketAfter } = await supabase.storage.getBucket("frames")
  console.log("bucketAfter:", bucketAfter)
}

testUpdate().catch(console.error)
