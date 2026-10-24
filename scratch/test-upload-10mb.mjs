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

async function testUpload() {
  console.log("Testing upload of a 7.5 MB buffer...")
  // 7.5 MB
  const size = 7.5 * 1024 * 1024
  const testBuffer = Buffer.alloc(size)
  const testPath = `test-temp-${Date.now()}.png`

  const { data, error } = await supabase.storage
    .from("frames")
    .upload(testPath, testBuffer, {
      contentType: "image/png",
      upsert: true
    })

  console.log("Upload result:", { data, error })

  if (!error) {
    console.log("SUCCESS! Deleting test file...")
    await supabase.storage.from("frames").remove([testPath])
    console.log("Test file cleaned up.")
  }
}

testUpload().catch(console.error)
