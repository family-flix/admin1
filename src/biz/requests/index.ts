import { request_factory } from "@/domains/request/utils";
import { Result } from "@/domains/result";

export const media_request = request_factory({
  hostnames: {
    dev: "https://media-t.funzm.com",
    test: "https://media-t.funzm.com",
    prod: "",
  },
  process<T>(r: Result<{ code: number | string; msg: string; data: T }>) {
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
});
