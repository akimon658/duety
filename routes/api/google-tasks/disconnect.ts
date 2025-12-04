import { eq } from "drizzle-orm"
import { db } from "../../../db/index.ts"
import { googleAccounts } from "../../../db/schema.ts"
import { define } from "../../../lib/define.ts"

export const handler = define.handlers({
  DELETE: async (ctx) => {
    try {
      await db
        .delete(googleAccounts)
        .where(eq(googleAccounts.username, ctx.state.user.username))

      return new Response(null, { status: 204 })
    } catch (error) {
      console.error("Disconnect error:", error)
      return Response.json({ error: "Failed to disconnect" }, { status: 500 })
    }
  },
})
