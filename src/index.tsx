/* @refresh reload */
import { createSignal, For, onMount } from "solid-js";
import { render } from "solid-js/web";

import { app } from "./store/app";
import { ViewComponent } from "./types";
import { bind } from "@/domains/app/bind.web";
import { RouteViewCore } from "./domains/route_view";
import { ToastCore } from "./domains/ui/toast";
import { MainLayout } from "./layouts/home";
import { EmptyLayout } from "./layouts/outer";
import { Toast } from "./components/ui/toast";
import { RouteView } from "./components/ui/route-view";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { TaskListPage } from "./pages/job";
import { TaskProfilePage } from "./pages/job/profile";
import { SharedFilesTransferPage } from "./pages/shared_files";
import { TestPage } from "./pages/test";
import { TVManagePage } from "./pages/tv";
import { UnknownTVManagePage } from "./pages/unknown_tv";
import { MemberManagePage } from "./pages/member";
import { VideoParsingPage } from "./pages/parse";
import { TVProfilePage } from "./pages/tv/profile";

import "./style.css";

const { router } = app;

const rootView = new RouteViewCore({ title: "ROOT", component: "div" });
const mainLayout = new RouteViewCore({
  title: "MainLayout",
  component: MainLayout,
});
const authLayout = new RouteViewCore({
  title: "EmptyLayout",
  component: EmptyLayout,
});
const homeView = new RouteViewCore({
  title: "首页",
  component: HomePage,
});
mainLayout.register("/home", () => {
  return homeView;
});
const taskProfileView = new RouteViewCore({
  title: "任务详情",
  component: TaskProfilePage,
});
mainLayout.register("/task/:id", () => {
  return taskProfileView;
});
const taskView = new RouteViewCore({
  title: "任务列表",
  component: TaskListPage,
});
mainLayout.register("/task", () => {
  return taskView;
});
const sharedFilesTransferView = new RouteViewCore({
  title: "文件转存",
  component: SharedFilesTransferPage,
});
mainLayout.register("/shared_files", () => {
  return sharedFilesTransferView;
});
const TVProfile = new RouteViewCore({
  title: "电视剧详情",
  component: TVProfilePage,
});
mainLayout.register("/tv/:id", () => {
  return new RouteViewCore({
    title: "电视剧详情",
    component: TVProfilePage,
  });
});
const TVManage = new RouteViewCore({
  title: "电视剧列表",
  component: TVManagePage,
});
mainLayout.register("/tv", () => {
  return TVManage;
});
const UnknownTVManage = new RouteViewCore({
  title: "未知电视剧列表",
  component: UnknownTVManagePage,
});
mainLayout.register("/unknown_tv", () => {
  return UnknownTVManage;
});
const memberManage = new RouteViewCore({
  title: "成员列表",
  component: MemberManagePage,
});
mainLayout.register("/members", () => {
  return memberManage;
});
const videoParsing = new RouteViewCore({
  title: "文件名解析",
  component: VideoParsingPage,
});
mainLayout.register("/parse", () => {
  return videoParsing;
});
const loginView = new RouteViewCore({
  title: "登录",
  component: LoginPage,
});
authLayout.register("/auth/login", () => {
  return loginView;
});
rootView.register("/auth", () => {
  return authLayout;
});
const testView = new RouteViewCore({
  title: "测试",
  component: TestPage,
});
rootView.register("/test", () => {
  return testView;
});
rootView.register("/", () => {
  return mainLayout;
});
router.onPathnameChange(({ pathname, type }) => {
  // router.log("[]Application - pathname change", pathname);
  rootView.checkMatch({ pathname, type });
});
app.onPopState((options) => {
  const { type, pathname } = options;
  router.handlePopState({ type, pathname });
});

function Application() {
  const toast = new ToastCore();

  const [layouts, setLayouts] = createSignal(rootView.subViews);

  rootView.onSubViewsChange((nextLayouts) => {
    // rootView.log("[]Application - layouts change", nextLayouts);
    setLayouts(nextLayouts);
  });
  app.onTip(async (msg) => {
    const { text } = msg;
    toast.show({
      texts: text,
    });
  });
  // app.onError((msg) => {
  //   alert(msg.message);
  // });
  // console.log("[]Application - start", window.location);
  bind(app);
  router.start(window.location);
  app.start();

  return (
    <div class="screen w-screen h-screen bg-slate-200">
      <For each={layouts()}>
        {(subView) => {
          const Layout = subView.component as ViewComponent;
          return (
            <RouteView store={subView}>
              <Layout app={app} router={router} view={subView} />
            </RouteView>
          );
        }}
      </For>
      <Toast store={toast} />
    </div>
  );
}

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?"
  );
}
render(() => <Application />, root!);
