/**
 * @file API 请求
 */
import { BaseDomain, Handler } from "@/domains/base";
import { BizError } from "@/domains/error";
import { Result, UnpackedResult, Unpacked } from "@/types";
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
type TheTypesOfEvents<T extends (...args: any[]) => Promise<Result<any>>> = {
  [Events.LoadingChange]: boolean;
  [Events.BeforeRequest]: void;
  [Events.AfterRequest]: void;
  [Events.Success]: T;
  [Events.Failed]: BizError;
  [Events.Completed]: void;
  [Events.StateChange]: RequestState<T>;
  [Events.ResponseChange]: UnpackedResult<Unpacked<ReturnType<T>>> | null;
};
type RequestState<T extends (...args: any[]) => Promise<Result<any>>> = {
  loading: boolean;
  response: UnpackedResult<Unpacked<ReturnType<T>>> | null;
};
type RequestProps<T extends (...args: any[]) => Promise<Result<any>>> = {
  delay?: null | number;
  defaultResponse?: UnpackedResult<Unpacked<ReturnType<T>>>;
  onSuccess: (v: T) => void;
  onFailed: (error: BizError) => void;
  onCompleted: () => void;
  beforeRequest: () => void;
  onLoading: (loading: boolean) => void;
};

/**
 * 用于接口请求的核心类
 */
export class RequestCore<T extends (...args: any[]) => Promise<Result<any>>> extends BaseDomain<
  TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>
> {
  debug = false;

  /** 原始 service 函数 */
  private _service: T;
  delay: null | number = 800;
  loading = false;
  /** 处于请求中的 promise */
  pending: ReturnType<T> | null = null;
  /** 调用 prepare 方法暂存的参数 */
  args: Parameters<T> | null = null;
  /** 请求的响应 */
  response: UnpackedResult<Unpacked<ReturnType<T>>> | null = null;

  get state(): RequestState<T> {
    return {
      loading: this.loading,
      response: this.response,
    };
  }

  constructor(service: T, props: Partial<RequestProps<UnpackedResult<Unpacked<ReturnType<T>>>>> = {}) {
    super();

    if (typeof fetch !== "function") {
      throw new Error("service must be a function");
    }
    this._service = service;
    const { delay, defaultResponse, onSuccess, onFailed, onCompleted, onLoading, beforeRequest } = props;
    if (delay !== undefined) {
      this.delay = delay;
    }
    if (defaultResponse) {
      this.response = defaultResponse;
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
  async run(...args: Parameters<T>) {
    if (this.pending !== null) {
      const r = await this.pending;
      const d = r.data as UnpackedResult<Unpacked<ReturnType<T>>>;
      this.pending = null;
      return Result.Ok(d);
    }
    this.args = args;
    this.emit(Events.LoadingChange, true);
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.BeforeRequest);
    const pending = this._service(...args, this.token) as ReturnType<T>;
    this.pending = pending;
    const [r] = await Promise.all([pending, this.delay === null ? null : sleep(this.delay)]);
    this.emit(Events.LoadingChange, false);
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.Completed);
    this.pending = null;
    console.log("[DOMAIN]client - run", r.error);
    if (r.error) {
      this.emit(Events.Failed, r.error);
      return Result.Err(r.error);
    }
    this.response = r.data;
    const d = r.data as UnpackedResult<Unpacked<ReturnType<T>>>;
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
  cancel() {
    // ...
  }
  clear() {
    this.response = null;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.ResponseChange, this.response);
  }
  modifyResponse(fn: (resp: UnpackedResult<Unpacked<ReturnType<T>>>) => UnpackedResult<Unpacked<ReturnType<T>>>) {
    if (this.response === null) {
      return;
    }
    const nextResponse = fn(this.response);
    this.response = nextResponse;
    this.emit(Events.StateChange, { ...this.state });
    this.emit(Events.ResponseChange, this.response);
  }

  onLoadingChange(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.LoadingChange]>) {
    return this.on(Events.LoadingChange, handler);
  }
  beforeRequest(handler: Handler<TheTypesOfEvents<T>[Events.BeforeRequest]>) {
    return this.on(Events.BeforeRequest, handler);
  }
  onSuccess(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Success]>) {
    return this.on(Events.Success, handler);
  }
  onFailed(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]>) {
    return this.on(Events.Failed, handler);
  }
  /** 建议使用 onFailed */
  onError(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]>) {
    return this.on(Events.Failed, handler);
  }
  onCompleted(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Completed]>) {
    return this.on(Events.Completed, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onResponseChange(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.ResponseChange]>) {
    return this.on(Events.ResponseChange, handler);
  }
}
