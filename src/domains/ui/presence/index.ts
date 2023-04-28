/**
 * @file 支持动画的 Popup
 */
import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  StateChanged,
  ChangePresent,
  PresentChange,
  Show,
  Hidden,
  Destroy,
}
type TheTypesOfEvents = {
  [Events.StateChanged]: string;
  [Events.ChangePresent]: boolean;
  [Events.PresentChange]: boolean;
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.Destroy]: void;
};
const EventMap = {
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
export class PresenceCore extends BaseDomain<TheTypesOfEvents> {
  /** 之前是否可见状态 */
  private prevPresent = false;
  styles: CSSStyleDeclaration;
  animationName = "none";
  private state = "unmounted";

  constructor() {
    super();

    this.on(Events.ChangePresent, async (present) => {
      const styles = this.styles;
      const wasPresent = this.prevPresent;
      const hasPresentChanged = wasPresent !== present;
      if (hasPresentChanged) {
        const prevAnimationName = this.animationName;
        const currentAnimationName = getAnimationName();
        if (present) {
          this.send("MOUNT");
        } else if (
          currentAnimationName === "none" ||
          styles.display === "none"
        ) {
          // If there is no exit animation or the element is hidden, animations won't run
          // so we unmount instantly
          this.send("UNMOUNT");
        } else {
          /**
           * When `present` changes to `false`, we check changes to animation-name to
           * determine whether an animation has started. We chose this approach (reading
           * computed styles) because there is no `animationrun` event and `animationstart`
           * fires after `animation-delay` has expired which would be too late.
           */
          const isAnimating = prevAnimationName !== currentAnimationName;

          if (wasPresent && isAnimating) {
            this.send("ANIMATION_OUT");
          } else {
            this.send("UNMOUNT");
          }
        }
        this.prevPresent = present;
      }
      this.emit(Events.PresentChange, this.isPresent);
      if (this.isPresent) {
        this.emit(Events.Show);
        return;
      }
      this.emit(Events.Hidden);
    });
  }
  /** 是否可见 */
  get isPresent() {
    return ["mounted", "unmountSuspended"].includes(this.state);
  }
  setStyles(styles: CSSStyleDeclaration) {
    this.styles = styles;
  }
  show() {
    this.emit(Events.ChangePresent, true);
  }
  hide() {
    this.emit(Events.ChangePresent, false);
  }
  send(
    event: "UNMOUNT" | "ANIMATION_OUT" | "MOUNT" | "ANIMATION_END" | "MOUNT"
  ) {
    const nextState = EventMap[this.state][event];
    this.state = nextState;
    const currentAnimationName = getAnimationName(this.styles);
    this.animationName =
      nextState === "mounted" ? currentAnimationName : "none";
    this.emit(Events.StateChanged, nextState);
    // console.log("[]Presence - send", this.isPresent);
  }
  emitAnimationEnd() {
    if (this.state === "unmounted") {
      this.emit(Events.Destroy);
    }
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
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChanged]>) {
    this.on(Events.StateChanged, handler);
  }
  onPresentChange(handler: Handler<TheTypesOfEvents[Events.PresentChange]>) {
    this.on(Events.PresentChange, handler);
  }
}

function getAnimationName(styles?: CSSStyleDeclaration) {
  return styles?.animationName || "none";
}
