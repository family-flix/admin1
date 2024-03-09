import { HttpClientCore } from "@/domains/http_client";
import { connect } from "@/domains/http_client/connect.axios";
import { Result } from "@/types";

const _client = new HttpClientCore({
  hostname: window.location.origin,
});
connect(_client);

// @ts-ignore
export const client: HttpClientCore = {
  hostname: _client.hostname,
  headers: _client.headers,
  async cancel<T>(...args: Parameters<typeof _client.cancel>) {
    return _client.cancel(...args);
  },
  async setHeaders<T>(...args: Parameters<typeof _client.setHeaders>) {
    return _client.setHeaders(...args);
  },
  async appendHeaders<T>(...args: Parameters<typeof _client.appendHeaders>) {
    return _client.appendHeaders(...args);
  },
  async get<T>(...args: Parameters<typeof _client.get>) {
    const r = await _client.get<{ code: number; msg: string; data: T }>(...args);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { data } = r.data;
    return Result.Ok(data);
  },
  async post<T>(...args: Parameters<typeof _client.post>) {
    const r = await _client.post<{ code: number; msg: string; data: T }>(...args);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { data } = r.data;
    return Result.Ok(data);
  },
};
