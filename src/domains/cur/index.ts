/**
 * @file 列表中单选
 */
import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: SelectionState;
};
type SelectionState = {};
export class SelectionCore<T> extends BaseDomain<TheTypesOfEvents> {
  value: T | null = null;
  /** 暂存一个值 */
  select(value: T) {
    this.value = value;
  }
  /** 暂存的值是否为空 */
  isEmpty() {
    return this.value === null;
  }
  /** 返回 select 方法保存的 value 并将 value 重置为 null */
  clear() {
    // const v = this.value;
    this.value = null;
    // return v;
  }
}
