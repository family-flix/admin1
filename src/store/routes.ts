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
            options: {
              require: ["login"],
            },
          },
          drive_list: {
            title: "云盘列表",
            pathname: "/home/drive",
            options: {
              require: ["login"],
            },
          },
          drive_profile: {
            title: "云盘详情",
            pathname: "/home/drive_profile",
            options: {
              require: ["login"],
            },
          },
          season_list: {
            title: "电视剧列表",
            pathname: "/home/season",
            options: {
              require: ["login"],
            },
          },
          season_profile: {
            title: "电视剧详情",
            pathname: "/home/season_profile",
            options: {
              require: ["login"],
            },
          },
          movie_list: {
            title: "电影列表",
            pathname: "/home/movie",
            options: {
              require: ["login"],
            },
          },
          movie_profile: {
            title: "电影详情",
            pathname: "/home/movie_profile",
            options: {
              require: ["login"],
            },
          },
          invalid_media_list: {
            title: "影视剧待处理问题",
            pathname: "/home/invalid_media",
            options: {
              require: ["login"],
            },
          },
          person_list: {
            title: "参演人员列表",
            pathname: "/home/person",
            options: {
              require: ["login"],
            },
          },
          job_list: {
            title: "日志",
            pathname: "/home/log",
            options: {
              require: ["login"],
            },
          },
          job_profile: {
            title: "日志详情",
            pathname: "/home/log_profile",
            options: {
              require: ["login"],
            },
          },
          member_list: {
            title: "成员列表",
            pathname: "/home/member",
            options: {
              require: ["login"],
            },
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
            options: {
              require: ["login"],
            },
          },
          permission: {
            title: "权限列表",
            pathname: "/home/permission",
            options: {
              require: ["login"],
            },
          },
          resource_sync: {
            title: "同步任务列表",
            pathname: "/home/resource_sync",
            options: {
              require: ["login"],
            },
          },
          subtitles_list: {
            title: "字幕列表",
            pathname: "/home/subtitles",
            options: {
              require: ["login"],
            },
          },
          subtitles_create: {
            title: "字幕上传",
            pathname: "/home/subtitles/create",
            options: {
              require: ["login"],
            },
          },
          collection_list: {
            title: "集合列表",
            pathname: "/home/collection",
            options: {
              require: ["login"],
            },
          },
          collection_create: {
            title: "集合创建",
            pathname: "/home/collection/create",
            options: {
              require: ["login"],
            },
          },
          collection_edit: {
            title: "集合编辑",
            pathname: "/home/collection/edit",
            options: {
              require: ["login"],
            },
          },
          report_list: {
            title: "问题列表",
            pathname: "/home/report",
            options: {
              require: ["login"],
            },
          },
          transfer: {
            title: "文件转存",
            pathname: "/home/transfer",
            options: {
              require: ["login"],
            },
          },
          transfer_search_list: {
            title: "资源查询历史",
            pathname: "/home/transfer/search",
            options: {
              require: ["login"],
            },
          },
          transfer_history_list: {
            title: "资源转存历史",
            pathname: "/home/transfer/history",
            options: {
              require: ["login"],
            },
          },
        },
      },
      archive: {
        title: "电视剧归档",
        pathname: "/home/archive",
        options: {
          require: ["login"],
        },
      },
      preview: {
        title: "预览",
        pathname: "/home/preview",
        options: {
          require: ["login"],
        },
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
