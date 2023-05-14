import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: CurState;
};
type CurState = {};
export class CurCore<T> extends BaseDomain<TheTypesOfEvents> {
  value: T | null = null;
  /** 暂存一个值 */
  save(value: T) {
    this.value = value;
  }
  /** 暂存的值是否为空 */
  isEmpty() {
    return this.value === null;
  }
  /** 返回 save 方法保存的 value 并将 value 重置为 null */
  consume() {
    const v = this.value;
    this.value = null;
    return v;
  }
}
