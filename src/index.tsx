/* @refresh reload */

import { createSignal, For, JSX, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import { Loader2 } from "lucide-solid";

import "@/store/request";
import { app, history } from "@/store/index";
import { initializeJobs } from "@/store/job";
import { KeepAliveRouteView } from "@/components/ui";
import { Toast } from "@/components/ui/toast";
import { ToastCore } from "@/domains/ui/toast";
import { connect as connectApplication } from "@/domains/app/connect.web";
import { connect as connectHistory } from "@/domains/history/connect.web";
import { PageKeys } from "./store/routes";
import { pages } from "./store/views";
import { ViewComponent } from "@/store/types";
import { sleep } from "@/utils";

import "./style.css";

// app.onClickLink(({ href, target }) => {
//   const { pathname, query } = NavigatorCore.parse(href);
//   const matched = pages.find((v) => {
//     return v.key === pathname;
//   });
//   if (!matched) {
//     app.tip({
//       text: ["没有匹配的页面"],
//     });
//     return;
//   }
//   matched.query = query as Record<string, string>;
//   if (target === "_blank") {
//     matched.buildUrlWithPrefix(matched.query);
//     return;
//   }
//   app.showView(matched);
//   return;
// });
// app.onPopState((options) => {
//   const { pathname } = NavigatorCore.parse(options.pathname);
//   console.log("[ROOT]index - app.onPopState", options.type, pathname);
//   const matched = pages.find((v) => {
//     return v.key === pathname;
//   });
//   if (matched) {
//     matched.isShowForBack = true;
//     matched.query = router.query;
//     app.showView(matched, { back: true });
//     return;
//   }
//   homeIndexPage.isShowForBack = true;
//   app.showView(homeIndexPage, { back: true });
// });
connectApplication(app);
connectHistory(history);

function Application() {
  const view = history.$view;
  const router = history.$router;
  const toast = new ToastCore();

  const [state, setState] = createSignal(app.state);
  const [subViews, setSubViews] = createSignal(view.subViews);

  app.onStateChange((nextState) => {
    setState(nextState);
  });
  // rootView.onViewShow((views) => {
  //   const curView = views.pop();
  //   if (!curView) {
  //     return;
  //   }
  //   if (curView.isShowForBack) {
  //     curView.isShowForBack = false;
  //     return;
  //   }
  //   const r = curView.buildUrl(curView.query);
  //   app.setTitle(`${curView.title} - FamilyFlix`);
  //   router.pushState(r);
  // });
  view.onSubViewsChange((nextSubViews) => {
    console.log("[ROOT]rootView.onSubViewsChange", nextSubViews.length);
    setSubViews(nextSubViews);
  });
  history.onTopViewChange((view) => {
    app.setTitle(`${view.title} - FamilyFlix 管理后台`);
  });
  app.onTip((msg) => {
    const { text } = msg;
    toast.show({
      texts: text,
    });
  });
  app.onError((error) => {
    // 处理各种错误？
  });
  // app.onReady(() => {
  //   router.start();
  // });
  onMount(async () => {
    // await sleep(1000);
    history.push("root.home_layout.index");
    // initializeJobs();
  });
  // console.log("[]Application - before start", window.history);
  const { innerWidth, innerHeight, location } = window;
  router.prepare(location);
  // (() => {
  //   const { pathname } = NavigatorCore.parse(router.pathname);
  //   const matched = pages.find((v) => {
  //     return v.key === pathname;
  //   });
  //   if (matched) {
  //     matched.query = router.query;
  //     app.showView(matched);
  //     return;
  //   }
  //   app.showView(homeIndexPage);
  // })();
  app.start({
    width: innerWidth,
    height: innerHeight,
  });

  return (
    <div class={"screen w-screen h-screen overflow-hidden"}>
      <Show when={!state().ready}>
        <div class="flex items-center justify-center w-full h-full">
          <div class="flex flex-col items-center text-slate-500">
            <Loader2 class="w-8 h-8 animate-spin" />
            <div class="mt-4 text-center">正在加载</div>
          </div>
        </div>
      </Show>
      <Show when={subViews().length !== 0}>
        <For each={subViews()}>
          {(subView, i) => {
            const routeName = subView.name;
            const PageContent = pages[routeName as Exclude<PageKeys, "root">];
            return (
              <KeepAliveRouteView class="absolute inset-0 opacity-100 dark:bg-black" store={subView} index={i()}>
                <PageContent app={app} history={history} view={subView} />
              </KeepAliveRouteView>
            );
          }}
        </For>
      </Show>
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
console.log("invoke render Application");
render(() => <Application />, root!);
