import * as fabric from "fabric"

async function test() {
  const url = "https://vxngherapkazdxlgdykn.supabase.co/storage/v1/object/public/frames/templates/4c82798c-4a1f-4c15-b50c-2763ddb4a2e8/e1b0b8d8-85e0-427f-8d1c-e0ad17ccd673.png"
  const res = await fetch(url)
  console.log("Fetch status:", res.status)
  console.log("Content-Type:", res.headers.get("content-type"))
  console.log("Access-Control-Allow-Origin:", res.headers.get("access-control-allow-origin"))
}

test().catch(console.error)
