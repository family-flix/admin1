import { PageKeysType, build } from "@/domains/route_view/utils";

/**
 * @file 路由配置
 */
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
          },
          drive_list: {
            title: "云盘列表",
            pathname: "/home/drive",
          },
          drive_profile: {
            title: "云盘详情",
            pathname: "/home/drive_profile",
          },
          season_list: {
            title: "电视剧列表",
            pathname: "/home/season",
          },
          season_profile: {
            title: "电视剧详情",
            pathname: "/home/season_profile",
          },
          movie_list: {
            title: "电影列表",
            pathname: "/home/movie",
          },
          movie_profile: {
            title: "电影详情",
            pathname: "/home/movie_profile",
          },
          invalid_media_list: {
            title: "影视剧待处理问题",
            pathname: "/home/invalid_media",
          },
          person_list: {
            title: "参演人员列表",
            pathname: "/home/person",
          },
          job_list: {
            title: "日志",
            pathname: "/home/log",
          },
          job_profile: {
            title: "日志详情",
            pathname: "/home/log_profile",
          },
          member_list: {
            title: "成员列表",
            pathname: "/home/member",
          },
          parse_result_layout: {
            title: "解析结果",
            pathname: "/home/unknown_media",
            children: {
              season: {
                title: "电视剧解析结果",
                pathname: "/home/unknown_media/season",
              },
              episode: {
                title: "剧集解析结果",
                pathname: "/home/unknown_media/episode",
              },
              movie: {
                title: "电影解析结果",
                pathname: "/home/unknown_media/movie",
              },
            },
          },
          permission: {
            title: "权限列表",
            pathname: "/home/permission",
          },
          resource_sync: {
            title: "同步任务列表",
            pathname: "/home/resource_sync",
          },
          subtitles_list: {
            title: "字幕列表",
            pathname: "/home/subtitles",
          },
          subtitles_create: {
            title: "字幕上传",
            pathname: "/home/subtitles/create",
          },
          collection_list: {
            title: "集合列表",
            pathname: "/home/collection",
          },
          collection_create: {
            title: "集合创建",
            pathname: "/home/collection/create",
          },
          collection_edit: {
            title: "集合编辑",
            pathname: "/home/collection/edit",
          },
          report_list: {
            title: "问题列表",
            pathname: "/home/report",
          },
          transfer: {
            title: "文件转存",
            pathname: "/home/transfer",
          },
          transfer_search_list: {
            title: "资源查询历史",
            pathname: "/home/transfer/search",
          },
          transfer_history_list: {
            title: "资源转存历史",
            pathname: "/home/transfer/history",
          },
        },
      },
      archive: {
        title: "电视剧归档",
        pathname: "/home/archive",
      },
      preview: {
        title: "预览",
        pathname: "/home/preview",
      },
      login: {
        title: "管理员登录",
        pathname: "/login",
      },
      register: {
        title: "管理员注册",
        pathname: "/register",
      },
      notfound: {
        title: "404",
        pathname: "/notfound",
      },
    },
  },
};
export type PageKeys = PageKeysType<typeof configure>;
const result = build<PageKeys>(configure);
export const routes = result.routes;
export const routesWithPathname = result.routesWithPathname;

// @ts-ignore
globalThis.__routes_with_pathname__ = routesWithPathname;
// @ts-ignore
globalThis.__routes__ = routes;
