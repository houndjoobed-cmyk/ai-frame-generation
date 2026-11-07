import { chromium } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; background: red;">
        <canvas id="c" width="450" height="600"></canvas>
        <img id="img" src="file://${path.resolve("scratch/summit.png").replace(/\\/g, "/")}" />
      </body>
    </html>
  `
  await page.setContent(html)
  await page.waitForTimeout(2000)

  const pixelData = await page.evaluate(async () => {
    const img = document.getElementById("img")
    const canvas = document.getElementById("c")
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 450, 600)
    ctx.drawImage(img, 0, 0, 450, 600)

    // Sample the center of the rectangle: x = 450 * 0.72 = 324, y = 600 * 0.70 = 420
    const p = ctx.getImageData(324, 420, 1, 1).data
    return { r: p[0], g: p[1], b: p[2], a: p[3] }
  })

  console.log("RENDERED PIXEL IN BROWSER (on white background):", pixelData)
  await browser.close()
}

run().catch(console.error)

