/**
 * @file 后台/首页布局
 */
import { For, JSX, createSignal, onMount } from "solid-js";
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
  Lock,
  Subtitles,
} from "lucide-solid";

import { Button, Dialog, Input, KeepAliveRouteView, Textarea } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { FileSearchDialog, FileSearcherCore } from "@/components/FileSearcher";
import { ButtonCore, DialogCore, InputCore } from "@/domains/ui";
import { RouteViewCore } from "@/domains/route_view";
import { RequestCore } from "@/domains/request";
import { Application } from "@/domains/app";
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
import {
  homeLayout,
  homePermissionListPage,
  homeReportListPage,
  homeSubtitleAddingPage,
  homeSubtitleListPage,
  onJobsChange,
} from "@/store";
import { cn, sleep } from "@/utils";
import { fetch_settings, notify_test, update_settings } from "@/services";

export const HomeLayout: ViewComponent = (props) => {
  const { app, view } = props;

  const tmdbDialog = new TMDBSearcherDialogCore({
    footer: false,
  });
  const fileSearchDialog = new FileSearcherCore({
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
  const settingsUpdateRequest = new RequestCore(update_settings, {
    onLoading(loading) {
      settingsDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["更新成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["更新失败", error.message],
      });
    },
  });
  const settingsDialog = new DialogCore({
    title: "配置",
    onOk() {
      const values = {
        push_deer_token: notify1TokenInput.value.trim(),
        extra_filename_rules: filenameParseRuleInput.value.trim(),
      };
      if (Object.keys(values).length === 0) {
        app.tip({
          text: ["配置不能均为空"],
        });
        return;
      }
      if (values.extra_filename_rules) {
        const rules = values.extra_filename_rules.split("\n\n").map((rule) => {
          const [regexp, placeholder] = rule.split("\n");
          return {
            regexp,
            placeholder,
          };
        });
        const invalid_rule = rules.some((rule) => {
          const { regexp, placeholder } = rule;
          if (!regexp || !placeholder) {
            return true;
          }
          try {
            new RegExp(regexp);
          } catch (err) {
            return true;
          }
        });
        if (invalid_rule) {
          app.tip({
            text: ["存在不合法的解析规则，请检查后重新提交"],
          });
          return;
        }
      }
      settingsUpdateRequest.run(values);
    },
  });
  const filenameParseRuleInput = new InputCore({
    defaultValue: "",
    placeholder: "额外解析规则",
  });
  const notify1TokenInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入 push deer token",
  });
  const notify1TestRequest = new RequestCore(notify_test, {
    onLoading(loading) {
      notify1TestBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["发送成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["发送失败", error.message],
      });
    },
  });
  const notify1TestInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入文本测试消息推送",
  });
  const notify1TestBtn = new ButtonCore({
    onClick() {
      if (!notify1TokenInput.value) {
        app.tip({
          text: ["请输入推送 token"],
        });
        return;
      }
      if (!notify1TestInput.value) {
        app.tip({
          text: ["请输入推送文本"],
        });
        return;
      }
      notify1TestRequest.run({
        text: notify1TestInput.value,
        token: notify1TokenInput.value,
      });
    },
  });
  const settingsRequest = new RequestCore(fetch_settings, {
    onLoading(loading) {
      settingsBtn.setLoading(loading);
    },
    onSuccess(v) {
      notify1TokenInput.setValue(v.push_deer_token);
      filenameParseRuleInput.setValue(v.extra_filename_rules);
      settingsDialog.show();
    },
    onFailed(error) {
      app.tip({
        text: ["获取设置失败", error.message],
      });
    },
  });
  const settingsBtn = new ButtonCore({
    onClick() {
      settingsRequest.run();
    },
  });

  const [curSubView, setCurSubView] = createSignal(view.curView);
  const [subViews, setSubViews] = createSignal(view.subViews);

  view.onSubViewsChange((nextSubViews) => {
    setSubViews(nextSubViews);
  });
  view.onCurViewChange((nextCurView) => {
    setCurSubView(nextCurView);
  });
  tmdbDialog.onTip((msg) => {
    app.tip(msg);
  });
  fileSearchDialog.onTip((msg) => {
    app.tip(msg);
  });

  const [menus, setMenus] = createSignal([
    {
      text: "首页",
      icon: <Home class="w-6 h-6" />,
      view: homeIndexPage,
    },
    {
      text: "电视剧",
      icon: <Tv class="w-6 h-6" />,
      view: homeTVListPage,
    },
    {
      text: "电影",
      icon: <Film class="w-6 h-6" />,
      view: homeMovieListPage,
    },
    {
      text: "字幕管理",
      icon: <Subtitles class="w-6 h-6" />,
      view: homeSubtitleListPage,
    },
    {
      text: "未识别影视剧",
      icon: <EyeOff class="w-6 h-6" />,
      view: homeUnknownMediaLayout,
    },
    {
      text: "任务",
      icon: <Bot class="w-6 h-6" />,
      badge: false,
      view: homeTaskListPage,
    },
    {
      text: "问题反馈",
      icon: <CircuitBoard class="w-6 h-6" />,
      badge: false,
      view: homeReportListPage,
    },
    {
      text: "云盘文件搜索",
      icon: <File class="w-6 h-6" />,
      onClick() {
        fileSearchDialog.show();
      },
    },
    {
      text: "TMDB 数据库",
      icon: <Flame class="w-6 h-6" />,
      onClick() {
        tmdbDialog.show();
      },
    },
    {
      text: "成员",
      icon: <Users class="w-6 h-6" />,
      view: homeMemberListPage,
    },
    {
      text: "转存资源",
      icon: <FolderInput class="w-6 h-6" />,
      view: homeTransferPage,
    },
    {
      text: "文件名解析",
      icon: <FileSearch class="w-6 h-6" />,
      view: homeFilenameParsingPage,
    },
  ]);

  onMount(() => {
    console.log("[PAGE]home/layout onMount");
  });

  onJobsChange((jobs) => {
    setMenus(
      menus().map((menu) => {
        const { view } = menu;
        if (view === homeTaskListPage) {
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
                  const { icon, text, view, badge, onClick } = menu;
                  return (
                    <Menu
                      app={app}
                      icon={icon}
                      highlight={(() => {
                        return curSubView() === view;
                      })()}
                      view={view}
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
                    router={app.router}
                    view={subView}
                    index={i()}
                  />
                );
              }}
            </For>
          </div>
        </div>
      </div>
      <TMDBSearcherDialog store={tmdbDialog} />
      <FileSearchDialog store={fileSearchDialog} />
      <Dialog store={settingsDialog}>
        <div>
          <div>PushDeer token</div>
          <Textarea store={notify1TokenInput} />
          <div class="mt-2 flex items-center space-x-2">
            <Input store={notify1TestInput} />
            <Button variant="subtle" store={notify1TestBtn}>
              发送
            </Button>
          </div>
        </div>
        <div class="mt-4">
          <div>文件名解析规则</div>
          <Textarea store={filenameParseRuleInput} />
        </div>
      </Dialog>
    </>
  );
};

function Menu(
  props: {
    app: Application;
    highlight?: boolean;
    view?: RouteViewCore;
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
    <Show when={props.view} fallback={inner}>
      <div
        onClick={() => {
          if (!props.view) {
            return;
          }
          props.app.showView(props.view);
        }}
      >
        {inner}
      </div>
    </Show>
  );
}
