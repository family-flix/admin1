/* @refresh reload */
import { createSignal, For } from "solid-js";
import { render } from "solid-js/web";

import { app } from "./store/app";
import { bind } from "@/domains/app/bind.web";
import { ViewComponent } from "./types";
import { ViewCore } from "./domains/view";
import { ToastCore } from "./domains/ui/toast";
import { MainLayout } from "./layouts/Main";
import { EmptyLayout } from "./layouts/Empty";
import { Toast } from "./components/ui/toast";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { TaskListPage } from "./pages/task/list";
import { SharedFilesTransferPage } from "./pages/shared_files";
import { TestPage } from "./pages/test";
import { TVManagePage } from "./pages/tv";
import { UnknownTVManagePage } from "./pages/unknown_tv";
import { MemberManagePage } from "./pages/member";
import { VideoParsingPage } from "./pages/parse";
import { TVProfilePage } from "./pages/tv/profile";

import "./style.css";

const { router } = app;

const rootView = new ViewCore({ title: "ROOT", component: "div" });
const mainLayout = new ViewCore({
  title: "MainLayout",
  component: MainLayout,
});
const authLayout = new ViewCore({
  title: "EmptyLayout",
  component: EmptyLayout,
});
mainLayout.register("/home", () => {
  const homeView = new ViewCore({
    title: "首页",
    component: HomePage,
  });
  return homeView;
});
mainLayout.register("/task/list", () => {
  const taskView = new ViewCore({
    title: "任务列表",
    component: TaskListPage,
  });
  return taskView;
});
mainLayout.register("/shared_files", () => {
  const sharedFilesTransferView = new ViewCore({
    title: "文件转存",
    component: SharedFilesTransferPage,
  });
  return sharedFilesTransferView;
});
mainLayout.register("/tv/:id", () => {
  return new ViewCore({
    title: "电视剧详情",
    component: TVProfilePage,
  });
});
mainLayout.register("/tv", () => {
  return new ViewCore({
    title: "电视剧列表",
    component: TVManagePage,
  });
});
mainLayout.register("/unknown_tv", () => {
  return new ViewCore({
    title: "未知电视剧列表",
    component: UnknownTVManagePage,
  });
});
mainLayout.register("/members", () => {
  return new ViewCore({
    title: "成员列表",
    component: MemberManagePage,
  });
});
mainLayout.register("/parse", () => {
  return new ViewCore({
    title: "文件名解析",
    component: VideoParsingPage,
  });
});
authLayout.register("/auth/login", () => {
  const loginView = new ViewCore({
    title: "登录",
    component: LoginPage,
  });
  return loginView;
});
rootView.register("/auth", () => {
  return authLayout;
});
rootView.register("/test", () => {
  const testView = new ViewCore({
    title: "测试",
    component: TestPage,
  });
  return testView;
});
rootView.register("/", () => {
  return mainLayout;
});
router.onPathnameChanged(({ pathname }) => {
  // router.log("[]Application - pathname change", pathname);
  rootView.checkMatch({ pathname, type: "push" });
});
app.onPopState((options) => {
  const { type, pathname } = options;
  router.handlePathnameChanged({ type, pathname });
});

function Application() {
  const toast = new ToastCore();

  const [subViews, setSubViews] = createSignal(rootView.subViews);

  rootView.onSubViewsChange((nextSubViews) => {
    // rootView.log("[]Application - subViews changed", nextSubViews);
    setSubViews(nextSubViews);
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
  // console.log("[]Application - before start", window.history);
  bind(app);
  router.start(window.location);
  app.start();

  return (
    <div>
      <For each={subViews()}>
        {(subView) => {
          const RenderedComponent = subView.component as ViewComponent;
          // console.log(
          //   "[Application]render subView",
          //   rootView.title,
          //   subView.title
          // );
          return (
            <RenderedComponent
              app={app}
              router={router}
              view={subView}
              // page={page}
            />
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
