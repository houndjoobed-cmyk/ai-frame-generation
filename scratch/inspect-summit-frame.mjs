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

async function inspectFrame() {
  const { data: frame } = await supabase.from("frames").select("*").eq("id", "4fe774cb-0357-44e1-be37-1dae2ce5acbc").single()
  console.log("Frame data:", frame)

  if (frame?.image_url) {
    const res = await fetch(frame.image_url)
    console.log("Fetch image status:", res.status, res.headers.get("content-type"), res.headers.get("content-length"))
    const buffer = Buffer.from(await res.arrayBuffer())
    console.log("Image buffer size:", buffer.length)
    fs.writeFileSync("scratch/downloaded-frame.png", buffer)
    console.log("Saved to scratch/downloaded-frame.png")
  }
}

inspectFrame().catch(console.error)
