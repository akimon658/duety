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
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">カレンダー管理</h2>
        <p class="text-gray-600 mb-4">
          大学のLMS（Moodle）から取得したiCalカレンダーのURLを登録すると、
          課題の期限が自動的にGoogle Tasksに追加されます。
        </p>
        <CalendarManager initialCalendars={data.calendars} />
      </div>
    </div>
  );
}
