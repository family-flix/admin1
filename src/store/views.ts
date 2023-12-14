/**
 * @file 所有视图（页面）
 */
import { RouteViewCore, onViewCreated } from "@/domains/route_view";

import { HomePage } from "@/pages/home";
import { TaskListPage } from "@/pages/job";
import { PersonListPage } from "@/pages/person";
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
import { SeasonArchivePage } from "@/pages/archive/season";
import { InvalidTVManagePage } from "@/pages/tv/invalid";
import { CollectionListPage } from "@/pages/collection";
import { CollectionEditPage } from "@/pages/collection/edit";
import { InvalidMediaManagePage } from "@/pages/media_error";
import { PrismaExecPage } from "@/pages/prisma";
import { lazy } from "solid-js";
import { MovieArchivePage } from "@/pages/archive/movie";

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
  component: HomePage,
});
export const driveProfilePage = new RouteViewCore({
  key: "/home/drive_profile",
  title: "云盘详情",
  component: DriveProfilePage,
});
export const homeTaskProfilePage = new RouteViewCore({
  key: "/home/task_profile",
  title: "任务详情",
  // component: TaskProfilePage,
  component: TaskProfilePage,
});
export const homePersonListPage = new RouteViewCore({
  key: "/home/person",
  title: "演员列表",
  component: PersonListPage,
});
export const homeTaskListPage = new RouteViewCore({
  key: "/home/task",
  title: "任务列表",
  // component: TaskListPage,
  component: TaskListPage,
});
export const homeTVProfilePage = new RouteViewCore({
  key: "/home/tv_profile",
  title: "电视剧详情",
  // component: TVProfilePage,
  component: TVProfilePage,
});
export const homeTVListPage = new RouteViewCore({
  key: "/home/tv",
  title: "电视剧列表",
  // component: TVManagePage,
  component: TVManagePage,
});
export const homeMovieProfilePage = new RouteViewCore({
  key: "/home/movie_profile",
  title: "电影详情",
  // component: MovieProfilePage,
  component: MovieProfilePage,
});
export const homeMovieListPage = new RouteViewCore({
  key: "/home/movie",
  title: "电影列表",
  // component: MovieManagePage,
  component: MovieManagePage,
});
export const homeUnknownTVPage = new RouteViewCore({
  key: "/home/unknown_tv/tv",
  title: "未识别的电视剧",
  component: UnknownTVPage,
});
export const homeInvalidTVListPage = new RouteViewCore({
  key: "/home/tv/invalid",
  title: "有问题的电视剧列表",
  component: InvalidTVManagePage,
});
export const homeUnknownSeasonPage = new RouteViewCore({
  key: "/home/unknown_tv/season",
  title: "未识别的季",
  // component: UnknownSeasonPage,
  component: UnknownSeasonPage,
});
export const homeUnknownEpisodePage = new RouteViewCore({
  key: "/home/unknown_tv/episode",
  title: "未识别的剧集",
  // component: UnknownMoviePage,
  component: UnknownEpisodePage,
});
export const homeUnknownMoviePage = new RouteViewCore({
  key: "/home/unknown_tv/movie",
  title: "未识别的电影",
  // component: UnknownMoviePage,
  component: UnknownMoviePage,
});
export const homeUnknownMediaLayout = new RouteViewCore({
  key: "/home/unknown_tv",
  title: "未识别影视剧",
  // component: UnknownMediaLayout,
  component: UnknownMediaLayout,
  children: [homeUnknownTVPage, homeUnknownSeasonPage, homeUnknownEpisodePage, homeUnknownMoviePage],
});
// homeUnknownMediaLayout.replaceSubViews([homeUnknownTVPage, homeUnknownSeasonPage, homeUnknownMoviePage]);
export const homeFilenameParsingPage = new RouteViewCore({
  key: "/home/parse",
  title: "文件名解析",
  // component: VideoParsingPage,
  component: VideoParsingPage,
});
export const homePermissionListPage = new RouteViewCore({
  key: "/home/permission",
  title: "权限列表",
  // component: MemberManagePage,
  component: HomePermissionPage,
});
export const homeMemberListPage = new RouteViewCore({
  key: "/home/member",
  title: "成员列表",
  // component: MemberManagePage,
  component: MemberManagePage,
});
export const homeReportListPage = new RouteViewCore({
  key: "/home/report",
  title: "问题列表",
  component: HomeReportListPage,
});
export const homeSubtitleListPage = new RouteViewCore({
  key: "/home/subtitle",
  title: "字幕列表",
  component: HomeSubtitleListPage,
});
export const homeSubtitleAddingPage = new RouteViewCore({
  key: "/home/subtitle_upload",
  title: "上传字幕",
  component: HomeSubtitleUploadPage,
});
export const homeTransferPage = new RouteViewCore({
  key: "/home/shared_files",
  title: "文件转存",
  component: SharedFilesTransferPage,
});
export const sharedFilesHistoryPage = new RouteViewCore({
  key: "/home/shared_files/history",
  title: "分享文件查询记录",
  component: SharedFilesHistoryPage,
});
export const sharedFilesTransferListPage = new RouteViewCore({
  key: "/home/shared_files/transfer",
  title: "分享文件转存记录",
  component: SharedFilesTransferListPage,
});
export const syncTaskListPage = new RouteViewCore({
  key: "/home/sync_task",
  title: "同步任务",
  component: SyncTaskListPage,
});
export const collectionListPage = new RouteViewCore({
  key: "/collection",
  title: "创建集合",
  component: CollectionListPage,
});
export const collectionCreatePage = new RouteViewCore({
  key: "/collection/create",
  title: "创建集合",
  component: CollectionCreatePage,
});
export const collectionEditPage = new RouteViewCore({
  key: "/collection/edit",
  title: "编辑集合",
  component: CollectionEditPage,
});
export const invalidMediasPage = new RouteViewCore({
  key: "/invalid_media",
  title: "待处理问题",
  component: InvalidMediaManagePage,
});
export const homeLayout = new RouteViewCore({
  key: "/home",
  title: "首页",
  component: HomeLayout,
  children: [
    homeIndexPage,
    homeTVListPage,
    homeTVProfilePage,
    homeMovieListPage,
    homeMovieProfilePage,
    homeInvalidTVListPage,
    homeTaskListPage,
    homeTaskProfilePage,
    homePersonListPage,
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
    invalidMediasPage,
    driveProfilePage,
  ],
});
export const seasonArchivePage = new RouteViewCore({
  key: "/season_archive",
  title: "电视剧归档",
  component: SeasonArchivePage,
});
export const movieArchivePage = new RouteViewCore({
  key: "/movie_archive",
  title: "电影归档",
  component: MovieArchivePage,
});
export const mediaPlayingPage = new RouteViewCore({
  key: "/preview",
  title: "文件播放",
  // component: MovieManagePage,
  component: MediaPlayingPage,
});
export const prismaPage = new RouteViewCore({
  key: "/prisma",
  title: "代码",
  component: PrismaExecPage,
});
export const loginPage = new RouteViewCore({
  key: "/login",
  title: "登录",
  // component: LoginPage,
  component: LoginPage,
});
export const registerPage = new RouteViewCore({
  key: "/register",
  title: "注册",
  // component: RegisterPage,
  component: RegisterPage,
});
export const testPage = new RouteViewCore({
  key: "/test",
  title: "测试",
  // component: TestPage,
  component: TestPage,
});
export const rootView = new RouteViewCore({
  key: "/",
  title: "ROOT",
  component: "div",
  layers: true,
  children: [
    homeLayout,
    mediaPlayingPage,
    seasonArchivePage,
    movieArchivePage,
    registerPage,
    loginPage,
    testPage,
    prismaPage,
  ],
});
