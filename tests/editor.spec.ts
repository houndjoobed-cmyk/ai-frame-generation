import { test, expect } from "@playwright/test"

test.describe("Frame Editor E2E Tests", () => {
  test("should load the editor page and display the canvas", async ({ page }) => {
    // Set a longer timeout for compilation and slow filesystems
    test.setTimeout(240000)

    // Listen for console logs inside the browser
    page.on("console", (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`)
    })

    // Listen for network requests and responses
    page.on("request", (req) => {
      console.log(`[Network Request] ${req.method()} ${req.url()}`)
    })
    page.on("response", (res) => {
      console.log(`[Network Response] ${res.status()} ${res.url()}`)
    })

    // Navigate to the editor page
    await page.goto("/editor")

    // If redirected to login, fill in the credentials and submit
    if (page.url().includes("/auth/login")) {
      console.log("Redirected to login. Logging in...")
      await page.fill("#email", "playwright-test@example.com")
      await page.fill("#password", "password123")
      
      // Click the sign-in/submit button
      await page.click("button[type='submit']")
      
      // Wait a moment for any potential error alerts or toasts to appear
      await page.waitForTimeout(3000)
      
      // Check if there is an alert/error visible
      const alert = page.locator("[role='alert'], .text-destructive, [data-sonner-toast]")
      if (await alert.count() > 0) {
        for (let i = 0; i < await alert.count(); i++) {
          const text = await alert.nth(i).innerText()
          console.error(`Alert/Toast text found: "${text}"`)
        }
      }

      // Check cookies
      const cookies = await page.context().cookies()
      console.log("Browser cookies:", JSON.stringify(cookies, null, 2))
      
      try {
        // Wait for navigation back to /editor
        await page.waitForURL("**/editor", { timeout: 120000 })
        console.log("Logged in successfully and navigated back to /editor")
      } catch (err) {
        console.error("Failed to navigate to /editor after login. Current URL:", page.url())
        console.error("Page HTML body content:")
        const bodyContent = await page.evaluate(() => document.body.innerHTML)
        console.error(bodyContent)
        throw err;
      }
    }

    // Wait for the main elements of the editor layout to load
    await expect(page.locator("header")).toBeVisible()
    
    // Check that the project title input is present and has the default value
    const titleInput = page.locator("header input")
    await expect(titleInput).toBeVisible()
    await expect(titleInput).toHaveValue(/Projet sans nom|Untitled Project/)

    // Wait for the canvas element to be mounted in the DOM
    const canvasElement = page.locator("canvas").first()
    await expect(canvasElement).toBeVisible()

    // Check that sidebar options (like upload button or templates selection) are visible
    const uploadLabel = page.getByText(/Cliquez ou glissez pour importer|Click or drag to upload/)
    await expect(uploadLabel).toBeVisible()

    // Check that the export button is present in the header
    const exportButton = page.locator("button:has-text('Exporter'), button:has-text('Export')")
    await expect(exportButton).toBeVisible()

    // Click the export button in the header to open the dialog
    await exportButton.click()

    // Wait for the dialog content to load
    await expect(page.getByText(/Taille d'exportation|Export Size/)).toBeVisible()

    // Verify all four export format buttons are present
    const downloadPng = page.getByText(/Télécharger en PNG|Download PNG/)
    await expect(downloadPng).toBeVisible()

    const downloadJpeg = page.getByText(/Télécharger en JPEG|Download JPEG/)
    await expect(downloadJpeg).toBeVisible()

    const downloadSvg = page.getByText(/Télécharger en SVG|Download SVG/)
    await expect(downloadSvg).toBeVisible()

    const downloadPdf = page.getByText(/Télécharger en PDF|Download PDF/)
    await expect(downloadPdf).toBeVisible()
  })
})


