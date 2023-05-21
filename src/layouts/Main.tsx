/**
 * @file 后台布局
 */
import { For, JSX, Show, children, createSignal } from "solid-js";
import { Calendar, Film, Users, FolderInput, Home } from "lucide-solid";

import { ViewCore } from "@/domains/view";
import { Application } from "@/domains/app";
// import { EmptyPageContainer } from "@/components/EmptyPageContainer";
import { NavigatorCore } from "@/domains/navigator";
import { ViewComponent } from "@/types";
import { View } from "@/components/ui/view";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";

export const MainLayout: ViewComponent = (props) => {
  const { app, router, view } = props;

  const dialog = new TMDBSearcherDialogCore();

  const [subViews, setSubViews] = createSignal(view.subViews);
  view.onSubViewsChange((nextSubViews) => {
    // console.log("[LAYOUT]MainLayout - subViewsChanged", nextSubViews.length);
    setSubViews(nextSubViews);
  });
  app.user.validate();

  // console.log("[LAYOUT]MainLayout - init", hidden);

  return (
    <View store={view}>
      <div class="min-h-screen flex p-8 bg-slate-200">
        <div class="fixed w-[240px] p-4 rounded-xl bg-white self-start">
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
              class="flex items-center p-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/unknown_tv");
              }}
            >
              <Film class="w-6 h-6" />
              <div class="text-xl">未知电视剧列表</div>
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
                dialog.show();
              }}
            >
              <Users class="w-6 h-6" />
              <div class="text-xl">TMDB 数据库</div>
            </div>
            <div
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/members");
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
            <div
              class="flex items-center p-2 rounded-lg cursor-pointer hover:bg-slate-200"
              onClick={() => {
                router.push("/parse");
              }}
            >
              <FolderInput class="w-6 h-6" />
              <div class="text-xl">解析文件名</div>
            </div>
          </div>
        </div>
        <div class="w-screen ml-[280px] space-y-4">
          <For each={subViews()}>
            {(subView) => {
              const PageContent = subView.component as ViewComponent;
              return (
                <View store={subView}>
                  <PageContent app={app} router={router} view={subView} />
                </View>
              );
            }}
          </For>
        </div>
      </div>
      <TMDBSearcherDialog store={dialog} />
    </View>
  );
};
