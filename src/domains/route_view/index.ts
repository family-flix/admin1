/**
 * @file 根据路由判断是否可见的视图块
 */
import qs from "qs";
import { Handler } from "mitt";
import { pathToRegexp } from "path-to-regexp";

import { BaseDomain } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
import { RouteAction } from "@/domains/navigator";
import { Result } from "@/types";

enum Events {
  /** 子视图改变（数量 */
  ViewsChange,
  /** 当前展示的子视图改变 */
  CurViewChange,
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
  prefix?: string;
  title: string;
  component: unknown;
  keepAlive?: boolean;
};

export class RouteViewCore extends BaseDomain<TheTypesOfEvents> {
  static Events = Events;

  _name = "ViewCore";
  debug = true;
  id = this.uid();
  prefix: string | null;
  /** 配置信息 */
  configs: {
    /** 路由匹配规则 */
    path: string;
    /** 根据路由匹配规则解析得到的正则表达式 */
    regexp: RegExp;
    /** 参数获取 */
    keys: ParamConfigure[];
    config: () => RouteViewCore;
  }[];
  title: string;
  subViews: RouteViewCore[] = [];
  /** 路由切换后，被切换的路由实例 */
  prevView: RouteViewCore | null = null;
  /** 路由切换后，切换到的路由实例 */
  curView: RouteViewCore | null = null;
  /** 浏览器返回后，被销毁的那个栈 */
  destroyStacksWhenBack: RouteViewCore[] = [];
  /** 当前 pathname */
  // pathname: string;
  /** 当前路由的 query */
  query: Record<string, string> = {};
  /** 当前路由的 params */
  params: Record<string, string> = {};
  /** 当前访问地址 */
  // url: string;
  component: unknown;
  presence = new PresenceCore();
  // keepAlive = false;

  isMounted = false;
  state: RouteViewState = {
    mounted: false,
    visible: false,
    layered: false,
  };

  constructor(options: Partial<{ name: string }> & RouteViewProps) {
    super(options);
    const { prefix = null, title, component, keepAlive = false } = options;
    this.title = title;
    this._name = title;
    this.prefix = prefix;
    this.component = component;
    this.configs = [];
    // this.keepAlive = keepAlive;

    this.presence.onStateChange((nextState) => {
      const { open, mounted } = nextState;
      if (this.state.visible === false && open) {
        this.showed();
        // this.emit(Events.Show);
      }
      if (this.state.visible && open === false) {
        this.hidden();
        // this.emit(Events.Hidden);
      }
      // if (this.state.mounted === false && mounted) {
      //   this.emit(Events.Mounted);
      // }
      // if (this.state.mounted && mounted === false) {
      //   this.emit(Events.Unmounted);
      // }
      this.state.visible = open;
      this.state.mounted = !!mounted;
      this.emit(Events.StateChange, { ...this.state });
    });
  }

  /** 判断给定的 pathname 是否有匹配的内容 */
  async checkMatch({ pathname, type }: { pathname: string; type: RouteAction }) {
    console.log(...this.log("checkMatch - ", this.title, pathname, this.configs, this.subViews));
    if (this.configs.length === 0) {
      return Result.Err("未配置子视图");
    }
    if (!pathname) {
      const msg = this.tip({ text: ["请传入 pathname"] });
      return Result.Err(msg);
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
    const query = buildQuery(targetPathname);
    matchedSubView.query = query;
    matchedSubView.params = params;
    console.log(...this.log("match", matchedSubView._name));
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
    console.log("[Navigator]relaunch - prev view", prevView?._name, view._name);
    if (prevView) {
      prevView.hide();
    }
    this.emit(Events.ViewsChange, [...this.subViews]);
    this.curView.show();
  }
  private setSubViews(
    subView: RouteViewCore,
    extra: {
      pathname: string;
      type: RouteAction;
      query: Record<string, string>;
      params: Record<string, string>;
    }
  ) {
    this.log("setSubViews", this.title, subView);
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
    this.log("next sub views", nextSubViews);
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
          this.log(this.title, "show subView", v.title);
          v.show();
          continue;
        }
        this.log(this.title, "hide subView", v.title);
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
  /** 添加子视图 */
  register(path: string, configFactory: () => RouteViewCore) {
    const existing = this.configs.find((config) => {
      return config.path === path;
    });
    if (existing) {
      return this;
    }
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
  ready() {
    this.emit(Events.Ready);
  }
  mounted() {
    if (this.isMounted) {
      return;
    }
    this.isMounted = true;
    this.emit(Events.Mounted);
  }
  /** 主动展示视图 */
  show() {
    if (this.state.visible) {
      // 为了让 presence 内部 hide 时判断 mounted 为 true
      this.presence.state.mounted = true;
      return;
    }
    this.presence.show();
  }
  _showed = false;
  /** 视图被展示 */
  showed() {
    if (this._showed) {
      return;
    }
    this._showed = true;
    this.emit(Events.Show);
  }
  /** 主动隐藏视图 */
  hide() {
    console.log("[ROUTE_VIEW]hide", this._name, this.state.visible);
    if (this.state.visible === false) {
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
  layered() {
    this.state.layered = true;
    this.emit(Events.Layered);
  }
  uncovered() {
    this.state.layered = false;
    this.emit(Events.Uncover);
  }
  /** 视图被卸载 */
  unmounted() {
    this.isMounted = false;
    this.emit(Events.Unmounted);
  }
  /** 销毁自身 */
  // destroy() {}

  onStart(handler: Handler<TheTypesOfEvents[Events.Start]>) {
    return this.on(Events.Start, handler);
  }
  onReady(handler: Handler<TheTypesOfEvents[Events.Ready]>) {
    return this.on(Events.Ready, handler);
  }
  onMounted(handler: Handler<TheTypesOfEvents[Events.Mounted]>) {
    return this.on(Events.Mounted, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    return this.on(Events.Show, handler);
  }
  onHidden(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    return this.on(Events.Hidden, handler);
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
