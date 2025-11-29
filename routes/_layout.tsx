import type { PageProps } from "$fresh/server.ts";
import type { State } from "@/lib/state.ts";

export default function Layout(
  { Component, state }: PageProps<unknown, State>,
) {
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
          {state.user && (
            <div class="flex-none">
              <span class="text-sm">ログイン中: {state.user.username}</span>
            </div>
          )}
        </div>
        <main class="container mx-auto p-4">
          <Component />
        </main>
      </body>
    </html>
  );
}
