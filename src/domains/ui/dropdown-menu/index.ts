import { BaseDomain } from "@/domains/base";
import { MenuCore } from "@/domains/ui/menu";

enum Events {}
type TheTypesOfEvents = {};
type DropdownMenuState = {
  visible: boolean;
  disabled: boolean;
};
export class DropdownMenuCore extends BaseDomain<TheTypesOfEvents> {
  menu: MenuCore;

  constructor() {
    super();

    this.menu = new MenuCore();
  }

  state: DropdownMenuState = {
    visible: false,
    disabled: false,
  };

  toggle() {
    this.menu.toggle();
  }
  // show() {
  //   this.state.visible = true;
  //   this.present.show();
  //   this.popper.place();
  //   this.emit(Events.Show);
  // }
  // hide() {
  //   this.state.visible = false;
  //   this.present.hide();
  //   this.emit(Events.Hidden);
  // }
  destroy() {
    super.destroy();
    this.menu.destroy();
  }
}
