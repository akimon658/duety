import { App, staticFiles } from "fresh"
import { State } from "./lib/state.ts"
import { auth } from "./middlewares/auth.ts"

export const app = new App<State>().use(auth, staticFiles()).fsRoutes()
