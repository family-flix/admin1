/**
 * @file API 请求
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
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
}
type TheTypesOfEvents<T> = {
  [Events.LoadingChange]: boolean;
  [Events.BeforeRequest]: void;
  [Events.AfterRequest]: void;
  [Events.Success]: T;
  [Events.Failed]: BizError;
  [Events.Completed]: void;
};
type RequestState = {};
type RequestProps<T> = {
  onSuccess: (v: T) => void;
  onFailed: (error: BizError) => void;
  onCompleted: () => void;
  onBeforeRequest: () => void;
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
  /** 处于请求中的 promise */
  pending: ReturnType<T> | null = null;
  /** 调用 prepare 方法暂存的参数 */
  args: Parameters<T> | null = null;
  /** 请求的响应 */
  response: UnpackedResult<Unpacked<ReturnType<T>>> | null = null;

  constructor(service: T, props: Partial<RequestProps<UnpackedResult<Unpacked<ReturnType<T>>>>> = {}) {
    super();

    if (typeof fetch !== "function") {
      throw new Error("service must be a function");
    }
    this._service = service;
    const { onSuccess, onFailed, onCompleted, onLoading, onBeforeRequest } = props;
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
    if (onBeforeRequest) {
      this.onBeforeRequest(onBeforeRequest);
    }
  }
  /** 执行 service 函数 */
  async run(...args: Parameters<T>) {
    if (this.pending !== null) {
      const r = await this.pending;
      const d = r.data;
      this.pending = null;
      return Result.Ok(d);
    }
    this.args = args;
    this.emit(Events.LoadingChange, true);
    this.emit(Events.BeforeRequest);
    const pending = this._service(...args) as ReturnType<T>;
    this.pending = pending;
    const [r] = await Promise.all([pending, sleep(1000)]);
    this.emit(Events.LoadingChange, false);
    this.emit(Events.Completed);
    this.pending = null;
    if (r.error) {
      this.emit(Events.Failed, r.error);
      return Result.Err(r.error);
    }
    this.response = r.data;
    const d = r.data as UnpackedResult<Unpacked<ReturnType<T>>>;
    this.emit(Events.Success, d);
    return Result.Ok(d);
  }
  /** 使用当前参数再请求一次 */
  reload() {
    if (this.args === null) {
      return;
    }
    this.run(...this.args);
  }

  onLoadingChange(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.LoadingChange]>) {
    this.on(Events.LoadingChange, handler);
  }
  onBeforeRequest(handler: Handler<TheTypesOfEvents<T>[Events.BeforeRequest]>) {
    this.on(Events.BeforeRequest, handler);
  }
  onSuccess(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Success]>) {
    this.on(Events.Success, handler);
  }
  onFailed(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]>) {
    this.on(Events.Failed, handler);
  }
  /** 建议使用 onFailed */
  onError(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]>) {
    this.on(Events.Failed, handler);
  }
  onCompleted(handler: Handler<TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Completed]>) {
    this.on(Events.Completed, handler);
  }
}
