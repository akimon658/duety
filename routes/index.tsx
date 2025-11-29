import { define } from "$fresh/server.ts";
import type { State } from "@/lib/state.ts";
import { db } from "@/db/index.ts";
import { calendars } from "@/db/schema.ts";
import { eq } from "drizzle-orm";
import CalendarManager from "@/islands/CalendarManager.tsx";

export const handler = define.handlers<State>({
  async GET(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.render({ calendars: [] });
    }

    const userCalendars = await db.query.calendars.findMany({
      where: eq(calendars.username, user.username),
    });

    return ctx.render({ calendars: userCalendars });
  },
});

interface PageData {
  calendars: Array<{
    id: string;
    url: string;
    name: string | null;
  }>;
}

export default function Home({ data }: { data: PageData }) {
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
          <CalendarManager initialCalendars={data.calendars} />
        </div>
      </div>
    </div>
  );
}
