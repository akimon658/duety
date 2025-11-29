import {
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// Users table - username from X-Forwarded-User header as primary key
export const users = mysqlTable("users", {
  // Username from proxy (alphanumeric + underscore, max 32 chars)
  username: varchar("username", { length: 32 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Calendars table - stores iCal URLs for each user
export const calendars = mysqlTable("calendars", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  username: varchar("username", { length: 32 })
    .notNull()
    .references(() => users.username, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Task services table - stores connected task services (Google Tasks, etc.)
// Designed for extensibility to support multiple task services
export const taskServices = mysqlTable("task_services", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  username: varchar("username", { length: 32 })
    .notNull()
    .references(() => users.username, { onDelete: "cascade" }),
  // Service type: 'google_tasks', 'todoist', 'microsoft_todo', etc.
  serviceType: varchar("service_type", { length: 50 }).notNull(),
  // OAuth credentials stored as JSON (encrypted in production)
  credentials: text("credentials"),
  // Service-specific configuration (e.g., default task list ID)
  config: text("config"),
  enabled: varchar("enabled", { length: 5 }).default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Synced events table - tracks which calendar events have been synced to which services
export const syncedEvents = mysqlTable(
  "synced_events",
  {
    calendarId: varchar("calendar_id", { length: 36 })
      .notNull()
      .references(() => calendars.id, { onDelete: "cascade" }),
    taskServiceId: varchar("task_service_id", { length: 36 })
      .notNull()
      .references(() => taskServices.id, { onDelete: "cascade" }),
    // Unique identifier from the iCal event (UID)
    eventUid: varchar("event_uid", { length: 255 }).notNull(),
    // ID of the task in the external service
    externalTaskId: varchar("external_task_id", { length: 255 }),
    // Last sync timestamp
    lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.calendarId, table.taskServiceId, table.eventUid],
    }),
  ],
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type TaskService = typeof taskServices.$inferSelect;
export type NewTaskService = typeof taskServices.$inferInsert;
export type SyncedEvent = typeof syncedEvents.$inferSelect;
export type NewSyncedEvent = typeof syncedEvents.$inferInsert;
