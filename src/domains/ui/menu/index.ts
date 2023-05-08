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
  StateChange,
}
type TheTypesOfEvents = {
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.EnterItem]: MenuItemCore;
  [Events.LeaveItem]: MenuItemCore;
  [Events.EnterMenu]: void;
  [Events.LeaveMenu]: void;
  [Events.StateChange]: MenuState;
};
type MenuState = {
  open: boolean;
  items: MenuItemCore[];
};

export class MenuCore extends BaseDomain<TheTypesOfEvents> {
  name = "MenuCore";
  debug = true;

  popper: PopperCore;
  presence: PresenceCore;
  layer: DismissableLayerCore;

  openTimer: NodeJS.Timeout | null = null;
  state: MenuState = {
    open: false,
    items: [],
  };

  constructor(
    options: Partial<{
      name: string;
      side: Side;
      align: Align;
      strategy: "fixed" | "absolute";
      items: MenuItemCore[];
    }> = {}
  ) {
    super(options);

    const { name, items = [] } = options;
    this.state.items = items;
    this.listenItems(items);
    this.popper = new PopperCore({
      ...options,
      name: name ? `${name}-popper` : undefined,
    });
    this.presence = new PresenceCore();
    this.layer = new DismissableLayerCore();
    this.presence.onShow(() => {
      // this.popper.place();
      // this.emit(Events.Show);
    });
    this.popper.onEnter(() => {
      // this.log("this.popper.onEnter", this.items.length);
      this.emit(Events.EnterMenu);
    });
    this.popper.onLeave(() => {
      // this.log("this.popper.onLeave", this.items.length);
      this.emit(Events.LeaveMenu);
    });
    this.layer.onDismiss(() => {
      this.hide();
      this.reset();
    });
  }

  subs: MenuCore[] = [];
  items: MenuItemCore[] = [];
  curSub: MenuCore | null = null;
  curItem: MenuItemCore | null = null;
  inside = false;
  inSubMenu = false;

  toggle() {
    const { open } = this.state;
    this.log("toggle", open);
    if (open) {
      this.hide();
      return;
    }
    this.show();
  }
  show() {
    // this.state.open = true;
    this.presence.show();
    this.popper.place();
    this.emit(Events.Show);
    // this.emit(Events.StateChange, { ...this.state });
  }
  hide() {
    // this.state.open = false;
    // this.inside = false;
    this.presence.hide();
    this.emit(Events.Hidden);
    this.emit(Events.StateChange, { ...this.state });
  }
  // appendSub(sub: MenuCore) {
  //   if (this.subs.includes(sub)) {
  //     return;
  //   }
  //   sub.onShow(() => {
  //     this.log("sub.onShow");
  //     this.curSub = sub;
  //   });
  //   sub.onEnter(() => {
  //     this.log("sub.onEnter");
  //     this.inSubMenu = true;
  //   });
  //   sub.onLeave(() => {
  //     this.log("sub.onLeave");
  //     this.inSubMenu = false;
  //   });
  //   sub.onHide(() => {
  //     this.log("sub.onHide");
  //     this.curSub = null;
  //   });
  //   this.subs.push(sub);
  //   return sub;
  // }
  listenItems(items: MenuItemCore[]) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      console.log(item);
      item.onEnter(() => {
        // this.log("item.onEnter", this.inside, this.curSub?.inside);
        this.maybeLeave = false;
        this.inside = true;
        if (item.menu) {
          this.maybeLeave = false;
          item.menu.show();
        }
        if (!item.menu && this.curSub) {
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
      if (!item.menu) {
        continue;
      }
      const sub = item.menu;
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
    }
  }
  setItems(items: MenuItemCore[]) {
    this.state.items = items;
    this.items = items;
    this.listenItems(items);
    this.emit(Events.StateChange, {
      ...this.state,
    });
  }
  maybeLeave = false;
  leaveTimer: NodeJS.Timeout | null = null;
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
  reset() {
    this.inside = false;
    this.inSubMenu = false;
    this.curItem = null;
    this.curSub = null;
    for (let i = 0; i < this.items.length; i += 1) {
      this.items[i].reset();
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
    this.reset();
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
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Menu";
  }
}
