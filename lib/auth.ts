import { db } from "@/db/index.ts";
import { users } from "@/db/schema.ts";
import { eq, sql } from "drizzle-orm";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,32}$/;

/**
 * Validates the username format
 * @param username - Username to validate
 * @returns true if valid, false otherwise
 */
export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

/**
 * Gets or creates a user from the X-Forwarded-User header
 * Uses INSERT ... ON DUPLICATE KEY UPDATE to avoid race conditions
 * @param request - The incoming request
 * @returns The user object or null if no valid username
 */
export async function getOrCreateUser(request: Request) {
  const username = request.headers.get("X-Forwarded-User");

  if (!username || !isValidUsername(username)) {
    return null;
  }

  // Use INSERT ... ON DUPLICATE KEY UPDATE to atomically create or update
  // This prevents race conditions when multiple requests try to create the same user
  await db.insert(users).values({ username }).onDuplicateKeyUpdate({
    set: { username: sql`username` },
  });

  // Now fetch the user (guaranteed to exist)
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  return user;
}
