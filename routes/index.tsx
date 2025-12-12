import { eq } from "drizzle-orm"
import { page } from "fresh"
import { db } from "../db/index.ts"
import { calendars, googleAccounts } from "../db/schema.ts"
import { AccountManager } from "../islands/AccountManager.tsx"
import { CalendarManager } from "../islands/CalendarManager.tsx"
import { SyncManager } from "../islands/SyncManager.tsx"
import { define } from "../lib/define.ts"

export const handler = define.handlers({
  GET: async (ctx) => {
    const userCalender = await db.query.calendars.findFirst({
      where: eq(calendars.username, ctx.state.user.username),
    })

    const userAccount = await db.query.googleAccounts.findFirst({
      where: eq(googleAccounts.username, ctx.state.user.username),
    })

    return page({ userCalender, userAccount })
  },
})

export default define.page<typeof handler>(({ data }) => {
  return (
    <main class="mx-auto max-w-2xl p-2 space-y-4">
      <div class="card shadow-sm">
        <div class="card-body">
          <h2 class="card-title">このサービスについて</h2>

          <p>
            大学のLMSから取得したカレンダーのURLを登録すると、自動で課題の期限をGoogle
            ToDoリストに同期します。
          </p>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-body">
          <h2 class="card-title">カレンダー管理</h2>

          <CalendarManager initialCalendar={data.userCalender} />
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-body">
          <h2 class="card-title">アカウント管理</h2>

          <AccountManager initialAccount={data.userAccount} />
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-body">
          <h2 class="card-title">タスク同期</h2>

          <SyncManager
            hasCalendar={!!data.userCalender}
            hasAccount={!!data.userAccount}
          />
        </div>
      </div>
    </main>
  )
})
