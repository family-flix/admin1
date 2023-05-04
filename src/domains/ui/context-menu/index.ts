import { BaseDomain } from "@/domains/base";
import { MenuCore } from "@/domains/ui/menu";

enum Events {}
type TheTypeOfEvent = {};
export class ContextMenuCore extends BaseDomain<TheTypeOfEvent> {
  menu: MenuCore;

  constructor(
    options: Partial<{
      name: string;
      menus: {
        label: string;
        onClick: () => void;
      }[];
    }>
  ) {
    super(options);

    // const { menus = [] } = options;
    this.menu = new MenuCore({
      ...options,
      side: "right",
      align: "start",
    });
  }

  show(position: { x: number; y: number }) {}
}
