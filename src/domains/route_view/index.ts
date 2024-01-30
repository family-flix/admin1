/**
 * @file 根据路由判断是否可见的视图块
 */
// import qs from "qs";
// import { pathToRegexp } from "path-to-regexp";
// import parse from "url-parse";

import { BaseDomain, Handler } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
import { NavigatorCore, RouteAction } from "@/domains/navigator";
import { Result } from "@/types";

import { buildUrl } from "./utils";
import { query_stringify } from "@/utils";

enum Events {
  /** 子视图改变（数量 */
  ViewsChange,
  /** 当前展示的子视图改变 */
  CurViewChange,
  /** 有视图变为可见状态 */
  ViewShow,
  /** 视图加载好 */
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
  [Events.StateChange]: RouteViewCoreState;
  [Events.Match]: RouteViewCore;
  [Events.NotFound]: void;
};

type RouteViewCoreState = {
  /** 是否加载到页面上（如果有动画，在隐藏动画播放时该值仍为 true，在 animation end 后从视图上卸载后，该值被置为 false） */
  mounted: boolean;
  /** 是否可见，用于判断是「进入动画」还是「退出动画」 */
  visible: boolean;
  /** 被另一视图覆盖 */
  layered: boolean;
};
type RouteViewCoreProps = {
  /** 唯一标志 */
  name: string;
  pathname: string;
  title: string;
  // component: unknown;
  parent: RouteViewCore | null;
  query?: Record<string, string>;
  visible?: boolean;
  layers?: boolean;
  children?: RouteViewCore[];
  views?: RouteViewCore[];

  // destroyAfterHide?: boolean;
};

export class RouteViewCore extends BaseDomain<TheTypesOfEvents> {
  _name = "ViewCore";
  debug = false;
  id = this.uid();

  /** 一些配置项 */
  name: string;
  pathname: string;
  title: string;
  /** 视图元素 */
  // component: unknown;
  // canLayer = false;
  // destroyAfterHide = false;

  /** 当前视图的 query */
  query: Record<string, string> = {};
  /** 当前视图的 params */
  params: Record<string, string> = {};
  visible = false;
  _showed = false;
  loaded = false;
  mounted = false;
  layered = false;

  parent: RouteViewCore | null;
  /** 当前子视图 */
  curView: RouteViewCore | null = null;
  /** 当前所有的子视图 */
  subViews: RouteViewCore[] = [];

  $presence = new PresenceCore();

  get state(): RouteViewCoreState {
    return {
      mounted: this.mounted,
      visible: this.visible,
      layered: this.layered,
    };
  }
  get href() {
    return [this.pathname, query_stringify(this.query)].filter(Boolean).join("?");
  }

  constructor(options: Partial<{ _name: string }> & RouteViewCoreProps) {
    super(options);
    const { name, pathname, title, query = {}, visible = false, parent = null, views = [] } = options;
    this.name = name;
    this.pathname = pathname;
    this.parent = parent;
    this.title = title;
    this._name = title;
    // this.component = component;
    this.subViews = views;
    // this.destroyAfterHide = destroyAfterHide;
    // console.log("[DOMAIN]route_view - constructor", title, { destroyAfterHide });
    if (views.length) {
      this.curView = views[0];
    }
    this.visible = visible;
    this.query = query;
    if (visible) {
      this.mounted = true;
    }
    for (let i = 0; i < views.length; i += 1) {
      const view = views[i];
      view.parent = this;
    }

    this.$presence.onStateChange((nextState) => {
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
      this.mounted = !!mounted;
      // if (this.state.mounted === false && mounted) {
      //   this.emit(Events.Mounted);
      // }
      // if (this.state.mounted && mounted === false) {
      //   this.emit(Events.Unmounted);
      // }
      this.emit(Events.StateChange, { ...this.state });
    });
    emitViewCreated(this);
  }

  // checkMatchRegexp(url: string) {
  //   const pathname = (() => {
  //     if (url.startsWith("http")) {
  //       return parse(url).pathname;
  //     }
  //     return url;
  //   })();
  //   console.log(pathname);
  //   if (pathname === this.key) {
  //     return true;
  //   }
  //   return false;
  // }
  setViews(
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
  }
  appendView(view: RouteViewCore) {
    view.parent = this;
    if (this.subViews.length === 0 && view.visible) {
      this.curView = view;
    }
    if (!this.subViews.includes(view)) {
      this.subViews.push(view);
    }
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  replaceViews(views: RouteViewCore[]) {
    this.subViews = views;
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  /** 移除（卸载）一个子视图 */
  removeView(view: RouteViewCore, callback?: Function) {
    // console.log("[DOMAIN]route_view - removeView", this.title, view.title);
    if (!this.subViews.includes(view)) {
      return;
    }
    view.onHidden(() => {
      // console.log("[DOMAIN]route_view - removeView handle view hidden", this.title, view.title);
      view.setUnmounted();
      view.destroy();
      this.subViews = this.subViews.filter((v) => v !== view);
      if (callback) {
        callback();
      }
      this.emit(Events.ViewsChange, [...this.subViews]);
    });
    view.hide();
    this.emit(Events.ViewsChange, [...this.subViews]);
  }
  findCurView(): RouteViewCore | null {
    if (!this.curView) {
      return this;
    }
    return this.curView.findCurView();
  }
  buildUrl(query: Record<string, string | number>) {
    const url = buildUrl(this.pathname, this.params, query);
    return url;
  }
  buildUrlWithPrefix(query: Record<string, string | number>) {
    const url = buildUrl(this.pathname, this.params, query);
    return NavigatorCore.prefix + url;
  }
  ready() {
    this.emit(Events.Ready);
  }
  /** 让自身的一个子视图变为可见 */
  showView(subView: RouteViewCore) {
    // console.log("[DOMAIN]route_view - showSubView", subView.title, this.curView?.title);
    if (subView === this) {
      return;
    }
    if (subView.visible) {
      return;
    }
    (() => {
      if (!this.visible) {
        // 如果自身是不可见状态，先让自身的父视图将自己 show
        // console.log("[DOMAIN]route_view - show self by parent", this.title, this.parent?.title);
        if (!this.parent) {
          // console.log("no parent");
          return;
        }
        this.parent.showView(this);
      }
    })();
    if (this.curView) {
      this.curView.hide();
    }
    this.appendView(subView);
    this.curView = subView;
    this.curView.show();
    this.emit(Events.CurViewChange, this.curView);
  }
  /** 主动展示视图 */
  show() {
    // console.log("[ROUTE_VIEW]show", this._name, this.state.visible);
    if (this.visible) {
      // 为了让 presence 内部 hide 时判断 mounted 为 true
      this.$presence.state.mounted = true;
      return;
    }
    this.$presence.show();
  }
  /** 主动隐藏视图 */
  hide() {
    // console.log("[ROUTE_VIEW]hide", this._name, this.state.visible);
    if (this.visible === false) {
      return;
    }
    for (let i = 0; i < this.subViews.length; i += 1) {
      const view = this.subViews[i];
      view.hide();
    }
    this.$presence.hide();
  }
  /** 视图在页面上展示（变为可见） */
  showed() {
    // console.log("[ROUTE_VIEW]showed", this._name, this._showed);
    if (this._showed) {
      return;
    }
    this._showed = true;
    // console.log("[ROUTE_VIEW]emit showed", this._name);
    this.emit(Events.Show);
  }
  /** 视图在页面上隐藏（变为不可见） */
  hidden() {
    this._showed = false;
    this.emit(Events.Hidden);
  }
  mount() {
    this.setMounted();
  }
  /** 卸载自身 */
  unmount() {
    // console.log("[DOMAIN]route_view - unmount", this.title);
    // this.onHidden(() => {
    //   this.destroy();
    //   this.setUnmounted();
    // });
    // this.hide();
  }
  /** 视图被装载到页面 */
  setMounted() {
    if (this.mounted) {
      return;
    }
    this.mounted = true;
    this.emit(Events.Mounted);
  }
  /** 视图从页面被卸载 */
  setUnmounted() {
    this.mounted = false;
    this.emit(Events.Unmounted);
  }
  /** 页面组件已加载 */
  setLoaded() {
    this.loaded = true;
  }
  /** 页面组件未加载 */
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
  onMatched(handler: Handler<TheTypesOfEvents[Events.Match]>) {
    return this.on(Events.Match, handler);
  }
  onNotFound(handler: Handler<TheTypesOfEvents[Events.NotFound]>) {
    return this.on(Events.NotFound, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
// type ParamConfigure = {
//   name: string;
//   prefix: string;
//   suffix: string;
//   pattern: string;
//   modifier: string;
// };
// function buildParams(opt: { regexp: RegExp; targetPath: string; keys: ParamConfigure[] }) {
//   const { regexp, keys, targetPath } = opt;
//   const match = regexp.exec(targetPath);
//   if (match) {
//     const params: Record<string, string> = {};
//     for (let i = 1; i < match.length; i++) {
//       params[keys[i - 1].name] = match[i];
//     }
//     return params;
//   }
//   return {};
// }
// function buildQuery(path: string) {
//   const [, search] = path.split("?");
//   if (!search) {
//     return {} as Record<string, string>;
//   }
//   return qs.parse(search) as Record<string, string>;
// }

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
