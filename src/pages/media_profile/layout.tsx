/**
 * @file 详情管理/首页布局
 */
import { For, JSX, createSignal, onMount } from "solid-js";
import { Film, Users, FolderInput, Home, Tv } from "lucide-solid";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { PageKeys } from "@/store/routes";
import { KeepAliveRouteView } from "@/components/ui";
import { HistoryCore } from "@/domains/history";
import { Application } from "@/domains/app";
import { Show } from "@/packages/ui/show";
// import { homeIndexPage, homeMovieListPage, homeSeasonListPage } from "@/store/views";
import { cn, sleep } from "@/utils";

export const MediaProfileHomeLayout: ViewComponent = (props) => {
  const { app, history, client, storage, pages, view } = props;

  const [curSubView, setCurSubView] = createSignal(view.curView);
  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });
  view.onCurViewChange((nextCurView) => {
    setCurSubView(nextCurView);
  });

  const [menus, setMenus] = createSignal([
    {
      text: "首页",
      icon: <Home class="w-6 h-6" />,
      url: "root.media_profile_layout.home" as PageKeys,
      // view: homeIndexPage,
    },
    // {
    //   text: "电视剧",
    //   icon: <Tv class="w-6 h-6" />,
    //   url: "/media_profile/home/season",
    //   // view: homeSeasonListPage,
    // },
    // {
    //   text: "电影",
    //   icon: <Film class="w-6 h-6" />,
    //   url: "/media_profile/home/movie",
    //   // view: homeMovieListPage,
    // },
  ]);

  onMount(() => {
    console.log("[PAGE]home/layout onMount");
  });

  return (
    <>
      <div class="flex w-full h-full bg-white">
        <div class="w-[248px] py-4 pl-2 pr-2 border border-r-slate-300">
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex-1 space-y-1 p-2 w-full h-full overflow-y-auto rounded-xl self-start">
              <For each={menus()}>
                {(menu) => {
                  const { icon, text, url } = menu;
                  return (
                    <Menu
                      app={app}
                      icon={icon}
                      history={history}
                      // highlight={(() => {
                      //   return curSubView() === view;
                      // })()}
                      url={url}
                    >
                      {text}
                    </Menu>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
        <div class="flex-1 bg-slate-100">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                const routeName = subView.name;
                const PageContent = pages[routeName as Exclude<PageKeys, "root">];
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "absolute inset-0",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    store={subView}
                    index={i()}
                  >
                    <PageContent
                      app={app}
                      history={history}
                      client={client}
                      storage={storage}
                      pages={pages}
                      view={subView}
                    />
                  </KeepAliveRouteView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
    </>
  );
};

function Menu(
  props: {
    app: Application;
    history: ViewComponentProps["history"];
    highlight?: boolean;
    url?: PageKeys;
    icon: JSX.Element;
    badge?: boolean;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const inner = (
    <div
      class={cn(
        "relative flex items-center px-4 py-2 space-x-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-300",
        props.highlight ? "bg-slate-200" : ""
      )}
      onClick={props.onClick}
    >
      <div class="w-6 h-6">{props.icon}</div>
      <div class="flex-1 text-lg text-slate-800">
        <div class="relative inline-block">
          {props.children}
          <Show when={props.badge}>
            <div class="absolute right-[-8px] top-0 w-2 h-2 rounded-full bg-red-500" />
          </Show>
        </div>
      </div>
    </div>
  );
  return (
    <Show when={props.url} fallback={inner}>
      <div
        onClick={() => {
          if (!props.url) {
            return;
          }
          props.history.push(props.url);
          // props.app.showView(props.url);
        }}
      >
        {inner}
      </div>
    </Show>
  );
}
