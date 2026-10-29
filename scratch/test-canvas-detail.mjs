import { chromium } from "@playwright/test"
import fs from "fs"

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  const frameId = "4fe774cb-0357-44e1-be37-1dae2ce5acbc"
  await page.goto(`http://localhost:3000/editor?frame=${frameId}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(4000)

  const result = await page.evaluate(() => {
    const canvas = window.__fabricCanvas
    const lower = document.querySelector(".lower-canvas")
    const upper = document.querySelector(".upper-canvas")
    const container = document.querySelector(".canvas-container")

    // Check if fabric is using the canvas element that is currently in DOM
    const isLowerInDom = document.body.contains(lower)
    const isFabricElementInDom = document.body.contains(canvas?.getElement())

    // Render again explicitly
    canvas?.renderAll()

    // Get pixel at center (300, 400)
    const ctx = lower?.getContext("2d")
    const pixel = ctx ? Array.from(ctx.getImageData(300, 400, 1, 1).data) : null
    const cornerPixel = ctx ? Array.from(ctx.getImageData(50, 50, 1, 1).data) : null

    return {
      fabricExists: !!canvas,
      isLowerInDom,
      isFabricElementInDom,
      fabricElementMatchesLower: canvas?.getElement() === lower,
      containerHtml: container ? container.outerHTML.slice(0, 400) : "NO CONTAINER",
      lowerWidth: lower?.width,
      lowerHeight: lower?.height,
      lowerClientWidth: lower?.clientWidth,
      lowerClientHeight: lower?.clientHeight,
      centerPixel: pixel,
      cornerPixel: cornerPixel,
      fabricDataUrlLength: canvas?.toDataURL().length,
      lowerDataUrlLength: lower?.toDataURL().length,
      dataUrlSample: canvas?.toDataURL().slice(0, 100),
      objects: canvas?.getObjects().length
    }
  })

  console.log("DETAILED CANVAS CHECK:", JSON.stringify(result, null, 2))

  // Also export canvas dataURL to an image file so we can view it
  const dataUrl = await page.evaluate(() => window.__fabricCanvas?.toDataURL())
  if (dataUrl && dataUrl.startsWith("data:image/png;base64,")) {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "")
    fs.writeFileSync("scratch/fabric-render-output.png", base64Data, "base64")
    console.log("Saved scratch/fabric-render-output.png")
  }

  await browser.close()
}

run().catch(console.error)
