import { and, eq } from "drizzle-orm"
import { db } from "../../db/index.ts"
import { calendars } from "../../db/schema.ts"
import { define } from "../../lib/define.ts"

export const handler = define.handlers({
  GET: async (ctx) => {
    const userCalendars = await db.query.calendars.findMany({
      where: eq(calendars.username, ctx.state.user.username),
    })

    return Response.json(userCalendars)
  },
  POST: async (ctx) => {
    const user = ctx.state.user

    try {
      const body = await ctx.req.json()
      const { url, name } = body

      if (!url || typeof url !== "string") {
        return Response.json({ error: "URL is required" }, { status: 400 })
      }

      try {
        new URL(url)
      } catch {
        return Response.json({ error: "Invalid URL format" }, { status: 400 })
      }

      const existing = await db.query.calendars.findFirst({
        where: and(
          eq(calendars.username, user.username),
          eq(calendars.url, url),
        ),
      })

      if (existing) {
        return Response.json(
          { error: "Calendar already registered" },
          { status: 409 },
        )
      }

      const id = crypto.randomUUID()

      await db.insert(calendars).values({
        id,
        username: user.username,
        url,
        name: name || null,
      })

      const newCalendar = await db.query.calendars.findFirst({
        where: eq(calendars.id, id),
      })

      return Response.json(newCalendar, { status: 201 })
    } catch (error) {
      console.error("Error creating calendar:", error)
      return Response.json(
        { error: "Failed to create calendar" },
        { status: 500 },
      )
    }
  },
})
