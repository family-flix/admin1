/**
 * @file 索引后没有找到匹配信息的电视剧（后面称为「未知电视剧」）
 */
import { createSignal, For, Show } from "solid-js";

import { ViewComponent } from "@/types";
import { ButtonCore } from "@/domains/ui/button";
import { ScrollView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
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
  const scrollView = new ScrollViewCore();

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
  router.onPathnameChange(({ pathname, search, type }) => {
    console.log("[PAGE]unknown_tv/layout - router.onPathnameChange", pathname, view.state.layered, view.state.visible);
    if (view.state.layered) {
      return;
    }
    if (!view.state.visible) {
      return;
    }
    view.checkMatch({ pathname, search, type });
  });
  view.onNotFound(() => {
    console.log("[PAGE]unknown_tv/layout - view.onNotFound");
  });
  view.onShow(() => {
    console.log("[PAGE]unknown_tv/layout - view.onShow");
    view.checkMatch(router._pending);
  });

  return (
    <ScrollView store={scrollView} class="flex flex-col box-border h-screen p-8">
      <div class="h-[80px]">
        <h1 class="text-2xl">未识别的影视剧</h1>
        <div class="space-x-2 border">
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
              router.push("/home/unknown_tv/episode");
            }}
          >
            剧集
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
      </div>
      <div class="flex-1 h-0 rounded-sm">
        <div class="w-full h-full">
          <Show
            when={subViews().length !== 0}
            fallback={
              <div class="flex items-center justify-center">
                <div class="py-8 text-xl text-slate-800">点击上方未知影视剧类型</div>
              </div>
            }
          >
            <div class="relative w-full h-full">
              <For each={subViews()}>
                {(subView, i) => {
                  const PageContent = subView.component as ViewComponent;
                  return (
                    <KeepAliveRouteView
                      class={cn("relative")}
                      view={subView}
                      app={app}
                      router={router}
                      index={i()}
                      immediately={true}
                    >
                      <PageContent app={app} router={router} view={subView} />
                    </KeepAliveRouteView>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </ScrollView>
  );
};
