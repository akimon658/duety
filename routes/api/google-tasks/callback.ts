import { generate } from "@std/uuid/unstable-v7"
import { eq } from "drizzle-orm"
import { db } from "../../../db/index.ts"
import { googleAccounts } from "../../../db/schema.ts"
import { define } from "../../../lib/define.ts"
import { GoogleTasksService } from "../../../services/googleTasks.ts"

export const handler = define.handlers({
  GET: async (ctx) => {
    const url = new URL(ctx.req.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 })
    }

    // Verify state matches username
    if (state !== ctx.state.user.username) {
      return new Response("Invalid state", { status: 400 })
    }

    const service = new GoogleTasksService()
    const redirectUri = `${ctx.url.origin}/api/google-tasks/callback`

    try {
      const credentials = await service.exchangeCode(code, redirectUri)

      // Check if account already exists
      const existing = await db.query.googleAccounts.findFirst({
        where: eq(googleAccounts.username, ctx.state.user.username),
      })

      if (existing) {
        // Update existing account
        await db
          .update(googleAccounts)
          .set({
            credentials,
            updatedAt: new Date(),
          })
          .where(eq(googleAccounts.id, existing.id))
      } else {
        // Create new account
        await db.insert(googleAccounts).values({
          id: generate(),
          username: ctx.state.user.username,
          credentials,
        })
      }

      // Redirect back to home page
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      })
    } catch (error) {
      console.error("OAuth callback error:", error)
      return new Response("OAuth exchange failed", { status: 500 })
    }
  },
})
