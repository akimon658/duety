import { db } from "@/db/index.ts";
import { users } from "@/db/schema.ts";
import { eq } from "drizzle-orm";

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
 * @param request - The incoming request
 * @returns The user object or null if no valid username
 */
export async function getOrCreateUser(request: Request) {
  const username = request.headers.get("X-Forwarded-User");

  if (!username || !isValidUsername(username)) {
    return null;
  }

  // Try to find existing user
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existingUser) {
    return existingUser;
  }

  // Create new user if doesn't exist
  await db.insert(users).values({ username });

  const newUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  return newUser;
}
