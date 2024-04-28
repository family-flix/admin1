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
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
  async post<T>(...args: Parameters<typeof _client.post>) {
    const r = await _client.post<{ code: number; msg: string; data: T }>(...args);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
};

const _client2 = new HttpClientCore({
  hostname: "http://nas.funzm.com:8001",
});
connect(_client2);

// @ts-ignore
export const client2: HttpClientCore = {
  hostname: _client2.hostname,
  headers: _client2.headers,
  async cancel<T>(...args: Parameters<typeof _client2.cancel>) {
    return _client2.cancel(...args);
  },
  async setHeaders<T>(...args: Parameters<typeof _client2.setHeaders>) {
    return _client2.setHeaders(...args);
  },
  async appendHeaders<T>(...args: Parameters<typeof _client2.appendHeaders>) {
    return _client2.appendHeaders(...args);
  },
  async get<T>(...args: Parameters<typeof _client2.get>) {
    const r = await _client2.get<{ code: number; msg: string; data: T }>(...args);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
  async post<T>(...args: Parameters<typeof _client2.post>) {
    const r = await _client2.post<{ code: number; msg: string; data: T }>(...args);
    if (r.error) {
      return Result.Err(r.error.message);
    }
    const { code, msg, data } = r.data;
    if (code !== 0) {
      return Result.Err(msg, code, data);
    }
    return Result.Ok(data);
  },
};
