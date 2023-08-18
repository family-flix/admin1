/**
 * @file 后台/首页布局
 */
import { For, JSX, createSignal } from "solid-js";
import {
  Film,
  Users,
  FolderInput,
  Home,
  EyeOff,
  Bot,
  Flame,
  LogOut,
  Settings,
  Tv,
  FileSearch,
  File,
  CircuitBoard,
} from "lucide-solid";

import { Button, Dialog, KeepAliveRouteView } from "@/components/ui";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { FileSearchDialog } from "@/components/FileSearcher";
import { FileSearcherCore } from "@/components/FileSearcher/store";
import { ButtonCore, DialogCore } from "@/domains/ui";
import { NavigatorCore } from "@/domains/navigator";
import { Show } from "@/packages/ui/show";
import { ViewComponent } from "@/types";
import {
  homeFilenameParsingPage,
  homeIndexPage,
  homeMemberListPage,
  homeMovieListPage,
  homeTVListPage,
  homeTaskListPage,
  homeTransferPage,
  homeUnknownMediaLayout,
} from "@/store/views";
import { homeReportListPage, onJobsChange } from "@/store";
import { cn, sleep } from "@/utils";

export const HomeLayout: ViewComponent = (props) => {
  const { app, router, view } = props;

  const dialog = new TMDBSearcherDialogCore({
    footer: false,
  });
  const dialog2 = new FileSearcherCore({
    footer: false,
  });
  const logoutBtn = new ButtonCore({
    async onClick() {
      logoutBtn.setLoading(true);
      app.user.logout();
      await sleep(2000);
      logoutBtn.setLoading(false);
    },
  });
  const settingsDialog = new DialogCore({
    title: "配置",
  });
  const settingsBtn = new ButtonCore({
    onClick() {
      settingsDialog.show();
    },
  });

  const [pathname, setPathname] = createSignal(router.pathname);
  const [subViews, setSubViews] = createSignal(view.subViews);
  // const [curSubView, setCurSubView] = createSignal(view.curView);
  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });
  // view.onCurViewChange((nextCurView) => {
  //   setCurSubView(nextCurView);
  // });
  view.onMatched((subView) => {
    console.log("[LAYOUT]home/layout - view.onMatched", view.curView?._name, view.prevView?._name, subView._name);
    if (subView === view.curView) {
      return;
    }
    const prevView = view.curView;
    view.prevView = prevView;
    view.curView = subView;
    if (!view.subViews.includes(subView)) {
      view.appendSubView(subView);
    }
    subView.show();
    if (view.prevView) {
      const isMenusPage = [
        homeIndexPage,
        homeTVListPage,
        homeMovieListPage,
        homeUnknownMediaLayout,
        homeTaskListPage,
        homeReportListPage,
        homeMemberListPage,
        homeTransferPage,
        homeFilenameParsingPage,
      ].includes(view.prevView);
      // console.log("[LAYOUT]home/layout - check need remove subView", view.prevView._name, isMenusPage);
      if (!isMenusPage) {
        // console.log("[LAYOUT]home/layout - remove subView", view.prevView._name);
        view.prevView.hide();
        view.removeSubView(view.prevView);
        return;
      }
      view.prevView.hide();
    }
  });
  // view.onLayered(() => {
  //   console.log("[LAYOUT]home/layout - view.onLayered");
  // });
  // view.onUncover(() => {
  //   console.log("[LAYOUT]home/layout - view.onUncover");
  // });
  // 因为 home layout 和 playing page 是共存的，所以切换到 playing page 时，home layout 也会检查是否匹配，结果是不匹配
  // 所以给 home layout 加了个 index
  view.onNotFound(() => {
    // console.log("[LAYOUT]home/layout - view.onNotFound", view.subViews, view.state.visible, view.state.layered);
    if (view.state.layered) {
      return;
    }
    if (!view.state.visible) {
      return;
    }
    view.curView = homeIndexPage;
    view.curView.show();
    view.appendSubView(view.curView);
  });
  router.onPathnameChange(({ pathname, search, type }) => {
    // console.log("[LAYOUT]home/layout - router.onPathnameChange", view.state.visible, view.state.layered);
    setPathname(pathname);
    if (view.state.layered) {
      return;
    }
    view.checkMatch({ pathname, search, type });
  });
  dialog.onTip((msg) => {
    app.tip(msg);
  });
  view.checkMatch(router._pending);
  // app.user.validate();

  // const pathname = router.pathname;

  const [menus, setMenus] = createSignal([
    {
      text: "首页",
      icon: <Home class="w-6 h-6" />,
      link: "/home/index",
      // onClick() {
      //   router.push("/home/index");
      // },
    },
    {
      text: "电视剧",
      icon: <Tv class="w-6 h-6" />,
      link: "/home/tv",
      // onClick() {
      //   router.push("/home/tv");
      // },
    },
    {
      text: "电影",
      icon: <Film class="w-6 h-6" />,
      link: "/home/movie",
      // onClick() {
      //   router.push("/home/tv");
      // },
    },
    {
      text: "未识别影视剧",
      icon: <EyeOff class="w-6 h-6" />,
      link: "/home/unknown_tv",
    },
    {
      text: "任务",
      icon: <Bot class="w-6 h-6" />,
      link: "/home/task",
      badge: false,
      // onClick() {
      //   router.push("/home/task");
      // },
    },
    {
      text: "问题反馈",
      icon: <CircuitBoard class="w-6 h-6" />,
      link: "/home/report",
      badge: false,
      // onClick() {
      //   router.push("/home/task");
      // },
    },
    {
      text: "云盘文件搜索",
      icon: <File class="w-6 h-6" />,
      onClick() {
        dialog2.show();
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
      link: "/home/members",
      // onClick() {
      //   router.push("/home/members");
      // },
    },
    {
      text: "转存资源",
      icon: <FolderInput class="w-6 h-6" />,
      link: "/home/shared_files",
      // onClick() {
      //   router.push("/home/shared_files");
      // },
    },
    {
      text: "文件名解析",
      icon: <FileSearch class="w-6 h-6" />,
      link: "/home/parse",
      // onClick() {
      //   router.push("/home/parse");
      // },
    },
  ]);

  onJobsChange((jobs) => {
    setMenus(
      menus().map((menu) => {
        const { link } = menu;
        if (link === "/home/task") {
          return {
            ...menu,
            badge: jobs.length !== 0,
          };
        }
        return menu;
      })
    );
  });

  return (
    <>
      <div class="flex w-full h-full">
        <div class="w-[248px] py-8 pt-4 pl-2 pr-2 border border-r-slate-300">
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex-1 space-y-1 p-2 w-full h-full rounded-xl self-start">
              <For each={menus()}>
                {(menu) => {
                  const { icon, text, link, badge, onClick } = menu;
                  return (
                    <Menu
                      icon={icon}
                      highlight={(() => {
                        return pathname() === `${NavigatorCore.prefix}${link}`;
                      })()}
                      link={link}
                      badge={badge}
                      onClick={onClick}
                    >
                      {text}
                    </Menu>
                  );
                }}
              </For>
            </div>
            <div class="flex justify-center space-x-2 h-[68rpx]">
              <Button class="" store={logoutBtn} variant="subtle" icon={<LogOut class="w-4 h-4" />}>
                退出登录
              </Button>
              <Button class="" store={settingsBtn} variant="subtle" icon={<Settings class="w-4 h-4" />}>
                设置
              </Button>
            </div>
          </div>
        </div>
        <div class="flex-1 bg-slate-100">
          <div class="relative w-full h-full">
            <For each={subViews()}>
              {(subView, i) => {
                return (
                  <KeepAliveRouteView
                    class={cn(
                      "absolute inset-0",
                      "data-[state=open]:animate-in data-[state=open]:fade-in",
                      "data-[state=closed]:animate-out data-[state=closed]:fade-out"
                    )}
                    app={app}
                    router={router}
                    view={subView}
                    index={i()}
                  />
                );
              }}
            </For>
          </div>
        </div>
      </div>
      <TMDBSearcherDialog store={dialog} />
      <FileSearchDialog store={dialog2} />
      <Dialog store={settingsDialog}>敬请期待</Dialog>
    </>
  );
};

function Menu(
  props: {
    highlight?: boolean;
    link?: string;
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
    <Show when={props.link} fallback={inner}>
      <a href={props.link}>{inner}</a>
    </Show>
  );
}
