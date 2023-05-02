import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PopperCore, Side, Align } from "@/domains/ui/popper";
import { DismissableLayerCore } from "@/domains/ui/dismissable-layer";
import { PresenceCore } from "@/domains/ui/presence";

type Direction = "ltr" | "rtl";

const SELECTION_KEYS = ["Enter", " "];
const FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
const LAST_KEYS = ["ArrowUp", "PageDown", "End"];
const FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
const SUB_OPEN_KEYS: Record<Direction, string[]> = {
  ltr: [...SELECTION_KEYS, "ArrowRight"],
  rtl: [...SELECTION_KEYS, "ArrowLeft"],
};
const SUB_CLOSE_KEYS: Record<Direction, string[]> = {
  ltr: ["ArrowLeft"],
  rtl: ["ArrowRight"],
};

enum Events {
  Show,
  Hidden,
  EnterItem,
  LeaveItem,
}
type TheTypesOfEvents = {
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.EnterItem]: MenuItemCore;
  [Events.LeaveItem]: MenuItemCore;
};
type MenuState = {
  visible: boolean;
};

export class MenuCore extends BaseDomain<TheTypesOfEvents> {
  name = "MenuCore";

  popper: PopperCore;
  presence: PresenceCore;
  layer: DismissableLayerCore;

  openTimer: NodeJS.Timeout | null = null;

  constructor(
    options: Partial<{
      side: Side;
      align: Align;
      strategy: "fixed" | "absolute";
    }> = {}
  ) {
    super();

    this.popper = new PopperCore(options);
    this.presence = new PresenceCore();
    this.layer = new DismissableLayerCore();
  }

  state = {
    visible: false,
  };

  toggle() {
    const { visible } = this.state;
    this.log("toggle", visible);
    if (visible) {
      this.hide();
      return;
    }
    this.show();
  }
  show() {
    this.state.visible = true;
    this.presence.show();
    this.popper.place();
    this.emit(Events.Show);
  }
  hide() {
    this.state.visible = false;
    this.presence.hide();
    this.emit(Events.Hidden);
  }
  appendItem() {
    this.log("appendItem");
    const item = new MenuItemCore();
    const off1 = item.onEnter(() => {
      this.log("item enter");
      this.emit(Events.EnterItem, item);
    });
    const off2 = item.onLeave(() => {
      this.log("item leave");
      this.emit(Events.LeaveItem, item);
    });
    this.listeners.push(off1);
    this.listeners.push(off2);
    return item;
  }

  destroy() {
    super.destroy();
    this.layer.destroy();
    this.popper.destroy();
    this.presence.destroy();
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onEnterItem(handler: Handler<TheTypesOfEvents[Events.EnterItem]>) {
    return this.on(Events.EnterItem, handler);
  }
  onLeaveItem(handler: Handler<TheTypesOfEvents[Events.LeaveItem]>) {
    return this.on(Events.LeaveItem, handler);
  }

  get [Symbol.toStringTag]() {
    return "Menu";
  }
}

enum SubEvents {
  StateChange,
  Enter,
  Leave,
  Focus,
  Blur,
}
type TheTypesOfSubEvents = {
  [SubEvents.StateChange]: MenuItemState;
  [SubEvents.Enter]: void;
  [SubEvents.Leave]: void;
  [SubEvents.Focus]: void;
  [SubEvents.Blur]: void;
};
type MenuItemState = {
  disabled: boolean;
  focused: boolean;
};
export class MenuItemCore extends BaseDomain<TheTypesOfSubEvents> {
  state: MenuItemState = {
    disabled: false,
    focused: false,
  };

  _enter = false;
  _focus = false;

  /** 禁用指定菜单项 */
  disable() {
    this.state.disabled = true;
    this.emit(SubEvents.StateChange, { ...this.state });
  }
  /** 鼠标进入菜单项 */
  enter() {
    if (this._enter) {
      return;
    }
    this.log("enter");
    this._enter = true;
    this.state.focused = true;
    this.emit(SubEvents.Enter);
    this.emit(SubEvents.StateChange, { ...this.state });
  }
  /** 鼠标离开菜单项 */
  leave() {
    if (this._enter === false) {
      return;
    }
    this.log("leave");
    this._enter = false;
    this.state.focused = false;
    this.emit(SubEvents.Leave);
    this.emit(SubEvents.StateChange, { ...this.state });
  }
  focus() {
    if (this._focus) {
      return;
    }
    this.log("focus");
    this._focus = true;
    this.state.focused = true;
    this.emit(SubEvents.Focus);
    this.emit(SubEvents.StateChange, { ...this.state });
  }
  blur() {
    if (this._focus === false) {
      return;
    }
    this.log("blur");
    this._focus = false;
    this.state.focused = false;
    this.emit(SubEvents.Blur);
    this.emit(SubEvents.StateChange, { ...this.state });
  }

  onStateChange(handler: Handler<TheTypesOfSubEvents[SubEvents.StateChange]>) {
    return this.on(SubEvents.StateChange, handler);
  }
  onEnter(handler: Handler<TheTypesOfSubEvents[SubEvents.Enter]>) {
    return this.on(SubEvents.Enter, handler);
  }
  onLeave(handler: Handler<TheTypesOfSubEvents[SubEvents.Leave]>) {
    return this.on(SubEvents.Leave, handler);
  }
  onFocus(handler: Handler<TheTypesOfSubEvents[SubEvents.Focus]>) {
    return this.on(SubEvents.Focus, handler);
  }
  onBlur(handler: Handler<TheTypesOfSubEvents[SubEvents.Blur]>) {
    return this.on(SubEvents.Blur, handler);
  }

  get [Symbol.toStringTag]() {
    return "MenuItem";
  }
}
