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

let pool: mysql.Pool | null = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(getConnectionConfig());
  }
  return pool;
};

export const db = drizzle(getPool(), { schema, mode: "default" });

export { schema };
