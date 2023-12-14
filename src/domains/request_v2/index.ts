// @ts-nocheck
/**
 * @file API 请求
 */
import { BaseDomain, Handler } from "@/domains/base";
import { BizError } from "@/domains/error";
import { Result, UnpackedResult, Unpacked, JSONValue } from "@/types";
import { sleep } from "@/utils";

enum Events {
  BeforeRequest,
  AfterRequest,
  LoadingChange,
  Success,
  Failed,
  Completed,
  StateChange,
  ResponseChange,
}
type TheTypesOfEvents<Resp> = {
  [Events.LoadingChange]: boolean;
  [Events.BeforeRequest]: void;
  [Events.AfterRequest]: void;
  [Events.Success]: Resp;
  [Events.Failed]: BizError;
  [Events.Completed]: void;
  [Events.StateChange]: RequestState<Resp>;
  [Events.ResponseChange]: Resp | null;
};
type RequestClient<T> = {
  fetch: (params: {
    hostname?: string;
    method?: "GET" | "POST";
    pathname: string;
    query?: Record<string, unknown>;
    body?: JSONValue;
  }) => Promise<T>;
  get: (params: { hostname?: string; pathname: string; query?: Record<string, unknown> }) => Promise<T>;
  post: (params: { hostname?: string; pathname: string; body?: Record<string, unknown> }) => Promise<T>;
};
type RequestState<R> = {
  loading: boolean;
  response: R | null;
};
type RequestProps<T> = {
  client: RequestClient<T>;
  payload: {
    hostname: string;
    pathname: string;
    method?: "GET" | "POST";
  };
  delay?: null | number;
  onSuccess: (v: T) => void;
  onFailed: (error: BizError) => void;
  onCompleted: () => void;
  beforeRequest: () => void;
  onLoading: (loading: boolean) => void;
};

/**
 * 用于接口请求的核心类
 */
export class RequestCore<Query extends Record<string, unknown>, T extends Record<string, unknown>> extends BaseDomain<
  TheTypesOfEvents<T>
> {
  debug = false;
  /** 用于请求的客户端 */
  client: RequestProps<T>["client"];
  payload: RequestProps<T>["payload"];
  delay: null | number = 800;
  loading = false;
  /** 处于请求中的 promise */
  pending: Promise<T> | null = null;
  /** 调用 prepare 方法暂存的参数 */
  args: Query = {};
  /** 请求的响应 */
  response: T | null = null;

  get state(): RequestState<T> {
    return {
      loading: this.loading,
      response: this.response,
    };
  }

  constructor(props: RequestProps<T>) {
    super();

    const { client, payload, delay, onSuccess, onFailed, onCompleted, onLoading, beforeRequest } = props;
    this.client = client;
    this.payload = payload;
    if (delay !== undefined) {
      this.delay = delay;
    }
    if (onSuccess) {
      this.onSuccess(onSuccess);
    }
    if (onFailed) {
      this.onFailed(onFailed);
    }
    if (onCompleted) {
      this.onCompleted(onCompleted);
    }
    if (onLoading) {
      this.onLoadingChange(onLoading);
    }
    if (beforeRequest) {
      this.beforeRequest(beforeRequest);
    }
  }
  token?: unknown;
  /** 执行 service 函数 */
  async run() {
    if (this.pending !== null) {
      const r = await this.pending;
      const d = r.data as T;
      this.pending = null;
      return Result.Ok(d);
    }
    // this.args = args;
    this.emit(Events.LoadingChange, true);
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.BeforeRequest);
    const { hostname, pathname, method } = this.payload;
    const pending = this.client.fetch(
      {
        hostname,
        pathname,
        method,
      },
      this.token
    ) as ReturnType<T>;
    this.pending = pending;
    const [r] = await Promise.all([pending, this.delay === null ? null : sleep(this.delay)]);
    this.emit(Events.LoadingChange, false);
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Completed);
    this.pending = null;
    // console.log("[DOMAIN]client - run", r.error);
    if (r.error) {
      this.emit(Events.Failed, r.error);
      return Result.Err(r.error);
    }
    this.response = r.data;
    const d = r.data as T;
    this.emit(Events.Success, d);
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.ResponseChange, this.response);
    return Result.Ok(d);
  }
  /** 使用当前参数再请求一次 */
  reload() {
    if (this.args === null) {
      return;
    }
    this.run(...this.args);
  }
  /** 取消当前请求 */
  cancel() {}
  clear() {
    this.response = null;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.ResponseChange, this.response);
  }
  modifyResponse(fn: (resp: T) => T) {
    if (this.response === null) {
      return;
    }
    const nextResponse = fn(this.response);
    this.response = nextResponse;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.ResponseChange, this.response);
  }
  // setHandler(handler: H) {
  //   this.response = handler();
  // }

  // onLoadingChange(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.LoadingChange]>) {
  //   return this.on(Events.LoadingChange, handler);
  // }
  // beforeRequest(handler: Handler<TheTypesOfEvents<T>[Events.BeforeRequest]>) {
  //   return this.on(Events.BeforeRequest, handler);
  // }
  // onSuccess(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Success]>) {
  //   return this.on(Events.Success, handler);
  // }
  // onFailed(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]>) {
  //   return this.on(Events.Failed, handler);
  // }
  // /** 建议使用 onFailed */
  // onError(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]>) {
  //   return this.on(Events.Failed, handler);
  // }
  // onCompleted(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Completed]>) {
  //   return this.on(Events.Completed, handler);
  // }
  // onStateChange(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.StateChange]>) {
  //   return this.on(Events.StateChange, handler);
  // }
  // onResponseChange(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.ResponseChange]>) {
  //   return this.on(Events.ResponseChange, handler);
  // }
}
