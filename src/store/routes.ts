/**
 * @file 路由配置
 */
// import { RouteViewCore, onViewCreated } from "@/domains/route_view";

import { PathnameKey, RouteConfig } from "@/types/index";

type OriginalRouteConfigure = Record<
  PathnameKey,
  {
    title: string;
    pathname: string;
    children: OriginalRouteConfigure;
  }
>;
function apply(
  configure: OriginalRouteConfigure,
  parent: {
    pathname: PathnameKey;
    name: string;
  }
): RouteConfig[] {
  const routes = Object.keys(configure).map((key) => {
    const config = configure[key];
    const { title, pathname, children } = config;
    // 一个 hack 操作，过滤掉 root
    const name = [parent.name, key].filter(Boolean).join(".");
    if (children) {
      const subRoutes = apply(children, {
        name,
        pathname,
      });
      return [
        {
          title,
          name,
          pathname,
          parent: {
            name: parent.name,
          },
        },
        ...subRoutes,
      ];
    }
    return [
      {
        title,
        name,
        pathname,
        parent: {
          name: parent.name,
        },
      },
    ];
  });
  return routes.reduce((a, b) => {
    return a.concat(b);
  }, []);
}
const configure = {
  root: {
    title: "ROOT",
    pathname: "/",
    children: {
      home_layout: {
        title: "首页布局",
        pathname: "/home",
        children: {
          index: {
            title: "首页",
            pathname: "/home/index",
            children: {},
          },
          drive_list: {
            title: "云盘列表",
            pathname: "/home/drive",
            children: {},
          },
          drive_profile: {
            title: "云盘详情",
            pathname: "/home/drive_profile",
            children: {},
          },
          season_list: {
            title: "电视剧列表",
            pathname: "/home/season",
            children: {},
          },
          season_profile: {
            title: "电视剧详情",
            pathname: "/home/season_profile",
            children: {},
          },
          movie_list: {
            title: "电影列表",
            pathname: "/home/movie",
            children: {},
          },
          movie_profile: {
            title: "电影详情",
            pathname: "/home/movie_profile",
            children: {},
          },
          invalid_media_list: {
            title: "影视剧待处理问题",
            pathname: "/home/invalid_media",
            children: {},
          },
          person_list: {
            title: "参演人员列表",
            pathname: "/home/person",
            children: {},
          },
          job_list: {
            title: "日志",
            pathname: "/home/log",
            children: {},
          },
          job_profile: {
            title: "日志详情",
            pathname: "/home/log_profile",
            children: {},
          },
          member_list: {
            title: "成员列表",
            pathname: "/home/member",
            children: {},
          },
          parse_result_layout: {
            title: "解析结果",
            pathname: "/home/unknown_media",
            children: {
              season: {
                title: "电视剧解析结果",
                pathname: "/home/unknown_media/season",
                children: {},
              },
              episode: {
                title: "剧集解析结果",
                pathname: "/home/unknown_media/episode",
                children: {},
              },
              movie: {
                title: "电影解析结果",
                pathname: "/home/unknown_media/movie",
                children: {},
              },
            },
          },
          permission: {
            title: "权限列表",
            pathname: "/home/permission",
            children: {},
          },
          resource_sync: {
            title: "同步任务列表",
            pathname: "/home/resource_sync",
            children: {},
          },
          subtitles_list: {
            title: "字幕列表",
            pathname: "/home/subtitles",
            children: {},
          },
          subtitles_create: {
            title: "字幕上传",
            pathname: "/home/subtitles/create",
            children: {},
          },
          collection_list: {
            title: "集合列表",
            pathname: "/home/collection",
            children: {},
          },
          collection_create: {
            title: "集合创建",
            pathname: "/home/collection/create",
            children: {},
          },
          collection_edit: {
            title: "集合编辑",
            pathname: "/home/collection/edit",
            children: {},
          },
          report_list: {
            title: "问题列表",
            pathname: "/home/report",
            children: {},
          },
          transfer: {
            title: "文件转存",
            pathname: "/home/transfer",
            children: {},
          },
          transfer_search_list: {
            title: "资源查询历史",
            pathname: "/home/transfer/search",
            children: {},
          },
          transfer_history_list: {
            title: "资源转存历史",
            pathname: "/home/transfer/history",
            children: {},
          },
        },
      },
      archive: {
        title: "电视剧归档",
        pathname: "/home/archive",
        children: {},
      },
      preview: {
        title: "预览",
        pathname: "/home/preview",
        children: {},
      },
      media_profile_layout: {
        title: "详情管理布局",
        pathname: "/media_profile",
        children: {
          home: {
            title: "详情管理布局",
            pathname: "/media_profile/home/index",
            children: {},
          },
        },
      },
      login: {
        title: "管理员登录",
        pathname: "/login",
        children: {},
      },
      register: {
        title: "管理员注册",
        pathname: "/register",
        children: {},
      },
      notfound: {
        title: "404",
        pathname: "/notfound",
        children: {},
      },
    },
  },
};
const configs = apply(configure, {
  name: "",
  pathname: "/",
});
export const routes: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.name]: a,
    };
  })
  .reduce((a, b) => {
    return {
      ...a,
      ...b,
    };
  }, {});
// @ts-ignore
window.__routes__ = routes;

type PageKeysType<T extends OriginalRouteConfigure, K = keyof T> = K extends keyof T & (string | number)
  ? `${K}` | (T[K] extends object ? `${K}.${PageKeysType<T[K]["children"]>}` : never)
  : never;
export type PageKeys = PageKeysType<typeof configure>;
