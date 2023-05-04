import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

import { MenuCore } from ".";

enum Events {
  StateChange,
  Enter,
  Leave,
  Focus,
  Blur,
}
type TheTypesOfEvents = {
  [Events.StateChange]: MenuItemState;
  [Events.Enter]: void;
  [Events.Leave]: void;
  [Events.Focus]: void;
  [Events.Blur]: void;
};
type MenuItemState = {
  /** 有子菜单并且子菜单展示了 */
  subOpen: boolean;
  disabled: boolean;
  focused: boolean;
};

export class MenuItemCore extends BaseDomain<TheTypesOfEvents> {
  name = "MenuItemCore";

  state: MenuItemState = {
    subOpen: false,
    disabled: false,
    focused: false,
  };

  sub: MenuCore | null = null;

  _visible = false;
  _enter = false;
  _focus = false;

  /** MenuItem 悬浮时展示的菜单 */
  setSub(sub: MenuCore) {
    sub.onShow(() => {
      this.state.subOpen = true;
      this.emit(Events.StateChange, { ...this.state });
    });
    sub.onHide(() => {
      this.state.subOpen = false;
      this.emit(Events.StateChange, { ...this.state });
    });
    this.sub = sub;
  }
  /** 禁用指定菜单项 */
  disable() {
    this.state.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 鼠标进入菜单项 */
  enter() {
    if (this._enter) {
      return;
    }
    this.log("enter");
    this._enter = true;
    this.state.focused = true;
    // this.state.visible = true;
    this.emit(Events.Enter);
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 鼠标离开菜单项 */
  leave() {
    if (this._enter === false) {
      return;
    }
    this.log("leave");
    this._enter = false;
    this.state.focused = false;
    this.emit(Events.Leave);
    this.emit(Events.StateChange, { ...this.state });
  }
  focus() {
    if (this._focus) {
      return;
    }
    this.log("focus");
    this._focus = true;
    this.state.focused = true;
    this.emit(Events.Focus);
    this.emit(Events.StateChange, { ...this.state });
  }
  blur() {
    if (this._focus === false) {
      return;
    }
    this.log("blur");
    this._focus = false;
    this.state.focused = false;
    this.emit(Events.Blur);
    this.emit(Events.StateChange, { ...this.state });
  }

  destroy() {
    super.destroy();

    if (this.sub) {
      this.sub.destroy();
    }
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onEnter(handler: Handler<TheTypesOfEvents[Events.Enter]>) {
    return this.on(Events.Enter, handler);
  }
  onLeave(handler: Handler<TheTypesOfEvents[Events.Leave]>) {
    return this.on(Events.Leave, handler);
  }
  onFocus(handler: Handler<TheTypesOfEvents[Events.Focus]>) {
    return this.on(Events.Focus, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }

  get [Symbol.toStringTag]() {
    return "MenuItem";
  }
}
