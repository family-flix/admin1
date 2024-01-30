/**
 * @file API 请求
 */
import { BaseDomain, Handler } from "@/domains/base";
import { BizError } from "@/domains/error";
import { Result, UnpackedResult, Unpacked, Shift } from "@/types";
import { sleep } from "@/utils";
import { HttpClientCore } from "@/domains/http_client";
import axios, { CancelToken, CancelTokenSource } from "axios";

enum Events {
  BeforeRequest,
  AfterRequest,
  LoadingChange,
  Success,
  Failed,
  Completed,
  Canceled,
  StateChange,
  ResponseChange,
}
type TheTypesOfEvents<T> = {
  [Events.LoadingChange]: boolean;
  [Events.BeforeRequest]: void;
  [Events.AfterRequest]: void;
  [Events.Success]: T;
  [Events.Failed]: BizError;
  [Events.Completed]: void;
  [Events.Canceled]: void;
  [Events.StateChange]: RequestState<T>;
  [Events.ResponseChange]: T | null;
};
type RequestState<T> = {
  loading: boolean;
  error: BizError | null;
  response: T | null;
};
type RequestProps<T> = {
  client: HttpClientCore;
  method: "GET" | "POST";
  delay?: null | number;
  defaultResponse?: T;
  onSuccess?: (v: T) => void;
  onFailed?: (error: BizError) => void;
  onCompleted?: () => void;
  onCanceled?: () => void;
  beforeRequest?: () => void;
  onLoading?: (loading: boolean) => void;
};

/**
 * 用于接口请求的核心类
 */
export class RequestCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  debug = false;

  method: "GET" | "POST";
  defaultResponse: T | null = null;

  /** 原始 service 函数 */
  private _service: string;
  client: HttpClientCore;
  delay: null | number = 800;
  loading = false;
  /** 处于请求中的 promise */
  pending: Promise<Result<T>> | null = null;
  /** 调用 prepare 方法暂存的参数 */
  // args: Parameters<T> | null = null;
  /** 请求的响应 */
  response: T | null = null;
  /** 请求失败，保存错误信息 */
  error: BizError | null = null;
  source: CancelTokenSource;

  get state(): RequestState<T> {
    return {
      loading: this.loading,
      error: this.error,
      response: this.response,
    };
  }

  constructor(url: string, props: RequestProps<T>) {
    super();

    this._service = url;
    const {
      client,
      method = "POST",
      delay,
      defaultResponse,
      onSuccess,
      onFailed,
      onCompleted,
      onCanceled,
      onLoading,
      beforeRequest,
    } = props;
    this.client = client;
    this.method = method;
    if (delay !== undefined) {
      this.delay = delay;
    }
    if (defaultResponse) {
      this.defaultResponse = defaultResponse;
      this.response = defaultResponse;
    }
    const source = axios.CancelToken.source();
    this.source = source;
    if (onSuccess) {
      this.onSuccess(onSuccess);
    }
    if (onFailed) {
      this.onFailed(onFailed);
    }
    if (onCompleted) {
      this.onCompleted(onCompleted);
    }
    if (onCanceled) {
      this.onCanceled(onCanceled);
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
  async run(...args: Shift<Parameters<(typeof this.client)["get"]>>) {
    if (this.pending !== null) {
      const r = await this.pending;
      this.loading = false;
      const d = r.data as T;
      this.pending = null;
      return Result.Ok(d);
    }
    // this.args = args;
    this.loading = true;
    this.response = this.defaultResponse;
    this.error = null;
    const source = axios.CancelToken.source();
    this.source = source;
    this.emit(Events.LoadingChange, true);
    console.log("this.emit(Events.StateChange", this.state);
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.BeforeRequest);
    // this.client.
    const r2 = (() => {
      if (this.method === "GET") {
        const [query, extra = {}] = args;
        return Result.Ok(
          this.client.get(this._service, query, {
            token: this.source.token,
            ...extra,
          })
        ) as Result<Promise<Result<T>>>;
      }
      if (this.method === "POST") {
        const [body, extra = {}] = args;
        return Result.Ok(
          this.client.post(this._service, body, {
            token: this.source.token,
            ...extra,
          })
        ) as Result<Promise<Result<T>>>;
      }
      return Result.Err(`未知的 method '${this.method}'`);
    })();
    if (r2.error) {
      return Result.Err(r2.error.message);
    }
    this.pending = r2.data;
    const [r] = await Promise.all([this.pending, this.delay === null ? null : sleep(this.delay)]);
    this.loading = false;
    this.emit(Events.LoadingChange, false);
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Completed);
    this.pending = null;
    if (r.error) {
      if (r.error.code === "CANCEL") {
        this.emit(Events.Canceled);
        return Result.Err(r.error);
      }
      this.error = r.error;
      this.emit(Events.Failed, r.error);
      this.emit(Events.StateChange, { ...this.state });
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
    // if (this.args === null) {
    //   return;
    // }
    // this.run(...this.args);
  }
  cancel() {
    this.source.cancel("主动取消");
  }
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

  onLoadingChange(handler: Handler<TheTypesOfEvents<T>[Events.LoadingChange]>) {
    return this.on(Events.LoadingChange, handler);
  }
  beforeRequest(handler: Handler<TheTypesOfEvents<T>[Events.BeforeRequest]>) {
    return this.on(Events.BeforeRequest, handler);
  }
  onSuccess(handler: Handler<TheTypesOfEvents<T>[Events.Success]>) {
    return this.on(Events.Success, handler);
  }
  onFailed(handler: Handler<TheTypesOfEvents<T>[Events.Failed]>) {
    return this.on(Events.Failed, handler);
  }
  onCanceled(handler: Handler<TheTypesOfEvents<T>[Events.Canceled]>) {
    return this.on(Events.Canceled, handler);
  }
  /** 建议使用 onFailed */
  onError(handler: Handler<TheTypesOfEvents<T>[Events.Failed]>) {
    return this.on(Events.Failed, handler);
  }
  onCompleted(handler: Handler<TheTypesOfEvents<T>[Events.Completed]>) {
    return this.on(Events.Completed, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onResponseChange(handler: Handler<TheTypesOfEvents<T>[Events.ResponseChange]>) {
    return this.on(Events.ResponseChange, handler);
  }
}
