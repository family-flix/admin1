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
    name: string;
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

export class HistoryCore<K extends string> extends BaseDomain<TheTypesOfEvents> {
  /** 路由配置 */
  routes: Record<string, RouteConfig>;
  /** 加载的所有视图 */
  views: Record<string, RouteViewCore> = {};
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
        const { id, pathname: key, title, query, visible } = view;
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
  push(name: K, query: Record<string, string> = {}) {
    const uniqueKey = [name, query_stringify(query)].filter(Boolean).join("?");
    if (uniqueKey === this.$router.href) {
      console.log("[DOMAIN]history/index - push target url is", uniqueKey, "and cur href is", this.$router.href);
      return;
    }
    const view = this.views[uniqueKey];
    if (view) {
      this.ensureParent(view);
      view.query = query;
      if (!view.parent) {
        console.log("[DOMAIN]history/index - push 1");
        return;
      }
      this.$router.href = view.href;
      this.$router.name = view.name;
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
        name,
        href: uniqueKey,
        pathname: view.pathname,
        query: view.query,
      });
      this.emit(Events.TopViewChange, view);
      this.emit(Events.StateChange, { ...this.state });
      return;
    }
    const route = (() => {
      const m = this.routes[name];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - push 2. no matched route", name);
      return null;
    }
    const created = new RouteViewCore({
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      parent: null,
    });
    // created.onUnmounted(() => {
    //   this.stacks = this.stacks.filter((s) => s.key !== created.key);
    //   delete this.views[uniqueKey];
    // });
    this.views[uniqueKey] = created;
    this.ensureParent(created);
    if (!created.parent) {
      console.log("[DOMAIN]history/index - push 3. ", route.name);
      return;
    }
    this.$router.href = created.href;
    this.$router.name = created.name;
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
      name,
      href: uniqueKey,
      pathname: created.pathname,
      query: created.query,
    });
    this.emit(Events.StateChange, { ...this.state });
  }
  replace(pathname: K, query: Record<string, string> = {}) {
    const uniqueKey = [pathname, query_stringify(query)].filter(Boolean).join("?");
    if (uniqueKey === this.$router.href) {
      console.log("[DOMAIN]history/index - replace target url is", uniqueKey, "and cur href is", this.$router.href);
      return;
    }
    const view = this.views[uniqueKey];
    if (view) {
      this.ensureParent(view);
      view.query = query;
      if (!view.parent) {
        console.log("[DOMAIN]history/index - replace 1");
        return;
      }
      this.$router.href = view.href;
      this.$router.name = view.name;
      const theViewNeedDestroy = this.stacks[this.stacks.length - 1];
      if (theViewNeedDestroy) {
        theViewNeedDestroy.parent?.removeView(theViewNeedDestroy);
      }
      this.stacks[this.stacks.length - 1] = view;
      // this.cursor = uniqueKey;
      view.parent.showView(view);
      this.emit(Events.HrefChange, {
        name: view.name,
        href: uniqueKey,
        pathname: view.pathname,
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
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      parent: null,
    });
    this.views[uniqueKey] = created;
    this.ensureParent(created);
    if (!created.parent) {
      console.log("[DOMAIN]history/index - replace 3. ");
      return;
    }
    this.$router.href = created.href;
    this.$router.name = created.name;
    const theViewNeedDestroy = this.stacks[this.stacks.length - 1];
    if (theViewNeedDestroy) {
      theViewNeedDestroy.parent?.removeView(theViewNeedDestroy, () => {
        delete this.views[uniqueKey];
      });
    }
    this.stacks[this.stacks.length - 1] = created;
    created.parent.showView(created);
    this.emit(Events.HrefChange, {
      name: created.name,
      href: uniqueKey,
      pathname: created.pathname,
      query: created.query,
    });
    this.emit(Events.TopViewChange, created);
    this.emit(Events.StateChange, { ...this.state });
  }
  back() {
    const targetCursor = this.cursor - 1;
    const viewPrepareShow = this.stacks[targetCursor];
    // console.log("[DOMAIN]history - back", this.cursor, targetCursor, viewPrepareShow.title);
    const href = viewPrepareShow.href;
    if (!viewPrepareShow) {
      return;
    }
    if (!viewPrepareShow.parent) {
      return;
    }
    this.$router.href = href;
    this.$router.name = viewPrepareShow.name;
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
      name: viewPrepareShow.name,
      href: href,
      pathname: viewPrepareShow.pathname,
      query: viewPrepareShow.query,
    });
    this.emit(Events.TopViewChange, viewPrepareShow);
    this.emit(Events.StateChange, { ...this.state });
  }
  ensureParent(view: RouteViewCore) {
    const { name } = view;
    if (view.parent) {
      if (view.parent.name === "root") {
        return;
      }
      this.ensureParent(view.parent);
      return;
    }
    const route = this.routes[name];
    if (!route) {
      return;
    }
    const { parent } = route;
    if (this.views[parent.name]) {
      view.parent = this.views[parent.name];
      if (parent.name === "root") {
        return;
      }
      this.ensureParent(this.views[parent.name]);
      return;
    }
    const parent_route = this.routes[parent.name];
    if (!parent_route) {
      return null;
    }
    const created_parent = new RouteViewCore({
      name: parent_route.name,
      pathname: parent_route.pathname,
      title: parent_route.title,
      parent: null,
    });
    this.views[parent_route.name] = created_parent;
    view.parent = created_parent;
    this.ensureParent(created_parent);
  }
  buildURL(name: K, query: Record<string, string> = {}) {
    const route = (() => {
      const m = this.routes[name];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - push 2. no matched route", name);
      return this.routes["root.notfound"]!.pathname as string;
    }
    const created = new RouteViewCore({
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      parent: null,
    });
    return created.buildUrl(query);
  }
  buildURLWithPrefix(name: K, query: Record<string, string> = {}) {
    const route = (() => {
      const m = this.routes[name];
      if (!m) {
        return null;
      }
      return m;
    })();
    if (!route) {
      console.log("[DOMAIN]history/index - push 2. no matched route", name);
      return this.routes["root.notfound"]!.pathname as string;
    }
    const created = new RouteViewCore({
      name: route.name,
      pathname: route.pathname,
      title: route.title,
      query,
      parent: null,
    });
    return created.buildUrlWithPrefix(query);
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
