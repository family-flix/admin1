import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";

enum Events {
  StateChange,
  Change,
}
type TheTypesOfEvents = {
  [Events.StateChange]: CheckboxState;
  [Events.Change]: boolean;
};
type CheckboxProps = {
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (checked: boolean) => void;
};
type CheckboxState = CheckboxProps & {
  value: unknown;
};

export class CheckboxCore extends BaseDomain<TheTypesOfEvents> {
  presence: PresenceCore;

  disabled: CheckboxProps["disabled"];
  checked: boolean;

  get state(): CheckboxState {
    return {
      value: "1",
      checked: this.checked,
      disabled: this.disabled,
    };
  }

  prevChecked = false;

  constructor(props: { _name?: string } & CheckboxProps = {}) {
    super(props);

    const { disabled = false, checked = false, onChange } = props;
    this.disabled = disabled;
    this.checked = checked;

    this.presence = new PresenceCore();
    if (onChange) {
      this.onChange(onChange);
    }
  }

  /** 切换选中状态 */
  toggle() {
    const prevChecked = this.checked;
    // console.log("[DOMAIN]checkbox - check", prevChecked);
    (() => {
      if (prevChecked) {
        this.presence.hide();
        return;
      }
      this.presence.show();
    })();
    this.checked = true;
    if (prevChecked) {
      this.checked = false;
    }
    this.prevChecked = prevChecked;
    this.emit(Events.Change, this.checked);
    this.emit(Events.StateChange, { ...this.state });
  }
  check() {
    if (this.checked === true) {
      return;
    }
    this.presence.show();
    this.prevChecked = this.checked;
    this.checked = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  uncheck() {
    if (this.checked === false) {
      return;
    }
    this.presence.hide();
    this.prevChecked = this.checked;
    this.checked = false;
    this.emit(Events.StateChange, { ...this.state });
  }

  onChange(handler: Handler<TheTypesOfEvents[Events.Change]>) {
    return this.on(Events.Change, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
