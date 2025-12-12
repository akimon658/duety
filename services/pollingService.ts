import { syncAllUsers } from "./syncService.ts"

interface PollingServiceConfig {
  intervalMinutes: number
  enabled: boolean
}

class PollingService {
  private intervalId: number | null = null
  private isRunning = false
  private config: PollingServiceConfig = {
    intervalMinutes: 60, // Default: poll every hour
    enabled: false,
  }

  constructor() {
    // Initialize config from environment variables
    const intervalMinutes = parseInt(
      Deno.env.get("SYNC_INTERVAL_MINUTES") || "60",
      10,
    )
    const enabled = Deno.env.get("SYNC_POLLING_ENABLED") === "true"

    this.config = {
      intervalMinutes: isNaN(intervalMinutes) ? 60 : intervalMinutes,
      enabled,
    }
  }

  start() {
    if (this.isRunning) {
      console.log("Polling service is already running")
      return
    }

    if (!this.config.enabled) {
      console.log("Polling service is disabled. Set SYNC_POLLING_ENABLED=true to enable")
      return
    }

    this.isRunning = true
    const intervalMs = this.config.intervalMinutes * 60 * 1000

    console.log(
      `Starting polling service with interval: ${this.config.intervalMinutes} minutes`,
    )

    // Run immediately on start
    this.runSync()

    // Schedule periodic sync
    this.intervalId = setInterval(() => {
      this.runSync()
    }, intervalMs)
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log("Polling service stopped")
  }

  private async runSync() {
    console.log(`[${new Date().toISOString()}] Starting scheduled sync...`)

    try {
      const results = await syncAllUsers()

      console.log(`Sync completed for ${results.size} users`)

      for (const [username, stats] of results) {
        console.log(`  ${username}: created=${stats.created}, updated=${stats.updated}, deleted=${stats.deleted}, errors=${stats.errors}`)

        if (stats.errorMessages.length > 0) {
          console.error(`  Errors for ${username}:`, stats.errorMessages)
        }
      }
    } catch (error) {
      console.error("Error during scheduled sync:", error)
    }
  }

  isActive() {
    return this.isRunning
  }

  getConfig() {
    return { ...this.config }
  }
}

// Global singleton instance
export const pollingService = new PollingService()
