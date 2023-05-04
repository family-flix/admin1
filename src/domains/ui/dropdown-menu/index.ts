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

  state: DropdownMenuState = {
    visible: false,
    disabled: false,
  };

  constructor(
    options: Partial<{
      name: string;
      menus: { label: string; onClick: () => void }[];
    }> = {}
  ) {
    super(options);

    const { menus = [] } = options;
    this.menu = new MenuCore({ options: menus });
  }

  toggle() {
    this.menu.toggle();
  }
  destroy() {
    super.destroy();
    this.menu.destroy();
  }
}
