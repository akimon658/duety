#!/usr/bin/env -S deno run -A --watch=static/,main.tsx

import { Builder } from "@fresh/core/dev";
import { tailwind } from "@fresh/plugin-tailwind";
import { app } from "./main.tsx";

const builder = new Builder();
tailwind(builder, app);

if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  await builder.listen(async () => {
    return app;
  });
}
