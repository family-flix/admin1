import { HttpClientCore } from "@/domains/http_client";

import { app } from "./index";
import { user } from "./user";

export const request = new HttpClientCore({
  app,
  user,
});
