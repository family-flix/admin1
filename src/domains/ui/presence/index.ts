/**
 * @file 支持动画的 Popup
 */
import { BaseDomain, Handler } from "@/domains/base";

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
type PresenceProps = {
  open?: boolean;
};
export class PresenceCore extends BaseDomain<TheTypesOfEvents> {
  name = "PresenceCore";
  debug = false;

  // styles: CSSStyleDeclaration;
  animationName = "none";
  // private state = "unmounted";
  open = false;
  mounted = false;
  unmounted = false;

  get state(): PresenceState {
    return {
      open: this.open,
      mounted: this.mounted,
      unmounted: this.unmounted,
    };
  }

  constructor(options: Partial<{ _name: string }> & PresenceProps = {}) {
    super(options);

    const { open } = options;
    if (open) {
      this.open = true;
      this.mounted = true;
    }
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
    return this.open;
    // return ["mounted", "unmountSuspended"].includes(this.state);
  }
  // setStyles(styles: CSSStyleDeclaration) {
  //   this.styles = styles;
  // }
  show() {
    // this.log("show");
    // this.calc(true);
    this.open = true;
    this.mounted = true;
    this.emit(Events.Show);
    this.emit(Events.StateChange, { ...this.state });
  }
  hide() {
    // console.log(...this.log("hide"));
    // this.calc(false);
    this.open = false;
    this.emit(Events.Hidden);
    this.emit(Events.StateChange, { ...this.state });
    setTimeout(() => {
      if (this.mounted === false) {
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
    // console.log("[]PresenceCore - destroy", this.state.open, this.state.unmounted);
    if (this.open) {
      // this.emit(Events.Show);
      return;
    }
    this.mounted = false;
    this.emit(Events.Unmounted);
    this.emit(Events.StateChange, { ...this.state });
  }
  reset() {
    this.open = false;
    this.mounted = false;
    this.unmounted = false;
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
