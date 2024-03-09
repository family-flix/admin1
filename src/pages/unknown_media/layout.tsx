/**
 * @file 索引后没有找到匹配信息的电视剧（后面称为「未知电视剧」）
 */
import { createSignal, For, onMount, Show } from "solid-js";

import { PageKeys } from "@/store/routes";
import { ViewComponent } from "@/store/types";
import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { ButtonCore, ScrollViewCore } from "@/domains/ui";
import { ScrollView, KeepAliveRouteView } from "@/components/ui";
import { cn } from "@/utils";

export const UnknownMediaLayout: ViewComponent = (props) => {
  const { app, history, pages, client, storage, view } = props;

  const scrollView = new ScrollViewCore({
    _name: "unknown_media/layout",
  });
  const tab = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: "root.home_layout.parse_result_layout.season" as PageKeys,
        text: "电视剧",
      },
      {
        id: "root.home_layout.parse_result_layout.episode" as PageKeys,
        text: "剧集",
      },
      {
        id: "root.home_layout.parse_result_layout.movie" as PageKeys,
        text: "电影",
      },
    ],
    onChange(opt) {
      history.push(opt.id);
    },
    onMounted() {
      tab.handleChangeById(view.name);
    },
  });

  // const [curSubView, setCurSubView] = createSignal(view.curView);
  const [subViews, setSubViews] = createSignal(view.subViews);

  history.onRouteChange((v) => {
    if (!tab.mounted) {
      return;
    }
    tab.handleChangeById(v.name);
  });
  // view.onCurViewChange((nextCurView) => {
  //   setCurSubView(nextCurView);
  // });
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
                  const routeName = subView.name;
                  const PageContent = pages[routeName as Exclude<PageKeys, "root">];
                  return (
                    <KeepAliveRouteView
                      class={cn("relative w-full h-full")}
                      store={subView}
                      immediately={true}
                      index={i()}
                    >
                      <PageContent
                        app={app}
                        history={history}
                        client={client}
                        storage={storage}
                        pages={pages}
                        parent={{
                          view,
                          scrollView,
                        }}
                        view={subView}
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
