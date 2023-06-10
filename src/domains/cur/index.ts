/**
 * @file 列表中单选
 */
import { BaseDomain } from "@/domains/base";
import { Handler } from "mitt";

enum Events {
  StateChange,
}
type TheTypesOfEvents<T> = {
  [Events.StateChange]: T;
};
type SelectionProps<T> = {
  onChange?: (v: T) => void;
};
type SelectionState = {};
export class SelectionCore<T> extends BaseDomain<TheTypesOfEvents<T>> {
  value: T | null = null;

  constructor(options: Partial<{ _name: string }> & SelectionProps<T> = {}) {
    super(options);

    const { onChange } = options;
    if (onChange) {
      this.onStateChange(onChange);
    }
  }

  /** 暂存一个值 */
  select(value: T) {
    this.value = value;
    this.emit(Events.StateChange, this.value);
  }
  /** 暂存的值是否为空 */
  isEmpty() {
    return this.value === null;
  }
  /** 返回 select 方法保存的 value 并将 value 重置为 null */
  clear() {
    // const v = this.value;
    this.value = null;
    this.emit(Events.StateChange);
    // return v;
  }

  onStateChange(handler: Handler<TheTypesOfEvents<T>[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
