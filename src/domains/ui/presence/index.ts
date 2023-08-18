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
  Unmounted,
}
type TheTypesOfEvents = {
  [Events.StateChange]: PresenceState;
  [Events.PresentChange]: boolean;
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.Unmounted]: void;
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
  open: boolean;
  unmounted: boolean;
};
export class PresenceCore extends BaseDomain<TheTypesOfEvents> {
  name = "PresenceCore";
  debug = false;

  // styles: CSSStyleDeclaration;
  animationName = "none";
  // private state = "unmounted";

  state: PresenceState = {
    open: false,
    mounted: false,
    unmounted: false,
  };

  constructor(options: Partial<{ _name: string }> = {}) {
    super(options);
  }

  calc() {
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
    return this.state.open;
    // return ["mounted", "unmountSuspended"].includes(this.state);
  }
  // setStyles(styles: CSSStyleDeclaration) {
  //   this.styles = styles;
  // }
  show() {
    // this.log("show");
    // this.calc(true);
    this.state.open = true;
    this.state.mounted = true;
    this.emit(Events.Show);
    this.emit(Events.StateChange, { ...this.state });
  }
  hide() {
    // console.log(...this.log("hide"));
    // this.calc(false);
    this.state.open = false;
    this.emit(Events.Hidden);
    this.emit(Events.StateChange, { ...this.state });
    setTimeout(() => {
      if (this.state.mounted === false) {
        return;
      }
      this.unmount();
    }, 120);
  }
  send(event: "UNMOUNT" | "ANIMATION_OUT" | "MOUNT" | "ANIMATION_END" | "MOUNT") {
    // this.log("send", event, this.state);
    // const nextState = PresenceEventMap[this.state][event];
    // this.state = nextState;
    // const currentAnimationName = getAnimationName(this.styles);
    // this.animationName =
    //   nextState === "mounted" ? currentAnimationName : "none";
    // this.calc(nextState);
  }
  /** 将 DOM 从页面卸载 */
  unmount() {
    console.log("[]PresenceCore - destroy", this.state.open, this.state.unmounted);
    if (this.state.open) {
      // this.emit(Events.Show);
      return;
    }
    this.state.mounted = false;
    this.emit(Events.Unmounted);
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.state = {
      mounted: false,
      open: false,
      unmounted: false,
    };
  }

  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onUnmounted(handler: Handler<TheTypesOfEvents[Events.Unmounted]>) {
    return this.on(Events.Unmounted, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onPresentChange(handler: Handler<TheTypesOfEvents[Events.PresentChange]>) {
    return this.on(Events.PresentChange, handler);
  }

  get [Symbol.toStringTag]() {
    return "Presence";
  }
}

function getAnimationName(styles?: CSSStyleDeclaration) {
  return styles?.animationName || "none";
}
