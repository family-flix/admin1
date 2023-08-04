/**
 * @file 所有视图（页面）
 */
import { RouteViewCore } from "@/domains/route_view";
import { NavigatorCore } from "@/domains/navigator";

import { HomePage } from "@/pages/home";
import { TaskListPage } from "@/pages/job";
import { TaskProfilePage } from "@/pages/job/profile";
import { DriveProfilePage } from "@/pages/drive/profile";
import { SharedFilesTransferPage } from "@/pages/shared_files";
import { MovieManagePage } from "@/pages/movie";
import { MovieProfilePage } from "@/pages/movie/profile";
import { TVManagePage } from "@/pages/tv";
import { TVProfilePage } from "@/pages/tv/profile";
import { MediaPlayingPage } from "@/pages/play/index";
import { UnknownMediaLayout as UnknownMediaLayout } from "@/pages/unknown_tv/layout";
import { UnknownTVPage } from "@/pages/unknown_tv/tv";
import { UnknownSeasonPage } from "@/pages/unknown_tv/season";
import { UnknownMoviePage } from "@/pages/unknown_tv/movie";
import { MemberManagePage } from "@/pages/member";
import { VideoParsingPage } from "@/pages/parse";
import { HomeLayout } from "@/pages/home/layout";
import { TestPage } from "@/pages/test";
import { RegisterPage } from "@/pages/register";
import { LoginPage } from "@/pages/login";

RouteViewCore.prefix = NavigatorCore.prefix;

export const rootView = new RouteViewCore({ title: "ROOT", component: "div" });
export const homeLayout = new RouteViewCore({
  title: "首页",
  component: async () => {
    // const { HomeLayout } = await import("@/pages/home/layout");
    return HomeLayout;
  },
});
// const authLayout = new RouteViewCore({
//   title: "EmptyLayout",
//   component: EmptyLayout,
// });
export const homeIndexPage = new RouteViewCore({
  title: "首页",
  component: async () => {
    // const { HomePage } = await import("@/pages/home/index");
    return HomePage;
  },
});
export const driveProfilePage = new RouteViewCore({
  title: "首页",
  component: async () => {
    // const { DriveProfilePage } = await import("@/pages/drive/profile");
    return DriveProfilePage;
  },
});
export const homeTaskProfilePage = new RouteViewCore({
  title: "任务详情",
  // component: TaskProfilePage,
  component: async () => {
    // const { TaskProfilePage } = await import("@/pages/job/profile");
    return TaskProfilePage;
  },
});
export const homeTaskListPage = new RouteViewCore({
  title: "任务列表",
  // component: TaskListPage,
  component: async () => {
    // const { TaskListPage } = await import("@/pages/job");
    return TaskListPage;
  },
});
export const homeTransferPage = new RouteViewCore({
  title: "文件转存",
  // component: SharedFilesTransferPage,
  component: async () => {
    // const { SharedFilesTransferPage } = await import("@/pages/shared_files");
    return SharedFilesTransferPage;
  },
});
export const homeTVListPage = new RouteViewCore({
  title: "电视剧列表",
  // component: TVManagePage,
  component: async () => {
    // const { TVManagePage } = await import("@/pages/tv");
    return TVManagePage;
  },
});
export const homeMovieListPage = new RouteViewCore({
  title: "电影列表",
  // component: MovieManagePage,
  component: async () => {
    // const { MovieManagePage } = await import("@/pages/movie");
    return MovieManagePage;
  },
});
export const filePreviewPage = new RouteViewCore({
  title: "文件播放",
  // component: MovieManagePage,
  component: async () => {
    // const { MediaPlayingPage } = await import("@/pages/play/index");
    return MediaPlayingPage;
  },
});
export const homeTVProfilePage = new RouteViewCore({
  title: "电视剧详情",
  // component: TVProfilePage,
  component: async () => {
    // const { TVProfilePage } = await import("@/pages/tv/profile");
    return TVProfilePage;
  },
});
export const homeMovieProfilePage = new RouteViewCore({
  title: "电影详情",
  // component: MovieProfilePage,
  component: async () => {
    // const { MovieProfilePage } = await import("@/pages/movie/profile");
    return MovieProfilePage;
  },
});
export const homeUnknownMediaLayout = new RouteViewCore({
  title: "未识别影视剧",
  // component: UnknownMediaLayout,
  component: async () => {
    // const { UnknownMediaLayout } = await import("@/pages/unknown_tv/layout");
    return UnknownMediaLayout;
  },
});
export const homeUnknownTVPage = new RouteViewCore({
  title: "未识别的电视剧",
  // component: UnknownTVPage,
  component: async () => {
    // const { UnknownTVPage } = await import("@/pages/unknown_tv/tv");
    return UnknownTVPage;
  },
});
export const homeUnknownSeasonPage = new RouteViewCore({
  title: "未识别的季",
  // component: UnknownSeasonPage,
  component: async () => {
    // const { UnknownSeasonPage } = await import("@/pages/unknown_tv/season");
    return UnknownSeasonPage;
  },
});
export const homeUnknownMoviePage = new RouteViewCore({
  title: "未识别的电影",
  // component: UnknownMoviePage,
  component: async () => {
    // const { UnknownMoviePage } = await import("@/pages/unknown_tv/movie");
    return UnknownMoviePage;
  },
});
homeUnknownMediaLayout.replaceSubViews([homeUnknownTVPage, homeUnknownSeasonPage, homeUnknownMoviePage]);
export const homeFilenameParsingPage = new RouteViewCore({
  title: "文件名解析",
  // component: VideoParsingPage,
  component: async () => {
    // const { VideoParsingPage } = await import("@/pages/parse");
    return VideoParsingPage;
  },
});
export const homeMemberListPage = new RouteViewCore({
  title: "成员列表",
  // component: MemberManagePage,
  component: async () => {
    // const { MemberManagePage } = await import("@/pages/member");
    return MemberManagePage;
  },
});
export const loginPage = new RouteViewCore({
  title: "登录",
  // component: LoginPage,
  component: async () => {
    // const { LoginPage } = await import("@/pages/login");
    return LoginPage;
  },
});
export const registerPage = new RouteViewCore({
  title: "注册",
  // component: RegisterPage,
  component: async () => {
    // const { RegisterPage } = await import("@/pages/register");
    return RegisterPage;
  },
});
export const testPage = new RouteViewCore({
  title: "测试",
  // component: TestPage,
  component: async () => {
    // const { TestPage } = await import("@/pages/test");
    return TestPage;
  },
});
