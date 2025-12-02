import { eq } from "drizzle-orm"
import { db } from "../db/index.ts"
import { users } from "../db/schema.ts"
import { define } from "../lib/define.ts"

const getOrCreateUser = async (username: string) => {
  await db.insert(users).values({ username }).onDuplicateKeyUpdate({
    set: {
      username: username,
    },
  })

  const user = db.query.users.findFirst({
    where: eq(users.username, username),
  })

  if (!user) {
    throw new Error("Failed to retrieve or create user")
  }

  return user
}

export const auth = define.middleware(async (ctx) => {
  const username = ctx.req.headers.get("X-Forwarded-User")

  if (!username) {
    return new Response("Unauthorized", { status: 401 })
  }

  ctx.state.user = await getOrCreateUser(username)

  return ctx.next()
})
