import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { MenuCore } from "@/domains/ui/menu";
import { MenuItemCore } from "@/domains/ui/menu/item";

enum Events {
  StateChange,
}
type TheTypesOfEvents = {
  [Events.StateChange]: DropdownMenuState;
};
type DropdownMenuState = {
  items: MenuItemCore[];
  open: boolean;
  disabled: boolean;
};
export class DropdownMenuCore extends BaseDomain<TheTypesOfEvents> {
  menu: MenuCore;

  state: DropdownMenuState = {
    items: [],
    open: false,
    disabled: false,
  };

  subs: MenuCore[] = [];
  items: MenuItemCore[] = [];

  constructor(
    options: Partial<{
      name: string;
      items: MenuItemCore[];
    }> = {}
  ) {
    super(options);

    const { items = [] } = options;
    this.state.items = items;
    this.listenItems(items);
    this.menu = new MenuCore({ items });
    this.menu.onHide(() => {
      // console.log("menu is hidden");
      this.menu.reset();
    });
  }

  listenItems(items: MenuItemCore[]) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      // console.log(item);
      // item.onEnter(() => {
      //   this.maybeLeave = false;
      //   this.inside = true;
      //   if (item.menu) {
      //     this.maybeLeave = false;
      //     item.menu.show();
      //   }
      //   if (!item.menu && this.curSub) {
      //     this.curSub.hide();
      //   }
      //   this.emit(Events.EnterItem, item);
      // });
      // item.onLeave(() => {
      //   this.maybeLeave = true;
      //   this.emit(Events.LeaveItem, item);
      //   this.log("item.onLeave", this.items.length);
      //   if (this.leaveTimer !== null) {
      //     clearInterval(this.leaveTimer);
      //     this.leaveTimer = setTimeout(() => {
      //       this.leaveMenu(item);
      //     }, 100);
      //     return;
      //   }
      //   this.leaveTimer = setTimeout(() => {
      //     this.leaveMenu(item);
      //   }, 100);
      // });
      // if (!item.menu) {
      //   continue;
      // }
      // const sub = item.menu;
      // if (this.subs.includes(sub)) {
      //   return;
      // }
      // sub.onShow(() => {
      //   this.log("sub.onShow");
      //   this.curSub = sub;
      // });
      // sub.onEnter(() => {
      //   this.log("sub.onEnter");
      //   this.inSubMenu = true;
      // });
      // sub.onLeave(() => {
      //   this.log("sub.onLeave");
      //   this.inSubMenu = false;
      // });
      // sub.onHide(() => {
      //   this.log("sub.onHide");
      //   this.curSub = null;
      // });
      // this.subs.push(sub);
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
  toggle() {
    this.menu.toggle();
  }
  hide() {
    this.menu.hide();
  }
  unmount() {
    super.unmount();
    this.menu.unmount();
  }

  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
}
