import { RouteViewCore } from "@/domains/route_view";

import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { TaskListPage } from "@/pages/job";
import { TaskProfilePage } from "@/pages/job/profile";
import { SharedFilesTransferPage } from "@/pages/shared_files";
import { TestPage } from "@/pages/test";
import { TVManagePage } from "@/pages/tv";
import { UnknownMediaLayout as UnknownMediaLayout } from "@/pages/unknown_tv/layout";
import { MemberManagePage } from "@/pages/member";
import { VideoParsingPage } from "@/pages/parse";
import { TVProfilePage } from "@/pages/tv/profile";
import { MovieProfilePage } from "@/pages/movie/profile";
import { HomeLayout } from "@/pages/home/layout";
import { NavigatorCore } from "@/domains/navigator";
import { RegisterPage } from "@/pages/register";
import { UnknownTVPage } from "@/pages/unknown_tv/tv";
import { UnknownSeasonPage } from "@/pages/unknown_tv/season";
import { UnknownMoviePage } from "@/pages/unknown_tv/movie";
import { MovieManagePage } from "@/pages/movie";

RouteViewCore.prefix = NavigatorCore.prefix;

export const rootView = new RouteViewCore({ title: "ROOT", component: "div" });
export const homeLayout = new RouteViewCore({
  title: "首页",
  component: HomeLayout,
});
// const authLayout = new RouteViewCore({
//   title: "EmptyLayout",
//   component: EmptyLayout,
// });
export const homeIndexPage = new RouteViewCore({
  title: "首页",
  component: HomePage,
});
export const homeTaskProfilePage = new RouteViewCore({
  title: "任务详情",
  component: TaskProfilePage,
});
export const homeTaskListPage = new RouteViewCore({
  title: "任务列表",
  component: TaskListPage,
});
export const homeTransferPage = new RouteViewCore({
  title: "文件转存",
  component: SharedFilesTransferPage,
});
export const homeTVListPage = new RouteViewCore({
  title: "电视剧列表",
  component: TVManagePage,
});
export const homeMovieListPage = new RouteViewCore({
  title: "电影列表",
  component: MovieManagePage,
});
export const homeTVProfilePage = new RouteViewCore({
  title: "电视剧详情",
  component: TVProfilePage,
});
export const homeMovieProfilePage = new RouteViewCore({
  title: "电影详情",
  component: MovieProfilePage,
});
export const homeUnknownMediaLayout = new RouteViewCore({
  title: "未识别影视剧",
  component: UnknownMediaLayout,
});

export const homeUnknownTVPage = new RouteViewCore({
  title: "未识别的电视剧",
  component: UnknownTVPage,
});
export const homeUnknownSeasonPage = new RouteViewCore({
  title: "未识别的季",
  component: UnknownSeasonPage,
});
export const homeUnknownMoviePage = new RouteViewCore({
  title: "未识别的电影",
  component: UnknownMoviePage,
});
homeUnknownMediaLayout.replaceSubViews([homeUnknownTVPage, homeUnknownSeasonPage, homeUnknownMoviePage]);
export const homeFilenameParsingPage = new RouteViewCore({
  title: "文件名解析",
  component: VideoParsingPage,
});
export const homeMemberListPage = new RouteViewCore({
  title: "成员列表",
  component: MemberManagePage,
});
export const loginPage = new RouteViewCore({
  title: "登录",
  component: LoginPage,
});
export const registerPage = new RouteViewCore({
  title: "注册",
  component: RegisterPage,
});
export const testPage = new RouteViewCore({
  title: "测试",
  component: TestPage,
});
