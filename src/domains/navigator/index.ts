/**
 * @file 仅负责路由的核心类
 *
 */

import { Handler } from "mitt";

import { BaseDomain } from "@/domains/base";

enum Events {
  PushState,
  ReplaceState,
  Back,
  Reload,
  Start,
  PathnameChange,
}
type TheTypesOfEvents = {
  [Events.PathnameChange]: {
    pathname: string;
    type: RouteAction;
  };
  [Events.PushState]: {
    from?: string;
    path: string;
    pathname: string;
  };
  [Events.ReplaceState]: {
    from?: string;
    path: string;
    pathname: string;
  };
  [Events.Back]: void;
  [Events.Reload]: void;
  [Events.Start]: RouteLocation;
};
type RouteLocation = {
  host: string;
  protocol: string;
  origin: string;
  pathname: string;
  href: string;
};
type ParamConfigure = {
  name: string;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
};
type RouteConfigure = {
  title: string;
  component: unknown;
  /** 子路由 */
  child?: NavigatorCore;
};

export class NavigatorCore extends BaseDomain<TheTypesOfEvents> {
  name = "NavigatorCore";
  debug = false;

  /** 当前 pathname */
  pathname: string;
  /** 发生跳转前的 pathname */
  prevPathname: string | null = null;
  /** 当前路由的 query */
  query: Record<string, string> = {};
  /** 当前路由的 params */
  params: Record<string, string> = {};
  prevHistories: { pathname: string }[] = [];
  histories: { pathname: string }[] = [];
  /** 当前访问地址 */
  url: string;
  location: Partial<RouteLocation> = {};

  /** router 基础信息 */
  host: string;
  protocol: string;
  origin: string;

  /** 启动路由监听 */
  async start(location: RouteLocation) {
    // console.log("[DOMAIN]router - start");
    const { pathname, href, origin, host, protocol } = location;
    this.origin = origin;
    this.log("start, current pathname is", pathname);
    // this.setSomething(location);
    this.setPathname(pathname);
    // const query = buildQuery(href);
    this.histories = [
      {
        pathname,
      },
    ];
    this.emit(Events.PathnameChange, {
      pathname,
      type: "initialize",
    });
  }

  private setPrevPathname(p: string) {
    this.prevPathname = p;
  }
  private setPathname(p: string) {
    this.pathname = p;
  }
  /** 跳转到指定路由 */
  async push(targetPathname: string) {
    this.log("push", targetPathname, this.prevPathname);
    if (this.pathname === targetPathname) {
      this.error("cur pathname has been", targetPathname);
      return;
    }
    const prevPathname = this.pathname;
    this.setPrevPathname(prevPathname);
    this.setPathname(targetPathname);
    this.histories.push({ pathname: targetPathname });
    this.emit(Events.PushState, {
      from: this.prevPathname,
      // 这里似乎不用 this.origin，只要是 / 开头的，就会拼接在后面
      path: `${this.origin}${targetPathname}`,
      pathname: targetPathname,
    });
    this.emit(Events.PathnameChange, {
      pathname: targetPathname,
      type: "push",
    });
  }
  replace = async (targetPathname: string) => {
    this.log("replace", targetPathname, this.pathname);
    if (targetPathname === this.pathname) {
      return;
    }
    this.setPrevPathname(this.pathname);
    this.setPathname(targetPathname);
    this.histories[this.histories.length - 1] = { pathname: targetPathname };
    this.emit(Events.ReplaceState, {
      from: this.prevPathname,
      //       title,
      path: `${this.origin}${targetPathname}`,
      pathname: targetPathname,
    });
    this.emit(Events.PathnameChange, {
      pathname: targetPathname,
      type: "replace",
    });
  };
  back = () => {
    this.emit(Events.Back);
  };
  reload = () => {
    this.emit(Events.Reload);
  };
  /** 外部路由改变，作出响应 */
  handlePopState({ type, pathname }: { type: string; pathname: string }) {
    this.log("pathname change", type, pathname);
    if (type !== "popstate") {
      return;
    }
    const targetPathname = pathname;
    const isForward = (() => {
      if (this.prevHistories.length === 0) {
        return false;
      }
      const lastStackWhenBack = this.prevHistories[this.prevHistories.length - 1];
      // console.log("[Router]lastStackWhenBack", lastStackWhenBack);
      if (lastStackWhenBack.pathname === targetPathname) {
        return true;
      }
      return false;
    })();
    this.emit(Events.PathnameChange, {
      pathname,
      type: (() => {
        if (isForward) {
          return "forward";
        }
        return "back";
      })(),
    });
    // forward
    if (isForward) {
      this.setPrevPathname(this.pathname);
      this.setPathname(targetPathname);
      const lastStackWhenBack = this.prevHistories.pop();
      this.histories = this.histories.concat([lastStackWhenBack!]);
      return;
    }
    // back
    if (this.histories.length === 1) {
      this.replace("/home");
      return;
    }
    // var confirmationMessage = "您的输入还未完成，确认放弃吗？";
    // if (confirm(confirmationMessage)) {
    // } else {
    //   history.pushState(null, null, window.location.href);
    // }
    const theHistoryDestroy = this.histories[this.histories.length - 1];
    this.prevHistories = this.prevHistories.concat([theHistoryDestroy]);
    this.setPrevPathname(this.pathname);
    this.setPathname(targetPathname);
    const cloneStacks = this.histories.slice(0, this.histories.length - 1);
    this.histories = cloneStacks;
  }

  onStart(handler: Handler<TheTypesOfEvents[Events.Start]>) {
    return this.on(Events.Start, handler);
  }
  onPushState(handler: Handler<TheTypesOfEvents[Events.PushState]>) {
    return this.on(Events.PushState, handler);
  }
  onReplaceState(handler: Handler<TheTypesOfEvents[Events.ReplaceState]>) {
    return this.on(Events.ReplaceState, handler);
  }
  onReload(handler: Handler<TheTypesOfEvents[Events.Reload]>) {
    this.on(Events.Reload, handler);
  }
  onPathnameChange(handler: Handler<TheTypesOfEvents[Events.PathnameChange]>) {
    this.on(Events.PathnameChange, handler);
  }
  onBack(handler: Handler<TheTypesOfEvents[Events.Back]>) {
    this.on(Events.Back, handler);
  }
}

export type RouteAction = "initialize" | "push" | "replace" | "back" | "forward";
