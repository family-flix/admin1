/**
 * @file 路由领域
 */
import qs from "qs";
import { Handler } from "mitt";
import { pathToRegexp } from "path-to-regexp";

import { BaseDomain } from "@/domains/base";

import { PageCore } from "./something";

enum Events {
  SubViewsChanged,
  Start,
}
type TheTypesOfEvents = {
  [Events.SubViewsChanged]: ViewCore[];
  [Events.Start]: { pathname: string };
};
type ParamConfigure = {
  name: string;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
};

// type ViewCore = {
//   uid: number;
//   pathname: string;
//   /** query 参数 */
//   query: Record<string, string>;
//   /** 路由参数 */
//   params: Record<string, string>;
//   /** 页面准备销毁 */
//   // unmounting: boolean;
//   /** 页面实例 */
//   page: PageCore;
// } & RouteConfigure;

export class ViewCore extends BaseDomain<TheTypesOfEvents> {
  prefix: string | null;
  /** 配置信息 */
  configs: {
    /** 路由匹配规则 */
    path: string;
    /** 根据路由匹配规则解析得到的正则表达式 */
    regexp: RegExp;
    /** 参数获取 */
    keys: ParamConfigure[];
    config: () => ViewCore;
  }[];

  title: string;
  page: PageCore;

  subViews: ViewCore[] = [];
  /** 浏览器返回后，被销毁的那个栈 */
  destroyStacksWhenBack: ViewCore[] = [];

  /** 当前 pathname */
  pathname: string;
  /** 当前路由的 query */
  query: Record<string, string> = {};
  /** 当前路由的 params */
  params: Record<string, string> = {};
  /** 当前访问地址 */
  url: string;
  component: unknown;
  child?: ViewCore;

  constructor(
    options: Partial<{
      prefix: string;
      title: string;
      component: unknown;
    }> = {}
  ) {
    super();
    const { prefix = null, title, component } = options;
    this.prefix = prefix;
    this.title = title;
    this.component = component;
    this.configs = [];
  }

  /** 判断给定的 pathname 是否有匹配的内容 */
  async checkMatch({
    pathname,
    type,
  }: {
    pathname: string;
    type: "push" | "replace";
  }) {
    console.log("[ViewCore]checkMatch - ", pathname, type);
    if (!pathname) {
      console.error("[ERROR]unexpected pathname", pathname);
      return;
    }
    const targetPathname = pathname;
    const matchedRoute = this.configs.find((route) => {
      const { regexp } = route;
      const strictMatch = regexp.test(targetPathname);
      if (strictMatch) {
        return true;
      }
      return targetPathname.startsWith(route.path);
    });
    if (!matchedRoute) {
      console.error(`[ERROR]View ${targetPathname} not found`);
      return;
    }
    const { regexp, keys, config } = matchedRoute;
    const params = buildParams({
      regexp,
      targetPath: targetPathname,
      keys,
    });
    const query = buildQuery(targetPathname);
    const v = await config();
    this.setSubViews(v, {
      query,
      params,
      replace: type === "replace",
    });
  }
  async start({ pathname }: { pathname: string }) {
    // console.log("[DOMAIN]router - start");
    console.log(
      "[DOMAIN]Router - start, current pathname is",
      pathname,
      this.prefix
    );
    this.checkMatch({ pathname, type: "push" });
    this.emit(Events.Start, { pathname });
  }
  /** 添加路由 */
  addSubViewBackup(path: string, configFactory: () => ViewCore) {
    // @todo 检查重复注册路由
    const keys: ParamConfigure[] = [];
    const regexp = pathToRegexp(path, keys);
    this.configs.push({
      regexp,
      keys,
      path,
      config: configFactory,
    });
    return this;
  }
  // onReplaceState(
  //   handler: Handler<TheTypesOfRouterEvents[RouteEvents.ReplaceState]>
  // ) {
  //   this.on(RouteEvents.ReplaceState, handler);
  // }
  private setSubViews(
    opt: ViewCore,
    extra: {
      query: Record<string, string>;
      params: Record<string, string>;
      replace?: boolean;
    }
  ) {
    console.log("[ViewCore]setSubViews", opt);
    const { title, component } = opt;
    const { query, params, replace = false } = extra;
    // this.query = query;
    // this.params = params;
    // console.log("[DOMAIN]router - push", path);
    const cloneStacks = this.subViews;
    // const newPage = new PageCore({
    //   query,
    //   params,
    // });
    // if (title) {
    //   newPage.setTitle(title);
    // }
    // const createdStack = {
    //   uid: this.uid(),
    //   title,
    //   pathname: this.pathname,
    //   component,
    //   hidden: false,
    //   query,
    //   params,
    //   page: newPage,
    //   child,
    // };
    if (replace) {
      cloneStacks[this.subViews.length - 1] = opt;
    } else {
      cloneStacks.push(opt);
    }
    this.subViews = cloneStacks;
    console.log("[ViewCore]modifyStacks", cloneStacks);
    this.emit(Events.SubViewsChanged, cloneStacks);
  }
  /** 获取路由信息 */
  // getLocation() {
  //   return window.location;
  // }
  onSubViewsChange(handler: Handler<TheTypesOfEvents[Events.SubViewsChanged]>) {
    this.on(Events.SubViewsChanged, handler);
  }
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
function convertNumberStringsToNumbers(obj: Record<string, any>) {
  const result: Record<string, string | number> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (!isNaN(value)) {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}
