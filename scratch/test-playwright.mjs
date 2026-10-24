import { chromium } from "@playwright/test"

async function run() {
  console.log("Launching Edge via Playwright...")
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  page.on("console", msg => console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text()))
  page.on("pageerror", err => console.error("[BROWSER ERROR]:", err))

  console.log("Navigating to http://localhost:3000/editor ...")
  await page.goto("http://localhost:3000/editor", { waitUntil: "networkidle" })

  console.log("Waiting for canvas to be ready...")
  await page.waitForTimeout(2000)

  // Take screenshot before adding frame
  await page.screenshot({ path: "scratch/editor-initial.png" })
  console.log("Saved scratch/editor-initial.png")

  // Check frames in sidebar
  const frameButtons = await page.$$("button img")
  console.log("Frame button count in sidebar:", frameButtons.length)

  if (frameButtons.length > 0) {
    console.log("Clicking first frame button...")
    await frameButtons[0].click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: "scratch/editor-after-frame.png" })
    console.log("Saved scratch/editor-after-frame.png")

    // Evaluate canvas objects
    const canvasInfo = await page.evaluate(() => {
      const canvasEl = document.querySelector(".lower-canvas")
      const container = document.querySelector(".canvas-container")
      return {
        canvasExists: !!canvasEl,
        canvasWidth: canvasEl ? canvasEl.width : null,
        canvasHeight: canvasEl ? canvasEl.height : null,
        canvasStyle: canvasEl ? canvasEl.getAttribute("style") : null,
        containerStyle: container ? container.getAttribute("style") : null
      }
    })
    console.log("Canvas DOM info:", canvasInfo)
  }

  await browser.close()
  console.log("Done!")
}

run().catch(console.error)
