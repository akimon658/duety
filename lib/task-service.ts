import type { ParsedEvent } from "./ical.ts";

/**
 * Represents a task in the external service
 */
export interface ExternalTask {
  id: string;
  title: string;
  notes?: string;
  due?: Date;
  completed?: boolean;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  externalTaskId?: string;
  error?: string;
}

/**
 * Base interface for task service implementations
 * All task services (Google Tasks, Todoist, etc.) should implement this
 */
export interface ITaskService {
  /**
   * Service type identifier (e.g., 'google_tasks', 'todoist')
   */
  readonly serviceType: string;

  /**
   * Display name for the service
   */
  readonly displayName: string;

  /**
   * Initialize the service with credentials
   * @param credentials - Service-specific credentials
   * @param config - Service-specific configuration
   */
  initialize(credentials: string, config?: string): Promise<void>;

  /**
   * Check if the service is properly authenticated
   */
  isAuthenticated(): boolean;

  /**
   * Create a task from a calendar event
   * @param event - Parsed calendar event
   * @returns Sync result with external task ID if successful
   */
  createTask(event: ParsedEvent): Promise<SyncResult>;

  /**
   * Update an existing task
   * @param externalTaskId - ID of the task in the external service
   * @param event - Updated calendar event
   */
  updateTask(externalTaskId: string, event: ParsedEvent): Promise<SyncResult>;

  /**
   * Delete a task
   * @param externalTaskId - ID of the task to delete
   */
  deleteTask(externalTaskId: string): Promise<SyncResult>;

  /**
   * Get the OAuth authorization URL for connecting the service
   * @param redirectUri - URI to redirect to after authorization
   * @param state - State parameter for CSRF protection
   */
  getAuthorizationUrl?(redirectUri: string, state: string): string;

  /**
   * Exchange authorization code for credentials
   * @param code - Authorization code from OAuth callback
   * @param redirectUri - The redirect URI used in authorization
   */
  exchangeCode?(code: string, redirectUri: string): Promise<string>;
}

/**
 * Registry for task service implementations
 */
export class TaskServiceRegistry {
  private services: Map<string, new () => ITaskService> = new Map();

  /**
   * Register a task service implementation
   * @param serviceType - Unique identifier for the service type
   * @param serviceClass - Class constructor for the service
   */
  register(serviceType: string, serviceClass: new () => ITaskService): void {
    this.services.set(serviceType, serviceClass);
  }

  /**
   * Create an instance of a registered service
   * @param serviceType - Service type to instantiate
   * @returns New instance of the service or undefined if not registered
   */
  create(serviceType: string): ITaskService | undefined {
    const ServiceClass = this.services.get(serviceType);
    if (ServiceClass) {
      return new ServiceClass();
    }
    return undefined;
  }

  /**
   * Get all registered service types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.services.keys());
  }
}

// Global registry instance
export const taskServiceRegistry = new TaskServiceRegistry();
