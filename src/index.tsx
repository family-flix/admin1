/* @refresh reload */
import { render } from "solid-js/web";
import { createSignal, For } from "solid-js";

import { ViewCore } from "./domains/router";
import { NavigatorCore } from "./domains/navigator";
import { MainLayout } from "./layouts/Main";
import { EmptyLayout } from "./layouts/Empty";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { TaskListPage } from "./pages/task/list";
import { SharedFilesTransferPage } from "./pages/shared_files";
import { app } from "./store/app";
import { ViewComponent } from "./types";

import "./style.css";
import { Toast } from "./components/ui/toast";
import { DialogCore } from "./domains/ui/dialog";
import { sleep } from "./utils";
import { ToastCore } from "./domains/ui/toast";

const { router } = app;
router.onBack(() => {
  window.history.back();
});
router.onReload(() => {
  window.location.reload();
});
router.onPushState(({ from, path }) => {
  console.log("[Application ]- onPushState", path);
  window.history.pushState(
    {
      from,
    },
    null,
    path
  );
});
router.onReplaceState(({ from, path, pathname }) => {
  console.log("[Application ]- onReplaceState");
  window.history.replaceState(
    {
      from,
    },
    null,
    path
  );
});

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
rootView.register("/", () => {
  return mainLayoutView;
});
authLayoutView.register("/auth/login", () => {
  return loginView;
});
rootView.register("/auth", () => {
  return authLayoutView;
});
router.onPathnameChanged(({ pathname }) => {
  console.log("[]Application - pathname change", pathname);
  rootView.checkMatch({ pathname, type: "push" });
});

window.addEventListener("popstate", (event) => {
  const { type } = event;
  const { pathname } = window.location;
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
  const [subViews, setSubViews] = createSignal(rootView.subViews);
  const [texts, setTexts] = createSignal<string[]>([]);

  const toast = new ToastCore();

  rootView.onSubViewsChange((nextSubViews) => {
    console.log("[]Application - subViews changed", nextSubViews);
    setSubViews(nextSubViews);
  });
  app.onTip(async (msg) => {
    const { text } = msg;
    toast.show({
      texts: text,
    });
  });
  toast.onContentChange((nextContent) => {
    setTexts(nextContent.texts);
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
          console.log(
            "[Application]render subView",
            rootView.title,
            subView.title
          );
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
      <Toast core={toast} texts={texts()} />
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
