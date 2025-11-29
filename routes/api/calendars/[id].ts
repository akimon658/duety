import { define } from "$fresh/server.ts";
import type { State } from "@/lib/state.ts";
import { db } from "@/db/index.ts";
import { calendars } from "@/db/schema.ts";
import { and, eq } from "drizzle-orm";

export const handler = define.handlers<State>({
  // GET /api/calendars/:id - Get a specific calendar
  async GET(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = ctx.params;

    const calendar = await db.query.calendars.findFirst({
      where: and(
        eq(calendars.id, id),
        eq(calendars.username, user.username),
      ),
    });

    if (!calendar) {
      return Response.json({ error: "Calendar not found" }, { status: 404 });
    }

    return Response.json(calendar);
  },

  // DELETE /api/calendars/:id - Delete a calendar
  async DELETE(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = ctx.params;

    // Verify the calendar belongs to the user
    const calendar = await db.query.calendars.findFirst({
      where: and(
        eq(calendars.id, id),
        eq(calendars.username, user.username),
      ),
    });

    if (!calendar) {
      return Response.json({ error: "Calendar not found" }, { status: 404 });
    }

    await db.delete(calendars).where(eq(calendars.id, id));

    return new Response(null, { status: 204 });
  },
});
