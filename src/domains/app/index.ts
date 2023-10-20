/**
 * @file 应用，包含一些全局相关的事件、状态
 */

import { BaseDomain, Handler } from "@/domains/base";
import { UserCore } from "@/domains/user";
import { NavigatorCore } from "@/domains/navigator";
import { RouteViewCore } from "@/domains/route_view";
import { Result } from "@/types";

enum Events {
  Ready,
  Tip,
  Error,
  Login,
  Logout,
  // 一些平台相关的事件
  PopState,
  Resize,
  Blur,
  Keydown,
  EscapeKeyDown,
  ClickLink,
  Show,
  Hidden,
  StateChange,
  // 该怎么处理？
  DrivesChange,
}
type TheTypesOfEvents = {
  [Events.Ready]: void;
  // [EventsUserCore{ icon?: string; text: string[] };
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
  [Events.PopState]: {
    type: string;
    href: string;
    pathname: string;
  };
  [Events.Resize]: {
    width: number;
    height: number;
  };
  [Events.Keydown]: {
    key: string;
  };
  [Events.EscapeKeyDown]: void;
  [Events.ClickLink]: {
    href: string;
  };
  [Events.Blur]: void;
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.StateChange]: ApplicationState;
};

type ApplicationProps = {
  user: UserCore;
  router: NavigatorCore;
  /**
   * 应用加载前的声明周期，只有返回 Result.Ok() 页面才会展示内容
   */
  beforeReady?: () => Promise<Result<null>>;
  onReady?: () => void;
};
type ApplicationState = {
  ready: boolean;
};

export class Application extends BaseDomain<TheTypesOfEvents> {
  user: UserCore;
  router: NavigatorCore;

  lifetimes: Pick<ApplicationProps, "beforeReady" | "onReady">;

  screen: {
    width: number;
    height: number;
  } = {
    width: 0,
    height: 0,
  };
  safeArea = false;
  Events = Events;

  // @todo 怎么才能更方便地拓展 Application 类，给其添加许多的额外属性还能有类型提示呢？

  _ready: boolean = false;

  get state(): ApplicationState {
    return {
      ready: this._ready,
    };
  }

  constructor(options: ApplicationProps) {
    super();

    const { user, router, beforeReady, onReady } = options;
    this.lifetimes = {
      beforeReady,
      onReady,
    };
    this.user = user;
    this.router = router;
    // const { availHeight, availWidth } = window.screen;
    // if (window.navigator.userAgent.match(/iphone/i)) {
    //   const matched = [
    //     // iphonex iphonexs iphone12mini
    //     "375-812",
    //     // iPhone XS Max iPhone XR
    //     "414-896",
    //     // iPhone pro max iPhone14Plus
    //     "428-926",
    //     // iPhone 12/pro 13/14  753
    //     "390-844",
    //     // iPhone 14Pro
    //     "393-852",
    //     // iPhone 14ProMax
    //     "430-932",
    //   ].includes(`${availWidth}-${availHeight}`);
    // }
  }
  /** 启动应用 */
  async start(size: { width: number; height: number }) {
    // console.log('[Application]start');
    const { beforeReady } = this.lifetimes;
    if (beforeReady) {
      const r = await beforeReady();
      // console.log("[]Application - ready result", r);
      if (r.error) {
        return Result.Err(r.error);
      }
    }
    this._ready = true;
    this.emit(Events.Ready);
    this.emit(Events.StateChange, { ...this.state });
    // console.log("[]Application - before start");
    return Result.Ok(null);
  }
  prevViews: RouteViewCore[] = [];
  views: RouteViewCore[] = [];
  curView: RouteViewCore | null = null;
  showView(view: RouteViewCore, options: Partial<{ back: boolean }> = {}) {
    console.log("[DOMAIN]Application - showView", view._name, view.parent);
    if (options.back) {
      if (!this.curView) {
        // 异常行为
        return;
      }
      if (!this.curView.parent) {
        return;
      }
      this.curView.parent.uncoverPrevView();
      return;
    }
    this.curView = view;
    this.prevViews = this.views;
    this.views = [];
    const _show = (view: RouteViewCore) => {
      if (view.parent) {
        _show(view.parent);
        (() => {
          if (view.parent.canLayer) {
            view.parent.layerSubView(view);
            return;
          }
          view.parent.showSubView(view);
        })();
      }
      view.show();
      this.views.push(view);
    };
    _show(view);
    // console.log("[DOMAIN]Application - after show", this.views);
  }
  back() {
    history.back();
  }
  /** 手机震动 */
  vibrate() {}
  setSize(size: { width: number; height: number }) {
    this.screen = size;
  }
  /** 设置页面 title */
  setTitle(title: string): void {
    throw new Error("请实现 setTitle 方法");
  }
  /** 复制文本到粘贴板 */
  copy(text: string) {
    throw new Error("请实现 copy 方法");
  }
  getComputedStyle(el: HTMLElement): CSSStyleDeclaration {
    throw new Error("请实现 getComputedStyle 方法");
  }
  /** 发送推送 */
  notify(msg: { title: string; body: string }) {
    console.log("请实现 notify 方法");
  }
  disablePointer() {
    throw new Error("请实现 disablePointer 方法");
  }
  enablePointer() {
    throw new Error("请实现 enablePointer 方法");
  }
  /** 平台相关的全局事件 */
  keydown({ key }: { key: string }) {
    if (key === "Escape") {
      this.escape();
    }
    this.emit(Events.Keydown, { key });
  }
  escape() {
    this.emit(Events.EscapeKeyDown);
  }
  popstate({ type, href, pathname }: { type: string; href: string; pathname: string }) {
    this.emit(Events.PopState, { type, href, pathname });
  }
  resize(size: { width: number; height: number }) {
    this.screen = size;
    this.emit(Events.Resize, size);
  }
  blur() {
    this.emit(Events.Blur);
  }
  /* ----------------
   * Lifetime
   * ----------------
   */
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  /** 平台相关全局事件 */
  onPopState(handler: Handler<TheTypesOfEvents[Events.PopState]>) {
    return this.on(Events.PopState, handler);
  }
  onResize(handler: Handler<TheTypesOfEvents[Events.Resize]>) {
    return this.on(Events.Resize, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    return this.on(Events.Blur, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onClickLink(handler: Handler<TheTypesOfEvents[Events.ClickLink]>) {
    return this.on(Events.ClickLink, handler);
  }
  onKeydown(handler: Handler<TheTypesOfEvents[Events.Keydown]>) {
    return this.on(Events.Keydown, handler);
  }
  onEscapeKeyDown(handler: Handler<TheTypesOfEvents[Events.EscapeKeyDown]>) {
    return this.on(Events.EscapeKeyDown, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  /**
   * ----------------
   * Event
   * ----------------
   */
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    return this.on(Events.Error, handler);
  }
}
