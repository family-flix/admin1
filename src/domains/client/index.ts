/**
 * @file API 请求
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
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
  [Events.Failed]: Error;
  [Events.Completed]: void;
};
type Service<T, V> = (params: V) => Promise<Result<T>>;
type RequestState = {};
type RequestProps<T> = {
  onSuccess: (v: T) => void;
  onFailed: (error: Error) => void;
  onCompleted: () => void;
  onLoading: (loading: boolean) => void;
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
  /** 请求的响应 */
  response: UnpackedResult<Unpacked<ReturnType<T>>> | null = null;

  constructor(
    service: T,
    props: Partial<RequestProps<UnpackedResult<Unpacked<ReturnType<T>>>>> = {}
  ) {
    super();

    if (typeof fetch !== "function") {
      throw new Error("service must be a function");
    }
    this._service = service;
    const { onSuccess, onFailed, onCompleted, onLoading } = props;
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
  }
  /** 执行 service 函数 */
  async run(...args: Parameters<T>) {
    if (this.pending) {
      return;
    }
    this.args = args;
    this.pending = true;
    this.emit(Events.LoadingChange, this.pending);
    const [r] = await Promise.all([this._service(...args), sleep(1000)]);
    this.pending = false;
    this.emit(Events.LoadingChange, this.pending);
    this.emit(Events.Completed);
    if (r.error) {
      this.emit(Events.Failed, r.error);
      return;
    }
    this.response = r.data;
    this.emit(
      Events.Success,
      r.data as UnpackedResult<Unpacked<ReturnType<T>>>
    );
  }
  /** 使用当前参数再请求一次 */
  reload() {
    this.run(...this.args);
  }

  onLoadingChange(
    handler: Handler<
      TheTypesOfEvents<
        UnpackedResult<Unpacked<ReturnType<T>>>
      >[Events.LoadingChange]
    >
  ) {
    this.on(Events.LoadingChange, handler);
  }
  onSuccess(
    handler: Handler<
      TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Success]
    >
  ) {
    this.on(Events.Success, handler);
  }
  onFailed(
    handler: Handler<
      TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]
    >
  ) {
    this.on(Events.Failed, handler);
  }
  /** 建议使用 onFailed */
  onError(
    handler: Handler<
      TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>[Events.Failed]
    >
  ) {
    this.on(Events.Failed, handler);
  }
  onCompleted(
    handler: Handler<
      TheTypesOfEvents<
        UnpackedResult<Unpacked<ReturnType<T>>>
      >[Events.Completed]
    >
  ) {
    this.on(Events.Completed, handler);
  }
}
