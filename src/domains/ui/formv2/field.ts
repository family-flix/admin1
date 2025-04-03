import { base, Handler } from "@/domains/base";
import { Result } from "@/domains/result";
import { BizError } from "@/domains/error";

import { FormInputInterface } from "./types";

type CommonRuleCore = {
  required: boolean;
};
type NumberRuleCore = {
  min: number;
  max: number;
};
type StringRuleCore = {
  minLength: number;
  maxLength: number;
};
type FieldRuleCore = CommonRuleCore & NumberRuleCore & StringRuleCore;
type FormFieldCoreProps = {
  label: string;
  name: string;
  rules?: FieldRuleCore[];
};
export function FormFieldCore<T>(props: FormFieldCoreProps) {
  const { label, name } = props;

  return {
    label,
    name,
    //     input,

    setValue() {},
    validate() {},
  };
}

export type FormValidateResult = {
  valid: boolean;
  value: any;
  errors: BizError[];
};

enum SingleFieldEvents {
  StateChange,
}
type TheSingleFieldCoreEvents<T> = {
  [SingleFieldEvents.StateChange]: T;
};
type SingleFieldCoreProps<T> = FormFieldCoreProps & {
  input: T;
  hidden?: boolean;
};
export class SingleFieldCore<T extends FormInputInterface<any>> {
  symbol = "SingleFieldCore" as const;
  _label: string;
  _name: string;
  _hidden = false;
  _input: T;
  _rules: FieldRuleCore[];
  _dirty = false;
  _bus = base<TheSingleFieldCoreEvents<T>>();
  get state() {
    return {
      symbol: this.symbol,
      label: this._label,
      name: this._name,
      hidden: this._hidden,
      input: {
        shape: this._input.shape,
        value: this._input.value,
        // @ts-ignore
        type: this._input.type,
        // @ts-ignore
        options: this._input.shape === "select" ? this._input.options : undefined,
      },
    };
  }

  constructor(props: SingleFieldCoreProps<T>) {
    const { label, name, rules = [], input, hidden = false } = props;

    this._label = label;
    this._name = name;
    this._input = input;
    this._rules = rules;
    this._hidden = hidden;
  }
  get label() {
    return this._label;
  }
  get name() {
    return this._name;
  }
  get hidden() {
    return this._hidden;
  }
  get dirty() {
    return this._dirty;
  }
  get input() {
    return this._input;
  }
  get value() {
    return this._input.value as T["value"];
  }
  hide() {
    this._hidden = true;
  }
  show() {
    this._hidden = false;
  }
  setValue(value: T["value"]) {
    const v = (() => {
      if (value !== undefined) {
        return value;
      }
      return this._input.defaultValue;
    })();
    //     console.log("[DOMAIN]formv2 - SingleField - setValue", v);
    this._input.setValue(v);
  }
  handleValueChange(value: T["value"]) {
    this._dirty = true;
    this._input.setValue(value);
  }
  async validate() {
    const value = this._input.value;
    const errors: BizError[] = [];
    for (let i = 0; i < this._rules.length; i += 1) {
      const rule = this._rules[i];
      if (rule.required && !value) {
        errors.push(new BizError(`${this._label}不能为空`));
      }
      if (this._input.shape === "number") {
        if (rule.min && typeof value === "number" && value < rule.min) {
          errors.push(new BizError(`${this._label}不能小于${rule.min}`));
        }
        if (rule.max && typeof value === "number" && value > rule.max) {
          errors.push(new BizError(`${this._label}不能大于${rule.max}`));
        }
      }
    }
    if (errors.length > 0) {
      return Result.Err(new BizError(errors.join("\n")));
    }
    return Result.Ok(value);
  }
  onStateChange(handler: Handler<TheSingleFieldCoreEvents<T>[SingleFieldEvents.StateChange]>) {
    return this._bus.on(SingleFieldEvents.StateChange, handler);
  }
}

type ArrayFieldCoreProps<
  T extends (count: number) => SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>
> = FormFieldCoreProps & {
  field: T;
  hidden?: boolean;
};
type ArrayFieldValue<T extends (count: number) => SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>> =
  ReturnType<T>["value"];
// type ArrayFieldValue<T extends (count: number) => SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>> = {
//   [K in keyof ReturnType<T>]: ReturnType<T>[K] extends SingleFieldCore<any>
//     ? ReturnType<T>[K]["value"]
//     : ReturnType<T>[K] extends ArrayFieldCore<any>
//     ? ReturnType<T>[K]["value"]
//     : ReturnType<T>[K] extends ObjectFieldCore<any> ? ReturnType<T>[K]["value"] : never;
// };
type ArrayFieldCoreState = {
  label: string;
  hidden: boolean;
  fields: { id: number; label: string }[];
};
enum ArrayFieldEvents {
  StateChange,
}
type TheArrayFieldCoreEvents<
  T extends (count: number) => SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>
> = {
  [ArrayFieldEvents.StateChange]: ArrayFieldValue<T>;
};
export class ArrayFieldCore<
  T extends (count: number) => SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>
> {
  symbol = "ArrayFieldCore" as const;
  _label: string;
  _name: string;
  _hidden = false;
  fields: { id: number; idx: number; field: ReturnType<T> }[] = [];
  _field: T;
  _bus = base<TheArrayFieldCoreEvents<T>>();

  get state(): ArrayFieldCoreState {
    return {
      label: this._label,
      hidden: this._hidden,
      fields: this.fields.map((field) => {
        return {
          id: field.id,
          idx: field.idx,
          label: field.field.label,
        };
      }),
    };
  }

  constructor(props: ArrayFieldCoreProps<T>) {
    const { label, name, field, hidden = false } = props;
    this._label = label;
    this._name = name;
    this._field = field;
    this._hidden = hidden;
    this.fields = [];
  }

  mapFieldWithIndex(index: number) {
    const field = this.fields[index];
    if (!field) {
      return null;
    }
    return field;
  }

  get label() {
    return this._label;
  }
  get name() {
    return this._name;
  }
  get hidden() {
    return this._hidden;
  }
  // get dirty() {
  //   return this._dirty;
  // }
  get value(): ArrayFieldValue<T> {
    const r: ArrayFieldValue<T> = this.fields.map((field) => {
      return field.field.value;
    });
    return r;
  }
  hide() {
    this._hidden = true;
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
  }
  show() {
    this._hidden = false;
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
  }
  setValue(values: any[], key?: string) {
    console.log("[DOMAIN]ArrayFieldCore - setValue", key, values, this.fields);
    for (let i = 0; i < values.length; i += 1) {
      (() => {
        const v = values[i];
        let field = this.fields[i];
        if (!field) {
          field = {
            id: this.fields.length,
            idx: i,
            // @ts-ignore
            field: this._field(i),
          };
          this.fields[i] = field;
        }
        field.field.setValue(v);
      })();
    }
    //     bus.emit(Events.StateChange, _state);
  }
  async validate(): Promise<Result<ArrayFieldValue<T>>> {
    const results: ArrayFieldValue<T> = [];
    const errors: BizError[] = [];
    for (let i = 0; i < this.fields.length; i += 1) {
      await (async () => {
        const field = this.fields[i];
        const r = await field.field.validate();
        if (r.error) {
          errors.push(r.error);
          return;
        }
        results.push(r.data);
      })();
    }
    if (errors.length > 0) {
      return Result.Err(new BizError(errors.join("\n")));
    }
    return Result.Ok(results);
  }
  insertBefore(id: number): ReturnType<T> {
    const field_idx = this.fields.findIndex((field) => field.id === id) ?? 0;
    const field = this._field(this.fields.length);
    let idx = field_idx;
    if (idx < 0) {
      idx = 0;
    }
    this.fields.splice(idx, 0, {
      id: this.fields.length,
      idx: idx,
      // @ts-ignore
      field,
    });
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
    // @ts-ignore
    return field;
  }
  insertAfter(id: number): ReturnType<T> {
    const field_idx = this.fields.findIndex((field) => field.id === id) ?? this.fields.length - 1;
    const field = this._field(this.fields.length);
    let idx = field_idx + 1;
    if (idx > this.fields.length) {
      idx = this.fields.length;
    }
    this.fields.splice(idx, 0, {
      id: this.fields.length,
      idx: idx,
      // @ts-ignore
      field,
    });
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
    // @ts-ignore
    return field;
  }
  append(): ReturnType<T> {
    let field = this._field(this.fields.length);
    this.fields.push({
      id: this.fields.length,
      idx: this.fields.length,
      // @ts-ignore
      field,
    });
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
    // @ts-ignore
    return field;
  }
  remove(id: number) {
    this.fields = this.fields.filter((field) => field.id !== id);
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
  }
  /** 将指定的元素，向前移动一个位置 */
  upIdx(id: number) {
    const field_idx = this.fields.findIndex((field) => field.id === id);
    if (field_idx === -1) {
      return;
    }
    if (field_idx === 0) {
      return;
    }
    const prev_idx = this.fields[field_idx - 1];
    if (!prev_idx) {
      return;
    }
    this.fields[field_idx - 1] = this.fields[field_idx];
    this.fields[field_idx] = prev_idx;
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
  }
  /** 将指定的元素，向后移动一个位置 */
  downIdx(id: number) {
    const field_idx = this.fields.findIndex((field) => field.id === id);
    if (field_idx === -1) {
      return;
    }
    if (field_idx === this.fields.length - 1) {
      return;
    }
    const next_idx = this.fields[field_idx + 1];
    if (!next_idx) {
      return;
    }
    this.fields[field_idx + 1] = this.fields[field_idx];
    this.fields[field_idx] = next_idx;
    this._bus.emit(ArrayFieldEvents.StateChange, { ...this.state });
  }
  onStateChange(handler: Handler<TheArrayFieldCoreEvents<T>[ArrayFieldEvents.StateChange]>) {
    return this._bus.on(ArrayFieldEvents.StateChange, handler);
  }
}
type ObjectValue<O extends Record<string, SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>>> = {
  [K in keyof O]: O[K] extends SingleFieldCore<any>
    ? O[K]["value"]
    : O[K] extends ArrayFieldCore<any>
    ? O[K]["value"][]
    : O[K] extends ObjectFieldCore<any>
    ? O[K]["value"]
    : never;
};
type ObjectFieldCoreProps<T> = FormFieldCoreProps & {
  fields: T;
  hidden?: boolean;
};
type ObjectFieldCoreState = {
  label: string;
  hidden: boolean;
  fields: {
    symbol: string;
    label: string;
    name: string;
    hidden: boolean;
  }[];
};
enum ObjectFieldEvents {
  Change,
  StateChange,
}
type TheObjectFieldCoreEvents<
  T extends Record<string, SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>>
> = {
  [ObjectFieldEvents.Change]: ObjectValue<T>;
  [ObjectFieldEvents.StateChange]: ObjectFieldCoreState;
};

function buildFieldsState<T extends Record<string, SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>>>(
  fields: T
) {
  const state: {
    symbol: string;
    label: string;
    name: string;
    hidden: boolean;
  }[] = Object.values(fields).map((field) => {
    return {
      symbol: field.symbol,
      label: field.label,
      name: field.name,
      hidden: field.hidden,
    };
  });
  return state;
}

export class ObjectFieldCore<
  T extends Record<string, SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>>
> {
  symbol = "ObjectFieldCore" as const;
  _label: string;
  _name: string;
  _hidden = false;
  _dirty = false;
  fields: T;
  _bus = base<TheObjectFieldCoreEvents<T>>();

  get state(): ObjectFieldCoreState {
    const fields = buildFieldsState(this.fields);
    return {
      label: this._label,
      hidden: this._hidden,
      fields,
    };
  }

  constructor(props: ObjectFieldCoreProps<T>) {
    const { label, name, hidden = false, fields } = props;
    this._label = label;
    this._name = name;
    this._hidden = hidden;
    this.fields = fields;
  }
  get label() {
    return this._label;
  }
  get name() {
    return this._name;
  }
  get hidden() {
    return this._hidden;
  }
  get dirty() {
    return this._dirty;
  }
  get value(): ObjectValue<T> {
    const keys = Object.keys(this.fields) as Array<keyof T>;
    const result = keys.reduce((acc, key) => {
      acc[key] = this.fields[key].value;
      return acc;
    }, {} as ObjectValue<T>);
    return result;
  }
  mapFieldWithName(name: string) {
    const field = this.fields[name];
    if (!field) {
      return null;
    }
    return field;
  }
  setField(name: string, field: SingleFieldCore<any> | ArrayFieldCore<any> | ObjectFieldCore<any>) {
    // @ts-ignore
    this.fields[name] = field;
    this._bus.emit(ObjectFieldEvents.StateChange, { ...this.state });
  }
  hideField(name: string) {
    const field = this.fields[name];
    if (!field) {
      return;
    }
    field.hide();
    this._bus.emit(ObjectFieldEvents.StateChange, { ...this.state });
  }
  showField(name: string) {
    const field = this.fields[name];
    if (!field) {
      return;
    }
    field.show();
  }
  hide() {
    this._hidden = true;
    this._bus.emit(ObjectFieldEvents.StateChange, { ...this.state });
  }
  show() {
    this._hidden = false;
    this._bus.emit(ObjectFieldEvents.StateChange, { ...this.state });
  }
  setValue(values: Record<string, any>) {
    const keys = Object.keys(this.fields);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const field = this.fields[key];
      console.log("[DOMAIN]ObjectFieldCore - before field.setValue", key, field);
      field.setValue(values[key], key);
    }
  }
  refresh() {
    this._bus.emit(ObjectFieldEvents.StateChange, { ...this.state });
  }
  async validate(): Promise<Result<ObjectValue<T>>> {
    const results: ObjectValue<T> = {} as ObjectValue<T>;
    const errors: BizError[] = [];
    const keys = Object.keys(this.fields);
    for (let i = 0; i < keys.length; i += 1) {
      await (async () => {
        const key = keys[i];
        const field = this.fields[key];
        const r = await field.validate();
        if (r.error) {
          errors.push(r.error);
          return;
        }
        // @ts-ignore
        results[key] = r.data;
      })();
    }
    if (errors.length > 0) {
      return Result.Err(new BizError(errors.join("\n")));
    }
    return Result.Ok(results);
  }
  handleValueChange(path: string, value: any) {
    this._dirty = true;
    const field = this.fields[path];
    if (!field) {
      return;
    }
    field.setValue(value, path);
    this._bus.emit(ObjectFieldEvents.Change, this.value);
  }
  toJSON() {
    return Object.keys(this.fields)
      .map((key) => {
        return {
          [key]: this.fields[key].value,
        };
      })
      .reduce((a, b) => {
        return { ...a, ...b };
      }, {});
  }
  destroy() {
    this._bus.destroy();
  }
  onChange(handler: Handler<TheObjectFieldCoreEvents<T>[ObjectFieldEvents.Change]>) {
    return this._bus.on(ObjectFieldEvents.Change, handler);
  }
  onStateChange(handler: Handler<TheObjectFieldCoreEvents<T>[ObjectFieldEvents.StateChange]>) {
    return this._bus.on(ObjectFieldEvents.StateChange, handler);
  }
}
