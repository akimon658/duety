import { define } from "../../../lib/define.ts"
import { syncUserTasks } from "../../../services/syncService.ts"

export const handler = define.handlers({
  POST: async (ctx) => {
    const username = ctx.state.user.username

    try {
      const stats = await syncUserTasks(username)

      return Response.json({
        success: stats.errors === 0,
        stats,
      })
    } catch (error) {
      console.error("Sync error:", error)
      return Response.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  },
})
