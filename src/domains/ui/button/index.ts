import { BaseDomain } from "@/domains/base";
import { Handler } from "mitt";

enum Events {
  Click,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Click]: void;
  [Events.StateChange]: ButtonState;
};
type ButtonState = {
  loading: boolean;
  disabled: boolean;
};
type ButtonProps = {
  onClick: () => void;
};
export class ButtonCore extends BaseDomain<TheTypesOfEvents> {
  state: ButtonState = {
    loading: false,
    disabled: false,
  };

  constructor(options: Partial<{ name: string } & ButtonProps> = {}) {
    super(options);

    const { onClick } = options;
    if (onClick) {
      this.onClick(onClick);
    }
  }

  click() {
    this.emit(Events.Click);
  }
  disable() {
    this.state.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  enable() {
    this.state.disabled = false;
    this.emit(Events.StateChange, { ...this.state });
  }

  onClick(handler: Handler<TheTypesOfEvents[Events.Click]>) {
    this.on(Events.Click, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
