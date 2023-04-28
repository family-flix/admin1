/**
 * @file 应用实例
 * 应该在这里进行一些初始化操作
 */
import Helper from "@list-helper/core/core";
import { Application } from "@/domains/app";
import { LocalCache } from "@/domains/app/cache";
import { ViewCore } from "@/domains/router";
import { UserCore } from "@/domains/user";
import { Result } from "@/types";

const cache = new LocalCache();
const router = new ViewCore();
const user = new UserCore(cache.get("user"));

export const app = new Application({
  user,
  router,
  cache,
  async beforeReady() {
    Helper.onError = (error: Error) => {
      app.emitTip({
        text: error.message,
      });
    };
    user.onError((error) => {
      app.emitTip({
        text: error.message,
      });
    });
    user.onLogin((profile) => {
      cache.set("user", profile);
    });
    // cache.init(JSON.parse(localStorage.getItem("global") || "{}"));
    // const videoSettings = JSON.parse(
    //   localStorage.getItem("video_settings") || "null"
    // );
    // if (videoSettings) {
    //   cache.set("video_settings", videoSettings);
    //   localStorage.removeItem("video_settings");
    // }
    if (!user.isLogin) {
      router.replace("/login");
      return Result.Ok(null);
    }
    return Result.Ok(null);
  },
});

Helper.defaultProcessor = (originalResponse) => {
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
