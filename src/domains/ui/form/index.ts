/**
 * @file 多字段 Input
 */
import { base, BaseDomain, Handler } from "@/domains/base";

import { FormFieldCore } from "./field";
import { ValueInputInterface } from "./types";

type FormProps<F extends Record<string, FieldCore<any>>> = {
  fields: F;
};
type FieldCore<T> = {
  name: string;
  $input: ValueInputInterface<T>;
};

export function FormCore<T extends Record<string, any>, F extends Record<string, FieldCore<any>> = {}>(
  props: FormProps<F>
) {
  const { fields } = props;

  let _fields: F = fields;
  let _values: T = {} as T;

  const _state = {
    get value() {
      return _values;
    },
  };

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
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents<T>>();

  function updateValuesWithout<K extends keyof T>(name: K, value: T[K]) {
    // console.log("[DOMAIN]ui/form/index - updateValues", name, value);
    _values[name] = value;
  }
  function updateValues<K extends keyof T>(name: K, value: T[K]) {
    // console.log("[DOMAIN]ui/form/index - updateValues", name, value);
    _values[name] = value;
    bus.emit(Events.Change, { ..._state.value });
  }

  const keys: Array<keyof F> = Object.keys(_fields);
  for (let i = 0; i < keys.length; i += 1) {
    const field = _fields[keys[i]];
    updateValuesWithout(field.name, field.$input.value);
    field.$input.onChange((v) => {
      updateValues(field.name, v);
    });
  }

  return {
    Symbol: "FormCore" as const,
    get value() {
      return _values;
    },
    get fields() {
      return _fields;
    },
    setValue(v: T) {
      _values = v;
      bus.emit(Events.Change, _state.value);
    },
    // setFieldsValue(nextValues) {}
    input<Key extends keyof T>(key: Key, value: T[Key]) {
      _values[key] = value;
      bus.emit(Events.Change, _state.value);
    },
    submit() {
      bus.emit(Events.Submit, _state.value);
    },
    onSubmit(handler: Handler<TheTypesOfEvents<T>[Events.Submit]>) {
      bus.on(Events.Submit, handler);
    },
    onInput(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
      bus.on(Events.Change, handler);
    },
    onChange(handler: Handler<TheTypesOfEvents<T>[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export type FormCore = ReturnType<typeof FormCore>;
