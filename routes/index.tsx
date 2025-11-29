import { eq } from "drizzle-orm"
import { page } from "fresh"
import { db } from "../db/index.ts"
import { calendars } from "../db/schema.ts"
import { CalendarManager } from "../islands/CalendarManager.tsx"
import { define } from "../lib/define.ts"

export const handler = define.handlers({
  GET: async (ctx) => {
    const userCalenders = await db.query.calendars.findMany({
      where: eq(calendars.username, ctx.state.user.username),
    })

    return page({ userCalenders })
  },
})

export default define.page<typeof handler>(({ data }) => {
  return (
    <div class="max-w-2xl mx-auto">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">カレンダー管理</h2>
          <p class="text-base-content/70">
            大学のLMS（Moodle）から取得したiCalカレンダーのURLを登録すると、
            課題の期限が自動的にGoogle Tasksに追加されます。
          </p>
          <div class="divider"></div>
          <CalendarManager initialCalendars={data.userCalenders} />
        </div>
      </div>
    </div>
  )
})
