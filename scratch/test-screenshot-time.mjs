import { chromium } from "@playwright/test"

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  const frameId = "4fe774cb-0357-44e1-be37-1dae2ce5acbc"
  await page.goto(`http://localhost:3000/editor?frame=${frameId}`, { waitUntil: "networkidle" })
  
  // Wait 1 second, take screenshot
  await page.waitForTimeout(1000)
  await page.screenshot({ path: "scratch/screen-1s.png" })

  // Wait 3 more seconds, take screenshot
  await page.waitForTimeout(3000)
  await page.screenshot({ path: "scratch/screen-4s.png" })

  // Check canvas container screenshot
  const container = await page.$(".canvas-container")
  if (container) {
    await container.screenshot({ path: "scratch/container-only.png" })
    console.log("Saved scratch/container-only.png")
  } else {
    console.log("No .canvas-container found!")
  }

  await browser.close()
  console.log("Done!")
}

run().catch(console.error)
