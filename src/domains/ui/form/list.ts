import { base, Handler } from "@/domains/base";

import { FormFieldCore } from "./field";
import { FormCore } from "./index";
// import { ValueInputInterface } from "./types";

// type ListInputCoreProps<T extends { defaultValue: any; value: ValueInputInterface<any> }> = {
//   defaultValue: T["defaultValue"];
//   value: FormCore<T>;
// };
export function ListContainerCore<T extends { defaultValue: any; input: any }>(props: T) {
  const { defaultValue, input } = props;

  if (defaultValue && Array.isArray(defaultValue)) {
    const v = defaultValue[0];
    if (input && typeof input.setValue === "function") {
      input.setValue(v);
    }
  }
  let _list: { index: number; $input: T["input"] }[] = [{ index: 0, $input: input }];
  let _backup = { ...input };
  let _values = [...defaultValue];

  function handle(item: { index: number; $input: T["input"] }, i: number) {
    item.$input.onChange((v: any) => {
      console.log("[DOMAIN]ui/form/list - $input onChange", v, item.index);
      _values[item.index] = v;
    });
  }

  for (let i = 0; i < _list.length; i += 1) {
    const $input = _list[i];
    handle($input, i);
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
      _list.push({ index: _list.length, $input: _backup });
      //       _values.push(v);
      bus.emit(Events.Change, _state.value);
    },
    removeField(v: T["input"]) {
      _list = _list.filter((f) => f !== v);
      bus.emit(Events.Change, _state.value);
    },
    removeFieldByIndex() {},
    setValue() {},
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
  };
}

export type ListContainerCore = ReturnType<typeof ListContainerCore>;
