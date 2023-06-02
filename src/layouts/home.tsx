/**
 * @file 后台布局
 */
import { For, JSX, Show, children, createSignal } from "solid-js";
import { Calendar, Film, Users, FolderInput, Home, EyeOff, Bot, Flame, FolderSearch } from "lucide-solid";

import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ViewComponent } from "@/types";
import { KeepAliveRouteView } from "@/components/ui/keep-alive-route-view";
import { cn } from "@/utils";

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
      icon: <EyeOff class="w-6 h-6" />,
      onClick() {
        router.push("/unknown_tv");
      },
    },
    {
      text: "日志",
      icon: <Bot class="w-6 h-6" />,
      onClick() {
        router.push("/task");
      },
    },
    {
      text: "TMDB 数据库",
      icon: <Flame class="w-6 h-6" />,
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
      icon: <FolderInput class="w-6 h-6" />,
      onClick() {
        router.push("/shared_files");
      },
    },
    {
      text: "文件名解析",
      icon: <FolderSearch class="w-6 h-6" />,
      onClick() {
        router.push("/parse");
      },
    },
  ];

  return (
    <>
      <div class="flex w-full h-full">
        <div class="w-[248px] py-8 pl-2 border border-r-slate-300">
          <div class="space-y-1 p-2 h-full rounded-xl self-start">
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
        <div class="flex-1">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                const Page = subView.component as ViewComponent;
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    store={subView}
                    index={i()}
                  >
                    <div class="overflow-y-auto w-full h-full p-8 pl-4">
                      <div class="min-h-full">
                        <Page app={app} router={router} view={subView} />
                      </div>
                    </div>
                  </KeepAliveRouteView>
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
    highlight?: boolean;
    icon: JSX.Element;
  } & JSX.HTMLAttributes<HTMLDivElement>
) {
  return (
    <div
      class={cn(
        "flex items-center px-4 py-2 space-x-2 rounded-lg opacity-80 cursor-pointer hover:bg-slate-300",
        props.highlight ? "bg-slate-100" : ""
      )}
      onClick={props.onClick}
    >
      <div class="w-6 h-6">{props.icon}</div>
      <div class="flex-1 text-lg text-slate-800">{props.children}</div>
    </div>
  );
}
