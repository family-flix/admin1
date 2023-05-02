/**
 * @file 气泡
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
import { PopperCore } from "@/domains/ui/popper";
import { DismissableLayerCore } from "@/domains/ui/dismissable-layer";

const SIDE_OPTIONS = ["top", "right", "bottom", "left"] as const;
const ALIGN_OPTIONS = ["start", "center", "end"] as const;
type Align = (typeof ALIGN_OPTIONS)[number];
type Side = (typeof SIDE_OPTIONS)[number];

enum Events {
  Show,
  Hidden,
}
type TheTypesOfEvents = {
  [Events.Show]: void;
  [Events.Hidden]: void;
};

export class PopoverCore extends BaseDomain<TheTypesOfEvents> {
  popper: PopperCore;
  present: PresenceCore;
  layer: DismissableLayerCore;

  _side: Side;
  _align: Align;

  constructor(config: Partial<{ side: Side; align: Align }> = {}) {
    super();

    const { side = "bottom", align = "end" } = config;
    this._side = side;
    this._align = align;

    this.popper = new PopperCore({
      side,
      align,
    });
    this.present = new PresenceCore();
    this.layer = new DismissableLayerCore();
    this.layer.onDismiss(() => {
      this.hide();
    });
  }

  state = {
    visible: false,
  };

  toggle() {
    const { visible } = this.state;
    if (visible) {
      this.hide();
      return;
    }
    this.show();
  }
  show() {
    this.state.visible = true;
    this.present.show();
    this.popper.place();
    this.emit(Events.Show);
  }
  hide() {
    this.state.visible = false;
    this.present.hide();
    this.emit(Events.Hidden);
  }
  destroy() {
    super.destroy();
    this.layer.destroy();
    this.popper.destroy();
    this.present.destroy();
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    this.on(Events.Show, handler);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    this.on(Events.Hidden, handler);
  }

  get [Symbol.toStringTag]() {
    return "PopoverCore";
  }
}
