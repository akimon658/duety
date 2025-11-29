import type { User } from "@/db/schema.ts";

export interface State {
  user?: User;
}
