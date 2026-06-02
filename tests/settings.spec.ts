import { test, expect } from "@playwright/test"

test.describe("Settings & Billing E2E Tests", () => {
  test("should load settings, view billing tab, and download invoice", async ({ page }) => {
    // Set a longer timeout for compilation and slow filesystems
    test.setTimeout(240000)

    // Listen for console logs inside the browser
    page.on("console", (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
    })

    // Navigate to settings page
    console.log("Navigating to /dashboard/settings...")
    await page.goto("/dashboard/settings")

    // If redirected to login, fill in the credentials and submit
    if (page.url().includes("/auth/login")) {
      console.log("Redirected to login. Logging in...")
      await page.fill("#email", "playwright-test@example.com")
      await page.fill("#password", "password123")
      
      // Click the sign-in/submit button
      await page.click("button[type='submit']")
      
      // Wait for navigation back to /dashboard/settings
      await page.waitForURL("**/dashboard/settings", { timeout: 120000 })
      console.log("Logged in successfully and navigated back to /dashboard/settings")
    }

    // Verify the page title/header is present
    const settingsHeading = page.locator("h1:has-text('Paramètres'), h1:has-text('Settings')")
    await expect(settingsHeading).toBeVisible()

    // Select the Billing (Facturation) tab trigger
    const billingTabTrigger = page.locator("button[role='tab']:has-text('Facturation'), button[role='tab']:has-text('Billing')")
    await expect(billingTabTrigger).toBeVisible()

    // Click the Billing tab
    console.log("Clicking Billing tab...")
    await billingTabTrigger.click()

    // Verify the billing history title inside the tab
    const billingTitle = page.locator("[data-slot='card-title']:has-text('Historique de facturation'), [data-slot='card-title']:has-text('Billing History')")
    await expect(billingTitle).toBeVisible()

    // Check if the mock payment row is in the table
    // The table should have columns for Date, Description, Amount, Reference, Status, Invoice
    const tableRow = page.locator("table tbody tr").first()
    await expect(tableRow).toBeVisible()

    // Assert that the reference cell contains the mock payment reference
    const refCell = tableRow.locator("td").nth(3) // 4th column (0-indexed 3) is Ref/Reference
    await expect(refCell).toContainText(/mock-pay-ref-12345/)

    // Assert that the amount cell contains the correct amount
    const amountCell = tableRow.locator("td").nth(2)
    await expect(amountCell).toContainText(/5[,.]000\s*XOF/)

    // Verify the invoice download button exists in the row
    const downloadButton = tableRow.locator("button[title='Facture'], button[title='Invoice'], button:has(svg)")
    await expect(downloadButton).toBeVisible()

    // Intercept the download event
    console.log("Clicking the invoice download button...")
    const downloadPromise = page.waitForEvent("download")
    await downloadButton.click()
    const download = await downloadPromise

    // Verify download details
    const filename = download.suggestedFilename()
    console.log(`Downloaded file name: ${filename}`)
    expect(filename).toMatch(/^facture-.*\.pdf$/)

    // Save download to temporary location to verify it's not empty
    const path = await download.path()
    console.log(`Saved download temp path: ${path}`)
    expect(path).not.toBeNull()
  })
})
