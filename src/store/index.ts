/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作、全局状态或变量的声明
 */
import { has_admin } from "@/services";
import { ListCore } from "@/domains/list";
import { Application } from "@/domains/app";
import { NavigatorCore } from "@/domains/navigator";
import { BizError } from "@/domains/error";
import { RouteViewCore } from "@/domains/route_view";
import { HistoryCore } from "@/domains/history";
import { UserCore } from "@/domains/user";
import { Result } from "@/types";

import { PageKeys, RouteConfig, routes } from "./routes";
import { storage } from "./storage";

NavigatorCore.prefix = "/admin";

const user = new UserCore(storage.get("user"));
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
export const history = new HistoryCore<PageKeys, RouteConfig>({
  view,
  router,
  routes,
  views: {
    root: view,
  } as Record<PageKeys, RouteViewCore>,
});
export const app = new Application({
  user,
  async beforeReady() {
    if (!user.isLogin) {
      const r = await has_admin();
      if (r.error) {
        return Result.Ok(null);
      }
      const { existing } = r.data;
      if (!existing) {
        // history.push(registerPage);
        user.needRegister = true;
        history.push("root.register");
        return Result.Ok(null);
      }
      // app.showView(loginPage);
      // @todo 如果目标是 /login，就不用 check is login
      // history.push("root.login");
      return Result.Ok(null);
    }
    await app.$user.validate();
    return Result.Ok(null);
  },
});
user.onTip((msg) => {
  app.tip(msg);
});
user.onLogin((profile) => {
  storage.set("user", profile);
  // app.showView(homeIndexPage);
  // homeLayout.showSubView(homeIndexPage);
  // rootView.showSubView(homeLayout);
  // router.push("/home/index");
  history.push("root.home_layout.index");
});
user.onLogout(() => {
  storage.clear("user");
  // app.showView(loginPage);
  history.push("root.login");
});
user.onExpired(() => {
  storage.clear("user");
  app.tip({
    text: ["token 已过期，请重新登录"],
  });
  // app.showView(loginPage);
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
