import { HttpClientCore } from "@/domains/http_client";

export const client = new HttpClientCore({
  hostname: window.location.origin,
});
