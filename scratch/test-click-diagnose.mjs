import { chromium } from "@playwright/test"

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  page.on("console", msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()))
  page.on("pageerror", err => console.error("[PAGE ERROR]:", err))

  await page.goto("http://localhost:3000/editor", { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)

  const tabTriggers = await page.$$('button[role="tab"]')
  if (tabTriggers.length >= 2) {
    await tabTriggers[1].click()
    await page.waitForTimeout(1500)
  }

  const frameButtons = await page.$$('.grid.grid-cols-2 button')
  console.log("Frame buttons:", frameButtons.length)

  // Click second frame button (Excellence summit)
  if (frameButtons.length >= 2) {
    console.log("Clicking second frame button (Excellence summit)...")
    await frameButtons[1].click()
    await page.waitForTimeout(3000)

    const info = await page.evaluate(() => {
      const canvas = window.__fabricCanvas
      return {
        objects: canvas?.getObjects().length,
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
        firstObj: canvas?.getObjects()[0] ? {
          type: canvas.getObjects()[0].type,
          visible: canvas.getObjects()[0].visible,
          width: canvas.getObjects()[0].width,
          height: canvas.getObjects()[0].height,
          scaleX: canvas.getObjects()[0].scaleX,
          scaleY: canvas.getObjects()[0].scaleY,
        } : null
      }
    })
    console.log("Canvas after click:", JSON.stringify(info, null, 2))
    await page.screenshot({ path: "scratch/after-second-frame-click.png" })
  }

  await browser.close()
  console.log("Done!")
}

run().catch(console.error)
