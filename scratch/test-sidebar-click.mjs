import { chromium } from "@playwright/test"

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  await page.goto("http://localhost:3000/editor", { waitUntil: "networkidle" })
  await page.waitForTimeout(2000)

  // Click on the frames tab trigger (second tab button with Layers icon)
  const tabTriggers = await page.$$('button[role="tab"]')
  console.log("Tab triggers found:", tabTriggers.length)
  if (tabTriggers.length >= 2) {
    console.log("Clicking frames tab (index 1)...")
    await tabTriggers[1].click()
    await page.waitForTimeout(2000)
  }

  // Find frame buttons in the sidebar
  const frameButtons = await page.$$('.grid.grid-cols-2 button')
  console.log("Frame buttons found:", frameButtons.length)

  if (frameButtons.length > 0) {
    console.log("Clicking first frame button...")
    await frameButtons[0].click()
    await page.waitForTimeout(3000)

    await page.screenshot({ path: "scratch/editor-sidebar-click.png" })
    console.log("Saved scratch/editor-sidebar-click.png")
  }

  await browser.close()
  console.log("Done!")
}

run().catch(console.error)
