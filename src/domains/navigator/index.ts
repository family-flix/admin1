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

  constructor(
    options: Partial<{
      prefix: string;
      host: string;
      protocol: string;
      origin: string;
      href: string;
      pathname: string;
    }> = {}
  ) {
    super();
    const {
      prefix = null,
      // host, protocol, origin, href, pathname
    } = options;
    //     this.prefix = prefix;
    //     this.configs = [];
    // this.host = host;
    // this.protocol = protocol;
    // this.origin = origin;
    // this.pathname = pathname;
    // this.url = href;
    // this.query = buildQuery(href);
    console.log("[DOMAIN]Router - init");
  }

  /** 启动路由监听 */
  async start(location: RouteLocation) {
    // console.log("[DOMAIN]router - start");
    const { pathname, href, origin, host, protocol } = location;
    console.log("[DOMAIN]Router - start, current pathname is", pathname);
    this.setSomething(location);
    this.setPathname(pathname);
    //     const matchedRoute = this.configs.find((route) => {
    //       const { regexp } = route;
    //       console.log(
    //         "[DOMAIN]Router - start, find config",
    //         route.path,
    //         route.regexp
    //       );
    //       const strictMatch = regexp.test(pathname);
    //       if (strictMatch) {
    //         return true;
    //       }
    //       return pathname.startsWith(route.path);
    //     });
    //     if (!matchedRoute) {
    //       console.error(`[Router]start - route ${pathname} not found`);
    //       this.emit(RouteEvents.Start, { host, origin, protocol, pathname, href });
    //       return;
    //     }
    //     const { regexp, keys, config } = matchedRoute;
    //     const params = buildParams({
    //       regexp,
    //       targetPath: pathname,
    //       keys,
    //     });
    const query = buildQuery(href);
    //     const { title, component, child } = await config();
    //     this.modifyStacks(
    //       {
    //         title,
    //         component,
    //         regexp,
    //         child,
    //       },
    //       { query, params }
    //     );
    this.stacks = [
      {
        pathname,
      },
    ];
    this.emit(Events.Start, { host, origin, protocol, pathname, href });
    // document.addEventListener("click", (event) => {
    //   //       console.log("[DOMAIN]router - listen click event", event);
    //   let target = event.target;
    //   if (target instanceof Document) {
    //     return;
    //   }
    //   if (target === null) {
    //     return;
    //   }
    //   let matched = false;
    //   while (target) {
    //     const t = target as HTMLElement;
    //     if (t.tagName === "A") {
    //       matched = true;
    //       break;
    //     }
    //     target = t.parentNode;
    //   }
    //   if (!matched) {
    //     return;
    //   }
    //   const t = target as HTMLElement;
    //   const href = t.getAttribute("href");
    //   if (!href) {
    //     return;
    //   }
    //   if (!href.startsWith("/")) {
    //     return;
    //   }
    //   if (href.startsWith("http")) {
    //     return;
    //   }
    //   event.preventDefault();
    //   this.push(href);
    // });
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
    console.log("[DOMAIN]Router - push", targetPathname, this.prevPathname);
    if (this.prevPathname === targetPathname) {
      console.log(
        "(ERROR)[DOMAIN]Router - cur pathname has been",
        targetPathname
      );
      return;
    }
    this.setPrevPathname(this.pathname);
    //     const matchedRoute = this.configs.find((route) => {
    //       const { regexp } = route;
    //       const strictMatch = regexp.test(targetPathname);
    //       if (strictMatch) {
    //         return true;
    //       }
    //       return targetPathname.startsWith(route.path);
    //     });
    //     if (!matchedRoute) {
    //       console.error(`Route ${targetPathname} not found`);
    //       return;
    //     }
    // targetPath 可能是带 search 的，不一定是 pathname 概念
    this.setPathname(targetPathname);
    //     const { regexp, keys, config } = matchedRoute;
    //     const params = buildParams({
    //       regexp,
    //       targetPath: targetPathname,
    //       keys,
    //     });
    const query = buildQuery(targetPathname);
    this.query = query;
    //     const { title, component } = await config();
    //     this.modifyStacks(
    //       {
    //         title,
    //         component,
    //         regexp,
    //       },
    //       {
    //         query,
    //         params,
    //       }
    //     );
    this.stacks.push({
      pathname: targetPathname,
    });
    this.emit(Events.PushState, {
      from: this.prevPathname,
      //       title,
      path: `${this.origin}${targetPathname}`,
      pathname: targetPathname,
    });
  }
  onPushState(handler: Handler<TheTypesOfEvents[Events.PushState]>) {
    this.on(Events.PushState, handler);
  }
  // onStateChange(
  //   handler: Handler<TheTypesOfRouterEvents[RouteEvents.PushState]>
  // ) {
  //   this.on(RouteEvents.PushState, handler);
  // }
  replace = async (targetPathname: string) => {
    console.log("[DOMAIN]Router - replace", targetPathname, this.pathname);
    if (targetPathname === this.pathname) {
      return;
    }
    this.setPrevPathname(this.pathname);
    //     const matchedRoute = this.configs.find((route) => {
    //       const { regexp } = route;
    //       return regexp.test(targetPathname);
    //     });
    //     if (!matchedRoute) {
    //       console.error(`Route ${targetPathname} not found`);
    //       return;
    //     }
    this.setPathname(targetPathname);
    //     const { regexp, keys, config } = matchedRoute;
    //     const params = buildParams({
    //       regexp,
    //       targetPath: targetPathname,
    //       keys,
    //     });
    const query = buildQuery(targetPathname);
    //     const { title, component } = await config();
    //     this.modifyStacks(
    //       {
    //         title,
    //         component,
    //         regexp,
    //       },
    //       {
    //         query,
    //         params,
    //         replace: true,
    //       }
    //     );
    this.emit(Events.ReplaceState, {
      from: this.prevPathname,
      //       title,
      path: `${this.origin}${targetPathname}`,
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
  private modifyStacks(
    opt: RouteConfigure & { regexp: RegExp },
    extra: {
      query: Record<string, string>;
      params: Record<string, string>;
      replace?: boolean;
    }
  ) {
    const { title, component, child } = opt;
    const { query, params, replace = false } = extra;
    this.query = query;
    this.params = params;
    this.child = child;
    // console.log("[DOMAIN]router - push", path);
    //     const cloneStacks = this.stacks.map((page) => {
    //       return {
    //         ...page,
    //         hidden: true,
    //       };
    //     });
    //     const newPage = new Page({
    //       query,
    //       params,
    //     });
    //     if (title) {
    //       newPage.setTitle(title);
    //     }
    //     const createdStack = {
    //       uid: this.uid(),
    //       title,
    //       pathname: this.pathname,
    //       component,
    //       hidden: false,
    //       query,
    //       params,
    //       page: newPage,
    //       child,
    //     };
    //     if (replace) {
    //       cloneStacks[this.stacks.length - 1] = createdStack;
    //     } else {
    //       cloneStacks.push(createdStack);
    //     }
    //     this.stacks = cloneStacks;
    //     this.emit(RouteEvents.StackChanged, cloneStacks);
  }

  /** 监听路由发生改变 */
  onPathnameChanged(
    handler: Handler<TheTypesOfEvents[Events.PathnameChanged]>
  ) {
    this.on(Events.PathnameChanged, handler);
  }

  prevStacks: { pathname: string }[] = [];
  stacks: { pathname: string }[] = [];
  /** 外部路由改变，作出响应 */
  handlePathnameChanged({
    type,
    pathname,
  }: {
    type: string;
    pathname: string;
  }) {
    console.log("[Router]pathname change", type, pathname);
    if (type !== "popstate") {
      return;
    }
    const targetPathname = pathname;
    const isForward = (() => {
      if (this.prevStacks.length === 0) {
        return false;
      }
      const lastStackWhenBack = this.prevStacks[this.prevStacks.length - 1];
      console.log("[Router]lastStackWhenBack", lastStackWhenBack);
      if (lastStackWhenBack.pathname === targetPathname) {
        return true;
      }
      return false;
    })();
    this.emit(Events.PathnameChanged, { pathname });
    // forward
    if (isForward) {
      this.setPrevPathname(this.pathname);
      this.setPathname(targetPathname);
      const lastStackWhenBack = this.prevStacks.pop();
      this.stacks = this.stacks.concat([lastStackWhenBack!]);
      //       this.emit(RouteEvents.StackChanged, [...this.stacks]);
      return;
    }
    // back
    if (this.stacks.length === 1) {
      this.replace("/");
      return;
    }
    const theStackPrepareDestroy = this.stacks[this.stacks.length - 1];
    // @todo 可以让 emitHidden 返回 promise，决定是否要隐藏页面吗？
    //     theStackPrepareDestroy.page.emitHidden();
    this.prevStacks = this.prevStacks.concat([theStackPrepareDestroy]);
    //     setTimeout(() => {
    this.setPrevPathname(this.pathname);
    this.setPathname(targetPathname);
    const cloneStacks = this.stacks.slice(0, this.stacks.length - 1);
    //       const lastStack = cloneStacks[cloneStacks.length - 1];
    this.stacks = cloneStacks;
    //       if (lastStack.title) {
    //         lastStack.page.setTitle(lastStack.title);
    //       }
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
