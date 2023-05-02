/**
 * @file 支持动画的 Popup
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChange,
  PresentChange,
  Show,
  Hidden,
  Destroy,
}
type TheTypesOfEvents = {
  [Events.StateChange]: PresenceState;
  [Events.PresentChange]: boolean;
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.Destroy]: void;
};
const PresenceEventMap = {
  mounted: {
    UNMOUNT: "unmounted",
    ANIMATION_OUT: "unmountSuspended",
  },
  unmountSuspended: {
    MOUNT: "mounted",
    ANIMATION_END: "unmounted",
  },
  unmounted: {
    MOUNT: "mounted",
  },
};
type PresenceState = {
  mounted: boolean;
  visible: boolean;
  unmounted: boolean;
};
export class PresenceCore extends BaseDomain<TheTypesOfEvents> {
  name = "PresenceCore";
  /** 之前是否可见状态 */
  private prevPresent = false;
  styles: CSSStyleDeclaration;
  animationName = "none";
  // private state = "unmounted";

  constructor() {
    super();
  }

  state: PresenceState = {
    mounted: false,
    visible: false,
    unmounted: false,
  };

  calc(present) {
    // const styles = this.styles;
    // const wasPresent = this.prevPresent;
    // const hasPresentChanged = wasPresent !== present;
    // if (hasPresentChanged) {
    //   const prevAnimationName = this.animationName;
    //   const currentAnimationName = getAnimationName();
    //   if (present) {
    //     this.send("MOUNT");
    //   } else if (currentAnimationName === "none" || styles.display === "none") {
    //     // If there is no exit animation or the element is hidden, animations won't run
    //     // so we unmount instantly
    //     this.send("UNMOUNT");
    //   } else {
    //     const isAnimating = prevAnimationName !== currentAnimationName;
    //     if (wasPresent && isAnimating) {
    //       this.send("ANIMATION_OUT");
    //     } else {
    //       this.send("UNMOUNT");
    //     }
    //   }
    //   this.prevPresent = present;
    // }
    // this.emit(Events.PresentChange, this.isPresent);
    // if (this.isPresent) {
    //   this.emit(Events.Show);
    //   return;
    // }
    // this.emit(Events.Hidden);
  }
  /** 是否可见 */
  get isPresent() {
    return this.state.visible;
    // return ["mounted", "unmountSuspended"].includes(this.state);
  }
  setStyles(styles: CSSStyleDeclaration) {
    this.styles = styles;
  }
  show() {
    // this.calc(true);
    // this.state.mounted = true;
    this.state.visible = true;
    this.emit(Events.Show);
    this.emit(Events.StateChange, { ...this.state });
  }
  hide() {
    // this.calc(false);
    this.state.visible = false;
    this.emit(Events.Hidden);
    this.emit(Events.StateChange, { ...this.state });
  }
  send(
    event: "UNMOUNT" | "ANIMATION_OUT" | "MOUNT" | "ANIMATION_END" | "MOUNT"
  ) {
    // this.log("send", event, this.state);
    // const nextState = PresenceEventMap[this.state][event];
    // this.state = nextState;
    // const currentAnimationName = getAnimationName(this.styles);
    // this.animationName =
    //   nextState === "mounted" ? currentAnimationName : "none";
    // this.calc(nextState);
  }
  emitAnimationEnd() {
    if (this.state.visible) {
      return;
    }
    this.state.unmounted = true;
    this.emit(Events.Destroy);
    this.emit(Events.StateChange, { ...this.state });
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    this.on(Events.Hidden, handler);
  }
  onDestroy(handler: Handler<TheTypesOfEvents[Events.Destroy]>) {
    this.on(Events.Destroy, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
  }
  onPresentChange(handler: Handler<TheTypesOfEvents[Events.PresentChange]>) {
    this.on(Events.PresentChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Presence";
  }
}

function getAnimationName(styles?: CSSStyleDeclaration) {
  return styles?.animationName || "none";
}
