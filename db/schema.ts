import {
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core"

export const users = mysqlTable("users", {
  username: varchar("username", { length: 32 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
})

export const calendars = mysqlTable("calendars", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  username: varchar("username", { length: 32 })
    .notNull()
    .references(() => users.username, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
})

export const taskServices = mysqlTable("task_services", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  username: varchar("username", { length: 32 })
    .notNull()
    .references(() => users.username, { onDelete: "cascade" }),
  serviceType: varchar("service_type", { length: 50 }).notNull(),
  credentials: text("credentials"),
  config: text("config"),
  enabled: varchar("enabled", { length: 5 }).default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
})

export const syncedEvents = mysqlTable(
  "synced_events",
  {
    calendarId: varchar("calendar_id", { length: 36 })
      .notNull()
      .references(() => calendars.id, { onDelete: "cascade" }),
    taskServiceId: varchar("task_service_id", { length: 36 })
      .notNull()
      .references(() => taskServices.id, { onDelete: "cascade" }),
    eventUid: varchar("event_uid", { length: 255 }).notNull(),
    externalTaskId: varchar("external_task_id", { length: 255 }),
    lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.calendarId, table.taskServiceId, table.eventUid],
    }),
  ],
)

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Calendar = typeof calendars.$inferSelect
export type NewCalendar = typeof calendars.$inferInsert
export type TaskService = typeof taskServices.$inferSelect
export type NewTaskService = typeof taskServices.$inferInsert
export type SyncedEvent = typeof syncedEvents.$inferSelect
export type NewSyncedEvent = typeof syncedEvents.$inferInsert
