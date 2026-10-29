import { chromium } from "@playwright/test"

async function run() {
  console.log("Launching Edge via Playwright...")
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  page.on("console", msg => console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text()))
  page.on("pageerror", err => console.error("[BROWSER ERROR]:", err))

  const frameId = "4fe774cb-0357-44e1-be37-1dae2ce5acbc"
  console.log(`Navigating to http://localhost:3000/editor?frame=${frameId} ...`)
  await page.goto(`http://localhost:3000/editor?frame=${frameId}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(4000)

  const debugInfo = await page.evaluate(() => {
    const canvas = window.__fabricCanvas
    if (!canvas) return { error: "No __fabricCanvas on window" }

    const objects = canvas.getObjects()
    const result = {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      objectCount: objects.length,
      objects: objects.map((obj) => ({
        type: obj.type,
        isFrame: obj.isFrame,
        width: obj.width,
        height: obj.height,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        left: obj.left,
        top: obj.top,
        visible: obj.visible,
        opacity: obj.opacity,
        elementTagName: obj.getElement ? obj.getElement()?.tagName : null,
        elementNaturalWidth: obj.getElement ? obj.getElement()?.naturalWidth : null,
        elementNaturalHeight: obj.getElement ? obj.getElement()?.naturalHeight : null,
        elementComplete: obj.getElement ? obj.getElement()?.complete : null,
        elementSrc: obj.getElement ? obj.getElement()?.src : null,
      }))
    }
    return result
  })

  console.log("DEBUG INFO:", JSON.stringify(debugInfo, null, 2))

  await browser.close()
  console.log("Done!")
}

run().catch(console.error)
