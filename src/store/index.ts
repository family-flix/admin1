/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作、全局状态或变量的声明
 */
import { hasAdmin } from "@/services/index";
import { media_request } from "@/biz/requests";
import { ListCore } from "@/domains/list/index";
import { ImageCore } from "@/domains/ui/index";
import { Application } from "@/domains/app/index";
import { NavigatorCore } from "@/domains/navigator/index";
import { BizError } from "@/domains/error/index";
import { RouteViewCore } from "@/domains/route_view";
import { RouteConfig } from "@/domains/route_view/utils";
import { HistoryCore } from "@/domains/history/index";
import { UserCore } from "@/biz/user/index";
import { RequestCore, onRequestCreated } from "@/domains/request/index";
import { Result } from "@/domains/result/index";

import { PageKeys, routes, routesWithPathname } from "./routes";
import { client } from "./request";
import { storage } from "./storage";

onRequestCreated((ins) => {
  ins.onFailed((e) => {
    app.tip({
      text: [e.message],
    });
    if (e.code === 900) {
      history.push("root.login");
    }
  });
  if (!ins.client) {
    ins.client = client;
  }
});
if (window.location.hostname === "media-t.funzm.com") {
  media_request.setEnv("dev");
}
NavigatorCore.prefix = import.meta.env.BASE_URL;
ImageCore.prefix = window.location.origin;

class ExtendsUser extends UserCore {
  say() {
    console.log(`My name is ${this.username}`);
  }
}
const user = new ExtendsUser(storage.get("user"), client);
const router = new NavigatorCore({
  location: window.location,
});
const view = new RouteViewCore({
  name: "root",
  pathname: "/",
  title: "ROOT",
  visible: true,
  parent: null,
});
view.isRoot = true;
export const history = new HistoryCore<PageKeys, RouteConfig<PageKeys>>({
  view,
  router,
  routes,
  views: {
    root: view,
  } as Record<PageKeys, RouteViewCore>,
});
export const app = new Application({
  user,
  storage,
  async beforeReady() {
    const { pathname, query } = history.$router;
    const route = routesWithPathname[pathname];
    console.log("[ROOT]onMount", pathname, route, app.$user.isLogin);
    if (!route) {
      history.push("root.notfound");
      return Result.Ok(null);
    }
    if (!app.$user.isLogin) {
      if (route.options?.require?.includes("login")) {
        app.tip({
          text: ["请先登录"],
        });
        history.push("root.login", { redirect: route.pathname });
        return Result.Ok(null);
      }
    }
    client.appendHeaders({
      Authorization: app.$user.token,
    });
    if (!history.isLayout(route.name)) {
      history.push(route.name, query, { ignore: true });
      return Result.Ok(null);
    }
    history.push("root.home_layout.index");
    return Result.Ok(null);
  },
});
user.onTip((msg) => {
  app.tip(msg);
});
user.onLogin((profile) => {
  storage.set("user", profile);
  media_request.appendHeaders({
    Authorization: user.token,
  });
  history.push("root.home_layout.index");
});
user.onLogout(() => {
  storage.clear("user");
  history.push("root.login");
});
user.onExpired(() => {
  storage.clear("user");
  app.tip({
    text: ["token 已过期，请重新登录"],
  });
  history.push("root.login");
});

ListCore.commonProcessor = <T>(
  originalResponse: any
): {
  dataSource: T[];
  page: number;
  pageSize: number;
  total: number;
  empty: boolean;
  noMore: boolean;
  error: BizError | null;
} => {
  if (originalResponse === null) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      empty: false,
      error: null,
    };
  }
  try {
    const data = originalResponse.data || originalResponse;
    const { list, page, page_size, total, noMore, no_more, next_marker } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      empty: false,
      noMore: false,
      error: null,
      next_marker,
    };
    if (total <= page_size * page) {
      result.noMore = true;
    }
    if (no_more !== undefined) {
      result.noMore = no_more;
    }
    if (noMore !== undefined) {
      result.noMore = noMore;
    }
    if (next_marker === null) {
      result.noMore = true;
    }
    if (list.length === 0 && page === 1) {
      result.empty = true;
    }
    if (list.length === 0) {
      result.noMore = true;
    }
    return result;
  } catch (error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      empty: false,
      error: new BizError(`${(error as Error).message}`),
      // next_marker: "",
    };
  }
};
