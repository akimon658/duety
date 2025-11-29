import { define, type FreshContext } from "$fresh/server.ts";
import type { State } from "@/lib/state.ts";
import { getOrCreateUser } from "@/lib/auth.ts";

/**
 * Common authentication handler for all HTTP methods
 */
async function authenticate(ctx: FreshContext<State>) {
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
}

export const handler = define.handlers<State>({
  GET: authenticate,
  POST: authenticate,
  PUT: authenticate,
  DELETE: authenticate,
});
