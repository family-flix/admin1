/**
 * @file 后台布局
 */
import { For, createSignal } from "solid-js";

import { ViewCore } from "@/domains/router";
import { PageCore } from "@/domains/router/something";
import { Application } from "@/domains/app";
import { FilmIcon } from "@/components/icons/film";
import { CalendarIcon } from "@/components/icons/calendar-check";
import { UsersIcon } from "@/components/icons/users";
import { FolderInputIcon } from "@/components/icons/folder-input";
import { HomeIcon } from "@/components/icons/home";
// import { EmptyPageContainer } from "@/components/EmptyPageContainer";
import { NavigatorCore } from "@/domains/navigator";

export const MainLayout = (props: {
  app: Application;
  view: ViewCore;
  router: NavigatorCore;
  // page: PageCore;
}) => {
  const { app, router, view } = props;

  const [subViews, setSubViews] = createSignal([]);

  console.log("[LAYOUT]MainLayout - render", view);
  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });
  view.start({ pathname: router.pathname });

  return (
    <div class="min-h-screen flex p-8">
      <div class="w-[240px] p-4 bg-white rounded-xl">
        <div class="space-y-2">
          <div
            class="flex items-center p-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-200"
            onClick={() => {
              router.push("/home");
            }}
          >
            <HomeIcon class="w-6 h-6" />
            <div class="text-xl">首页</div>
          </div>
          <div
            class="flex items-center p-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-200"
            onClick={() => {
              router.push("/tv");
            }}
          >
            <FilmIcon class="w-6 h-6" />
            <div class="text-xl">影片管理</div>
          </div>
          <div
            class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
            onClick={() => {
              router.push("/task/list");
            }}
          >
            <CalendarIcon class="w-6 h-6" />
            <p class="text-xl">任务列表</p>
          </div>
          {/* <div
              class="card cursor-pointer"
              onClick={() => {
                modal.show();
              }}
            >
              <div>TMDB 数据库</div>
            </div> */}
          <div
            class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
            onClick={() => {
              router.push("/member");
            }}
          >
            <UsersIcon class="w-6 h-6" />
            <div class="text-xl">所有成员</div>
          </div>
          <div
            class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
            onClick={() => {
              router.push("/shared_files");
            }}
          >
            <FolderInputIcon class="w-6 h-6" />
            <div class="text-xl">文件转存</div>
          </div>
          <div
            class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
            onClick={() => {
              router.push("/shared_files_in_progress/list");
            }}
          >
            <FolderInputIcon class="w-6 h-6" />
            <div class="text-xl">待处理更新</div>
          </div>
        </div>
      </div>
      <div class="flex-1 ml-12 space-y-4">
        <For each={subViews()}>
          {(view) => {
            const PageContent = view.component;
            return <PageContent app={app} router={navigator} view={view} />;
          }}
        </For>
      </div>
    </div>
  );
};
