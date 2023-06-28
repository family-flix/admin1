/* @refresh reload */
import { createSignal, For, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import { Loader, Loader2 } from "lucide-solid";

import { app } from "./store/app";
import { ViewComponent } from "./types";
import { connect } from "./domains/app/connect.web";
import { ToastCore } from "./domains/ui/toast";
import { Toast } from "./components/ui/toast";
import { RouteView } from "./components/ui/route-view";
import {
  homeLayout,
  homeIndexPage,
  homeTaskProfilePage,
  homeTaskListPage,
  homeTransferPage,
  homeTVProfilePage,
  homeTVListPage,
  homeUnknownMediaLayout,
  homeMemberListPage,
  homeFilenameParsingPage,
  rootView,
  loginPage,
  testPage,
  registerPage,
  homeUnknownTVPage,
  homeUnknownSeasonPage,
  homeMovieListPage,
  homeMovieProfilePage,
  homeUnknownMoviePage,
} from "./store/views";

import "./style.css";

const { router } = app;

homeLayout.register("/home/index", () => {
  return homeIndexPage;
});
homeLayout.register("/home/task/:id", () => {
  return homeTaskProfilePage;
});
homeLayout.register("/home/task", () => {
  return homeTaskListPage;
});
homeLayout.register("/home/shared_files", () => {
  return homeTransferPage;
});
homeLayout.register("/home/tv/:id", () => {
  return homeTVProfilePage;
});
homeLayout.register("/home/tv", () => {
  return homeTVListPage;
});
homeLayout.register("/home/movie/:id", () => {
  return homeMovieProfilePage;
});
homeLayout.register("/home/movie", () => {
  return homeMovieListPage;
});
homeUnknownMediaLayout.register("/home/unknown_tv/tv", () => {
  return homeUnknownTVPage;
});
homeUnknownMediaLayout.register("/home/unknown_tv/season", () => {
  return homeUnknownSeasonPage;
});
homeUnknownMediaLayout.register("/home/unknown_tv/movie", () => {
  return homeUnknownMoviePage;
});
homeLayout.register("/home/unknown_tv", () => {
  return homeUnknownMediaLayout;
});
homeLayout.register("/home/members", () => {
  return homeMemberListPage;
});
homeLayout.register("/home/parse", () => {
  return homeFilenameParsingPage;
});
rootView.register("/test", () => {
  return testPage;
});
rootView.register("/login", () => {
  return loginPage;
});
rootView.register("/home", () => {
  return homeLayout;
});

// router.onPathnameChange(({ pathname, type }) => {
//   rootView.checkMatch({ pathname, type });
// });
app.onPopState((options) => {
  const { type, pathname } = options;
  router.handlePopState({ type, pathname });
});

connect(app);
const toast = new ToastCore();

function Application() {
  const [state, setState] = createSignal(app.state);
  const [subViews, setSubViews] = createSignal(rootView.subViews);

  app.onStateChange((nextState) => {
    setState(nextState);
  });
  rootView.onSubViewsChange((nextSubViews) => {
    // console.log(...rootView.log("[]Application - subViews changed", nextSubViews));
    setSubViews(nextSubViews);
  });
  rootView.onMatched((subView) => {
    // console.log("[Application]rootView.onMatched", rootView.curView?._name, subView._name, router._pending.type);
    if (subView === rootView.curView) {
      return;
    }
    const prevView = rootView.curView;
    rootView.prevView = prevView;
    rootView.curView = subView;
    subView.show();
    if (prevView) {
      prevView.hide();
    }
    rootView.replaceSubViews([subView]);
  });
  rootView.onNotFound(() => {
    // console.log("[Application]rootView.onNotFound");
    rootView.curView = (() => {
      if (app.user.isLogin) {
        return homeLayout;
      }
      if (app.user.needRegister) {
        return registerPage;
      }
      return loginPage;
    })();
    rootView.curView.show();
    rootView.appendSubView(rootView.curView);
  });
  router.onPathnameChange(({ pathname, type }) => {
    // router.log("[]Application - pathname change", pathname);
    rootView.checkMatch({ pathname, type });
  });
  app.onTip((msg) => {
    const { text } = msg;
    toast.show({
      texts: text,
    });
  });
  app.onReady(() => {
    // if (app.user.isLogin) {
    //   router.start();
    //   return;
    // }
    // router.push(`/login?redirect=${router.pathname}`);
    router.start();
  });
  // console.log("[]Application - before start", window.history);
  router.prepare(window.location);
  app.start();

  return (
    <div class={"screen w-screen h-screen"}>
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
          {(subView) => {
            const PageContent = subView.component as ViewComponent;
            return (
              <RouteView class="absolute inset-0 opacity-100 dark:bg-black" store={subView}>
                <PageContent app={app} router={router} view={subView} />
              </RouteView>
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
