import { App, staticFiles } from "fresh"
import { State } from "./lib/state.ts"
import { auth } from "./middlewares/auth.ts"
import { pollingService } from "./services/pollingService.ts"

export const app = new App<State>().use(auth, staticFiles()).fsRoutes()

// Start polling service when the app initializes
pollingService.start()
