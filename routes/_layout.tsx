import type { PageProps } from "$fresh/server.ts";
import type { State } from "@/lib/state.ts";

export default function Layout(
  { Component, state }: PageProps<unknown, State>,
) {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Duety - Calendar to Tasks</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-gray-100 min-h-screen">
        <header class="bg-blue-600 text-white p-4 shadow-md">
          <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold">Duety</h1>
            {state.user && (
              <span class="text-sm">
                ログイン中: {state.user.username}
              </span>
            )}
          </div>
        </header>
        <main class="container mx-auto p-4">
          <Component />
        </main>
      </body>
    </html>
  );
}
