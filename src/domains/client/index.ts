/**
 * @file API 请求
 */

import { BaseDomain } from "@/domains/base";
import { Unpacked } from "@/types";
import { Result, UnpackedResult } from "@/types";
import { Handler } from "mitt";

enum Events {
  BeforeRequest,
  AfterRequest,
  LoadingChange,
  Tip,
  Error,
  Success,
  Completed,
}
type TheTypesOfEvents<T> = {
  [Events.LoadingChange]: boolean;
  [Events.BeforeRequest]: void;
  [Events.AfterRequest]: void;
  [Events.Error]: Error;
  [Events.Tip]: string;
  [Events.Success]: T;
  [Events.Completed]: void;
};
type Service<T, V> = (params: V) => Promise<Result<T>>;
/**
 * 分页类
 */
class Client<
  T extends (...args: unknown[]) => Promise<Result<any>>
> extends BaseDomain<
  TheTypesOfEvents<UnpackedResult<Unpacked<ReturnType<T>>>>
> {
  private originalFetch: T;

  debug: boolean = false;
  /** 是否处于请求中 */
  pending = false;

  constructor(service: T) {
    super();

    if (typeof fetch !== "function") {
      throw new Error("service must be a function");
    }
    this.originalFetch = service;
  }
  log = (...messages: unknown[]) => {
    if (this.debug) {
      console.log(...messages);
    }
  };
  async submit(...values: Parameters<T>) {
    if (this.pending) {
      return;
    }
    this.pending = true;
    this.emit(Events.LoadingChange, this.pending);
    const r = await this.originalFetch(...values);
    this.pending = false;
    this.emit(Events.LoadingChange, this.pending);
    this.emit(Events.Completed);
    if (r.error) {
      this.emit(Events.Error, r.error);
      return;
    }
    this.emit(Events.Success, r.data);
  }
  onLoadingChange(handler: Handler<TheTypesOfEvents<T>[Events.LoadingChange]>) {
    this.on(Events.LoadingChange, handler);
  }
  onSuccess(handler: Handler<TheTypesOfEvents<T>[Events.Success]>) {
    this.on(Events.Success, handler);
  }
  onError(handler: Handler<TheTypesOfEvents<T>[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  onTip(handler: Handler<TheTypesOfEvents<T>[Events.Tip]>) {
    this.on(Events.Tip, handler);
  }
}

export default Client;
