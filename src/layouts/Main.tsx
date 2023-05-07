/**
 * @file 后台布局
 */
import { For, JSX, Show, children, createSignal } from "solid-js";
import { Calendar, Film, Users, FolderInput, Home } from "lucide-solid";

import { ViewCore } from "@/domains/router";
import { PageCore } from "@/domains/router/something";
import { Application } from "@/domains/app";
// import { EmptyPageContainer } from "@/components/EmptyPageContainer";
import { NavigatorCore } from "@/domains/navigator";
import { ViewComponent } from "@/types";

export const MainLayout = (props: {
  app: Application;
  view: ViewCore;
  router: NavigatorCore;
  // page: PageCore;
}) => {
  const { app, router, view } = props;

  const [hidden, setHidden] = createSignal(view.hidden);
  const [subViews, setSubViews] = createSignal(view.subViews);
  view.onShow(() => {
    // view.log("MainLayout - show");
    setHidden(false);
  });
  view.onHide(() => {
    // console.log("[LAYOUT]MainLayout - hidden");
    setHidden(true);
  });
  view.onSubViewsChange((nextSubViews) => {
    // console.log("[LAYOUT]MainLayout - subViewsChanged", nextSubViews.length);
    setSubViews(nextSubViews);
  });

  // console.log("[LAYOUT]MainLayout - init", hidden);

  return (
    <Show when={!hidden()}>
      <div class="min-h-screen flex p-8 bg-slate-200">
        <div class="w-[240px] p-4 rounded-xl bg-white">
          <div class="space-y-2">
            <div
              class="flex items-center p-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/home");
              }}
            >
              <Home class="w-6 h-6" />
              <div class="text-xl">首页</div>
            </div>
            <div
              class="flex items-center p-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/tv");
              }}
            >
              <Film class="w-6 h-6" />
              <div class="text-xl">影片管理</div>
            </div>
            <div
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/task/list");
              }}
            >
              <Calendar class="w-6 h-6" />
              <p class="text-xl">任务列表</p>
            </div>
            <div
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
              onClick={() => {
                // modal.show();
              }}
            >
              <Users class="w-6 h-6" />
              <div class="text-xl">TMDB 数据库</div>
            </div>
            <div
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/member");
              }}
            >
              <Users class="w-6 h-6" />
              <div class="text-xl">所有成员</div>
            </div>
            <div
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/shared_files");
              }}
            >
              <FolderInput class="w-6 h-6" />
              <div class="text-xl">文件转存</div>
            </div>
            <div
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/shared_files_in_progress/list");
              }}
            >
              <FolderInput class="w-6 h-6" />
              <div class="text-xl">待处理更新</div>
            </div>
          </div>
        </div>
        <div class="flex-1 ml-8 space-y-4">
          <For each={subViews()}>
            {(subView) => {
              const PageContent = subView.component as ViewComponent;
              return <PageContent app={app} router={router} view={subView} />;
            }}
          </For>
        </div>
      </div>
    </Show>
  );
};
