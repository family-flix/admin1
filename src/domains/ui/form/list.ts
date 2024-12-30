/**
 * @file 一个用于表单中的动态列表组件
 */
import { base, Handler } from "@/domains/base";

import { FormFieldCore } from "./field";
import { FormCore } from "./index";
// import { ValueInputInterface } from "./types";

// type ListInputCoreProps<T extends { defaultValue: any; value: ValueInputInterface<any> }> = {
//   defaultValue: T["defaultValue"];
//   value: FormCore<T>;
// };
export function ListContainerCore<T extends { defaultValue: any; input: () => any }>(props: T) {
  const { defaultValue, input } = props;

  const $input = input();

  if (defaultValue && Array.isArray(defaultValue)) {
    const v = defaultValue[0];
    if ($input && typeof $input.setValue === "function") {
      $input.setValue(v);
    }
  }
  let _factory = input;
  let _list: { index: number; $input: ReturnType<T["input"]> }[] = [{ index: 0, $input }];
  let _values = [...defaultValue];

  function handle(item: { index: number; $input: ReturnType<T["input"]> }) {
    //     _values[item.index] = item.$input.defaultValue;
    //     console.log("[DOMAIN]ui/form/list - $input onChange", _values);
    item.$input.onChange((v: any) => {
//       console.log("[DOMAIN]ui/form/list - $input onChange", v, item.index);
      _values[item.index] = v;
    });
  }

  for (let i = 0; i < _list.length; i += 1) {
    const $input = _list[i];
    handle($input);
  }

  const _state = {
    get list() {
      return _list;
    },
    get value() {
      return _values;
    },
  };

  enum Events {
    Change,
  }
  type TheTypesOfEvents = {
    [Events.Change]: typeof _state.value;
  };
  const bus = base<TheTypesOfEvents>();

  return {
    value: _state.value,
    $value: input,
    get list() {
      return _list;
    },
    append() {
      const ins = { index: _list.length, $input: _factory() };
//       console.log("[DOMAIN]ui/form/list - append", ins.index);
      handle(ins);
      _list.push(ins);
      //       _values.push(v);
      bus.emit(Events.Change, _state.value);
      return ins;
    },
    removeField(v: ReturnType<T["input"]>) {
      _list = _list.filter((f) => f !== v);
      bus.emit(Events.Change, _state.value);
    },
    removeFieldByIndex(index: number) {
      _list = _list.filter((f) => f.index !== index);
      bus.emit(Events.Change, _state.value);
    },
    setValue() {},
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export type ListContainerCore = ReturnType<typeof ListContainerCore>;
