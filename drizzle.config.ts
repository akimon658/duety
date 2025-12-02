import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: Deno.env.get("DB_HOST") || "localhost",
    port: Number(Deno.env.get("DB_PORT") || "3306"),
    user: Deno.env.get("DB_USER") || "root",
    password: Deno.env.get("DB_PASSWORD") || "password",
    database: Deno.env.get("DB_NAME") || "duety",
  },
})
