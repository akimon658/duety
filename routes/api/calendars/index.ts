import { define } from "$fresh/server.ts";
import type { State } from "@/lib/state.ts";
import { db } from "@/db/index.ts";
import { calendars } from "@/db/schema.ts";
import { and, eq } from "drizzle-orm";

// GET /api/calendars - List user's calendars
export const handler = define.handlers<State>({
  async GET(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userCalendars = await db.query.calendars.findMany({
      where: eq(calendars.username, user.username),
    });

    return Response.json(userCalendars);
  },

  // POST /api/calendars - Add a new calendar
  async POST(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await ctx.req.json();
      const { url, name } = body;

      if (!url || typeof url !== "string") {
        return Response.json(
          { error: "URL is required" },
          { status: 400 },
        );
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return Response.json(
          { error: "Invalid URL format" },
          { status: 400 },
        );
      }

      // Check if calendar already exists for this user
      const existing = await db.query.calendars.findFirst({
        where: and(
          eq(calendars.username, user.username),
          eq(calendars.url, url),
        ),
      });

      if (existing) {
        return Response.json(
          { error: "Calendar already registered" },
          { status: 409 },
        );
      }

      // Generate UUID for calendar ID
      const id = crypto.randomUUID();

      await db.insert(calendars).values({
        id,
        username: user.username,
        url,
        name: name || null,
      });

      const newCalendar = await db.query.calendars.findFirst({
        where: eq(calendars.id, id),
      });

      return Response.json(newCalendar, { status: 201 });
    } catch (error) {
      console.error("Error creating calendar:", error);
      return Response.json(
        { error: "Failed to create calendar" },
        { status: 500 },
      );
    }
  },
});
