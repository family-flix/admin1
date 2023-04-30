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
  // 该怎么处理？
  DrivesChange,
}
type TheTypesOfEvents = {
  [Events.Ready]: void;
  [Events.Tip]: { icon?: string; text: string[] };
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
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
    this.emitReady();
    // console.log("[]Application - before start");
    return Result.Ok(null);
  }
  /** 手机震动 */
  vibrate() {}
  setSize(size: { width: number; height: number }) {
    this.size = size;
  }
  tip(msg: { icon?: string; text: string[] }) {
    this.emitTip(msg);
  }
  async fetchDrives() {
    console.log(this);
    if (this.drives.length !== 0) {
      this.emit(Events.DrivesChange, this.drives);
      return;
    }
    const r = await Drive.ListHelper.init();
    if (r.error) {
      this.emit(Events.Tip, { text: ["获取网盘失败", r.error.message] });
      return;
    }
    this.drives = r.data;
    this.emit(Events.DrivesChange, r.data);
  }
  /* ----------------
   * Lifetime
   * ----------------
   */
  emitReady = () => {
    this.emit(Events.Ready);
  };
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    this.on(Events.Ready, handler);
  }
  /**
   * ----------------
   * Event
   * ----------------
   */
  /** 向 app 发送错误，该错误会作为全屏错误遮挡所有内容 */
  emitError = (error: Error) => {
    this.emit(Events.Error, error);
  };
  onError(handler: Handler<TheTypesOfEvents[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  emitTip = (tip: { icon?: string; text: string[] }) => {
    this.emit(Events.Tip, tip);
  };
  onTip(handler: Handler<TheTypesOfEvents[Events.Tip]>) {
    this.on(Events.Tip, handler);
  }
  onDrivesChange(handler: Handler<TheTypesOfEvents[Events.DrivesChange]>) {
    this.on(Events.DrivesChange, handler);
  }
}
