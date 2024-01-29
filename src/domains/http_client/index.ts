import axios, { AxiosError, AxiosInstance } from "axios";

import { BaseDomain, Handler } from "@/domains/base";
import { Application } from "@/domains/app";
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
  app: Application;
  user: UserCore;
};
type HttpClientCoreState = {};

export class HttpClientCore extends BaseDomain<TheTypesOfEvents> {
  axios: AxiosInstance;
  user: UserCore;
  app: Application;

  constructor(props: Partial<{ _name: string }> & HttpClientCoreProps) {
    super(props);

    const { app, user } = props;

    const client = axios.create({
      timeout: 12000,
    });
    this.axios = client;
    this.app = app;
    this.user = user;

    type RequestClient = {
      get: <T>(
        url: string,
        query?: JSONObject,
        config?: Partial<{ headers: Record<string, string> }>
      ) => Promise<Result<T>>;
      post: <T>(
        url: string,
        body: JSONObject | FormData,
        config?: Partial<{ headers: Record<string, string> }>
      ) => Promise<Result<T>>;
    };
    const request = {} as RequestClient;
  }

  getHost() {
    return window.location.origin;
  }

  async get<T>(
    endpoint: string,
    query?: JSONObject,
    config: Partial<{ headers: Record<string, string> }> = {}
  ): Promise<Result<T>> {
    const client = this.axios;
    const user = this.user;
    const app = this.app;
    try {
      const h = this.getHost();
      const url = `${h}${endpoint}${query ? "?" + query_stringify(query) : ""}`;
      const resp = await client.get<{ code: number | string; msg: string; data: unknown | null }>(url, {
        // cancelToken: source.token,
        headers: {
          ...(config.headers || {}),
          Authorization: app.$user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      //       console.log(data);
      return Result.Ok(data as T);
    } catch (err) {
      const { response, message } = err as AxiosError;
      console.log("error", message);
      return Result.Err(message);
    }
  }

  async post<T>(
    endpoint: string,
    body?: JSONObject | FormData,
    config: Partial<{ headers: Record<string, string> }> = {}
  ): Promise<Result<T>> {
    const client = this.axios;
    const user = this.user;
    const app = this.app;
    try {
      const resp = await client.post<{ code: number | string; msg: string; data: unknown | null }>(endpoint, body, {
        headers: {
          ...(config.headers || {}),
          Authorization: app.$user.token,
        },
      });
      const { code, msg, data } = resp.data;
      if (code !== 0) {
        return Result.Err(msg, code, data);
      }
      return Result.Ok(data as T);
    } catch (err) {
      const error = err as AxiosError;
      const { response, message } = error;
      return Result.Err(message);
    }
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
