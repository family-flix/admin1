/**
 * @file 后台布局
 */
import { For, JSX, Show, children, createSignal } from "solid-js";
import { Calendar, Film, Users, FolderInput, Home } from "lucide-solid";

import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ViewComponent } from "@/types";
import { KeepAliveView } from "@/components/ui/keep-alive";

export const MainLayout: ViewComponent = (props) => {
  const { app, router, view } = props;

  const dialog = new TMDBSearcherDialogCore({
    footer: false,
  });

  const [subViews, setSubViews] = createSignal(view.subViews);
  view.onSubViewsChange((nextSubViews) => {
    // console.log("[LAYOUT]MainLayout - subViewsChanged", nextSubViews.length);
    setSubViews(nextSubViews);
  });
  app.user.validate();

  // console.log("[LAYOUT]MainLayout - init", hidden);
  const menus = [
    {
      text: "首页",
      icon: <Home class="w-6 h-6" />,
      onClick() {
        router.push("/home");
      },
    },
    {
      text: "电视剧",
      icon: <Film class="w-6 h-6" />,
      onClick() {
        router.push("/tv");
      },
    },
    {
      text: "未识别电视剧",
      icon: <Film class="w-6 h-6" />,
      onClick() {
        router.push("/unknown_tv");
      },
    },
    {
      text: "日志",
      icon: <Film class="w-6 h-6" />,
      onClick() {
        router.push("/task");
      },
    },
    {
      text: "TMDB 数据库",
      icon: <Users class="w-6 h-6" />,
      onClick() {
        dialog.show();
      },
    },
    {
      text: "成员",
      icon: <Users class="w-6 h-6" />,
      onClick() {
        router.push("/members");
      },
    },
    {
      text: "转存资源",
      icon: <Users class="w-6 h-6" />,
      onClick() {
        router.push("/shared_files");
      },
    },
    {
      text: "文件名解析",
      icon: <Users class="w-6 h-6" />,
      onClick() {
        router.push("/parse");
      },
    },
  ];

  return (
    <>
      <div class="grid gap-4 grid-cols-12 min-h-screen p-8 bg-slate-200">
        <div class="col-span-2 p-4 rounded-xl bg-white self-start shadow-xl">
          <div class="space-y-2">
            <For each={menus}>
              {(menu) => {
                const { icon, text, onClick } = menu;
                return (
                  <Menu icon={icon} onClick={onClick}>
                    {text}
                  </Menu>
                );
              }}
            </For>
          </div>
        </div>
        <div class="col-span-10 p-4 bg-white rounded-lg">
          <div class="relative">
            <For each={subViews()}>
              {(subView, i) => {
                const PageContent = subView.component as ViewComponent;
                return (
                  <KeepAliveView store={subView} index={i()}>
                    <div class="bg-white">
                      <PageContent app={app} router={router} view={subView} />
                    </div>
                  </KeepAliveView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
      <TMDBSearcherDialog store={dialog} />
    </>
  );
};

function Menu(
  props: {
    icon: JSX.Element;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  const { icon } = props;

  return (
    <div
      class="flex items-center px-4 py-2 space-x-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-200"
      onClick={props.onClick}
    >
      <div class="w-6 h-6">{icon}</div>
      <div class="flex-1 text-xl">{props.children}</div>
    </div>
  );
}
