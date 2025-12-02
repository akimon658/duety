import { eq } from "drizzle-orm"
import { db } from "../../../db/index.ts"
import { googleTasksAccounts } from "../../../db/schema.ts"
import { define } from "../../../lib/define.ts"

export const handler = define.handlers({
  DELETE: async (ctx) => {
    try {
      const account = await db.query.googleTasksAccounts.findFirst({
        where: eq(googleTasksAccounts.username, ctx.state.user.username),
      })

      if (!account) {
        return new Response(JSON.stringify({ error: "Account not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      }

      await db
        .delete(googleTasksAccounts)
        .where(eq(googleTasksAccounts.id, account.id))

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    } catch (error) {
      console.error("Disconnect error:", error)
      return new Response(JSON.stringify({ error: "Failed to disconnect" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  },
})
