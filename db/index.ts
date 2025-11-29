import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.ts";

const getConnectionConfig = () => {
  return {
    host: Deno.env.get("DB_HOST") || "localhost",
    port: parseInt(Deno.env.get("DB_PORT") || "3306"),
    user: Deno.env.get("DB_USER") || "root",
    password: Deno.env.get("DB_PASSWORD") || "",
    database: Deno.env.get("DB_NAME") || "duety",
  };
};

// Initialize pool eagerly to avoid race conditions in concurrent requests
const pool = mysql.createPool(getConnectionConfig());

export const db = drizzle(pool, { schema, mode: "default" });

export { schema };
