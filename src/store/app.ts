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

const cache = new LocalCache();
const router = new NavigatorCore();
const user = new UserCore(cache.get("user"));
user.onTip((msg) => {
  app.tip(msg);
});
user.onLogin((profile) => {
  cache.set("user", profile);
  // @todo 应该记住 redirect
  router.push("/home");
});
user.onExpired(() => {
  cache.clear("user");
  router.replace("/auth/login");
});

export const app = new Application({
  user,
  router,
  cache,
  async beforeReady() {
    return Result.Ok(null);
  },
});

// @ts-ignore
ListCore.commonProcessor = (originalResponse) => {
  if (originalResponse.error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      empty: false,
      error: new Error(`${(originalResponse.error as unknown as Error).message}`),
    };
  }
  try {
    const data = originalResponse.data || originalResponse;
    // @ts-ignore
    const { list, page, page_size, total, no_more } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      empty: false,
      noMore: false,
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
      error: new Error(`${(error as Error).message}`),
    };
  }
};
