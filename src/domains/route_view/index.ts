/**
 * @file 根据路由判断是否可见的视图块
 */
import qs from "qs";
import { pathToRegexp } from "path-to-regexp";
import parse from "url-parse";

import { BaseDomain, Handler } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
import { NavigatorCore, RouteAction } from "@/domains/navigator";
import { Result } from "@/types";

import { buildUrl } from "./utils";

enum Events {
  /** 子视图改变（数量 */
  ViewsChange,
  /** 当前展示的子视图改变 */
  CurViewChange,
  /** 有视图变为可见状态 */
  ViewShow,
  Ready,
  /** 当前视图载入页面 */
  Mounted,
  /** 当前视图可见，稍晚于 Mounted 事件 */
  Show,
  /** 当前视图隐藏 */
  Hidden,
  /** 当前视图从页面卸载 */
  Unmounted,
  /** 被其他视图覆盖 */
  Layered,
  /** 覆盖自身的视图被移开 */
  Uncover,
  Start,
  StateChange,
  /** 子视图匹配上了 */
  Match,
  NotFound,
}
type TheTypesOfEvents = {
  [Events.ViewsChange]: RouteViewCore[];
  [Events.CurViewChange]: RouteViewCore;
  [Events.Ready]: void;
  [Events.Mounted]: void;
  [Events.ViewShow]: RouteViewCore[];
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.Layered]: void;
  [Events.Uncover]: void;
  [Events.Unmounted]: void;
  [Events.Start]: { pathname: string };
  [Events.StateChange]: RouteViewState;
  [Events.Match]: RouteViewCore;
  [Events.NotFound]: void;
};

type RouteViewState = {
  /** 是否加载到页面上（如果有动画，在隐藏动画播放时该值仍为 true，在 animation end 后从视图上卸载后，该值被置为 false） */
  mounted: boolean;
  /** 是否可见，用于判断是「进入动画」还是「退出动画」 */
  visible: boolean;
  /** 被另一视图覆盖 */
  layered: boolean;
};
type RouteViewProps = {
  /** 唯一标志 */
  key: string;
  title: string;
  component: unknown;
  layers?: boolean;
  children?: RouteViewCore[];
};

export class RouteViewCore extends BaseDomain<TheTypesOfEvents> {
  _name = "ViewCore";
  debug = true;
  id = this.uid();
  /**
   * 配置信息
   * @deprecated
   */
  configs: {
    /** 路由匹配规则 */
    path: string;
    /** 根据路由匹配规则解析得到的正则表达式 */
    regexp: RegExp;
    /** 参数获取 */
    keys: ParamConfigure[];
    config: () => RouteViewCore;
  }[];

  key: string;
  title: string;
  loaded = false;
  isMounted = false;
  visible = false;
  layered = false;
  canLayer = false;
  /** 父级视图 */
  parent: RouteViewCore | null = null;
  /** 视图元素 */
  component: unknown;
  /** 用于路由匹配的 */
  keys: ParamConfigure[] = [];
  regexp: RegExp | null = null;

  isShowForBack = false;
  subViews: RouteViewCore[] = [];
  /** 路由切换后，被切换的路由实例 */
  prevView: RouteViewCore | null = null;
  /** 路由切换后，切换到的路由实例 */
  curView: RouteViewCore | null = null;
  /** 浏览器返回后，被销毁的那个栈 */
  destroyStacksWhenBack: RouteViewCore[] = [];
  /** 当前视图的 query */
  query: Record<string, string> = {};
  /** 当前视图的 params */
  params: Record<string, string> = {};

  presence = new PresenceCore();

  get state(): RouteViewState {
    return {
      mounted: this.isMounted,
      visible: this.visible,
      layered: this.layered,
    };
  }

  constructor(options: Partial<{ _name: string }> & RouteViewProps) {
    super(options);
    const { key, title, component, layers = false, children = [] } = options;
    this.key = key;
    this.title = title;
    this._name = title;
    this.component = component;
    this.configs = [];
    this.canLayer = layers;

    for (let i = 0; i < children.length; i += 1) {
      children[i].parent = this;
    }

    this.presence.onStateChange((nextState) => {
      const { open, mounted } = nextState;
      // console.log("[ROUTE_VIEW]this.presence.onStateChange", this._name, this.state.visible, open, mounted);
      const prevVisible = this.state.visible;
      this.visible = open;

      if (prevVisible === false && open) {
        this.showed();
        // this.emit(Events.Show);
      }
      if (prevVisible && open === false) {
        this.hidden();
        // this.emit(Events.Hidden);
      }
      this.isMounted = !!mounted;
      // if (this.state.mounted === false && mounted) {
      //   this.emit(Events.Mounted);
      // }
      // if (this.state.mounted && mounted === false) {
      //   this.emit(Events.Unmounted);
      // }
      this.emit(Events.StateChange, { ...this.state });
    });
    this.keys = [];
    this.regexp = pathToRegexp(key, this.keys);
    emitViewCreated(this);
  }

  checkMatchRegexp(url: string) {
    const pathname = (() => {
      if (url.startsWith("http")) {
        return parse(url).pathname;
      }
      return url;
    })();
    console.log(pathname);
    if (pathname === this.key) {
      return true;
    }
    return false;
  }

  /** 判断给定的 pathname 是否有匹配的内容 */
  async checkMatch({ pathname, search }: { pathname: string; search: string; type: RouteAction }) {
    console.log(...this.log("checkMatch - ", this.title, pathname, search));
    if (this.configs.length === 0) {
      return Result.Err("未配置子视图");
    }
    if (!pathname) {
      const msg = this.tip({ text: ["请传入 pathname"] });
      return Result.Err(msg);
    }
    const { pathname: p, query: q } = parse(pathname);
    const queryString = search || q;
    // console.log(...this.log("checkMatch - after parse", typeof q));
    const targetPathname = p;
    const matchedRoute = this.configs.find((route) => {
      const { regexp } = route;
      const strictMatch = regexp.test(targetPathname);
      if (strictMatch) {
        return true;
      }
      return targetPathname.startsWith(route.path);
    });
    if (!matchedRoute) {
      // this.error(`View ${targetPathname} not found`);
      const msg = this.tip({ text: [targetPathname, "没有找到匹配的路由"] });
      // console.log(...this.log("not found", targetPathname));
      this.emit(Events.NotFound);
      return Result.Err(msg);
    }
    const { regexp, keys, config } = matchedRoute;
    // 运行时获取 view
    const matchedSubView = await config();
    const params = buildParams({
      regexp,
      targetPath: targetPathname,
      keys,
    });
    const query = buildQuery(queryString);
    matchedSubView.query = query;
    matchedSubView.params = params;
    // console.log(...this.log("match", matchedSubView._name));
    this.emit(Events.Match, matchedSubView);
    // this.setSubViews(matchedSubView, {
    //   pathname,
    //   type,
    //   query,
    //   params,
    // });
  }
  relaunch(view: RouteViewCore) {
    const prevView = this.curView;
    this.prevView = prevView;
    this.curView = view;
    this.subViews = [view];
    // console.log("[Navigator]relaunch - prev view", prevView?._name, view._name);
    if (prevView) {
      prevView.hide();
    }
    this.emit(Events.ViewsChange, [...this.subViews]);
    this.curView.show();
  }
  setSubViews(
    subView: RouteViewCore,
    extra: {
      pathname: string;
      type: RouteAction;
      query: Record<string, string>;
      params: Record<string, string>;
    }
  ) {
    // this.log("setSubViews", this.title, subView);
    const { pathname, type, query, params } = extra;
    const prevView = this.curView;
    this.curView = subView;
    this.emit(Events.CurViewChange, subView);
    const cloneViews = this.subViews;
    // 已经在 / layout，当路由改变时，仍然响应，并且查找到了 / layout，就可能重复添加，这里做个判断，避免了重复添加
    // this.log("setSubViews -", this.title, "check", subView.title, "existing", existing);

    const nextSubViews = (() => {
      const existing = this.subViews.includes(subView);
      if (existing) {
        // if (type === "back") {
        //   return cloneViews.slice(0, cloneViews.length - 1);
        // }
        return cloneViews;
      }
      if (type === "initialize") {
        return cloneViews.concat(subView);
      }
      if (type === "push") {
        return cloneViews.concat(subView);
      }
      // if (type === "replace" && !this.keepAlive) {
      //   return cloneViews.slice(0, cloneViews.length - 1).concat(subView);
      // }
      if (type === "forward") {
        return cloneViews.concat(subView);
      }
      if (type === "back") {
        return cloneViews.slice(0, cloneViews.length - 1);
      }
      return cloneViews;
    })();
    // this.log("next sub views", nextSubViews);
    (() => {
      if (type === "back") {
        if (prevView) {
          prevView.hide();
          setTimeout(() => {
            this.subViews = nextSubViews;
            this.emit(Events.ViewsChange, [...this.subViews]);
          }, 800);
        }
        subView.show();
        return;
      }
      this.subViews = nextSubViews;
      this.emit(Events.ViewsChange, [...this.subViews]);
      for (let i = 0; i < nextSubViews.length; i += 1) {
        const v = nextSubViews[i];
        if (v === subView) {
          // this.log(this.title, "show subView", v.title);
          v.show();
          continue;
        }
        // this.log(this.title, "hide subView", v.title);
        // if (!this.keepAlive) {
        //   v.hide();
        // }
      }
    })();
    // @todo 判断 query 是否改变，触发特定事件
    // subView.checkMatch({ pathname, type });
  }
  appendSubView(view: RouteViewCore) {
    if (this.subViews.includes(view)) {
      return;
    }
    // console.log("view listen onShow", view.title);
    view.onViewShow((views) => {
      // console.log("view onShow", view.title);
      this.emit(Events.ViewShow, [this, ...views]);
    });
    view.onShow(() => {
      // console.log("view onShow", view.title);
      this.emit(Events.ViewShow, [this, view]);
    });
    this.subViews.push(view);
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  replaceSubViews(views: RouteViewCore[]) {
    this.subViews = views;
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  removeSubView(view: RouteViewCore) {
    if (!this.subViews.includes(view)) {
      return;
    }
    this.subViews = this.subViews.filter((v) => v !== view);
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  buildUrl(query: Record<string, string | number>) {
    const url = buildUrl(this.key, this.params, query);
    return url;
  }
  buildUrlWithPrefix(query: Record<string, string | number>) {
    const url = buildUrl(this.key, this.params, query);
    return NavigatorCore.prefix + url;
  }
  ready() {
    this.emit(Events.Ready);
  }
  /** 主动展示视图 */
  show() {
    // console.log("[ROUTE_VIEW]show", this._name, this.state.visible);
    if (this.visible) {
      // 为了让 presence 内部 hide 时判断 mounted 为 true
      this.presence.state.mounted = true;
      return;
    }
    this.presence.show();
  }
  showSubView(subView: RouteViewCore) {
    console.log("[DOMAIN]route_view - showSubView", subView.title, this.curView?.title);
    if (subView === this) {
      return;
    }
    if (subView.visible) {
      return;
    }
    // alert(subView.title);
    this.curView?.hide();
    this.prevView = this.curView;
    this.appendSubView(subView);
    this.curView = subView;
    this.curView.show();
    this.emit(Events.CurViewChange, this.curView);
  }
  layerSubView(subView: RouteViewCore) {
    this.curView?.setLayered();
    this.appendSubView(subView);
    this.prevView = this.curView;
    this.curView = subView;
    this.curView.show();
    this.emit(Events.CurViewChange, this.curView);
  }
  showPrevView(options: Partial<{ ignore: boolean; destroy: boolean }> = {}) {
    // alert(JSON.stringify(this.prevView));
    console.log("[DOMAIN]route_view - showPrevView", this.prevView?.title, this.curView?.title);
    if (this.prevView === null) {
      return;
    }
    console.log("[DOMAIN]route_view - showPrevView", this.prevView?.title, this.curView?.title);
    const curView = this.curView;
    if (options.destroy) {
      curView?.onHidden(() => {
        console.log("[DOMAIN]route_view - showPrevView when hidden", this.title);
        curView?.setUnload();
        this.subViews = this.subViews.filter((v) => v !== curView);
        this.emit(Events.ViewsChange, [...this.subViews]);
      });
    }
    curView?.hide();
    if (options.ignore && this.prevView) {
      this.prevView.isShowForBack = true;
    }
    this.prevView?.show();
    this.curView = this.prevView;
    this.prevView = null;
    this.emit(Events.CurViewChange, this.curView);
  }
  uncoverPrevView() {
    if (this.prevView === null) {
      return;
    }
    this.curView?.hide();
    this.curView?.setUnload();
    this.subViews = this.subViews.filter((v) => v !== this.curView);
    this.prevView?.uncovered();
    this.curView = this.prevView;
    this.prevView = null;
    this.emit(Events.CurViewChange, this.curView);
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  _showed = false;
  /** 视图被展示 */
  showed() {
    console.log("[ROUTE_VIEW]showed", this._name, this._showed);
    if (this._showed) {
      return;
    }
    this._showed = true;
    console.log("[ROUTE_VIEW]emit showed", this._name);
    this.emit(Events.Show);
  }
  /** 主动隐藏视图 */
  hide() {
    // console.log("[ROUTE_VIEW]hide", this._name, this.state.visible);
    if (this.visible === false) {
      return;
    }
    this.presence.hide();
  }
  /** 视图被隐藏（由框架发出？） */
  hidden() {
    this._showed = false;
    this.emit(Events.Hidden);
  }
  /** 自己被其他视图覆盖了 */
  setLayered() {
    this.layered = true;
    this.emit(Events.Layered);
  }
  /** 从被覆盖的状态变成可见 */
  uncovered() {
    this.layered = false;
    this.emit(Events.Uncover);
  }
  setMounted() {
    if (this.isMounted) {
      return;
    }
    this.isMounted = true;
    this.emit(Events.Mounted);
  }
  /** 视图被卸载 */
  setUnmounted() {
    this.isMounted = false;
    this.emit(Events.Unmounted);
  }
  /** 页面组件已加载 */
  setLoaded() {
    this.loaded = true;
  }
  setUnload() {
    this.loaded = false;
  }

  onStart(handler: Handler<TheTypesOfEvents[Events.Start]>) {
    return this.on(Events.Start, handler);
  }
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onViewShow(handler: Handler<TheTypesOfEvents[Events.ViewShow]>) {
    return this.on(Events.ViewShow, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>, options: Partial<{ once: boolean }> = {}) {
    const listen = this.on(Events.Hidden, () => {
      handler();
      if (options.once) {
        listen();
      }
    });
    return listen;
  }
  onLayered(handler: Handler<TheTypesOfEvents[Events.Layered]>) {
    return this.on(Events.Layered, handler);
  }
  onUncover(handler: Handler<TheTypesOfEvents[Events.Uncover]>) {
    return this.on(Events.Uncover, handler);
  }
  onUnmounted(handler: Handler<TheTypesOfEvents[Events.Unmounted]>) {
    return this.on(Events.Unmounted, handler);
  }
  onSubViewsChange(handler: Handler<TheTypesOfEvents[Events.ViewsChange]>) {
    return this.on(Events.ViewsChange, handler);
  }
  onCurViewChange(handler: Handler<TheTypesOfEvents[Events.CurViewChange]>) {
    return this.on(Events.CurViewChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
  onMatched(handler: Handler<TheTypesOfEvents[Events.Match]>) {
    return this.on(Events.Match, handler);
  }
  onNotFound(handler: Handler<TheTypesOfEvents[Events.NotFound]>) {
    return this.on(Events.NotFound, handler);
  }
}
type ParamConfigure = {
  name: string;
  prefix: string;
  suffix: string;
  pattern: string;
  modifier: string;
};
function buildParams(opt: { regexp: RegExp; targetPath: string; keys: ParamConfigure[] }) {
  const { regexp, keys, targetPath } = opt;
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

let handler: ((views: RouteViewCore) => void) | null = null;
export function onViewCreated(fn: (views: RouteViewCore) => void) {
  handler = fn;
}
function emitViewCreated(view: RouteViewCore) {
  if (!handler) {
    return;
  }
  handler(view);
}
