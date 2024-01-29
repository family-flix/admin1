import { BaseDomain, Handler } from "@/domains/base";
import { RouteViewCore } from "@/domains/route_view";
import { NavigatorCore } from "@/domains/navigator";
import { PathnameKey, RouteConfig } from "@/types";
import { query_stringify } from "@/utils";

enum Events {
  TopViewChange,
  HrefChange,
  ClickLink,
  StateChange,
}
type TheTypesOfEvents = {
  [Events.TopViewChange]: RouteViewCore;
  [Events.ClickLink]: {
    href: string;
    target: string | null;
  };
  [Events.HrefChange]: {
    href: string;
    pathname: string;
    query: Record<string, string>;
  };
  [Events.StateChange]: HistoryCoreState;
};

type HistoryCoreProps = {
  view: RouteViewCore;
  router: NavigatorCore;
  routes: Record<PathnameKey, RouteConfig>;
  views: Record<PathnameKey, RouteViewCore>;
};
type HistoryCoreState = {
  href: string;
  stacks: {
    id: string;
    key: string;
    title: string;
    visible: boolean;
    query: string;
  }[];
  cursor: number;
};

export class HistoryCore extends BaseDomain<TheTypesOfEvents> {
  /** 路由配置 */
  routes: Record<PathnameKey, RouteConfig>;
  /** 加载的所有视图 */
  views: Record<PathnameKey, RouteViewCore> = {};
  /** 按顺序依次 push 的视图 */
  stacks: RouteViewCore[] = [];
  /** 栈指针 */
  cursor: number = -1;

  /** 浏览器 url 管理 */
  $router: NavigatorCore;
  /** 根视图 */
  $view: RouteViewCore;

  get state(): HistoryCoreState {
    return {
      href: this.$router.href,
      stacks: this.stacks.map((view) => {
        const { id, key, title, query, visible } = view;
        return {
          // id: String(id),
          id: [key, query_stringify(query)].filter(Boolean).join("?"),
          key,
          title,
          query: JSON.stringify(query, null, 2),
          visible,
        };
      }),
      cursor: this.cursor,
    };
  }

  constructor(props: Partial<{ _name: string }> & HistoryCoreProps) {
    super(props);

    const { view, router, routes, views = {} } = props;

    this.$view = view;
    this.$router = router;
    this.routes = routes;
    this.views = views;
  }

  // 详情页，如果在详情页，跳转到其他页，再回来，是希望能正确返回
  // 但是，如果在已经有一个详情页的情况下，再跳转到一个 href 不相同的详情页，是要将之前的销毁
  // 也不对，如果从 详情(数据A) 跳转 详情(数据B)，这时候从 详情(B) 返回，应该还能正确返回 详情(A)
  // 所以，究竟在什么时候，才需要销毁 详情(A)？
  // 其实都不应该销毁？因为你要支持返回到上一个，肯定不能销毁，那这样，如果进入过 n 个详情页，这 n 个都要保留？
  // 如果返回了，这时候可以销毁，其他时候都不销毁？
  // 所以还有 replace 的区别，replace 时，要销毁当前的，
  push(pathname: string, query: Record<string, string> = {}) {
    const uniqueKey = [pathname, query_stringify(query)].filter(Boolean).join("?");
    if (uniqueKey === this.$router.href) {
      console.log("[DOMAIN]history/index - push target url is", uniqueKey, "and cur href is", this.$router.href);
      return;
    }
    const view = this.views[uniqueKey];
    if (view) {
      this.findParent(view);
      view.query = query;
      if (!view.parent) {
        console.log("[DOMAIN]history/index - push 1");
        return;
      }
      this.$router.href = uniqueKey;
      const viewAfter = this.stacks.slice(this.cursor + 1);
      for (let i = 0; i < viewAfter.length; i += 1) {
        const v = viewAfter[i];
        v.parent?.removeView(v, () => {
          delete this.views[v.href];
        });
      }
      this.stacks = this.stacks.slice(0, this.cursor + 1).concat(view);
      this.cursor += 1;
      view.parent.showView(view);
      this.emit(Events.HrefChange, {
        href: uniqueKey,
        pathname: view.key,
        query: view.query,
      });
      this.emit(Events.TopViewChange, view);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    const route = (() => {
      const m = this.routes[pathname];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - push 2. no matched route");
      return null;
    }
    const created = new RouteViewCore({
      key: route.pathname,
      // destroyAfterHide: route.destroy,
      title: route.title,
      component: route.component,
      query,
      parent: null,
    });
    // created.onUnmounted(() => {
    //   this.stacks = this.stacks.filter((s) => s.key !== created.key);
    //   delete this.views[uniqueKey];
    // });
    this.views[uniqueKey] = created;
    this.findParent(created);
    if (!created.parent) {
      console.log("[DOMAIN]history/index - push 3. ");
      return;
    }
    this.$router.href = uniqueKey;
    // const viewsAfter = this.stacks.slice(this.cursor);
    // for (let i = 0; i < viewsAfter.length; i += 1) {
    //   const v = viewsAfter[i];
    //   v.hide();
    // }
    this.stacks = this.stacks.slice(0, this.cursor + 1).concat(created);
    this.cursor += 1;
    created.parent.showView(created);
    this.emit(Events.TopViewChange, created);
    this.emit(Events.HrefChange, {
      href: uniqueKey,
      pathname: created.key,
      query: created.query,
    });
    this.emit(Events.StateChange, { ...this.state });
  }
  replace(pathname: string, query: Record<string, string> = {}) {
    const uniqueKey = [pathname, query_stringify(query)].filter(Boolean).join("?");
    if (uniqueKey === this.$router.href) {
      console.log("[DOMAIN]history/index - replace target url is", uniqueKey, "and cur href is", this.$router.href);
      return;
    }
    const view = this.views[uniqueKey];
    if (view) {
      this.findParent(view);
      view.query = query;
      if (!view.parent) {
        console.log("[DOMAIN]history/index - replace 1");
        return;
      }
      this.$router.href = uniqueKey;
      const theViewNeedDestroy = this.stacks[this.stacks.length - 1];
      if (theViewNeedDestroy) {
        theViewNeedDestroy.parent?.removeView(theViewNeedDestroy);
      }
      this.stacks[this.stacks.length - 1] = view;
      // this.cursor = uniqueKey;
      view.parent.showView(view);
      this.emit(Events.HrefChange, {
        href: uniqueKey,
        pathname: view.key,
        query: view.query,
      });
      this.emit(Events.TopViewChange, view);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    const route = (() => {
      const m = this.routes[pathname];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - replace 2. no matched route");
      return null;
    }
    const created = new RouteViewCore({
      key: route.pathname,
      destroyAfterHide: route.destroy,
      title: route.title,
      component: route.component,
      query,
      parent: null,
    });
    this.views[uniqueKey] = created;
    this.findParent(created);
    if (!created.parent) {
      console.log("[DOMAIN]history/index - replace 3. ");
      return;
    }
    this.$router.href = uniqueKey;
    const theViewNeedDestroy = this.stacks[this.stacks.length - 1];
    if (theViewNeedDestroy) {
      theViewNeedDestroy.parent?.removeView(theViewNeedDestroy, () => {
        delete this.views[uniqueKey];
      });
    }
    this.stacks[this.stacks.length - 1] = created;
    created.parent.showView(created);
    this.emit(Events.HrefChange, {
      href: uniqueKey,
      pathname: created.key,
      query: created.query,
    });
    this.emit(Events.TopViewChange, created);
    this.emit(Events.StateChange, { ...this.state });
  }
  back() {
    const targetCursor = this.cursor - 1;
    const viewPrepareShow = this.stacks[targetCursor];
    // console.log("[DOMAIN]history - back", this.cursor, targetCursor, viewPrepareShow.title);
    const uniqueKey = [viewPrepareShow.key, query_stringify(viewPrepareShow.query)].filter(Boolean).join("?");
    if (!viewPrepareShow) {
      return;
    }
    if (!viewPrepareShow.parent) {
      return;
    }
    this.$router.href = uniqueKey;
    this.cursor = targetCursor;
    const viewsAfter = this.stacks.slice(targetCursor + 1);
    for (let i = 0; i < viewsAfter.length; i += 1) {
      const v = viewsAfter[i];
      v.parent?.removeView(v, () => {
        delete this.views[v.href];
      });
    }
    viewPrepareShow.parent.showView(viewPrepareShow);
    this.emit(Events.HrefChange, {
      href: uniqueKey,
      pathname: viewPrepareShow.key,
      query: viewPrepareShow.query,
    });
    this.emit(Events.TopViewChange, viewPrepareShow);
    this.emit(Events.StateChange, { ...this.state });
  }
  findParent(view: RouteViewCore) {
    const { key } = view;
    if (view.parent) {
      if (view.parent.key === "/") {
        return;
      }
      this.findParent(view.parent);
      return;
    }
    const route = this.routes[key];
    if (!route) {
      return;
    }
    const { parent_pathname } = route;
    if (this.views[parent_pathname]) {
      view.parent = this.views[parent_pathname];
      if (this.views[parent_pathname].key === "/") {
        return;
      }
      this.findParent(this.views[parent_pathname]);
      return;
    }
    const parent_route = this.routes[parent_pathname];
    if (!parent_route) {
      return null;
    }
    const created_parent = new RouteViewCore({
      key: parent_route.pathname,
      title: parent_route.title,
      component: parent_route.component,
      parent: null,
    });
    this.views[parent_route.pathname] = created_parent;
    view.parent = created_parent;
    this.findParent(created_parent);
  }
  /** 根据「页面Key」找到对应路由 */
  findRoute(pathname: PathnameKey) {
    const matched = this.routes[pathname];
    if (!matched) {
      return null;
    }
    return {
      key: matched.pathname,
      title: matched.title,
      component: matched.component,
      destroyAfterHide: matched.destroy,
      parent_pathname: matched.parent_pathname,
    };
  }

  handleClickLink(params: { href: string; target: null | string }) {}

  onTopViewChange(handler: Handler<TheTypesOfEvents[Events.TopViewChange]>) {
    return this.on(Events.TopViewChange, handler);
  }
  onHrefChange(handler: Handler<TheTypesOfEvents[Events.HrefChange]>) {
    return this.on(Events.HrefChange, handler);
  }
  onClickLink(handler: Handler<TheTypesOfEvents[Events.ClickLink]>) {
    return this.on(Events.ClickLink, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
