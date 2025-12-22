import { ParsedEvent } from "@/lib/ical.ts"

/**
 * Represents a task in the external service
 */
export interface ExternalTask {
  id: string
  title: string
  notes?: string
  due?: Date
  completed?: boolean
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean
  externalTaskId?: string
  error?: string
}

export interface ITaskService {
  /**
   * Service type identifier (e.g., 'google_tasks', 'todoist')
   */
  readonly serviceType: string

  /**
   * Display name for the service
   */
  readonly displayName: string

  /**
   * Initialize the service with credentials
   * @param credentials - Service-specific credentials
   * @param config - Service-specific configuration
   */
  initialize: (credentials: string, config?: string) => void | Promise<void>

  /**
   * Check if the service is properly authenticated
   */
  isAuthenticated: () => boolean

  /**
   * Create a task from a calendar event
   */
  createTask: (event: ParsedEvent) => Promise<SyncResult>

  /**
   * Update an existing task
   */
  updateTask: (
    externalTaskId: string,
    event: ParsedEvent,
  ) => Promise<SyncResult>

  /**
   * Delete a task
   */
  deleteTask: (externalTaskId: string) => Promise<SyncResult>

  /**
   * Get the OAuth authorization URL for connecting the service
   */
  getAuthorizationUrl?: (redirectUri: string, state: string) => string

  /**
   * Exchange authorization code for credentials
   */
  exchangeCode?: (code: string, redirectUri: string) => Promise<string>

  /**
   * Get updated credentials after potential token refresh
   * Returns null if credentials haven't changed
   */
  getUpdatedCredentials?: () => string | null
}
