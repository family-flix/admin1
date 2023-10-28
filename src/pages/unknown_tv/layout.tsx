/**
 * @file 索引后没有找到匹配信息的电视剧（后面称为「未知电视剧」）
 */
import { createSignal, For, Show } from "solid-js";

import { ButtonCore, ScrollViewCore } from "@/domains/ui";
import { ScrollView, KeepAliveRouteView } from "@/components/ui";
import { ViewComponent } from "@/types";
import { homeUnknownEpisodePage, homeUnknownMoviePage, homeUnknownTVPage } from "@/store";
import { cn } from "@/utils";

export const UnknownMediaLayout: ViewComponent = (props) => {
  const { app, view } = props;

  const scrollView = new ScrollViewCore({});

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
          <div class="mt-8 space-x-2 border">
            <div
              classList={{
                "inline-block px-4 py-2 cursor-pointer": true,
                underline: curSubView() === homeUnknownTVPage,
              }}
              onClick={() => {
                app.showView(homeUnknownTVPage);
                // homeUnknownMediaLayout.showSubView(homeUnknownTVPage);
                // router.push("/home/unknown_tv/tv");
              }}
            >
              电视剧
            </div>
            <div
              // class="inline-block px-4 py-2 cursor-pointer"
              classList={{
                "inline-block px-4 py-2 cursor-pointer": true,
                underline: curSubView() === homeUnknownEpisodePage,
              }}
              onClick={() => {
                app.showView(homeUnknownEpisodePage);
              }}
            >
              剧集
            </div>
            <div
              // class="inline-block px-4 py-2 cursor-pointer"
              classList={{
                "inline-block px-4 py-2 cursor-pointer": true,
                underline: curSubView() === homeUnknownMoviePage,
              }}
              onClick={() => {
                app.showView(homeUnknownMoviePage);
                // homeUnknownMediaLayout.showSubView(homeUnknownMoviePage);
                // router.push("/home/unknown_tv/movie");
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
