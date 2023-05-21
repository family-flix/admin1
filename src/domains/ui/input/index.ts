import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  Change,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Change]: string;
  [Events.StateChange]: InputState;
};
type InputState = {
  value: string;
  placeholder: string;
  disabled: boolean;
  type: string;
};
type InputProps = {
  /** 字段键 */
  name: string;
  defaultValue: string;
  placeholder: string;
  type: string;
  onChange: (v: string) => void;
};

export class InputCore extends BaseDomain<TheTypesOfEvents> {
  _defaultValue: string;
  value = "";
  state = {
    value: "",
    placeholder: "请输入",
    disabled: false,
    type: "string",
  };

  constructor(options: Partial<{ name: string } & InputProps> = {}) {
    super(options);

    const { name, defaultValue, placeholder, type, onChange } = options;
    this.name = name;
    if (placeholder) {
      this.state.placeholder = placeholder;
    }
    if (type) {
      this.state.type = type;
    }
    this._defaultValue = defaultValue;
    if (defaultValue) {
      this.value = defaultValue;
      this.state.value = defaultValue;
    }
    if (onChange) {
      this.onChange((v) => {
        onChange(v);
      });
    }
  }

  change(value: string) {
    this.state.value = value;
    this.value = value;
    this.emit(Events.Change, value);
    this.emit(Events.StateChange, { ...this.state });
  }
  enable() {
    this.state.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  disable() {
    this.state.disabled = false;
    this.emit(Events.StateChange, { ...this.state });
  }
  empty() {
    this.state.value = "";
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.state.value = this._defaultValue;
    this.emit(Events.StateChange, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
    this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
