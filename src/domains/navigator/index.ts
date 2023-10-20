/**
 * @file 仅负责路由的核心类
 *
 */
import qs from "qs";
import parse from "url-parse";

import { BaseDomain, Handler } from "@/domains/base";
import { JSONObject } from "@/types";

enum Events {
  PushState,
  ReplaceState,
  Back,
  Forward,
  Reload,
  Start,
  PathnameChange,
  /** 销毁所有页面并跳转至指定页面 */
  Relaunch,
  /** ???? */
  RedirectToHome,
  HistoriesChange,
}
type TheTypesOfEvents = {
  [Events.PathnameChange]: {
    pathname: string;
    search: string;
    type: RouteAction;
  };
  [Events.PushState]: {
    from: string | null;
    to: string | null;
    path: string;
    pathname: string;
  };
  [Events.ReplaceState]: {
    from: string | null;
    path: string;
    pathname: string;
  };
  [Events.Back]: void;
  [Events.Forward]: void;
  [Events.Reload]: void;
  [Events.Start]: RouteLocation;
  [Events.Relaunch]: void;
  [Events.HistoriesChange]: {
    pathname: string;
  }[];
};
type RouteLocation = {
  host: string;
  protocol: string;
  origin: string;
  pathname: string;
  href: string;
  search: string;
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
type NavigatorState = {
  pathname: string;
  query: JSONObject;
  params: JSONObject;
  search: string;
  location: string;
};

export class NavigatorCore extends BaseDomain<TheTypesOfEvents> {
  static prefix: string | null = null;
  static parse(url: string) {
    const { pathname, query: queryStr, ...rest } = parse(url);
    const query = qs.parse(queryStr, { ignoreQueryPrefix: true });
    if (NavigatorCore.prefix && pathname.startsWith(NavigatorCore.prefix)) {
      return { ...rest, query, pathname: pathname.replace(NavigatorCore.prefix, "") };
    }
    return {
      ...rest,
      query,
      pathname,
    };
  }

  _name = "NavigatorCore";
  debug = false;

  /** 当前 pathname */
  pathname: string = "/";
  /** 发生跳转前的 pathname */
  prevPathname: string | null = null;
  /** 当前路由的 query */
  query: Record<string, string> = {};
  /** 当前路由的 params */
  params: Record<string, string> = {};
  prevHistories: { pathname: string }[] = [];
  histories: { pathname: string }[] = [];
  /** 当前访问地址 */
  // url: string;
  location: Partial<RouteLocation> = {};

  /** router 基础信息 */
  // host: string;
  // protocol: string;
  origin: string = "";

  _pending: {
    pathname: string;
    search: string;
    type: RouteAction;
  } = {
    pathname: "/",
    search: "",
    type: "initialize",
  };

  get state() {
    return {
      pathname: this.pathname,
      search: this._pending.search,
      params: this.params,
      query: this.query,
      location: this.location,
    };
  }

  /** 启动路由监听 */
  async prepare(location: RouteLocation) {
    // console.log("[DOMAIN]router - start");
    const { pathname, href, search, origin, host, protocol } = location;
    const pp = pathname.replace(NavigatorCore.prefix!, "");
    this.setPathname(pp);
    this.origin = origin;
    // this.pathname = pathname;
    const query = buildQuery(href);
    this.query = query;
    this._pending = {
      pathname: pp,
      search,
      type: "initialize",
    };
  }
  start() {
    const { pathname } = this._pending;
    this.setPathname(pathname);
    this.histories = [
      {
        pathname,
      },
    ];
    this.emit(Events.PathnameChange, { ...this._pending });
  }
  private setPrevPathname(p: string) {
    this.prevPathname = p;
  }
  private setPathname(p: string) {
    this.pathname = p;
  }
  pushState(url: string) {
    const u = `${this.origin}${NavigatorCore.prefix}${url}`;
    const r = new URL(u);
    const { pathname: realTargetPathname, search } = r;
    const prevPathname = this.pathname;
    this.setPrevPathname(prevPathname);
    this.setPathname(realTargetPathname);
    // this.prevHistories = [...this.histories];
    console.log("[DOMAIN]navigator - before push", prevPathname, realTargetPathname);
    this.histories.push({ pathname: realTargetPathname });
    this.emit(Events.PushState, {
      from: prevPathname,
      to: realTargetPathname,
      // 这里似乎不用 this.origin，只要是 / 开头的，就会拼接在后面
      path: realTargetPathname + search,
      pathname: realTargetPathname,
    });
    this.emit(Events.HistoriesChange, [...this.histories]);
  }
  /** 跳转到指定路由 */
  async push(targetPathname: string, targetQuery?: Record<string, string>) {
    // console.log("[DOMAIN]navigator - push", this.query);
    // this.log("push", targetPathname, this.prevPathname);
    const url = (() => {
      if (targetPathname.startsWith("http")) {
        return targetPathname;
      }
      const p = `${NavigatorCore.prefix}${targetPathname}`;
      return `${this.origin}${p}`;
    })();
    const r = new URL(url);
    const { pathname: realTargetPathname, search } = r;
    const query = targetQuery || buildQuery(search);
    const remainingFields = extractDefinedKeys(this.query, ["token"]);
    this.query = {
      ...query,
      ...remainingFields,
    };
    if (this.pathname === realTargetPathname) {
      console.log("cur pathname has been", targetPathname);
      return;
    }
    const prevPathname = this.pathname;
    this.setPrevPathname(prevPathname);
    this.setPathname(realTargetPathname);
    this.histories.push({ pathname: realTargetPathname });
    // this.emit(Events.PushState, {
    //   from: this.prevPathname,
    //   to: realTargetPathname,
    //   // 这里似乎不用 this.origin，只要是 / 开头的，就会拼接在后面
    //   path: (() => {
    //     let url = `${this.origin}${realTargetPathname}`;
    //     url += "?" + query_stringify(this.query);
    //     return url;
    //   })(),
    //   pathname: realTargetPathname,
    // });
    this._pending = {
      pathname: realTargetPathname,
      search,
      type: "push",
    };
    this.emit(Events.PathnameChange, { ...this._pending });
  }
  replace = async (targetPathname: string) => {
    const realTargetPathname = NavigatorCore.prefix + targetPathname;
    // this.log("replace", targetPathname, this.pathname);
    if (this.pathname === realTargetPathname) {
      return;
    }
    this.setPrevPathname(this.pathname);
    this.setPathname(realTargetPathname);
    this.histories[this.histories.length - 1] = { pathname: realTargetPathname };
    this.emit(Events.ReplaceState, {
      from: this.prevPathname,
      //       title,
      path: `${this.origin}${realTargetPathname}`,
      pathname: realTargetPathname,
    });
    this._pending = {
      pathname: realTargetPathname,
      search: "",
      type: "push",
    };
    this.emit(Events.PathnameChange, { ...this._pending });
  };
  back = () => {
    // this.emit(Events.Back);
  };
  reload = () => {
    // this.emit(Events.Reload);
  };
  /** 外部路由改变（点击浏览器前进、后退），作出响应 */
  handlePopState({ type, pathname }: { type: string; pathname: string }) {
    console.log("pathname change", type, this.pathname, this.prevHistories);
    if (type !== "popstate") {
      return;
    }
    const targetPathname = pathname;
    const prevPathname = this.pathname;
    this.setPrevPathname(prevPathname);
    this.setPathname(targetPathname);
    const isForward = (() => {
      if (this.prevHistories.length === 0) {
        return false;
      }
      const lastStackWhenBack = this.prevHistories[this.prevHistories.length - 1];
      // console.log("[DOMAIN]navigator -lastStackWhenBack", lastStackWhenBack.pathname, targetPathname);
      if (lastStackWhenBack?.pathname === targetPathname) {
        return true;
      }
      return false;
    })();
    this._pending = {
      pathname,
      search: "",
      type: (() => {
        if (isForward) {
          return "forward";
        }
        return "back";
      })(),
    };
    // this.emit(Events.PathnameChange, { ...this._pending });
    // forward
    if (isForward) {
      console.log("is forward");
      this.setPrevPathname(this.pathname);
      this.setPathname(targetPathname);
      const lastStackWhenBack = this.prevHistories.pop();
      if (lastStackWhenBack) {
        this.histories = this.histories.concat([lastStackWhenBack]);
      }
      this.emit(Events.Forward);
      this.emit(Events.HistoriesChange, [...this.histories]);
      return;
    }
    // back
    // if (this.histories.length === 1) {
    // this.emit(Events.Relaunch);
    // const targetPathname = "/home/index";
    // this.emit(Events.ReplaceState, {
    //   from: this.prevPathname,
    //   path: `${this.origin}${targetPathname}`,
    //   pathname: targetPathname,
    // });
    // this.replace("/home/index");
    // this.emit(Events.Back);
    // return;
    // }
    console.log("is back");
    this.emit(Events.Back);
    // var confirmationMessage = "您的输入还未完成，确认放弃吗？";
    // if (confirm(confirmationMessage)) {
    // } else {
    //   history.pushState(null, null, window.location.href);
    // }
    const theHistoryDestroy = this.histories[this.histories.length - 1];
    this.prevHistories = this.prevHistories.concat([theHistoryDestroy]);
    // this.prevHistories = [...this.histories];
    this.setPrevPathname(this.pathname);
    this.setPathname(targetPathname);
    // const cloneStacks = this.histories.slice(0, this.histories.length - 1);
    console.log(
      "[DOMAIN]navigator - before pop",
      this.histories.map((h) => h.pathname)
    );
    const cloneStacks = this.histories.slice(0, this.histories.length - 1);
    this.histories = cloneStacks.filter(Boolean);
    // this.histories.pop();
    this.emit(Events.HistoriesChange, [...this.histories]);
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
    return this.on(Events.Reload, handler);
  }
  onPathnameChange(handler: Handler<TheTypesOfEvents[Events.PathnameChange]>) {
    return this.on(Events.PathnameChange, handler);
  }
  onBack(handler: Handler<TheTypesOfEvents[Events.Back]>) {
    return this.on(Events.Back, handler);
  }
  onForward(handler: Handler<TheTypesOfEvents[Events.Forward]>) {
    return this.on(Events.Forward, handler);
  }
  onRelaunch(handler: Handler<TheTypesOfEvents[Events.Relaunch]>) {
    return this.on(Events.Relaunch, handler);
  }
  onHistoriesChange(handler: Handler<TheTypesOfEvents[Events.HistoriesChange]>) {
    return this.on(Events.HistoriesChange, handler);
  }
}

export type RouteAction = "initialize" | "push" | "replace" | "back" | "forward";

function buildQuery(path: string) {
  const [, search] = path.split("?");
  if (!search) {
    return {} as Record<string, string>;
  }
  return qs.parse(search) as Record<string, string>;
}

type ExtractDefinedKeys<T, K extends keyof T> = {
  [key in K]: T[key] extends undefined ? never : T[key];
};
function extractDefinedKeys<T extends any, K extends keyof T>(obj: T, keys: K[]): ExtractDefinedKeys<T, K> {
  const result = {} as ExtractDefinedKeys<T, K>;
  for (const key of keys) {
    // @ts-ignore
    if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
      result[key] = obj[key] as ExtractDefinedKeys<T, K>[typeof key];
    }
  }
  return result;
}
