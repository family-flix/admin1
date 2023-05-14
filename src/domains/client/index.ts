/**
 * @file API 请求
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { Result, UnpackedResult, Unpacked } from "@/types";

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
  [Events.Failed]: Error;
  [Events.Completed]: void;
};
type Service<T, V> = (params: V) => Promise<Result<T>>;
type RequestState = {};
type RequestProps = {
  onSuccess: () => void;
  onFailed: (error: Error) => void;
  onCompleted: () => void;
};

/**
 * 用于接口请求的核心类
 */
export class RequestCore<
  T extends (...args: any[]) => Promise<Result<any>>
> extends BaseDomain<
  TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>
> {
  debug = false;

  /** 原始 service 函数 */
  private _service: T;
  /** 是否处于请求中 */
  pending = false;
  /** 调用 prepare 方法暂存的参数 */
  args: Parameters<T>;

  constructor(service: T, props: Partial<RequestProps> = {}) {
    super();

    if (typeof fetch !== "function") {
      throw new Error("service must be a function");
    }
    this._service = service;
    const { onSuccess, onFailed, onCompleted } = props;
    if (onSuccess) {
      this.onSuccess(onSuccess);
    }
    if (onFailed) {
      this.onFailed(onFailed);
    }
    if (onCompleted) {
      this.onCompleted(onCompleted);
    }
  }
  /** 执行 service 函数 */
  async run(...args: Parameters<T>) {
    if (this.pending) {
      return;
    }
    this.pending = true;
    this.emit(Events.LoadingChange, this.pending);
    const r = await this._service(...args);
    this.pending = false;
    this.emit(Events.LoadingChange, this.pending);
    this.emit(Events.Completed);
    if (r.error) {
      this.emit(Events.Failed, r.error);
      return;
    }
    this.emit(Events.Success, r.data);
  }
  prepare(...args: Parameters<T>) {
    this.args = args;
  }

  onLoadingChange(handler: Handler<TheTypesOfEvents<T>[Events.LoadingChange]>) {
    this.on(Events.LoadingChange, handler);
  }
  onSuccess(handler: Handler<TheTypesOfEvents<T>[Events.Success]>) {
    this.on(Events.Success, handler);
  }
  onFailed(handler: Handler<TheTypesOfEvents<T>[Events.Failed]>) {
    this.on(Events.Failed, handler);
  }
  /** 建议使用 onFailed */
  onError(handler: Handler<TheTypesOfEvents<T>[Events.Failed]>) {
    this.on(Events.Failed, handler);
  }
  onCompleted(handler: Handler<TheTypesOfEvents<T>[Events.Completed]>) {
    this.on(Events.Completed, handler);
  }
}
