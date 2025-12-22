import { google, tasks_v1 } from "googleapis"
import { ParsedEvent } from "../lib/ical.ts"
import { ITaskService, SyncResult } from "./taskService.ts"

interface GoogleCredentials {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface GoogleTasksConfig {
  taskListId?: string
}

/**
 * Google Tasks implementation of ITaskService using official googleapis client
 */
export class GoogleTasksService implements ITaskService {
  readonly serviceType = "google_tasks"
  readonly displayName = "Google Tasks"

  private credentials: GoogleCredentials | null = null
  private config: GoogleTasksConfig = {}
  private tasksClient: tasks_v1.Tasks | null = null

  private get clientId(): string {
    return Deno.env.get("GOOGLE_CLIENT_ID") || ""
  }

  private get clientSecret(): string {
    return Deno.env.get("GOOGLE_CLIENT_SECRET") || ""
  }

  private createOAuth2Client() {
    return new google.auth.OAuth2(this.clientId, this.clientSecret)
  }

  initialize(credentials: string, config?: string): void {
    try {
      this.credentials = JSON.parse(credentials) as GoogleCredentials
      if (config) {
        this.config = JSON.parse(config) as GoogleTasksConfig
      }

      const oauth2Client = this.createOAuth2Client()
      oauth2Client.setCredentials({
        access_token: this.credentials.accessToken,
        refresh_token: this.credentials.refreshToken,
        expiry_date: this.credentials.expiresAt,
      })

      // Set up automatic token refresh
      oauth2Client.on("tokens", (tokens) => {
        if (this.credentials) {
          if (tokens.access_token) {
            this.credentials.accessToken = tokens.access_token
          }
          if (tokens.refresh_token) {
            this.credentials.refreshToken = tokens.refresh_token
          }
          if (tokens.expiry_date) {
            this.credentials.expiresAt = tokens.expiry_date
          }
        }
      })

      this.tasksClient = google.tasks({ version: "v1", auth: oauth2Client })
    } catch (error) {
      console.error("Failed to initialize Google Tasks credentials:", error)
      this.credentials = null
      this.tasksClient = null
    }
  }

  isAuthenticated(): boolean {
    return this.credentials !== null && this.tasksClient !== null
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const oauth2Client = this.createOAuth2Client()
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/tasks"],
      redirect_uri: redirectUri,
      state,
      prompt: "consent",
    })
  }

  async exchangeCode(code: string, redirectUri: string): Promise<string> {
    const oauth2Client = this.createOAuth2Client()
    oauth2Client.redirectUri = redirectUri

    const { tokens } = await oauth2Client.getToken(code)

    const credentials: GoogleCredentials = {
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || "",
      expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000,
    }

    return JSON.stringify(credentials)
  }

  private getTaskListId(): string {
    return this.config.taskListId || "@default"
  }

  async createTask(event: ParsedEvent): Promise<SyncResult> {
    if (!this.tasksClient) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const taskListId = this.getTaskListId()

      const taskBody: tasks_v1.Schema$Task = {
        title: event.summary,
      }

      if (event.description) {
        taskBody.notes = event.description
      }

      if (event.dueDate) {
        taskBody.due = event.dueDate.toISOString()
      }

      const response = await this.tasksClient.tasks.insert({
        tasklist: taskListId,
        requestBody: taskBody,
      })

      return { success: true, externalTaskId: response.data.id || undefined }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async updateTask(
    externalTaskId: string,
    event: ParsedEvent,
  ): Promise<SyncResult> {
    if (!this.tasksClient) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const taskListId = this.getTaskListId()

      const taskBody: tasks_v1.Schema$Task = {
        title: event.summary,
      }

      if (event.description) {
        taskBody.notes = event.description
      }

      if (event.dueDate) {
        taskBody.due = event.dueDate.toISOString()
      }

      await this.tasksClient.tasks.patch({
        tasklist: taskListId,
        task: externalTaskId,
        requestBody: taskBody,
      })

      return { success: true, externalTaskId }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async deleteTask(externalTaskId: string): Promise<SyncResult> {
    if (!this.tasksClient) {
      return { success: false, error: "Not authenticated" }
    }

    try {
      const taskListId = this.getTaskListId()

      await this.tasksClient.tasks.delete({
        tasklist: taskListId,
        task: externalTaskId,
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get the current credentials (for saving after token refresh)
   */
  getCredentials(): string | null {
    return this.credentials ? JSON.stringify(this.credentials) : null
  }

  /**
   * Get updated credentials after potential token refresh
   * Returns null if credentials haven't changed
   */
  getUpdatedCredentials(): string | null {
    return this.getCredentials()
  }
}

/**
 * Create a new Google Tasks service instance
 */
export function createTaskService(): ITaskService {
  return new GoogleTasksService()
}
