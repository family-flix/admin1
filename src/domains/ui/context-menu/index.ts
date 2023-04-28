import { BaseDomain } from "@/domains/base";

enum Events {}
type TheTypeOfEvent = {};
export class ContextMenuCore extends BaseDomain<TheTypeOfEvent> {
  constructor(
    options: {
      label: string;
      on_click: unknown;
    }[]
  ) {
    super();
  }

  show(position: { x: number; y: number }) {}
}
