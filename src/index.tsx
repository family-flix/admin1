/* @refresh reload */
import { createSignal, For, onMount } from "solid-js";
import { render } from "solid-js/web";

import { app } from "./store/app";
import { ViewComponent } from "./types";
import { connect } from "@/domains/app/connect.web";
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
  homeUnknownTVListPage,
  homeMemberListPage,
  homeFilenameParsingPage,
  rootView,
  loginPage,
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
homeLayout.register("/home/unknown_tv", () => {
  return homeUnknownTVListPage;
});
homeLayout.register("/home/members", () => {
  return homeMemberListPage;
});
homeLayout.register("/home/parse", () => {
  return homeFilenameParsingPage;
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
  const [subViews, setSubViews] = createSignal(rootView.subViews);

  onMount(() => {});

  rootView.onSubViewsChange((nextSubViews) => {
    console.log(...rootView.log("[]Application - subViews changed", nextSubViews));
    setSubViews(nextSubViews);
  });
  rootView.onMatched((subView) => {
    console.log("[Application]rootView.onMatched", rootView.curView?._name, subView._name, router._pending.type);
    if (subView === rootView.curView) {
      return;
    }
    const prevView = rootView.curView;
    rootView.prevView = prevView;
    rootView.curView = subView;
    if (!rootView.subViews.includes(subView)) {
      rootView.appendSubView(subView);
    }
    subView.show();
    // setTimeout(() => {
    //   subView.checkMatch(router._pending);
    // }, 200);
    if (prevView) {
      if (router._pending.type === "back") {
        prevView.hide();
        subView.uncovered();
        return;
      }
      prevView.layered();
      // prevView.layered();
      // prevView.state.layered = true;
      // setTimeout(() => {
      //   rootView.prevView = null;
      //   rootView.removeSubView(prevView);
      // }, 120);
    }
  });
  rootView.onNotFound(() => {
    console.log("[Application]rootView.onNotFound");
    rootView.curView = homeLayout;
    rootView.appendSubView(homeLayout);
  });
  router.onPathnameChange(({ pathname, type }) => {
    // router.log("[]Application - pathname change", pathname);
    rootView.checkMatch({ pathname, type });
  });
  // router.onRelaunch(() => {
  //   router.log("[]Application - router.onRelaunch");
  //   rootView.relaunch(mainLayout);
  // });
  app.onTip((msg) => {
    const { text } = msg;
    toast.show({
      texts: text,
    });
  });
  // app.onError((msg) => {
  //   alert(msg.message);
  // });
  console.log("[]Application - before start", window.history);
  router.start(window.location);
  app.start();

  return (
    <div class={"screen w-screen h-screen"}>
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
