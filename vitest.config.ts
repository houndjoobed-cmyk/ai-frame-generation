import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**", "**/playwright-report/**"],
  },
})
