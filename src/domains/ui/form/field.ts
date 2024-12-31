import { BaseDomain, Handler } from "@/domains/base";
import { InputCore } from "@/domains/ui/form/input";
import { DatePickerCore } from "@/domains/ui/date-picker";

import { ListContainerCore } from "./list";
import { FormCore } from "./index";
import { ValueInputInterface } from "./types";

enum Events {
  Input,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Input]: unknown;
  [Events.StateChange]: FormFieldCoreState;
};
type FormFieldCoreState = {
  label: string;
  name: string;
};
// value: InputCore<any> | DatePickerCore | ListInputCore | FormCore<any>;
// type FormFieldCoreProps = {
//   label: string;
//   name: string;
//   value: ValueInputInterface<any>;
// };

export class FormFieldCore<
  T extends { label: string; name: string; required?: boolean; input: ValueInputInterface<any> }
> extends BaseDomain<TheTypesOfEvents> {
  _label: string;
  _name: string;
  _required = false;
  $input: T["input"];

  get state(): FormFieldCoreState {
    return {
      label: this._label,
      name: this._name,
    };
  }
  get label() {
    return this._label;
  }
  get name() {
    return this._name;
  }
  // get $value() {
  //   return this.$value;
  // }

  constructor(props: Partial<{ _name: string }> & T) {
    super(props);

    const { name, label, required = false, input } = props;
    this._name = name;
    this._label = label;
    this._required = required;
    this.$input = input;
  }

  setLabel(label: string) {
    this._label = label;
  }
  setValue(...args: Parameters<typeof this.$input.setValue>) {
    this.$input.setValue(...args);
  }
  onInput(handler: Handler<TheTypesOfEvents[Events.Input]>) {
    this.on(Events.Input, handler);
  }
}
