import { define } from "../../../lib/define.ts"
import { GoogleTasksService } from "../../../services/googleTasks.ts"

export const handler = define.handlers({
  GET: (ctx) => {
    const service = new GoogleTasksService()
    const redirectUri = `${ctx.url.origin}/api/google-tasks/callback`
    const state = ctx.state.user.username

    const authUrl = service.getAuthorizationUrl(redirectUri, state)

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
      },
    })
  },
})
