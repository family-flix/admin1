import { Handler } from "mitt";

import { UserCore } from "@/domains/user";
import { ViewCore } from "@/domains/router";
import { BaseDomain } from "@/domains/base";
import { Result } from "@/types";

import { LocalCache } from "./cache";

export enum Events {
  Ready,
  Tip,
  Error,
  Login,
  Logout,
}
type TheTypeOfEvent = {
  [Events.Ready]: void;
  [Events.Tip]: { icon?: string; text: unknown };
  [Events.Error]: Error;
  [Events.Login]: {};
  [Events.Logout]: void;
};

export class Application extends BaseDomain<TheTypeOfEvent> {
  user: UserCore;
  // router: ViewCore;
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

  state: Partial<{
    ready: boolean;
  }> = {};

  constructor(
    options: {
      user: UserCore;
      router: ViewCore;
      cache: LocalCache;
    } & Application["lifetimes"]
  ) {
    super();

    const { user, cache, beforeReady, onReady } = options;
    this.lifetimes = {
      beforeReady,
      onReady,
    };
    this.user = user;
    // this.router = router;
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
  tip(msg: { icon?: string; text: unknown }) {
    this.emitTip(msg);
  }
  /* ----------------
   * Lifetime
   * ----------------
   */
  emitReady = () => {
    this.emit(Events.Ready);
  };
  onReady(handler: Handler<TheTypeOfEvent[Events.Ready]>) {
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
  onError(handler: Handler<TheTypeOfEvent[Events.Error]>) {
    this.on(Events.Error, handler);
  }
  emitTip = (tip: { icon?: string; text: unknown }) => {
    this.emit(Events.Tip, tip);
  };
  onTip(handler: Handler<TheTypeOfEvent[Events.Tip]>) {
    this.on(Events.Tip, handler);
  }
}
