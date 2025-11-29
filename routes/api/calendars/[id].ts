import { and, eq } from "drizzle-orm"
import { db } from "../../../db/index.ts"
import { calendars } from "../../../db/schema.ts"
import { define } from "../../../lib/define.ts"

export const handler = define.handlers({
  GET: async (ctx) => {
    const user = ctx.state.user
    const { id } = ctx.params
    const calendar = await db.query.calendars.findFirst({
      where: and(
        eq(calendars.id, id),
        eq(calendars.username, user.username),
      ),
    })

    if (!calendar) {
      return Response.json({ error: "Calendar not found" }, { status: 404 })
    }

    return Response.json(calendar)
  },
  DELETE: async (ctx) => {
    const user = ctx.state.user
    const { id } = ctx.params

    const calendar = await db.query.calendars.findFirst({
      where: and(
        eq(calendars.id, id),
        eq(calendars.username, user.username),
      ),
    })

    if (!calendar) {
      return Response.json({ error: "Calendar not found" }, { status: 404 })
    }

    await db.delete(calendars).where(eq(calendars.id, id))

    return new Response(null, { status: 204 })
  },
})
