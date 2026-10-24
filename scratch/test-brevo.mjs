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

async function testBrevo() {
  const brevoApiKey = env.BREVO_API_KEY
  console.log("Testing Brevo API key...")
  const res = await fetch("https://api.brevo.com/v3/account", {
    headers: {
      "api-key": brevoApiKey,
      accept: "application/json"
    }
  })
  const data = await res.json()
  console.log("Brevo status:", res.status)
  console.log("Brevo account info:", data)
}

testBrevo().catch(console.error)
