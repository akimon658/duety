#!/usr/bin/env -S deno run -A

import { App, staticFiles, trailingSlashes } from "@fresh/core";
import { type State } from "@/lib/state.ts";
import { define } from "@/lib/define.ts";

export const app = new App<State>({ root: import.meta.url })
  .use(staticFiles())
  .use(trailingSlashes("never"));

// Middleware for authentication
app.use(define.middleware(async (ctx) => {
  const { getOrCreateUser } = await import("@/lib/auth.ts");
  const user = await getOrCreateUser(ctx.req);

  if (!user) {
    return new Response(
      "Unauthorized: Missing or invalid X-Forwarded-User header",
      { status: 401 },
    );
  }

  ctx.state.user = user;
  return ctx.next();
}));

// Routes
app.get("/", async (ctx) => {
  const { db } = await import("@/db/index.ts");
  const { calendars } = await import("@/db/schema.ts");
  const { eq } = await import("drizzle-orm");

  const user = ctx.state.user;
  if (!user) {
    return ctx.render(<HomePage calendars={[]} />);
  }

  const userCalendars = await db.query.calendars.findMany({
    where: eq(calendars.username, user.username),
  });

  return ctx.render(<HomePage calendars={userCalendars} />);
});

// API routes
app.get("/api/calendars", async (ctx) => {
  const { db } = await import("@/db/index.ts");
  const { calendars } = await import("@/db/schema.ts");
  const { eq } = await import("drizzle-orm");

  const user = ctx.state.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userCalendars = await db.query.calendars.findMany({
    where: eq(calendars.username, user.username),
  });

  return Response.json(userCalendars);
});

app.post("/api/calendars", async (ctx) => {
  const { db } = await import("@/db/index.ts");
  const { calendars } = await import("@/db/schema.ts");
  const { and, eq } = await import("drizzle-orm");

  const user = ctx.state.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await ctx.req.json();
    const { url, name } = body;

    if (!url || typeof url !== "string") {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return Response.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const existing = await db.query.calendars.findFirst({
      where: and(
        eq(calendars.username, user.username),
        eq(calendars.url, url),
      ),
    });

    if (existing) {
      return Response.json(
        { error: "Calendar already registered" },
        { status: 409 },
      );
    }

    const id = crypto.randomUUID();

    await db.insert(calendars).values({
      id,
      username: user.username,
      url,
      name: name || null,
    });

    const newCalendar = await db.query.calendars.findFirst({
      where: eq(calendars.id, id),
    });

    return Response.json(newCalendar, { status: 201 });
  } catch (error) {
    console.error("Error creating calendar:", error);
    return Response.json(
      { error: "Failed to create calendar" },
      { status: 500 },
    );
  }
});

app.get("/api/calendars/:id", async (ctx) => {
  const { db } = await import("@/db/index.ts");
  const { calendars } = await import("@/db/schema.ts");
  const { and, eq } = await import("drizzle-orm");

  const user = ctx.state.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = ctx.params;

  const calendar = await db.query.calendars.findFirst({
    where: and(
      eq(calendars.id, id),
      eq(calendars.username, user.username),
    ),
  });

  if (!calendar) {
    return Response.json({ error: "Calendar not found" }, { status: 404 });
  }

  return Response.json(calendar);
});

app.delete("/api/calendars/:id", async (ctx) => {
  const { db } = await import("@/db/index.ts");
  const { calendars } = await import("@/db/schema.ts");
  const { and, eq } = await import("drizzle-orm");

  const user = ctx.state.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = ctx.params;

  const calendar = await db.query.calendars.findFirst({
    where: and(
      eq(calendars.id, id),
      eq(calendars.username, user.username),
    ),
  });

  if (!calendar) {
    return Response.json({ error: "Calendar not found" }, { status: 404 });
  }

  await db.delete(calendars).where(eq(calendars.id, id));

  return new Response(null, { status: 204 });
});

// Components
import CalendarManager from "@/islands/CalendarManager.tsx";

interface Calendar {
  id: string;
  url: string;
  name: string | null;
}

function HomePage({ calendars }: { calendars: Calendar[] }) {
  return (
    <Layout>
      <div class="max-w-2xl mx-auto">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">カレンダー管理</h2>
            <p class="text-base-content/70">
              大学のLMS（Moodle）から取得したiCalカレンダーのURLを登録すると、
              課題の期限が自動的にGoogle Tasksに追加されます。
            </p>
            <div class="divider"></div>
            <CalendarManager initialCalendars={calendars} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Layout({ children }: { children: preact.ComponentChildren }) {
  return (
    <html lang="ja" data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Duety - Calendar to Tasks</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="min-h-screen bg-base-200">
        <div class="navbar bg-primary text-primary-content shadow-lg">
          <div class="flex-1">
            <a class="btn btn-ghost text-xl">Duety</a>
          </div>
        </div>
        <main class="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}

if (import.meta.main) {
  await app.listen();
}
