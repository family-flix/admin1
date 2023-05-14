/* @refresh reload */
import { createSignal, For } from "solid-js";
import { render } from "solid-js/web";

import { app } from "./store/app";
import { ViewComponent } from "./types";
import { ViewCore } from "./domains/router";
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

import "./style.css";

const { router } = app;

const rootView = new ViewCore({ title: "ROOT", component: "div" });
const mainLayoutView = new ViewCore({
  title: "MainLayout",
  component: MainLayout,
});
const homeView = new ViewCore({
  title: "首页",
  component: HomePage,
});
const taskView = new ViewCore({
  title: "任务列表",
  component: TaskListPage,
});
const sharedFilesTransferView = new ViewCore({
  title: "文件转存",
  component: SharedFilesTransferPage,
});
const authLayoutView = new ViewCore({
  title: "EmptyLayout",
  component: EmptyLayout,
});
const loginView = new ViewCore({
  title: "登录",
  component: LoginPage,
});
mainLayoutView.register("/home", () => {
  return homeView;
});
mainLayoutView.register("/task/list", () => {
  return taskView;
});
mainLayoutView.register("/shared_files", () => {
  return sharedFilesTransferView;
});
mainLayoutView.register("/tv", () => {
  return new ViewCore({
    title: "电视剧列表",
    component: TVManagePage,
  });
});
mainLayoutView.register("/unknown_tv", () => {
  return new ViewCore({
    title: "未知电视剧列表",
    component: UnknownTVManagePage,
  });
});

authLayoutView.register("/auth/login", () => {
  return loginView;
});
rootView.register("/auth", () => {
  return authLayoutView;
});
const testView = new ViewCore({
  title: "测试",
  component: TestPage,
});
rootView.register("/test", () => {
  return testView;
});
rootView.register("/", () => {
  return mainLayoutView;
});
router.onPathnameChanged(({ pathname }) => {
  // router.log("[]Application - pathname change", pathname);
  rootView.checkMatch({ pathname, type: "push" });
});
app.onPopState((options) => {
  const { type, pathname } = options;
  router.handlePathnameChanged({ type, pathname });
});

// function ViewComponent(props: { view: ViewCore }) {
//   const { view } = props;
//   const [subViews, setSubViews] = createSignal([]);
//   view.onSubViewsChange((nextSubViews) => {
//     // console.log("[]ViewComponent - sub view changed", nextSubViews);
//     setSubViews(nextSubViews);
//   });
//   const { pathname } = navigator;
//   // console.log("[]ViewComponent - before start", pathname);
//   // view.start({ pathname });
//   // view.stopListen();
//   return (
//     <For each={subViews()}>
//       {(subView) => {
//         // const { page } = subView;
//         const RenderedComponent = subView.component;
//         return (
//           <RenderedComponent
//             app={app}
//             router={navigator}
//             view={subView}
//             // page={page}
//           />
//         );
//       }}
//     </For>
//   );
// }

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
