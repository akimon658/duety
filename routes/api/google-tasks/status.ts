import { eq } from "drizzle-orm"
import { db } from "../../../db/index.ts"
import { googleTasksAccounts } from "../../../db/schema.ts"
import { define } from "../../../lib/define.ts"

export const handler = define.handlers({
  GET: async (ctx) => {
    try {
      const account = await db.query.googleTasksAccounts.findFirst({
        where: eq(googleTasksAccounts.username, ctx.state.user.username),
      })

      return new Response(
        JSON.stringify({
          connected: !!account,
          enabled: account?.enabled === "true",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (error) {
      console.error("Status check error:", error)
      return new Response(JSON.stringify({ error: "Failed to check status" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  },
})
