/**
 * @file 索引后没有找到匹配信息的电视剧（后面称为「未知电视剧」）
 */
import { createSignal, For } from "solid-js";

import { ViewComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { ButtonCore } from "@/domains/ui/button";
import { homeUnknownTVPage } from "@/store/views";
import { KeepAliveRouteView } from "@/components/ui/keep-alive-route-view";
import { cn } from "@/utils";

export const UnknownMediaLayout: ViewComponent = (props) => {
  const { app, view, router } = props;

  const tvBtn = new ButtonCore({
    onClick() {
      router.push("/home/unknown_tv/tv");
    },
  });
  const seasonBtn = new ButtonCore({
    onClick() {
      router.push("/home/unknown_tv/season");
    },
  });

  const [subViews, setSubViews] = createSignal(view.subViews);
  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });
  view.onMatched((subView) => {
    console.log("[LAYOUT]home/layout - view.onMatched", view.curView?._name, view.prevView?._name, subView._name);
    if (subView === view.curView) {
      return;
    }
    const prevView = view.curView;
    view.prevView = prevView;
    view.curView = subView;
    if (!view.subViews.includes(subView)) {
      view.appendSubView(subView);
    }
    subView.show();
    if (view.prevView) {
      view.prevView.hide();
    }
  });
  // view.onNotFound(() => {
  //   console.log("not found", view.state.layered, view.state.visible);
  //   if (view.state.layered) {
  //     return;
  //   }
  //   if (!view.state.visible) {
  //     return;
  //   }
  //   view.curView = homeUnknownTVPage;
  //   view.curView.show();
  //   view.appendSubView(view.curView);
  // });
  router.onPathnameChange(({ pathname, type }) => {
    if (view.state.layered) {
      return;
    }
    if (!view.state.visible) {
      return;
    }
    view.checkMatch({ pathname, type });
  });
  view.onShow(() => {
    if (view.curView) {
      return;
    }
    view.checkMatch(router._pending);
  });

  return (
    <div class="flex flex-col h-screen">
      <h1 class="text-2xl h-[32px]">未识别的影视剧</h1>
      <div class="flex-1 mt-8">
        <div class="space-x-2 h-[24px]">
          <div
            class="inline-block px-4 py-2 cursor-pointer"
            onClick={() => {
              router.push("/home/unknown_tv/tv");
            }}
          >
            电视剧
          </div>
          <div
            class="inline-block px-4 py-2 cursor-pointer"
            onClick={() => {
              router.push("/home/unknown_tv/season");
            }}
          >
            季
          </div>
          <div
            class="inline-block px-4 py-2 cursor-pointer"
            onClick={() => {
              router.push("/home/unknown_tv/movie");
            }}
          >
            电影
          </div>
        </div>
        <div class="mt-8 w-full h-full">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                const PageContent = subView.component as ViewComponent;
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "absolute left-0 top-0 w-full h-full",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    store={subView}
                    index={i()}
                  >
                    <div class="overflow-y-auto w-full h-full">
                      <div class="min-h-full">
                        <PageContent app={app} router={router} view={subView} />
                      </div>
                    </div>
                  </KeepAliveRouteView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};
