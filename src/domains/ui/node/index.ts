import { BaseDomain } from "@/domains/base";
import { Handler } from "mitt";

enum Events {
  Click,
  ContextMenu,
}
type TheTypesOfEvents = {
  [Events.Click]: Events & { target: HTMLElement };
};
export class NodeCore extends BaseDomain<TheTypesOfEvents> {
  onClick(handler: Handler<TheTypesOfEvents[Events.Click]>) {
    this.on(Events.Click, handler);
  }
}
