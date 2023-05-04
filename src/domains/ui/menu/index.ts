import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PopperCore, Side, Align } from "@/domains/ui/popper";
import { DismissableLayerCore } from "@/domains/ui/dismissable-layer";
import { PresenceCore } from "@/domains/ui/presence";

import { MenuItemCore } from "./item";

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
  EnterMenu,
  LeaveMenu,
}
type TheTypesOfEvents = {
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.EnterItem]: MenuItemCore;
  [Events.LeaveItem]: MenuItemCore;
  [Events.EnterMenu]: void;
  [Events.LeaveMenu]: void;
};
type MenuState = {
  visible: boolean;
};

export class MenuCore extends BaseDomain<TheTypesOfEvents> {
  name = "MenuCore";
  debug = true;

  popper: PopperCore;
  presence: PresenceCore;
  layer: DismissableLayerCore;

  openTimer: NodeJS.Timeout | null = null;

  constructor(
    options: Partial<{
      name: string;
      side: Side;
      align: Align;
      strategy: "fixed" | "absolute";
      options: {
        label: string;
        onClick: () => void;
      }[];
    }> = {}
  ) {
    super(options);

    this.popper = new PopperCore({
      ...options,
      name: options.name ? `${options.name}-popper` : undefined,
    });
    this.presence = new PresenceCore();
    this.layer = new DismissableLayerCore();
    this.popper.onEnter(() => {
      this.log("this.popper.onEnter", this.items.length);
      this.emit(Events.EnterMenu);
    });
    this.popper.onLeave(() => {
      this.log("this.popper.onLeave", this.items.length);
      this.emit(Events.LeaveMenu);
    });
    this.layer.onDismiss(() => {
      this.hide();
    });
  }

  state = {
    visible: false,
  };
  subs: MenuCore[] = [];
  curSub: MenuCore | null = null;
  items: MenuItemCore[] = [];
  curItem: MenuItemCore | null = null;
  inside = false;
  inSubMenu = false;

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
    this.inside = false;
    this.presence.hide();
    this.emit(Events.Hidden);
  }
  appendSub(sub: MenuCore) {
    if (this.subs.includes(sub)) {
      return;
    }
    sub.onShow(() => {
      this.log("sub.onShow");
      this.curSub = sub;
    });
    sub.onEnter(() => {
      this.log("sub.onEnter");
      this.inSubMenu = true;
    });
    sub.onLeave(() => {
      this.log("sub.onLeave");
      this.inSubMenu = false;
    });
    sub.onHide(() => {
      this.log("sub.onHide");
      this.curSub = null;
    });
    this.subs.push(sub);
    return sub;
  }
  maybeLeave = false;
  leaveTimer: NodeJS.Timeout | null = null;
  appendItem(item: MenuItemCore) {
    if (this.items.includes(item)) {
      return;
    }
    // this.log("appendItem");
    // const item = new MenuItemCore();
    item.onEnter(() => {
      // this.log("item.onEnter", this.inside, this.curSub?.inside);
      this.maybeLeave = false;
      this.inside = true;
      if (item.sub) {
        this.maybeLeave = false;
        item.sub.show();
      }
      if (!item.sub && this.curSub) {
        this.curSub.hide();
      }
      this.emit(Events.EnterItem, item);
      // this.emit(Events.EnterMenu);
    });
    item.onLeave(() => {
      this.maybeLeave = true;
      this.emit(Events.LeaveItem, item);
      this.log("item.onLeave", this.items.length);
      if (this.leaveTimer !== null) {
        clearInterval(this.leaveTimer);
        this.leaveTimer = setTimeout(() => {
          this.leaveMenu(item);
        }, 100);
        return;
      }
      this.leaveTimer = setTimeout(() => {
        this.leaveMenu(item);
      }, 100);
    });
    this.items.push(item);
    return item;
  }
  leaveMenu(item: MenuItemCore) {
    clearTimeout(this.leaveTimer);
    this.leaveTimer = null;
    if (this.maybeLeave === false) {
      return;
    }
    this.log("leaveMenu check need hide subMenu", this.curSub, this.inSubMenu);
    this.inside = false;
    // this.emit(Events.LeaveMenu);
    // 直接从有 SubMenu 的 MenuItem 离开，不到其他 MenuItem 场景下，也要关闭 SubMenu
    if (this.curSub && !this.inSubMenu) {
      this.curSub.hide();
    }
  }

  destroy() {
    // this.log("destroy", this.name);
    super.destroy();
    this.layer.destroy();
    this.popper.destroy();
    this.presence.destroy();
    for (let i = 0; i < this.subs.length; i += 1) {
      this.subs[i].destroy();
    }
    for (let i = 0; i < this.items.length; i += 1) {
      this.items[i].destroy();
    }
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
  onEnter(handler: Handler<TheTypesOfEvents[Events.EnterMenu]>) {
    return this.on(Events.EnterMenu, handler);
  }
  onLeave(handler: Handler<TheTypesOfEvents[Events.LeaveMenu]>) {
    return this.on(Events.LeaveMenu, handler);
  }

  get [Symbol.toStringTag]() {
    return "Menu";
  }
}

// enum MenuSubEvents {}
// type TheTypesOfMenuSubEvents = {};
// export class MenuSubCore extends BaseDomain<TheTypesOfMenuSubEvents> {}
