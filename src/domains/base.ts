/**
 * 注册的监听器
 * @todo
 * 1、支持在 emitValuesChange 前做一些事情，比如衍生一些状态值
 */
import mitt, { EventType } from "mitt";

let _uid = 0;
function uid() {
  _uid += 1;
  return _uid;
}

export class BaseDomain<E extends Record<EventType, unknown>> {
  private _emitter = mitt<E>();
  on = this._emitter.on;
  emit = this._emitter.emit;

  constructor() {}

  uid() {
    return uid();
  }

  get [Symbol.toStringTag]() {
    return "Domain";
  }
}

// This can live anywhere in your codebase:
export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null)
      );
    });
  });
}
