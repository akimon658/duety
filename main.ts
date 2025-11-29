#!/usr/bin/env -S deno run -A

import { App, fsRoutes, staticFiles, trailingSlashes } from "$fresh/server.ts";
import { type State } from "@/lib/state.ts";

export const app = new App<State>();

app.use(staticFiles());
app.use(trailingSlashes("never"));

await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
  await app.listen();
}
