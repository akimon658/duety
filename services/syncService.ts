import { and, eq } from "drizzle-orm"
import { db } from "../db/index.ts"
import { calendars, googleAccounts, syncedEvents } from "../db/schema.ts"
import { fetchAndParseIcal, ParsedEvent } from "../lib/ical.ts"
import { taskServiceRegistry } from "./taskService.ts"

export interface SyncStats {
  created: number
  updated: number
  deleted: number
  errors: number
  errorMessages: string[]
}

/**
 * Synchronize calendar events with Google Tasks for a specific user
 */
export async function syncUserTasks(username: string): Promise<SyncStats> {
  const stats: SyncStats = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
    errorMessages: [],
  }

  try {
    // Get user's calendar
    const calendar = await db.query.calendars.findFirst({
      where: eq(calendars.username, username),
    })

    if (!calendar) {
      stats.errors++
      stats.errorMessages.push("No calendar found for user")
      return stats
    }

    // Get user's Google account
    const googleAccount = await db.query.googleAccounts.findFirst({
      where: eq(googleAccounts.username, username),
    })

    if (!googleAccount || !googleAccount.credentials) {
      stats.errors++
      stats.errorMessages.push("No Google account connected")
      return stats
    }

    // Initialize Google Tasks service
    const taskService = taskServiceRegistry.create("google_tasks")
    if (!taskService) {
      stats.errors++
      stats.errorMessages.push("Failed to initialize Google Tasks service")
      return stats
    }

    taskService.initialize(
      googleAccount.credentials,
      googleAccount.config || undefined,
    )

    if (!taskService.isAuthenticated()) {
      stats.errors++
      stats.errorMessages.push("Failed to authenticate with Google Tasks")
      return stats
    }

    // Fetch and parse calendar events
    let events: ParsedEvent[]
    try {
      events = await fetchAndParseIcal(calendar.url)
    } catch (error) {
      stats.errors++
      stats.errorMessages.push(
        `Failed to fetch calendar: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      )
      return stats
    }

    // Get existing synced events
    const existingSyncedEvents = await db.query.syncedEvents.findMany({
      where: and(
        eq(syncedEvents.calendarId, calendar.id),
        eq(syncedEvents.taskServiceId, googleAccount.id),
      ),
    })

    const existingEventMap = new Map(
      existingSyncedEvents.map((se) => [se.eventUid, se]),
    )
    const processedEventUids = new Set<string>()

    // Process each event
    for (const event of events) {
      processedEventUids.add(event.uid)
      const existingSync = existingEventMap.get(event.uid)

      try {
        if (existingSync && existingSync.externalTaskId) {
          // Update existing task
          const result = await taskService.updateTask(
            existingSync.externalTaskId,
            event,
          )

          if (result.success) {
            stats.updated++
            // Update last synced timestamp
            await db
              .update(syncedEvents)
              .set({
                lastSyncedAt: new Date(),
              })
              .where(
                and(
                  eq(syncedEvents.calendarId, calendar.id),
                  eq(syncedEvents.taskServiceId, googleAccount.id),
                  eq(syncedEvents.eventUid, event.uid),
                ),
              )
          } else {
            stats.errors++
            stats.errorMessages.push(
              `Failed to update task for event ${event.uid}: ${result.error}`,
            )
          }
        } else {
          // Create new task
          const result = await taskService.createTask(event)

          if (result.success && result.externalTaskId) {
            stats.created++
            // Record synced event
            await db.insert(syncedEvents).values({
              calendarId: calendar.id,
              taskServiceId: googleAccount.id,
              eventUid: event.uid,
              externalTaskId: result.externalTaskId,
              lastSyncedAt: new Date(),
            })
          } else {
            stats.errors++
            stats.errorMessages.push(
              `Failed to create task for event ${event.uid}: ${result.error}`,
            )
          }
        }
      } catch (error) {
        stats.errors++
        stats.errorMessages.push(
          `Error processing event ${event.uid}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        )
      }
    }

    // Delete tasks for events that no longer exist in the calendar
    for (const [eventUid, existingSync] of existingEventMap) {
      if (!processedEventUids.has(eventUid) && existingSync.externalTaskId) {
        try {
          const result = await taskService.deleteTask(
            existingSync.externalTaskId,
          )

          if (result.success) {
            stats.deleted++
            // Remove from synced events
            await db
              .delete(syncedEvents)
              .where(
                and(
                  eq(syncedEvents.calendarId, calendar.id),
                  eq(syncedEvents.taskServiceId, googleAccount.id),
                  eq(syncedEvents.eventUid, eventUid),
                ),
              )
          } else {
            stats.errors++
            stats.errorMessages.push(
              `Failed to delete task for event ${eventUid}: ${result.error}`,
            )
          }
        } catch (error) {
          stats.errors++
          stats.errorMessages.push(
            `Error deleting task for event ${eventUid}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          )
        }
      }
    }

    // Update credentials if they were refreshed
    if (taskService.getUpdatedCredentials) {
      const updatedCredentials = taskService.getUpdatedCredentials()
      if (
        updatedCredentials && updatedCredentials !== googleAccount.credentials
      ) {
        await db
          .update(googleAccounts)
          .set({
            credentials: updatedCredentials,
            updatedAt: new Date(),
          })
          .where(eq(googleAccounts.id, googleAccount.id))
      }
    }

    return stats
  } catch (error) {
    stats.errors++
    stats.errorMessages.push(
      `Unexpected error during sync: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    )
    return stats
  }
}

/**
 * Synchronize tasks for all users
 */
export async function syncAllUsers(): Promise<Map<string, SyncStats>> {
  const allUsers = await db.query.calendars.findMany()
  const results = new Map<string, SyncStats>()

  for (const calendar of allUsers) {
    const stats = await syncUserTasks(calendar.username)
    results.set(calendar.username, stats)
  }

  return results
}
