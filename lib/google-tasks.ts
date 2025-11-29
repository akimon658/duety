import type { ITaskService, SyncResult } from "./task-service.ts";
import type { ParsedEvent } from "./ical.ts";
import { taskServiceRegistry } from "./task-service.ts";

interface GoogleCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface GoogleTasksConfig {
  taskListId?: string;
}

/**
 * Google Tasks implementation of ITaskService
 */
export class GoogleTasksService implements ITaskService {
  readonly serviceType = "google_tasks";
  readonly displayName = "Google Tasks";

  private credentials: GoogleCredentials | null = null;
  private config: GoogleTasksConfig = {};

  private get clientId(): string {
    return Deno.env.get("GOOGLE_CLIENT_ID") || "";
  }

  private get clientSecret(): string {
    return Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
  }

  async initialize(credentials: string, config?: string): Promise<void> {
    try {
      this.credentials = JSON.parse(credentials) as GoogleCredentials;
      if (config) {
        this.config = JSON.parse(config) as GoogleTasksConfig;
      }

      // Refresh token if expired
      if (this.credentials && this.credentials.expiresAt < Date.now()) {
        await this.refreshAccessToken();
      }
    } catch {
      this.credentials = null;
    }
  }

  isAuthenticated(): boolean {
    return this.credentials !== null && !!this.credentials.accessToken;
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/tasks",
      access_type: "offline",
      prompt: "consent",
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<string> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    const data = await response.json();

    const credentials: GoogleCredentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return JSON.stringify(credentials);
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.credentials?.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.credentials.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();

    this.credentials.accessToken = data.access_token;
    this.credentials.expiresAt = Date.now() + data.expires_in * 1000;
  }

  private getTaskListId(): string {
    return this.config.taskListId || "@default";
  }

  private async apiRequest(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<Response> {
    if (!this.credentials) {
      throw new Error("Not authenticated");
    }

    // Refresh if token is about to expire (within 5 minutes)
    if (this.credentials.expiresAt < Date.now() + 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }

    const url = `https://tasks.googleapis.com/tasks/v1${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  async createTask(event: ParsedEvent): Promise<SyncResult> {
    try {
      const taskListId = this.getTaskListId();

      const taskBody: Record<string, string> = {
        title: event.summary,
      };

      if (event.description) {
        taskBody.notes = event.description;
      }

      if (event.dueDate) {
        // Google Tasks expects RFC 3339 timestamp for due date
        taskBody.due = event.dueDate.toISOString();
      }

      const response = await this.apiRequest(
        "POST",
        `/lists/${taskListId}/tasks`,
        taskBody,
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const data = await response.json();
      return { success: true, externalTaskId: data.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateTask(
    externalTaskId: string,
    event: ParsedEvent,
  ): Promise<SyncResult> {
    try {
      const taskListId = this.getTaskListId();

      const taskBody: Record<string, string> = {
        title: event.summary,
      };

      if (event.description) {
        taskBody.notes = event.description;
      }

      if (event.dueDate) {
        taskBody.due = event.dueDate.toISOString();
      }

      const response = await this.apiRequest(
        "PATCH",
        `/lists/${taskListId}/tasks/${externalTaskId}`,
        taskBody,
      );

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true, externalTaskId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteTask(externalTaskId: string): Promise<SyncResult> {
    try {
      const taskListId = this.getTaskListId();

      const response = await this.apiRequest(
        "DELETE",
        `/lists/${taskListId}/tasks/${externalTaskId}`,
      );

      if (!response.ok && response.status !== 204) {
        const error = await response.text();
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Register Google Tasks service
taskServiceRegistry.register("google_tasks", GoogleTasksService);
