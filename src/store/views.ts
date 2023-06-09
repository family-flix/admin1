import { RouteViewCore } from "@/domains/route_view";

import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { TaskListPage } from "@/pages/job";
import { TaskProfilePage } from "@/pages/job/profile";
import { SharedFilesTransferPage } from "@/pages/shared_files";
import { TestPage } from "@/pages/test";
import { TVManagePage } from "@/pages/tv";
import { UnknownTVManagePage } from "@/pages/unknown_tv";
import { MemberManagePage } from "@/pages/member";
import { VideoParsingPage } from "@/pages/parse";
import { TVProfilePage } from "@/pages/tv/profile";
import { HomeLayout } from "@/pages/home/layout";
import { NavigatorCore } from "@/domains/navigator";

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
export const homeTVProfilePage = new RouteViewCore({
  title: "电视剧详情",
  component: TVProfilePage,
});
export const homeUnknownTVListPage = new RouteViewCore({
  title: "未知电视剧列表",
  component: UnknownTVManagePage,
});
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
export const testPage = new RouteViewCore({
  title: "测试",
  component: TestPage,
});
