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
  SubViewChanged,
  Show,
  Hidden,
  Start,
}
type TheTypesOfEvents = {
  [Events.SubViewsChanged]: ViewCore[];
  [Events.SubViewChanged]: ViewCore;
  [Events.Show]: void;
  [Events.Hidden]: void;
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
  name = "ViewCore";
  debug = false;

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
  _uid: number;

  title: string;
  page: PageCore;

  _hidden = false;
  get hidden() {
    return this._hidden;
  }
  subViews: ViewCore[] = [];
  curSubView: ViewCore;
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
    this._uid = this.uid();
  }

  /** 判断给定的 pathname 是否有匹配的内容 */
  async checkMatch({
    pathname,
    type,
  }: {
    pathname: string;
    type: "push" | "replace";
  }) {
    this.log(
      "checkMatch - ",
      this.title,
      pathname,
      this.configs,
      this.subViews
    );
    // for (let i = 0; i < this.subViews.length; i += 1) {
    //   const view = this.subViews[i];
    //   view.checkMatch({ pathname, type });
    // }
    // const latestViewCore = this.subViews[this.subViews.length - 1];
    // if (latestViewCore) {
    //   this.log("checkMatch - latest view is", latestViewCore);
    //   latestViewCore.checkMatch({ pathname, type });
    // }
    if (this.configs.length === 0) {
      this.log("checkMatch", this.title, "do not have configs");
      return;
    }
    if (!pathname) {
      this.error("unexpected pathname", pathname);
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
      this.error(`View ${targetPathname} not found`);
      return;
    }
    const { regexp, keys, config } = matchedRoute;
    const v = await config();
    // if (this.subViews.includes(v)) {
    //   this.log("the sub view has existing");
    // }
    const params = buildParams({
      regexp,
      targetPath: targetPathname,
      keys,
    });
    const query = buildQuery(targetPathname);
    this.setSubViews(v, {
      pathname,
      type,
      query,
      params,
      replace: type === "replace",
    });
  }
  private setSubViews(
    subView: ViewCore,
    extra: {
      pathname: string;
      type: "push" | "replace";
      query: Record<string, string>;
      params: Record<string, string>;
      replace?: boolean;
    }
  ) {
    this.log("setSubViews", this.title, subView);
    const { title, component } = subView;
    const { pathname, type, query, params, replace = false } = extra;
    this.curSubView = subView;
    this.emit(Events.SubViewChanged, subView);
    const cloneStacks = this.subViews;
    // 已经在 / layout，当路由改变时，仍然响应，并且查找到了 / layout，就可能重复添加，这里做个判断，避免了重复添加
    const existing = this.subViews.includes(subView);
    this.log(
      "setSubViews -",
      this.title,
      "check",
      subView.title,
      "existing",
      existing
    );
    for (let i = 0; i < this.subViews.length; i += 1) {
      const v = this.subViews[i];
      if (v === subView) {
        this.log(this.title, "show subView", v.title);
        v.show();
        continue;
      }
      this.log(this.title, "hide subView", v.title);
      v.hide();
    }
    if (!existing) {
      if (replace) {
        cloneStacks[this.subViews.length - 1] = subView;
      } else {
        cloneStacks.push(subView);
      }
      // this.log("setSubViews - emit SubViewsChanged");
      this.emit(Events.SubViewsChanged, [...cloneStacks]);
    }
    subView.checkMatch({ pathname, type });
  }
  /** 视图栈改变 */
  onSubViewsChange(handler: Handler<TheTypesOfEvents[Events.SubViewsChanged]>) {
    this.on(Events.SubViewsChanged, handler);
  }
  /** 当前视图改变 */
  onSubViewChange(handler: Handler<TheTypesOfEvents[Events.SubViewChanged]>) {
    this.on(Events.SubViewChanged, handler);
  }
  /** 添加子视图 */
  register(path: string, configFactory: () => ViewCore) {
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
  show() {
    if (this._hidden === false) {
      return;
    }
    this._hidden = false;
    this.emit(Events.Show);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    this.on(Events.Show, handler);
  }
  hide() {
    if (this._hidden === true) {
      return;
    }
    this._hidden = true;
    this.emit(Events.Hidden);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    this.on(Events.Hidden, handler);
  }
  async start({ pathname }: { pathname: string }) {
    this.log("current pathname is", this.title, pathname);
    this.checkMatch({ pathname, type: "push" });
    this.emit(Events.Start, { pathname });
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
