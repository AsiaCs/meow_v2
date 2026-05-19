/**
 * Standalone scraper runner — call with: npm run scrape
 * Loads env vars from .env.local so it works outside Next.js runtime.
 */
import { config } from "dotenv"
import { resolve } from "path"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

// Import after env is loaded
const { runAllScrapers } = await import("./index.js")

console.log("Running all scrapers…")
const result = await runAllScrapers()
console.log("Done:", JSON.stringify(result, null, 2))
process.exit(0)
