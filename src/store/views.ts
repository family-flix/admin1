/**
 * @file 所有视图（页面）
 */
import { RouteViewCore, onViewCreated } from "@/domains/route_view";

import { HomePage } from "@/pages/home";
import { TaskListPage } from "@/pages/job";
import { TaskProfilePage } from "@/pages/job/profile";
import { DriveProfilePage } from "@/pages/drive/profile";
import { SharedFilesTransferPage } from "@/pages/resource";
import { MovieManagePage } from "@/pages/movie";
import { MovieProfilePage } from "@/pages/movie/profile";
import { TVManagePage } from "@/pages/season";
import { TVProfilePage } from "@/pages/season/profile";
import { MediaPlayingPage } from "@/pages/play/index";
import { UnknownMediaLayout } from "@/pages/unknown_tv/layout";
import { UnknownTVPage } from "@/pages/unknown_tv/tv";
import { UnknownSeasonPage } from "@/pages/unknown_tv/season";
import { UnknownEpisodePage } from "@/pages/unknown_tv/episode";
import { UnknownMoviePage } from "@/pages/unknown_tv/movie";
import { SyncTaskListPage } from "@/pages/sync_task";
import { CollectionCreatePage } from "@/pages/collection/create";
import { MemberManagePage } from "@/pages/member";
import { VideoParsingPage } from "@/pages/parse";
import { HomeLayout } from "@/pages/home/layout";
import { TestPage } from "@/pages/test";
import { RegisterPage } from "@/pages/register";
import { LoginPage } from "@/pages/login";
import { HomeReportListPage } from "@/pages/report";
import { HomePermissionPage } from "@/pages/permission";
import { HomeSubtitleUploadPage } from "@/pages/subtitle/add";
import { HomeSubtitleListPage } from "@/pages/subtitle";
import { SharedFilesHistoryPage } from "@/pages/resource/list";
import { SharedFilesTransferListPage } from "@/pages/resource/transfer";
import { SeasonArchivePage } from "@/pages/archive";
import { InvalidTVManagePage } from "@/pages/tv/invalid";
import { CollectionListPage } from "@/pages/collection";
import { CollectionEditPage } from "@/pages/collection/edit";
import { PrismaExecPage } from "@/pages/prisma";

export const pages: RouteViewCore[] = [];
onViewCreated((created) => {
  if (pages.includes(created)) {
    return;
  }
  pages.push(created);
});

export const homeIndexPage = new RouteViewCore({
  key: "/home/index",
  title: "首页",
  component: async () => {
    // const { HomePage } = await import("@/pages/home/index");
    return HomePage;
  },
});
export const driveProfilePage = new RouteViewCore({
  key: "/home/drive_profile",
  title: "云盘详情",
  component: async () => {
    // const { DriveProfilePage } = await import("@/pages/drive/profile");
    return DriveProfilePage;
  },
});
export const homeTaskProfilePage = new RouteViewCore({
  key: "/home/task_profile",
  title: "任务详情",
  // component: TaskProfilePage,
  component: async () => {
    // const { TaskProfilePage } = await import("@/pages/job/profile");
    return TaskProfilePage;
  },
});
export const homeTaskListPage = new RouteViewCore({
  key: "/home/task",
  title: "任务列表",
  // component: TaskListPage,
  component: async () => {
    // const { TaskListPage } = await import("@/pages/job");
    return TaskListPage;
  },
});
export const homeTVProfilePage = new RouteViewCore({
  key: "/home/tv_profile",
  title: "电视剧详情",
  // component: TVProfilePage,
  component: async () => {
    // const { TVProfilePage } = await import("@/pages/tv/profile");
    return TVProfilePage;
  },
});
export const homeTVListPage = new RouteViewCore({
  key: "/home/tv",
  title: "电视剧列表",
  // component: TVManagePage,
  component: async () => {
    // const { TVManagePage } = await import("@/pages/tv");
    return TVManagePage;
  },
});
export const homeMovieProfilePage = new RouteViewCore({
  key: "/home/movie_profile",
  title: "电影详情",
  // component: MovieProfilePage,
  component: async () => {
    // const { MovieProfilePage } = await import("@/pages/movie/profile");
    return MovieProfilePage;
  },
});
export const homeMovieListPage = new RouteViewCore({
  key: "/home/movie",
  title: "电影列表",
  // component: MovieManagePage,
  component: async () => {
    // const { MovieManagePage } = await import("@/pages/movie");
    return MovieManagePage;
  },
});
export const homeUnknownTVPage = new RouteViewCore({
  key: "/home/unknown_tv/tv",
  title: "未识别的电视剧",
  // component: UnknownTVPage,
  // model: () => {

  // },
  component: async () => {
    // const { UnknownTVPage } = await import("@/pages/unknown_tv/tv");
    return UnknownTVPage;
  },
  // onReady() {

  // }
});
export const homeInvalidTVListPage = new RouteViewCore({
  key: "/home/tv/invalid",
  title: "有问题的电视剧列表",
  component: async () => {
    return InvalidTVManagePage;
  },
});
export const homeUnknownSeasonPage = new RouteViewCore({
  key: "/home/unknown_tv/season",
  title: "未识别的季",
  // component: UnknownSeasonPage,
  component: async () => {
    // const { UnknownSeasonPage } = await import("@/pages/unknown_tv/season");
    return UnknownSeasonPage;
  },
});
export const homeUnknownEpisodePage = new RouteViewCore({
  key: "/home/unknown_tv/episode",
  title: "未识别的剧集",
  // component: UnknownMoviePage,
  component: async () => {
    // const { UnknownMoviePage } = await import("@/pages/unknown_tv/movie");
    return UnknownEpisodePage;
  },
});
export const homeUnknownMoviePage = new RouteViewCore({
  key: "/home/unknown_tv/movie",
  title: "未识别的电影",
  // component: UnknownMoviePage,
  component: async () => {
    // const { UnknownMoviePage } = await import("@/pages/unknown_tv/movie");
    return UnknownMoviePage;
  },
});
export const homeUnknownMediaLayout = new RouteViewCore({
  key: "/home/unknown_tv",
  title: "未识别影视剧",
  // component: UnknownMediaLayout,
  component: async () => {
    // const { UnknownMediaLayout } = await import("@/pages/unknown_tv/layout");
    return UnknownMediaLayout;
  },
  children: [homeUnknownTVPage, homeUnknownSeasonPage, homeUnknownEpisodePage, homeUnknownMoviePage],
});
// homeUnknownMediaLayout.replaceSubViews([homeUnknownTVPage, homeUnknownSeasonPage, homeUnknownMoviePage]);
export const homeFilenameParsingPage = new RouteViewCore({
  key: "/home/parse",
  title: "文件名解析",
  // component: VideoParsingPage,
  component: async () => {
    // const { VideoParsingPage } = await import("@/pages/parse");
    return VideoParsingPage;
  },
});
export const homePermissionListPage = new RouteViewCore({
  key: "/home/permission",
  title: "权限列表",
  // component: MemberManagePage,
  component: async () => {
    // const { MemberManagePage } = await import("@/pages/member");
    return HomePermissionPage;
  },
});
export const homeMemberListPage = new RouteViewCore({
  key: "/home/member",
  title: "成员列表",
  // component: MemberManagePage,
  component: async () => {
    // const { MemberManagePage } = await import("@/pages/member");
    return MemberManagePage;
  },
});
export const homeReportListPage = new RouteViewCore({
  key: "/home/report",
  title: "问题列表",
  component: async () => {
    return HomeReportListPage;
  },
});
export const homeSubtitleListPage = new RouteViewCore({
  key: "/home/subtitle",
  title: "字幕列表",
  component: async () => {
    return HomeSubtitleListPage;
  },
});
export const homeSubtitleAddingPage = new RouteViewCore({
  key: "/home/subtitle_upload",
  title: "上传字幕",
  component: async () => {
    // const { LoginPage } = await import("@/pages/login");
    return HomeSubtitleUploadPage;
  },
});
export const homeTransferPage = new RouteViewCore({
  key: "/home/shared_files",
  title: "文件转存",
  component: async () => {
    return SharedFilesTransferPage;
  },
});
export const sharedFilesHistoryPage = new RouteViewCore({
  key: "/home/shared_files/history",
  title: "分享文件查询记录",
  component: async () => {
    return SharedFilesHistoryPage;
  },
});
export const sharedFilesTransferListPage = new RouteViewCore({
  key: "/home/shared_files/transfer",
  title: "分享文件转存记录",
  component: async () => {
    return SharedFilesTransferListPage;
  },
});
export const syncTaskListPage = new RouteViewCore({
  key: "/home/sync_task",
  title: "同步任务",
  component: async () => {
    return SyncTaskListPage;
  },
});
export const collectionListPage = new RouteViewCore({
  key: "/collection",
  title: "创建集合",
  component: async () => {
    return CollectionListPage;
  },
});
export const collectionCreatePage = new RouteViewCore({
  key: "/collection/create",
  title: "创建集合",
  component: async () => {
    return CollectionCreatePage;
  },
});
export const collectionEditPage = new RouteViewCore({
  key: "/collection/edit",
  title: "编辑集合",
  component: async () => {
    return CollectionEditPage;
  },
});
export const homeLayout = new RouteViewCore({
  key: "/home",
  title: "首页",
  component: async () => {
    // const { HomeLayout } = await import("@/pages/home/layout");
    return HomeLayout;
  },
  children: [
    homeIndexPage,
    homeTVListPage,
    homeTVProfilePage,
    homeMovieListPage,
    homeMovieProfilePage,
    homeInvalidTVListPage,
    homeTaskListPage,
    homeTaskProfilePage,
    homePermissionListPage,
    homeMemberListPage,
    homeUnknownMediaLayout,
    homeReportListPage,
    homeTransferPage,
    collectionCreatePage,
    collectionListPage,
    collectionEditPage,
    syncTaskListPage,
    sharedFilesHistoryPage,
    sharedFilesTransferListPage,
    homeSubtitleAddingPage,
    homeSubtitleListPage,
    homeFilenameParsingPage,
    driveProfilePage,
  ],
});
export const seasonArchivePage = new RouteViewCore({
  key: "/season_archive",
  title: "电视剧归档",
  component: async () => {
    return SeasonArchivePage;
  },
});
export const mediaPlayingPage = new RouteViewCore({
  key: "/preview",
  title: "文件播放",
  // component: MovieManagePage,
  component: async () => {
    // const { MediaPlayingPage } = await import("@/pages/play/index");
    return MediaPlayingPage;
  },
});
export const prismaPage = new RouteViewCore({
  key: "/prisma",
  title: "代码",
  component: async () => {
    return PrismaExecPage;
  },
});
export const loginPage = new RouteViewCore({
  key: "/login",
  title: "登录",
  // component: LoginPage,
  component: async () => {
    // const { LoginPage } = await import("@/pages/login");
    return LoginPage;
  },
});
export const registerPage = new RouteViewCore({
  key: "/register",
  title: "注册",
  // component: RegisterPage,
  component: async () => {
    // const { RegisterPage } = await import("@/pages/register");
    return RegisterPage;
  },
});
export const testPage = new RouteViewCore({
  key: "/test",
  title: "测试",
  // component: TestPage,
  component: async () => {
    // const { TestPage } = await import("@/pages/test");
    return TestPage;
  },
});
export const rootView = new RouteViewCore({
  key: "/",
  title: "ROOT",
  component: "div",
  layers: true,
  children: [homeLayout, mediaPlayingPage, seasonArchivePage, registerPage, loginPage, testPage, prismaPage],
});
