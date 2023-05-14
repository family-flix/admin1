/**
 * @file 应用实例，也可以看作启动入口，优先会执行这里的代码
 * 应该在这里进行一些初始化操作、全局状态或变量的声明
 */
import { ListCore } from "@/domains/list";
import { Application } from "@/domains/app";
import { LocalCache } from "@/domains/app/cache";
import { ViewCore } from "@/domains/router";
import { UserCore } from "@/domains/user";
import { NavigatorCore } from "@/domains/navigator";
import { Drive } from "@/domains/drive";
import { bind } from "@/domains/app/bind.web";
import { Result } from "@/types";

// class CurUser extends UserCore {
//   /** 该用户的网盘列表 */
//   drives: Drive[];

//   constructor(props) {
//     super(props);
//   }

//   async fetchDrives() {
//     const r = await Drive.ListHelper.init();
//     if (r.error) {
//       this.emit(UserCore.Events.Error, r.error);
//       return;
//     }
//     this.drives = r.data;
//   }
// }

const cache = new LocalCache();
const router = new NavigatorCore();
const user = new UserCore(cache.get("user"));

const _app = new Application({
  user,
  router,
  cache,
  async beforeReady() {
    // ListCore.onError = (error: Error) => {
    //   app.tip({
    //     text: [error.message],
    //   });
    // };
    user.onError((error) => {
      app.tip({
        text: [error.message],
      });
    });
    user.onLogin((profile) => {
      cache.set("user", profile);
    });
    if (!user.isLogin) {
      // router.replace("/login");
      return Result.Ok(null);
    }
    return Result.Ok(null);
  },
});

ListCore.commonProcessor = (originalResponse) => {
  if (originalResponse.error) {
    return {
      dataSource: [],
      page: 1,
      pageSize: 20,
      total: 0,
      noMore: false,
      error: new Error(`${originalResponse.error.message}`),
    };
  }
  try {
    const data = originalResponse.data || originalResponse;
    const { list, page, page_size, total, no_more } = data;
    const result = {
      dataSource: list,
      page,
      pageSize: page_size,
      total,
      noMore: false,
    };
    if (total <= page_size * page) {
      result.noMore = true;
    }
    if (no_more !== undefined) {
      result.noMore = no_more;
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
bind(_app);
export const app = _app;
