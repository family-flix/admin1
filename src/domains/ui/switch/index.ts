import { base, Handler } from "@/domains/base";

type SwitchCoreProps = {
  defaultValue: boolean;
  disabled?: boolean;
};
export function SwitchCore(props: SwitchCoreProps) {
  const { defaultValue, disabled } = props;

  let _value = defaultValue;
  let _disabled = disabled;

  const _state = {
    get value() {
      return _value;
    },
    get disabled() {
      return _disabled;
    },
  };
  enum Events {
    Open,
    Close,
    Change,
    StateChange,
  }
  type TheTypesOfEvents = {
    [Events.Open]: void;
    [Events.Close]: void;
    [Events.Change]: typeof _value;
    [Events.StateChange]: typeof _state;
  };
  const bus = base<TheTypesOfEvents>();
  return {
    shape: "switch" as const,
    state: _state,
    setValue(v: boolean) {
      _value = v;
      bus.emit(Events.Change, _value);
      bus.emit(Events.StateChange, { ..._state });
    },
    disable() {
      _disabled = true;
      bus.emit(Events.StateChange, { ..._state });
    },
    enable() {
      _disabled = false;
      bus.emit(Events.StateChange, { ..._state });
    },
    handleChange(v: boolean) {
      this.setValue(v);
    },
    onOpen(handler: Handler<TheTypesOfEvents[Events.Open]>) {
      return bus.on(Events.Open, handler);
    },
    onClose(handler: Handler<TheTypesOfEvents[Events.Close]>) {
      return bus.on(Events.Close, handler);
    },
    onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
      return bus.on(Events.Change, handler);
    },
    onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
      return bus.on(Events.StateChange, handler);
    },
  };
}

export type SwitchCore = ReturnType<typeof SwitchCore>;
