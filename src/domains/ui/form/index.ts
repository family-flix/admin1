import { BaseDomain } from "@/domains/base";
import { Handler } from "mitt";

enum Events {
  Input,
  Submit,
}
type TheTypesOfEvents<T> = {
  [Events.Input]: unknown;
  [Events.Submit]: T;
};

export class FormCore<T extends Record<string, unknown>> extends BaseDomain<
  TheTypesOfEvents<T>
> {
  // @ts-ignore
  values: T = {};

  input<Key extends keyof T>(key: Key, value: T[Key]) {
    this.values[key] = value;
    this.emit(Events.Input, value);
  }
  onInput(handler: Handler<TheTypesOfEvents<T>[Events.Input]>) {
    this.on(Events.Input, handler);
  }
  submit() {
    this.emit(Events.Submit, { ...this.values });
  }
  onSubmit(handler: Handler<TheTypesOfEvents<T>[Events.Submit]>) {
    this.on(Events.Submit, handler);
  }
}
