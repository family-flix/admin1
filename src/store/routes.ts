/**
 * @file 路由配置
 */
// import { RouteViewCore, onViewCreated } from "@/domains/route_view";
import { HomeLayout } from "@/pages/home/layout";
import { HomeIndexPage } from "@/pages/home";
import { LogListPage } from "@/pages/job";
import { LogProfilePage } from "@/pages/job/profile";
import { HomeSeasonListPage } from "@/pages/season";
import { HomeSeasonProfilePage } from "@/pages/season/profile";
import { UnknownMediaLayout } from "@/pages/unknown_media/layout";
import { UnknownSeasonListPage } from "@/pages/unknown_media/season";
import { UnknownMovieListPage } from "@/pages/unknown_media/movie";
import { TestPage } from "@/pages/test";
import { RegisterPage } from "@/pages/register";
import { LoginPage } from "@/pages/login";
import { DriveListPage } from "@/pages/drive";
import { PersonListPage } from "@/pages/person";
import { DriveProfilePage } from "@/pages/drive/profile";
import { SharedFilesTransferPage } from "@/pages/resource";
import { MovieListPage } from "@/pages/movie";
import { MovieProfilePage } from "@/pages/movie/profile";
import { MediaPlayingPage } from "@/pages/play/index";
import { UnknownEpisodeListPage } from "@/pages/unknown_media/episode";
import { SyncTaskListPage } from "@/pages/sync_task";
import { CollectionCreatePage } from "@/pages/collection/create";
import { MemberListPage } from "@/pages/member";
import { VideoParsingPage } from "@/pages/parse";
import { HomeReportListPage } from "@/pages/report";
import { HomePermissionPage } from "@/pages/permission";
import { HomeSubtitleUploadPage } from "@/pages/subtitle/add";
import { HomeSubtitleListPage } from "@/pages/subtitle";
import { SharedFilesHistoryPage } from "@/pages/resource/list";
import { SharedFilesTransferListPage } from "@/pages/resource/transfer";
import { SeasonArchivePage } from "@/pages/archive/season";
import { CollectionListPage } from "@/pages/collection";
import { CollectionEditPage } from "@/pages/collection/edit";
import { InvalidMediaListPage } from "@/pages/media_error";
import { PrismaExecPage } from "@/pages/prisma";
import { OuterMediaProfilePage } from "@/pages/outer_profile";
import { MediaProfileHomeLayout } from "@/pages/media_profile/layout";
import { SeasonMediaProfileManagePage } from "@/pages/media_profile";
import { NotFoundPage } from "@/pages/notfound";

// import { pages } from "@/pages";
import { PathnameKey, RouteConfig } from "@/types";

type OriginalRouteConfigure = Record<
  PathnameKey,
  {
    pathname: string;
    title: string;
    destroy?: boolean;
    children?: OriginalRouteConfigure;
    component: unknown;
  }
>;
function apply(configure: OriginalRouteConfigure, parent: PathnameKey): RouteConfig[] {
  const routes = Object.keys(configure).map((key) => {
    const config = configure[key];
    const { pathname, title, destroy, component, children } = config;
    if (children) {
      const subRoutes = apply(children, pathname);
      return [
        {
          title,
          destroy,
          pathname,
          component,
          parent_pathname: parent,
        },
        ...subRoutes,
      ];
    }
    return [
      {
        title,
        destroy,
        pathname,
        component,
        parent_pathname: parent,
      },
    ];
  });
  return routes.reduce((a, b) => {
    return a.concat(b);
  }, []);
}
const configure: OriginalRouteConfigure = {
  "/": {
    pathname: "/",
    title: "ROOT",
    component: "div",
    children: {
      "/home": {
        pathname: "/home",
        title: "首页布局",
        component: HomeLayout,
        children: {
          "/home/index": {
            pathname: "/home/index",
            title: "首页",
            component: HomeIndexPage,
          },
          "/home/drive": {
            pathname: "/home/drive",
            title: "云盘列表",
            component: DriveListPage,
          },
          "/home/drive_profile": {
            pathname: "/home/drive_profile",
            title: "云盘详情",
            component: DriveProfilePage,
          },
          "/home/season": {
            pathname: "/home/season",
            title: "电视剧列表",
            component: HomeSeasonListPage,
          },
          "/home/season_profile": {
            pathname: "/home/season_profile",
            title: "电视剧详情",
            destroy: true,
            component: HomeSeasonProfilePage,
          },
          // "/home/movie": {
          //   pathname: "/home/movie",
          //   title: "电影列表",
          //   component: MovieListPage,
          // },
          // "/home/movie_profile": {
          //   pathname: "/home/movie_profile",
          //   title: "电影详情",
          //   component: MovieProfilePage,
          // },
          // "/home/invalid_media": {
          //   pathname: "/home/invalid_media",
          //   title: "影视剧待处理问题",
          //   component: InvalidMediaListPage,
          // },
          // "/home/person": {
          //   pathname: "/home/person",
          //   title: "参演人员列表",
          //   component: PersonListPage,
          // },
          // "/home/job": {
          //   pathname: "/home/log",
          //   title: "日志",
          //   component: LogListPage,
          // },
          // "/home/job_profile": {
          //   pathname: "/home/log_profile",
          //   title: "日志详情",
          //   component: LogProfilePage,
          // },
          // "/home/member": {
          //   pathname: "/home/member",
          //   title: "成员列表",
          //   component: MemberManagePage,
          // },
          // "/home/unknown_media": {
          //   pathname: "/home/unknown_media",
          //   title: "解析结果",
          //   component: UnknownMediaLayout,
          //   children: {
          //     "/home/unknown_media/season": {
          //       pathname: "/home/unknown_media/season",
          //       title: "电视剧解析结果",
          //       component: UnknownSeasonListPage,
          //     },
          //     "/home/unknown_media/episode": {
          //       pathname: "/home/unknown_media/episode",
          //       title: "剧集解析结果",
          //       component: UnknownEpisodePage,
          //     },
          //     "/home/unknown_media/movie": {
          //       pathname: "/home/unknown_media/movie",
          //       title: "电影解析结果",
          //       component: UnknownMovieListPage,
          //     },
          //   },
          // },
          // "/home/permission": {
          //   pathname: "/home/permission",
          //   title: "权限列表",
          //   component: HomePermissionPage,
          // },
          // "/home/resource_sync": {
          //   pathname: "/home/resource_sync",
          //   title: "同步任务列表",
          //   component: SyncTaskListPage,
          // },
          // "/home/subtitles": {
          //   pathname: "/home/subtitles",
          //   title: "字幕列表",
          //   component: HomeSubtitleListPage,
          // },
          // "/home/subtitles/create": {
          //   pathname: "/home/subtitles/create",
          //   title: "字幕上传",
          //   component: HomeSubtitleUploadPage,
          // },
          // "/home/collection": {
          //   pathname: "/home/collection",
          //   title: "集合列表",
          //   component: CollectionListPage,
          // },
          // "/home/collection/create": {
          //   pathname: "/home/collection/create",
          //   title: "集合创建",
          //   component: CollectionCreatePage,
          // },
          // "/home/collection/edit": {
          //   pathname: "/home/collection/edit",
          //   title: "集合编辑",
          //   component: CollectionEditPage,
          // },
          // "/home/report": {
          //   pathname: "/home/report",
          //   title: "问题列表",
          //   component: HomeReportListPage,
          // },
          // "/home/transfer": {
          //   pathname: "/home/transfer",
          //   title: "文件转存",
          //   component: SharedFilesTransferPage,
          // },
          // "/home/transfer/search": {
          //   pathname: "/home/transfer/search",
          //   title: "资源查询历史",
          //   component: SharedFilesHistoryPage,
          // },
          // "/home/transfer/history": {
          //   pathname: "/home/transfer/history",
          //   title: "资源转存历史",
          //   component: SharedFilesTransferListPage,
          // },
        },
      },
      // "/archive": {
      //   pathname: "/home/archive",
      //   title: "电视剧归档",
      //   component: SeasonArchivePage,
      // },
      // "/preview": {
      //   pathname: "/home/preview",
      //   title: "预览",
      //   component: MediaPlayingPage,
      // },
      // "/media_profile": {
      //   pathname: "/media_profile",
      //   title: "详情管理布局",
      //   component: MediaProfileHomeLayout,
      //   children: {
      //     "/media_profile/home/index": {
      //       pathname: "/media_profile/home/index",
      //       title: "详情管理布局",
      //       component: SeasonMediaProfileManagePage,
      //     },
      //   },
      // },
      "/login": {
        pathname: "/login",
        title: "管理员登录",
        component: LoginPage,
      },
      "/register": {
        pathname: "/register",
        title: "管理员注册",
        component: RegisterPage,
      },
      "/notfound": {
        pathname: "/notfound",
        title: "404",
        component: NotFoundPage,
      },
    },
  },
};
const configs = apply(configure, "/");
export const routes: Record<PathnameKey, RouteConfig> = configs
  .map((a) => {
    return {
      [a.pathname]: a,
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
