import { define } from "$fresh/server.ts";
import type { State } from "@/lib/state.ts";
import { getOrCreateUser } from "@/lib/auth.ts";

export const handler = define.handlers<State>({
  async GET(ctx) {
    // Get or create user from X-Forwarded-User header
    const user = await getOrCreateUser(ctx.req);

    if (!user) {
      // Return 401 if no valid user header
      return new Response(
        "Unauthorized: Missing or invalid X-Forwarded-User header",
        {
          status: 401,
        },
      );
    }

    // Set user in state for use in routes
    ctx.state.user = user;

    return ctx.next();
  },

  async POST(ctx) {
    const user = await getOrCreateUser(ctx.req);

    if (!user) {
      return new Response(
        "Unauthorized: Missing or invalid X-Forwarded-User header",
        {
          status: 401,
        },
      );
    }

    ctx.state.user = user;
    return ctx.next();
  },

  async PUT(ctx) {
    const user = await getOrCreateUser(ctx.req);

    if (!user) {
      return new Response(
        "Unauthorized: Missing or invalid X-Forwarded-User header",
        {
          status: 401,
        },
      );
    }

    ctx.state.user = user;
    return ctx.next();
  },

  async DELETE(ctx) {
    const user = await getOrCreateUser(ctx.req);

    if (!user) {
      return new Response(
        "Unauthorized: Missing or invalid X-Forwarded-User header",
        {
          status: 401,
        },
      );
    }

    ctx.state.user = user;
    return ctx.next();
  },
});
