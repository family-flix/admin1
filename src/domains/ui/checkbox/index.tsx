import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: CheckboxState;
};
type CheckboxProps = {
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
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

    const { disabled = false, checked = false } = props;
    this.disabled = disabled;
    this.checked = checked;

    this.presence = new PresenceCore();
  }

  /** 选中 */
  check() {
    const prevChecked = this.checked;
    console.log("[DOMAIN]checkbox - check", prevChecked);
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
    this.emit(Events.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
