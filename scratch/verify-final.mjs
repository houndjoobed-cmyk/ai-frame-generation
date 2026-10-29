import { chromium } from "@playwright/test"

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true })
  const page = await browser.newPage()

  // Test 1: Direct URL with frame param
  console.log("=== Test 1: Direct URL with frame param ===")
  const frameId = "4fe774cb-0357-44e1-be37-1dae2ce5acbc"
  await page.goto(`http://localhost:3000/editor?frame=${frameId}`, { waitUntil: "networkidle" })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: "scratch/verify-frame-direct.png" })
  console.log("Saved scratch/verify-frame-direct.png")

  // Test 2: Click frame from sidebar
  console.log("=== Test 2: Click frame from sidebar ===")
  await page.goto("http://localhost:3000/editor", { waitUntil: "networkidle" })
  await page.waitForTimeout(1500)

  const tabTriggers = await page.$$('button[role="tab"]')
  if (tabTriggers.length >= 2) {
    await tabTriggers[1].click()
    await page.waitForTimeout(1500)
  }

  const frameButtons = await page.$$('.grid.grid-cols-2 button')
  console.log("Found frame buttons:", frameButtons.length)
  if (frameButtons.length >= 2) {
    console.log("Clicking second frame button...")
    await frameButtons[1].click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: "scratch/verify-frame-click.png" })
    console.log("Saved scratch/verify-frame-click.png")
  }

  await browser.close()
  console.log("All tests completed successfully!")
}

run().catch(console.error)
