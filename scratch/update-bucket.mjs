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

async function updateBucketLimit() {
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets()
  console.log("Current buckets:", buckets, bErr)

  const framesBucket = buckets?.find(b => b.name === "frames")
  if (framesBucket) {
    console.log("Updating 'frames' bucket to 10MB (10485760 bytes)...")
    const { data, error } = await supabase.storage.updateBucket("frames", {
      public: true,
      file_size_limit: 10485760 // 10MB
    })
    console.log("Update result:", data, error)
  } else {
    console.log("Creating 'frames' bucket with 10MB limit...")
    const { data, error } = await supabase.storage.createBucket("frames", {
      public: true,
      file_size_limit: 10485760 // 10MB
    })
    console.log("Create result:", data, error)
  }
}

updateBucketLimit().catch(console.error)
