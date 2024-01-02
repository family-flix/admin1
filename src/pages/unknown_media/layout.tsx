/**
 * @file 索引后没有找到匹配信息的电视剧（后面称为「未知电视剧」）
 */
import { createSignal, For, onMount, Show } from "solid-js";

import { ButtonCore, ScrollViewCore } from "@/domains/ui";
import { ScrollView, KeepAliveRouteView } from "@/components/ui";
import { ViewComponent } from "@/types";
import { homeUnknownEpisodePage, homeUnknownMoviePage, homeUnknownTVPage } from "@/store";
import { cn } from "@/utils";
import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";

export const UnknownMediaLayout: ViewComponent = (props) => {
  const { app, view } = props;

  const scrollView = new ScrollViewCore({});
  const tab = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: "season",
        text: "电视剧",
      },
      {
        id: "episode",
        text: "剧集",
      },
      {
        id: "movie",
        text: "电影",
      },
    ],
    onChange(opt) {
      console.log(opt);
      if (opt.value === "season") {
        app.showView(homeUnknownTVPage);
        return;
      }
      if (opt.value === "episode") {
        app.showView(homeUnknownEpisodePage);
        return;
      }
      if (opt.value === "movie") {
        app.showView(homeUnknownMoviePage);
      }
    },
    onMounted() {
      if (view.curView === homeUnknownTVPage) {
        tab.select(0);
      }
      if (view.curView === homeUnknownEpisodePage) {
        tab.select(1);
      }
      if (view.curView === homeUnknownMoviePage) {
        tab.select(2);
      }
    },
  });

  const [curSubView, setCurSubView] = createSignal(view.curView);
  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onCurViewChange((nextCurView) => {
    setCurSubView(nextCurView);
  });
  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });

  return (
    <ScrollView store={scrollView} class="flex flex-col box-border h-screen">
      <div class="relative">
        <div class="p-8 pb-0">
          <h1 class="text-2xl">未识别的影视剧</h1>
          <div class="mt-8">
            <TabHeader store={tab} />
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
              <For each={subViews()}>
                {(subView, i) => {
                  const PageContent = subView.component as ViewComponent;
                  return (
                    <KeepAliveRouteView
                      class={cn("relative w-full h-full")}
                      store={subView}
                      immediately={true}
                      index={i()}
                    >
                      <PageContent app={app} router={app.router} view={view} />
                    </KeepAliveRouteView>
                  );
                }}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </ScrollView>
  );
};
