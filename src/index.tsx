/* @refresh reload */
import { render } from "solid-js/web";
import { createSignal, For, onMount } from "solid-js";

import { ViewCore } from "./domains/router";
import { NavigatorCore } from "./domains/navigator";
import { Window } from "./components/Page";
import { MainLayout } from "./layouts/Main";
import { EmptyLayout } from "./layouts/Empty";
import { HomePage } from "./pages/home";
import { LoginPage } from "./pages/login";
import { TaskListPage } from "./pages/task/list";
import { app } from "./store/app";

import "./style.css";

const view = new ViewCore({ title: "ROOT", component: "div" });
view.addSubViewBackup("/", () => {
  console.log("[]/");
  const subView = new ViewCore({ title: "MainLayout", component: MainLayout });
  subView.addSubViewBackup("/home", () => {
    console.log("[]/home");
    const a = new ViewCore({
      title: "首页",
      component: HomePage,
    });
    return a;
    // return {
    //   title: "首页",
    //   component: HomePage,
    // };
  });
  subView.addSubViewBackup("/task/list", () => {
    console.log("[]/task/list");
    const a = new ViewCore({
      title: "任务列表",
      component: TaskListPage,
    });
    return a;
    // return {
    //   title: "刮削任务列表",
    //   component: TaskListPage,
    // };
  });
  return subView;
  // return {
  //   title: "管理后台",
  //   component: MainLayout,
  // };
});
view.addSubViewBackup("/auth", () => {
  console.log("[]/auth");
  const subView = new ViewCore({
    title: "EmptyLayout",
    component: EmptyLayout,
  });
  subView.addSubViewBackup("/auth/login", () => {
    const a = new ViewCore({
      title: "登录",
      component: LoginPage,
    });
    return a;
  });
  return subView;
  // return {
  //   title: "登录",
  //   component: EmptyLayout,
  // };
});

const navigator = new NavigatorCore();
navigator.onPushState(({ from, path, pathname }) => {
  console.log("[ROOT]Application - onPushState");
  view.checkMatch({ pathname, type: "push" });
  window.history.pushState(
    {
      from,
    },
    null,
    path
  );
});
navigator.onReplaceState(({ from, path, pathname }) => {
  console.log("[ROOT]Application - onReplaceState");
  view.checkMatch({ pathname, type: "replace" });
  window.history.replaceState(
    {
      from,
    },
    null,
    path
  );
});
navigator.onBack(() => {
  window.history.back();
});
navigator.onReload(() => {
  window.location.reload();
});
window.addEventListener("popstate", (event) => {
  const { type } = event;
  const { pathname } = window.location;
  navigator.handlePathnameChanged({ type, pathname });
});

function ViewComponent(props: { view: ViewCore }) {
  const { view } = props;
  const [subViews, setSubViews] = createSignal([]);
  view.onSubViewsChange((nextSubViews) => {
    console.log("[]ViewComponent - sub view changed", nextSubViews);
    setSubViews(nextSubViews);
  });
  const { pathname } = navigator;
  console.log("[]ViewComponent - before start", pathname);
  view.start({ pathname });
  return (
    <For each={subViews()}>
      {(subView) => {
        // const { page } = subView;
        const RenderedComponent = subView.component;
        return (
          <RenderedComponent
            app={app}
            router={navigator}
            view={subView}
            // page={page}
          />
        );
      }}
    </For>
  );
}

function Application() {
  // const [subViews, setSubViews] = createSignal([]);
  // view.onSubViewsChange((nextSubViews) => {
  //   console.log("[]Application - sub view changed", nextSubViews);
  //   setSubViews(nextSubViews);
  // });
  // navigator.onStart((params) => {
  //   view.start(params);
  // });
  app.onError((msg) => {
    alert(msg.message);
  });
  // console.log("[]Application - before start", window.history);
  navigator.start(window.location);
  app.start();

  return (
    <div>
      <ViewComponent view={view} />
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
