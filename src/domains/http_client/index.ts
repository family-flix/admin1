import axios, { AxiosError, AxiosInstance, CancelToken } from "axios";

import { BaseDomain, Handler } from "@/domains/base";
import { UserCore } from "@/domains/user";
import { JSONObject, Result } from "@/types";
import { query_stringify } from "@/utils";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: void;
};

type HttpClientCoreProps = {
  hostname: string;
  headers?: Record<string, string>;
};
type HttpClientCoreState = {};

export class HttpClientCore extends BaseDomain<TheTypesOfEvents> {
  axios: AxiosInstance;

  hostname: string;
  headers: Record<string, string> = {};

  constructor(props: Partial<{ _name: string }> & HttpClientCoreProps) {
    super(props);

    const { hostname, headers = {} } = props;

    this.hostname = hostname;
    this.headers = headers;
    // this.user = user;
    const client = axios.create({
      timeout: 12000,
    });
    this.axios = client;
  }

  async get<T>(
    endpoint: string,
    query?: JSONObject,
    extra: Partial<{ headers: Record<string, string>; token: CancelToken }> = {}
  ): Promise<Result<T>> {
    const client = this.axios;
    // const user = this.user;
    try {
      const h = this.hostname;
      const url = `${h}${endpoint}${query ? "?" + query_stringify(query) : ""}`;
      const resp = await client.get<{ code: number | string; msg: string; data: unknown | null }>(url, {
        cancelToken: extra.token,
        headers: {
          ...this.headers,
          ...(extra.headers || {}),
          // Authorization: user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      return Result.Ok(data as T);
    } catch (err) {
      const error = err as AxiosError;
      if (axios.isCancel(error)) {
        return Result.Err("cancel", "CANCEL");
      }
      const { response, message } = error;
      // console.log("error", message);
      return Result.Err(message);
    }
  }
  async post<T>(
    endpoint: string,
    body?: JSONObject | FormData,
    extra: Partial<{ headers: Record<string, string>; token: CancelToken }> = {}
  ): Promise<Result<T>> {
    const client = this.axios;
    // const user = this.user;
    const h = this.hostname;
    const url = `${h}${endpoint}`;
    // console.log(url, h, endpoint, this.headers);
    try {
      const resp = await client.post<{ code: number | string; msg: string; data: unknown | null }>(url, body, {
        cancelToken: extra.token,
        headers: {
          ...this.headers,
          ...(extra.headers || {}),
          // Authorization: user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      return Result.Ok(data as T);
    } catch (err) {
      const error = err as AxiosError;
      if (axios.isCancel(error)) {
        return Result.Err("cancel", "CANCEL");
      }
      const { response, message } = error;
      return Result.Err(message);
    }
  }
  cancel() {}
  setHeaders(headers: Record<string, string>) {
    this.headers = headers;
  }
  appendHeaders(headers: Record<string, string>) {
    this.headers = {
      ...this.headers,
      ...headers,
    };
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
