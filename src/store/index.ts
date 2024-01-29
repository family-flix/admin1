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
import { HttpClientCore } from "@/domains/http_client";
import { Result } from "@/types";

import { routes } from "./routes";
import { cache } from "./cache";
import { user } from "./user";

NavigatorCore.prefix = "/admin";

const router = new NavigatorCore();
const view = new RouteViewCore({
  key: "/",
  title: "ROOT",
  component: "div",
  visible: true,
  parent: null,
});
const history = new HistoryCore({
  view,
  router,
  routes,
  views: {
    "/": view,
  },
});
export const app = new Application({
  user: user,
  history,
  async beforeReady() {
    if (!user.isLogin) {
      const r = await has_admin();
      if (r.error) {
        return Result.Ok(null);
      }
      const { existing } = r.data;
      if (!existing) {
        // app.push(registerPage);
        user.needRegister = true;
        return Result.Ok(null);
      }
      // app.showView(loginPage);
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
  cache.set("user", profile);
  // app.showView(homeIndexPage);
  // homeLayout.showSubView(homeIndexPage);
  // rootView.showSubView(homeLayout);
  // router.push("/home/index");
  app.push("/home/index");
});
user.onLogout(() => {
  cache.clear("user");
  // app.showView(loginPage);
  app.push("/login");
});
user.onExpired(() => {
  cache.clear("user");
  app.tip({
    text: ["token 已过期，请重新登录"],
  });
  // app.showView(loginPage);
  app.push("/login");
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
