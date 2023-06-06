import { Handler } from "mitt";

import { UserCore } from "@/domains/user";
import { BaseDomain } from "@/domains/base";
import { Drive } from "@/domains/drive";
import { NavigatorCore } from "@/domains/navigator";
import { Result } from "@/types";

import { LocalCache } from "./cache";

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
  [Events.DrivesChange]: Drive[];
};

export class Application extends BaseDomain<TheTypesOfEvents> {
  user: UserCore;
  router: NavigatorCore;
  cache: LocalCache;
  lifetimes: Partial<{
    beforeReady: () => Promise<Result<null>>;
    onReady: () => void;
  }> = {};
  size: {
    width: number;
    height: number;
  } = {
    width: 0,
    height: 0,
  };
  safeArea = false;
  Events = Events;

  // @todo 怎么才能更方便地拓展 Application 类，给其添加许多的额外属性还能有类型提示呢？

  /** 网盘列表 */
  drives: Drive[] = [];

  state: Partial<{
    ready: boolean;
  }> = {};

  static Events = Events;

  constructor(
    options: {
      user: UserCore;
      router: NavigatorCore;
      cache: LocalCache;
    } & Application["lifetimes"]
  ) {
    super();

    const { user, router, cache, beforeReady, onReady } = options;
    this.lifetimes = {
      beforeReady,
      onReady,
    };
    this.user = user;
    this.router = router;
    this.cache = cache;

    const { availHeight, availWidth } = window.screen;
    if (window.navigator.userAgent.match(/iphone/i)) {
      const matched = [
        // iphonex iphonexs iphone12mini
        "375-812",
        // iPhone XS Max iPhone XR
        "414-896",
        // iPhone pro max iPhone14Plus
        "428-926",
        // iPhone 12/pro 13/14  753
        "390-844",
        // iPhone 14Pro
        "393-852",
        // iPhone 14ProMax
        "430-932",
      ].includes(`${availWidth}-${availHeight}`);
    }
  }
  /** 启动应用 */
  async start() {
    // console.log('[Application]start');
    const { beforeReady } = this.lifetimes;
    if (beforeReady) {
      const r = await beforeReady();
      // console.log("[]Application - ready result", r);
      if (r.error) {
        return Result.Err(r.error);
      }
    }
    this.emit(Events.Ready);
    // console.log("[]Application - before start");
    return Result.Ok(null);
  }
  /** 手机震动 */
  vibrate() {}
  setSize(size: { width: number; height: number }) {
    this.size = size;
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
  popstate({ type, pathname }: { type: string; pathname: string }) {
    this.emit(Events.PopState, { type, pathname });
  }
  resize(size: { width: number; height: number }) {
    this.size = size;
    this.emit(Events.Resize, size);
  }
  blur() {
    this.emit(Events.Blur);
  }
  async fetchDrives() {
    if (this.drives.length !== 0) {
      this.emit(Events.DrivesChange, this.drives);
      return;
    }
    const r = await Drive.ListHelper.init();
    if (r.error) {
      this.tip({ text: ["获取网盘失败", r.error.message] });
      return;
    }
    this.drives = [...r.data];
    this.emit(Events.DrivesChange, [...r.data]);
  }
  async refreshDrives() {
    const r = await Drive.ListHelper.refresh();
    if (r.error) {
      this.tip({ text: ["获取网盘失败", r.error.message] });
      return;
    }
    this.drives = [...r.data];
    this.emit(Events.DrivesChange, [...r.data]);
  }

  onDrivesChange(handler: Handler<TheTypesOfEvents[Events.DrivesChange]>) {
    this.on(Events.DrivesChange, handler);
  }
  /* ----------------
   * Lifetime
   * ----------------
   */
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    this.on(Events.Ready, handler);
  }
  /** 平台相关全局事件 */
  onPopState(handler: Handler<TheTypesOfEvents[Events.PopState]>) {
    this.on(Events.PopState, handler);
  }
  onResize(handler: Handler<TheTypesOfEvents[Events.Resize]>) {
    this.on(Events.Resize, handler);
  }
  onBlur(handler: Handler<TheTypesOfEvents[Events.Blur]>) {
    this.on(Events.Blur, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
  }
  onClickLink(handler: Handler<TheTypesOfEvents[Events.ClickLink]>) {
    this.on(Events.ClickLink, handler);
  }
  onKeydown(handler: Handler<TheTypesOfEvents[Events.Keydown]>) {
    this.on(Events.Keydown, handler);
  }
  onEscapeKeyDown(handler: Handler<TheTypesOfEvents[Events.EscapeKeyDown]>) {
    this.on(Events.EscapeKeyDown, handler);
  }
  /**
   * ----------------
   * Event
   * ----------------
   */
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    this.on(Events.Error, handler);
  }
}
