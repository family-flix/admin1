/**
 * @file 负责路由的核心类
 * 路由切换、状态保持、事件监听与分发等
 *
 * Page 核心类
 * 监听路由的变化，判断自身是否要渲染？
 */

import qs from "qs";
import { Handler } from "mitt";
import { pathToRegexp } from "path-to-regexp";

import { BaseDomain } from "@/domains/base";

enum Events {
  PushState,
  ReplaceState,
  Back,
  Reload,
  Start,
  PathnameChanged,
}
type TheTypesOfEvents = {
  [Events.PathnameChanged]: {
    pathname: string;
    isBack?: boolean;
  };
  [Events.PushState]: {
    from?: string;
    //     title: string;
    path: string;
    pathname: string;
  };
  [Events.ReplaceState]: {
    from?: string;
    //     title: string;
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
  debug = false;
  //   prefix: string | null;
  /** 配置信息 */
  //   configs: {
  //     /** 路由匹配规则 */
  //     path: string;
  //     /** 根据路由匹配规则解析得到的正则表达式 */
  //     regexp: RegExp;
  //     /** 参数获取 */
  //     keys: ParamConfigure[];
  //     config: () => RouteConfigure;
  //   }[];

  /** 当前 pathname */
  pathname: string;
  /** 发生跳转前的 pathname */
  prevPathname: string | null = null;
  /** 当前路由的 query */
  query: Record<string, string> = {};
  /** 当前路由的 params */
  params: Record<string, string> = {};
  /** 当前访问地址 */
  url: string;
  location: Partial<RouteLocation> = {};
  child?: NavigatorCore;

  /** router 基础信息 */
  host: string;
  protocol: string;
  origin: string;

  /** 启动路由监听 */
  async start(location: RouteLocation) {
    // console.log("[DOMAIN]router - start");
    const { pathname, href, origin, host, protocol } = location;
    this.log("start, current pathname is", pathname);
    // this.setSomething(location);
    this.prevPathname = null;
    this.setPathname(pathname);
    this.origin = origin;
    // const query = buildQuery(href);
    this.histories = [
      {
        pathname,
      },
    ];
    this.emit(Events.PathnameChanged, {
      pathname,
    });
  }

  private setPrevPathname(p: string) {
    // console.log("[] - setPrevPathname", p);
    this.prevPathname = p;
  }
  private setPathname(p: string) {
    // console.log("[] - setPathname", p);
    this.pathname = p;
  }
  private setSomething(params: RouteLocation) {
    const { host, protocol, origin, pathname, href } = params;
    this.host = host;
    this.protocol = protocol;
    this.origin = origin;
    this.pathname = pathname;
    this.url = href;
    this.query = buildQuery(href);
    this.location = {
      host,
      protocol,
      origin,
      pathname,
      href,
    };
  }
  /** 添加路由 */
  //   route(path: string, configFactory: () => RouteConfigure) {
  //     const keys: ParamConfigure[] = [];
  //     const regexp = pathToRegexp(path, keys);
  //     this.configs.push({
  //       regexp,
  //       keys,
  //       path,
  //       config: configFactory,
  //     });
  //     return this;
  //   }
  /** 添加子路由 */
  // child(path: string, configFactory: () => RouteConfigure) {}
  /** 跳转到指定路由 */
  async push(
    targetPathname: string,
    options: Partial<{ modifyHistory: boolean }> = {}
  ) {
    this.log("push", targetPathname, this.prevPathname);
    if (this.pathname === targetPathname) {
      this.error("cur pathname has been", targetPathname);
      return;
    }
    const prevPathname = this.pathname;
    this.setPrevPathname(prevPathname);
    this.setPathname(targetPathname);
    const query = buildQuery(targetPathname);
    this.query = query;
    this.histories.push({ pathname: targetPathname });
    this.emit(Events.PushState, {
      from: this.prevPathname,
      // 这里似乎不用 this.origin，只要是 / 开头的，就会拼接在后面
      path: `${this.origin}${targetPathname}`,
      pathname: targetPathname,
    });
    this.emit(Events.PathnameChanged, {
      pathname: targetPathname,
    });
  }
  onPushState(handler: Handler<TheTypesOfEvents[Events.PushState]>) {
    this.on(Events.PushState, handler);
  }
  replace = async (targetPathname: string) => {
    this.log("replace", targetPathname, this.pathname);
    if (targetPathname === this.pathname) {
      return;
    }
    this.setPrevPathname(this.pathname);
    this.setPathname(targetPathname);
    //     const { regexp, keys, config } = matchedRoute;
    //     const params = buildParams({
    //       regexp,
    //       targetPath: targetPathname,
    //       keys,
    //     });
    const query = buildQuery(targetPathname);
    this.histories[this.histories.length - 1] = { pathname: targetPathname };
    this.emit(Events.ReplaceState, {
      from: this.prevPathname,
      //       title,
      path: `${this.origin}${targetPathname}`,
      pathname: targetPathname,
    });
    this.emit(Events.PathnameChanged, {
      pathname: targetPathname,
    });
  };
  onReplaceState(handler: Handler<TheTypesOfEvents[Events.ReplaceState]>) {
    this.on(Events.ReplaceState, handler);
  }
  back = () => {
    this.emit(Events.Back);
  };
  onBack(handler: Handler<TheTypesOfEvents[Events.Back]>) {
    this.on(Events.Back, handler);
  }
  reload = () => {
    this.emit(Events.Reload);
  };
  onReload(handler: Handler<TheTypesOfEvents[Events.Reload]>) {
    this.on(Events.Reload, handler);
  }
  /** 监听路由发生改变 */
  onPathnameChanged(
    handler: Handler<TheTypesOfEvents[Events.PathnameChanged]>
  ) {
    this.on(Events.PathnameChanged, handler);
  }
  prevHistories: { pathname: string }[] = [];
  histories: { pathname: string }[] = [];
  /** 外部路由改变，作出响应 */
  handlePathnameChanged({
    type,
    pathname,
  }: {
    type: string;
    pathname: string;
  }) {
    this.log("pathname change", type, pathname);
    if (type !== "popstate") {
      return;
    }
    const targetPathname = pathname;
    const isForward = (() => {
      if (this.prevHistories.length === 0) {
        return false;
      }
      const lastStackWhenBack =
        this.prevHistories[this.prevHistories.length - 1];
      // console.log("[Router]lastStackWhenBack", lastStackWhenBack);
      if (lastStackWhenBack.pathname === targetPathname) {
        return true;
      }
      return false;
    })();
    this.emit(Events.PathnameChanged, { pathname, isBack: !isForward });
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
      this.replace("/");
      return;
    }
    const theStackPrepareDestroy = this.histories[this.histories.length - 1];
    // @todo 可以让 emitHidden 返回 promise，决定是否要隐藏页面吗？
    //     theStackPrepareDestroy.page.emitHidden();
    this.prevHistories = this.prevHistories.concat([theStackPrepareDestroy]);
    //     setTimeout(() => {
    this.setPrevPathname(this.pathname);
    this.setPathname(targetPathname);
    const cloneStacks = this.histories.slice(0, this.histories.length - 1);
    //       const lastStack = cloneStacks[cloneStacks.length - 1];
    this.histories = cloneStacks;
    //       lastStack.page.emitDestroy();
    //       this.emit(RouteEvents.StackChanged, cloneStacks);
    //     }, 300);
  }
  /** 获取路由信息 */
  // getLocation() {
  //   return window.location;
  // }
  //   onStackChange(
  //     handler: Handler<TheTypesOfRouterEvents[RouteEvents.StackChanged]>
  //   ) {
  //     this.on(RouteEvents.StackChanged, handler);
  //   }
  onStart(handler: Handler<TheTypesOfEvents[Events.Start]>) {
    this.on(Events.Start, handler);
  }
}

function buildParams(opt: {
  regexp: RegExp;
  targetPath: string;
  keys: ParamConfigure[];
}) {
  const { regexp, keys, targetPath } = opt;
  // const regexp = pathToRegexp(path, keys);
  const match = regexp.exec(targetPath);
  if (match) {
    const params: Record<string, string> = {};
    for (let i = 1; i < match.length; i++) {
      params[keys[i - 1].name] = match[i];
    }
    return params;
  }
  return {};
}
function buildQuery(path: string) {
  const [, search] = path.split("?");
  if (!search) {
    return {} as Record<string, string>;
  }
  return qs.parse(search) as Record<string, string>;
}
