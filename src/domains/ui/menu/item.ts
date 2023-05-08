import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

import { MenuCore } from ".";

enum Events {
  StateChange,
  Enter,
  Leave,
  Focus,
  Blur,
  Click,
}
type TheTypesOfEvents = {
  [Events.StateChange]: MenuItemState;
  [Events.Enter]: void;
  [Events.Leave]: void;
  [Events.Focus]: void;
  [Events.Blur]: void;
  [Events.Click]: void;
};
type MenuItemState = {
  label: string;
  /** 有子菜单并且子菜单展示了 */
  open: boolean;
  disabled: boolean;
  focused: boolean;
};
type MenuItemProps = {
  label: string;
  disabled: boolean;
  /** 子菜单 */
  menu?: MenuCore;
  /** 点击后的回调 */
  onClick?: () => void;
};
const defaultMenuItemState: MenuItemState = {
  label: "",
  open: false,
  disabled: false,
  focused: false,
};

export class MenuItemCore extends BaseDomain<TheTypesOfEvents> {
  name = "MenuItemCore";
  debug = true;

  state: MenuItemState = { ...defaultMenuItemState };

  label: string;
  /** 子菜单 */
  menu: MenuCore | null = null;

  _enter = false;

  constructor(options: Partial<{ name: string } & MenuItemProps> = {}) {
    super(options);

    const { label, disabled = false, menu, onClick } = options;
    this.state.label = label;
    this.state.disabled = disabled;
    this.label = label;
    if (menu) {
      this.menu = menu;
      menu.onShow(() => {
        this.state.open = true;
        this.emit(Events.StateChange, { ...this.state });
      });
      menu.onHide(() => {
        this.state.open = false;
        this.emit(Events.StateChange, { ...this.state });
      });
    }
    if (onClick) {
      this.onClick(() => {
        onClick();
      });
    }
  }
  /** 禁用指定菜单项 */
  disable() {
    this.state.disabled = true;
    this.emit(Events.StateChange, { ...this.state });
  }
  /** 鼠标进入菜单项 */
  enter() {
    // console.log("enter", this.label, this._enter);
    if (this._enter) {
      return;
    }
    this.log("enter");
    this._enter = true;
    this.state.focused = true;
    this.emit(Events.Enter);
    this.emit(Events.StateChange, { ...this.state });
  }
  move() {
    if (this.state.disabled) {
      this.leave();
      return;
    }
    this.enter();
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
    if (this.state.focused) {
      return;
    }
    this.log("focus");
    this.state.focused = true;
    this.emit(Events.Focus);
    this.emit(Events.StateChange, { ...this.state });
  }
  blur() {
    if (this.state.focused === false) {
      return;
    }
    this.log("blur");
    this.state.focused = false;
    this._enter = false;
    this.emit(Events.Blur);
    this.emit(Events.StateChange, { ...this.state });
  }
  click() {
    this.emit(Events.Click);
  }
  reset() {
    // console.log("[]MenuItemCore - reset", this.state.open);
    this.state = { ...this.state, focused: false, open: false };
    this._enter = false;
    if (this.menu) {
      this.menu.reset();
    }
  }
  destroy() {
    super.destroy();
    if (this.menu) {
      this.menu.destroy();
    }
    this.reset();
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
  onClick(handler: Handler<TheTypesOfEvents[Events.Click]>) {
    return this.on(Events.Click, handler);
  }

  get [Symbol.toStringTag]() {
    return "MenuItem";
  }
}
