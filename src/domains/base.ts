/**
 * 注册的监听器
 * @todo
 * 1、支持在 emitValuesChange 前做一些事情，比如衍生一些状态值
 */
import mitt, { EventType, Handler } from "mitt";

let _uid = 0;
function uid() {
  _uid += 1;
  return _uid;
}

export class BaseDomain<Events extends Record<EventType, unknown>> {
  private _emitter = mitt<Events>();
  name: string;
  debug: boolean = false;

  listeners: (() => void)[] = [];

  constructor(params: Partial<{ name: string; debug: boolean }> = {}) {
    // const { name = "Domain", debug } = params;
    // this.name = name;
    // this.debug = debug;
  }

  uid() {
    return uid();
  }

  log(...args: unknown[]) {
    if (!this.debug) {
      return;
    }
    console.log(
      `%c CORE %c ${this.name} %c`,
      "color:white;background:#dfa639;border-top-left-radius:2px;border-bottom-left-radius:2px;",
      "color:white;background:#19be6b;border-top-right-radius:2px;border-bottom-right-radius:2px;",
      "color:#19be6b;",
      ...args
    );
  }

  off<Key extends keyof Events>(event: Key, handler: Handler<Events[Key]>) {
    this._emitter.off(event, handler);
  }
  on<Key extends keyof Events>(event: Key, handler: Handler<Events[Key]>) {
    const unlisten = () => {
      this.listeners = this.listeners.filter((l) => l !== unlisten);
      this.off(event, handler);
    };
    this.listeners.push(unlisten);
    this._emitter.on(event, handler);
    return unlisten;
  }
  emit<Key extends keyof Events>(event: Key, value?: Events[Key]) {
    this._emitter.emit(event, value);
  }

  /** 主动销毁所有的监听事件 */
  destroy() {
    for (let i = 0; i < this.listeners.length; i += 1) {
      const off = this.listeners[i];
      off();
    }
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
