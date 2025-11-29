#!/usr/bin/env -S deno run -A --watch=static/,main.tsx

import { Builder } from "@fresh/core/dev";

const builder = new Builder();

if (Deno.args.includes("build")) {
  const { app } = await import("./main.tsx");
  await builder.build(app);
} else {
  await builder.listen(async () => {
    const { app } = await import("./main.tsx");
    return app;
  });
}
