/**
 * @file 多字段 Input
 */
import { BaseDomain, Handler } from "@/domains/base";

import { FormFieldCore } from "./field";
import { ValueInputInterface } from "./types";

enum Events {
  Input,
  Submit,
  Change,
  StateChange,
}
type TheTypesOfEvents<T extends Record<string, unknown>> = {
  [Events.Input]: unknown;
  [Events.Submit]: T;
  [Events.Change]: T;
  [Events.StateChange]: T;
};

type FormState<T extends Record<string, unknown>> = {
  value: T;
};
type FormProps<F extends Record<string, FieldCore<any>>> = {
  fields: F;
};
type FieldCore<T> = {
  name: string;
  $input: ValueInputInterface<T>;
};

export class FormCore<T extends Record<string, any>, F extends Record<string, FieldCore<any>> = {}>
  extends BaseDomain<TheTypesOfEvents<T>>
  implements ValueInputInterface<T>
{
  fields: F;

  _values: T = {} as T;

  get state(): FormState<T> {
    return {
      value: this._values,
    };
  }
  get value() {
    return this._values;
  }

  constructor(props: Partial<{ _name: string }> & FormProps<F>) {
    super(props);

    const { fields } = props;
    const keys: Array<keyof F> = Object.keys(fields);
    for (let i = 0; i < keys.length; i += 1) {
      const field = fields[keys[i]];
      this.updateValues(field.name, field.$input.value);
      field.$input.onChange((v) => {
        this.updateValues(field.name, v);
      });
    }
    this.fields = fields;
  }
  updateValues<K extends keyof T>(name: K, value: T[K]) {
    console.log("[DOMAIN]ui/form/index - updateValues", name, value);
    this._values[name] = value;
    this.emit(Events.Change, { ...this.state.value });
  }
  setValue(v: T) {
    this._values = v;
    this.emit(Events.Change, { ...this.state.value });
  }
  // setFieldsValue(nextValues) {}
  input<Key extends keyof T>(key: Key, value: T[Key]) {
    this._values[key] = value;
    this.emit(Events.Input, value);
    this.emit(Events.Change, { ...this.state.value });
  }
  submit() {
    this.emit(Events.Submit, { ...this.state.value });
  }

  onSubmit(handler: Handler<TheTypesOfEvents<T>[Events.Submit]>) {
    this.on(Events.Submit, handler);
  }
  onInput(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    this.on(Events.Change, handler);
  }
  onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
}
