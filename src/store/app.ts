/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作、全局状态或变量的声明
 */
import { ListCore } from "@/domains/list";
import { Application } from "@/domains/app";
import { LocalCache } from "@/domains/app/cache";
import { UserCore } from "@/domains/user";
import { NavigatorCore } from "@/domains/navigator";
import { Result } from "@/types";
import { has_admin } from "@/services";

NavigatorCore.prefix = "/admin";

const cache = new LocalCache();
const router = new NavigatorCore();
const user = new UserCore(cache.get("user"));
user.onTip((msg) => {
  app.tip(msg);
});
user.onLogin((profile) => {
  cache.set("user", profile);
  router.push("/home/index");
});
user.onLogout(() => {
  cache.clear("user");
  router.push("/login");
});
user.onExpired(() => {
  cache.clear("user");
  router.replace("/login");
});

export const app = new Application({
  user,
  router,
  cache,
  async beforeReady() {
    if (!user.isLogin) {
      const r = await has_admin();
      if (r.error) {
        return Result.Ok(null);
      }
      const { existing } = r.data;
      if (!existing) {
        user.needRegister = true;
      }
    }
    return Result.Ok(null);
  },
});
app.onClickLink(({ href }) => {
  router.push(href);
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
  error: Error | null;
} => {
  try {
    const data = originalResponse.data || originalResponse;
    const { list, page, page_size, total, no_more } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      empty: false,
      noMore: false,
      error: null,
    };
    if (total <= page_size * page) {
      result.noMore = true;
    }
    if (no_more !== undefined) {
      result.noMore = no_more;
    }
    if (list.length === 0 && page >= 1) {
      result.empty = true;
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
      error: new Error(`${(error as Error).message}`),
    };
  }
};
