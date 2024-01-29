/**
 * @file 索引后没有找到匹配信息的电视剧（后面称为「未知电视剧」）
 */
import { createSignal, For, onMount, Show } from "solid-js";

import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { ButtonCore, ScrollViewCore } from "@/domains/ui";
import { ScrollView, KeepAliveRouteView } from "@/components/ui";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";

export const UnknownMediaLayout: ViewComponent = (props) => {
  const { app, view } = props;

  const scrollView = new ScrollViewCore({
    _name: "unknown_media/layout",
  });
  const tab = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: "/home/unknown_media/season",
        text: "电视剧",
      },
      {
        id: "/home/unknown_media/episode",
        text: "剧集",
      },
      {
        id: "/home/unknown_media/movie",
        text: "电影",
      },
    ],
    onChange(opt) {
      app.push(opt.value as string);
    },
    onMounted() {
      tab.selectById(view.key);
      // if (view.curView === homeUnknownTVPage) {
      //   tab.select(0);
      // }
      // if (view.curView === homeUnknownEpisodePage) {
      //   tab.select(1);
      // }
      // if (view.curView === homeUnknownMoviePage) {
      //   tab.select(2);
      // }
    },
  });

  const [curSubView, setCurSubView] = createSignal(view.curView);
  const [subViews, setSubViews] = createSignal(view.subViews);

  app.$history.onHrefChange((v) => {
    if (!tab.mounted) {
      return;
    }
    tab.selectById(v.pathname);
  });
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
          <h1 class="text-2xl">解析结果</h1>
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
                      <PageContent
                        app={app}
                        parent={{
                          scrollView,
                        }}
                        view={view}
                      />
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
