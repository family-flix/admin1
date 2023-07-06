import { UserCore } from "@/domains/user";

import { cache } from "./cache";

export const user = new UserCore(cache.get("user"));
