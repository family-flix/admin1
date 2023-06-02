/**
 * @file 根据路由判断是否可见的视图块
 */
import qs from "qs";
import { Handler } from "mitt";
import { pathToRegexp } from "path-to-regexp";

import { BaseDomain } from "@/domains/base";
import { PresenceCore } from "@/domains/ui/presence";
import { RouteAction } from "@/domains/navigator";

enum Events {
  /** 子视图改变（数量 */
  ViewsChange,
  /** 当前展示的子视图改变 */
  CurViewChange,
  /** 当前视图载入页面 */
  Mounted,
  /** 当前视图可见，稍晚于 Mounted 事件 */
  Show,
  /** 当前视图隐藏 */
  Hidden,
  /** 当前视图从页面卸载 */
  Unmounted,
  Start,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.ViewsChange]: RouteViewCore[];
  [Events.CurViewChange]: RouteViewCore;
  [Events.Mounted]: void;
  [Events.Show]: void;
  [Events.Hidden]: void;
  [Events.Unmounted]: void;
  [Events.Start]: { pathname: string };
  [Events.StateChange]: RouteViewState;
};

type RouteViewState = {
  /** 是否加载到页面上（如果有动画，在隐藏动画播放时该值仍为 true，在 animation end 后从视图上卸载后，该值被置为 false） */
  mounted: boolean;
  /** 是否可见，用于判断是「进入动画」还是「退出动画」 */
  visible: boolean;
};
type RouteViewProps = {
  prefix: string;
  title: string;
  component: unknown;
};

export class RouteViewCore extends BaseDomain<TheTypesOfEvents> {
  name = "ViewCore";
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
  curView: RouteViewCore;
  /** 浏览器返回后，被销毁的那个栈 */
  destroyStacksWhenBack: RouteViewCore[] = [];
  /** 当前 pathname */
  pathname: string;
  /** 当前路由的 query */
  query: Record<string, string> = {};
  /** 当前路由的 params */
  params: Record<string, string> = {};
  /** 当前访问地址 */
  url: string;
  component: unknown;
  presence = new PresenceCore();

  state: RouteViewState = {
    mounted: true,
    visible: true,
  };

  constructor(options: Partial<{ name: string } & RouteViewProps> = {}) {
    super(options);

    const { prefix = null, title, component } = options;
    // name 是为了调试用
    this.name = title;
    this.prefix = prefix;
    this.title = title;
    this.component = component;
    this.configs = [];

    this.presence.onStateChange((nextState) => {
      const { open, mounted } = nextState;
      if (this.state.visible === false && open) {
        this.emit(Events.Show);
      }
      if (this.state.visible && open === false) {
        this.emit(Events.Hidden);
      }
      if (this.state.mounted === false && mounted) {
        this.emit(Events.Mounted);
      }
      if (this.state.mounted && mounted === false) {
        this.emit(Events.Unmounted);
      }
      this.state.visible = open;
      this.state.mounted = !!mounted;
      this.emit(Events.StateChange, { ...this.state });
    });
  }

  /** 判断给定的 pathname 是否有匹配的内容 */
  async checkMatch({ pathname, type }: { pathname: string; type: RouteAction }) {
    this.log("checkMatch - ", this.title, pathname, this.configs, this.subViews);
    if (this.configs.length === 0) {
      this.log("checkMatch", this.title, "do not have configs");
      // this.tip({ text: ["没有配置路由"] });
      return;
    }
    if (!pathname) {
      this.error("unexpected pathname", pathname);
      this.tip({ text: ["请传入 pathname"] });
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
      this.tip({ text: [targetPathname, "没有找到匹配的路由"] });
      return;
    }
    const { regexp, keys, config } = matchedRoute;
    // 运行时获取 view
    const v = await config();
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
    });
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
    this.curView = subView;
    this.emit(Events.CurViewChange, subView);
    const cloneViews = this.subViews;
    // 已经在 / layout，当路由改变时，仍然响应，并且查找到了 / layout，就可能重复添加，这里做个判断，避免了重复添加
    // this.log("setSubViews -", this.title, "check", subView.title, "existing", existing);

    const nextSubViews = (() => {
      const existing = this.subViews.includes(subView);
      if (existing) {
        return cloneViews;
      }
      if (type === "initialize") {
        return cloneViews.concat(subView);
      }
      if (type === "push") {
        return cloneViews.concat(subView);
      }
      if (type === "replace") {
        return cloneViews.slice(0, cloneViews.length - 1).concat(subView);
      }
      if (type === "forward") {
        return cloneViews.concat(subView);
      }
      if (type === "back") {
        return cloneViews.slice(0, cloneViews.length - 1);
      }
      return cloneViews;
    })();
    subView.query = query;
    subView.params = params;
    this.log("next sub views", nextSubViews);
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
      v.hide();
    }
    // @todo 判断 query 是否改变，触发特定事件
    subView.checkMatch({ pathname, type });
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
  show() {
    if (this.state.visible) {
      return;
    }
    this.presence.show();
  }
  hide() {
    if (this.state.visible === false) {
      return;
    }
    this.presence.hide();
  }

  onStart(handler: Handler<TheTypesOfEvents[Events.Start]>) {
    this.on(Events.Start, handler);
  }
  onShow(handler: Handler<TheTypesOfEvents[Events.Show]>) {
    this.on(Events.Show, handler);
  }
  onHide(handler: Handler<TheTypesOfEvents[Events.Hidden]>) {
    this.on(Events.Hidden, handler);
  }
  onUnmounted(handler: Handler<TheTypesOfEvents[Events.Unmounted]>) {
    this.on(Events.Unmounted, handler);
  }
  onSubViewsChange(handler: Handler<TheTypesOfEvents[Events.ViewsChange]>) {
    this.on(Events.ViewsChange, handler);
  }
  onCurViewChange(handler: Handler<TheTypesOfEvents[Events.CurViewChange]>) {
    this.on(Events.CurViewChange, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    this.on(Events.StateChange, handler);
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
