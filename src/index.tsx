/* @refresh reload */
import { createSignal, For, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import { Loader2 } from "lucide-solid";

import { Toast } from "./components/ui/toast";
import { RouteView } from "./components/ui/route-view";
import { connect } from "./domains/app/connect.web";
import { ToastCore } from "./domains/ui/toast";
import { rootView, homeIndexPage, homeLayout } from "./store/views";
import { app, router, initializeJobs, pages } from "./store";
import { sleep } from "./utils";

import "./style.css";

app.onClickLink(({ href }) => {
  console.log(href);
  // router.push(href);
});
// app.onPopState((options) => {
//   const { type, pathname } = options;
//   router.handlePopState({ type, pathname });
// });
// router.onBack(() => {
//   homeLayout.showPrevView({ ignore: true });
// });
// router.onHistoriesChange((histories) => {
//   console.log(histories.map((h) => h.pathname));
// });
connect(app);

function Application() {
  const toast = new ToastCore();

  const [state, setState] = createSignal(app.state);
  const [subViews, setSubViews] = createSignal(rootView.subViews);

  app.onStateChange((nextState) => {
    setState(nextState);
  });
  rootView.onViewShow((views) => {
    const curView = views.pop();
    if (!curView) {
      return;
    }
    if (curView.isShowForBack) {
      curView.isShowForBack = false;
      return;
    }
    const r = curView.buildUrl();
    console.log("[PAGE]index.tsx - onViewShow", curView.title);
    router.pushState(r);
  });
  rootView.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
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
    // @todo 让 app 能监听页面的生命周期
    await sleep(1000);
    initializeJobs();
  });
  // console.log("[]Application - before start", window.history);
  const { innerWidth, innerHeight, location } = window;
  router.prepare(location);
  (() => {
    const matched = pages.find((v) => {
      return v.checkMatchRegexp(router.pathname);
    });
    if (matched) {
      matched.query = router.query;
      // @todo 这样写只能展示 /home/xxx 路由，应该根据路由，找到多层级视图，即 rootView,homeLayout,homeIndexPage 这样
      // rootView.showSubView(matched);
      rootView.showSubView(homeLayout);
      homeLayout.showSubView(matched);
      return;
    }
    rootView.showSubView(homeLayout);
    homeLayout.showSubView(homeIndexPage);
  })();
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
            return (
              <RouteView
                class="absolute inset-0 opacity-100 dark:bg-black"
                app={app}
                view={subView}
                router={router}
                index={i()}
              />
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
render(() => <Application />, root!);
