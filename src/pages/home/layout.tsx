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
  Subtitles,
  MessageCircle,
  AlarmClock,
  Folder,
  Cherry,
  Sparkles,
  HeartCrack,
} from "lucide-solid";

import { ViewComponent, ViewComponentProps } from "@/store/types";
import { onJobsChange } from "@/store/job";
import { PageKeys } from "@/store/routes";
import { fetchSettings, notify_test, updateSettings } from "@/services";
import { Show } from "@/packages/ui/show";
import { Button, Dialog, DropdownMenu, Input, KeepAliveRouteView, Textarea } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { FileSearchDialog, FileSearcherCore } from "@/components/FileSearcher";
import { ButtonCore, DialogCore, DropdownMenuCore, InputCore, MenuCore, MenuItemCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { Application } from "@/domains/app";
import { HistoryCore } from "@/domains/history";
import { cn, sleep } from "@/utils";

export const HomeLayout: ViewComponent = (props) => {
  const { app, history, client, storage, pages, view } = props;

  const settingsRequest = new RequestCore(fetchSettings, {
    onLoading(loading) {
      settingsBtn.setLoading(loading);
    },
    onSuccess(v) {
      const { push_deer_token = "", extra_filename_rules = "", ignore_files_when_sync = "" } = v;
      notify1TokenInput.setValue(push_deer_token);
      filenameParseRuleInput.setValue(extra_filename_rules);
      ignoreFilesRuleInput.setValue(ignore_files_when_sync);
    },
    onFailed(error) {
      app.tip({
        text: ["获取设置失败", error.message],
      });
    },
  });
  const expiredDeletingRequest = new RequestCore(fetchSettings, {
    onLoading(loading) {
      expiredDeletingBtn.setLoading(loading);
    },
    onSuccess(v) {
      app.tip({
        text: ["清除成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["获取设置失败", error.message],
      });
    },
  });
  const tmdbDialog = new TMDBSearcherDialogCore({
    footer: false,
  });
  const fileSearchDialog = new FileSearcherCore({
    footer: false,
  });
  const logoutBtn = new ButtonCore({
    async onClick() {
      logoutBtn.setLoading(true);
      app.$user.logout();
      await sleep(2000);
      logoutBtn.setLoading(false);
    },
  });
  const settingsUpdateRequest = new RequestCore(updateSettings, {
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
      const notify1Token = notify1TokenInput.value?.trim();
      const ignoreFilesRule = ignoreFilesRuleInput.value?.trim();
      const filenameParse = filenameParseRuleInput.value?.trim();
      const values = {
        ignore_files_when_sync: ignoreFilesRule,
        push_deer_token: notify1TokenInput.value?.trim(),
        extra_filename_rules: filenameParseRuleInput.value?.trim(),
      };
      if (notify1Token) {
        values.push_deer_token = notify1Token;
      }
      if (filenameParse) {
        values.extra_filename_rules = filenameParse;
      }
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
  const ignoreFilesRuleInput = new InputCore({
    defaultValue: "",
    placeholder: "转存时可忽略指定文件/文件夹",
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
  const settingsBtn = new ButtonCore({
    onClick() {
      settingsRequest.run();
      settingsDialog.show();
    },
  });
  const expiredDeletingBtn = new ButtonCore({});

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
      // url: "/home/index",
      url: "root.home_layout.index" as PageKeys,
      // view: homeIndexPage,
    },
    {
      text: "电视剧",
      icon: <Tv class="w-6 h-6" />,
      // url: "/home/season",
      url: "root.home_layout.season_list" as PageKeys,
      // view: homeSeasonListPage,
    },
    {
      text: "电影",
      icon: <Film class="w-6 h-6" />,
      // url: "/home/movie",
      url: "root.home_layout.movie_list" as PageKeys,
      // view: homeMovieListPage,
    },
    {
      text: "刮削结果",
      icon: <Sparkles class="w-6 h-6" />,
      // url: "/home/unknown_media/season",
      url: "root.home_layout.parse_result_layout.season" as PageKeys,
      // view: homeUnknownTVPage,
    },
    {
      text: "问题影视剧",
      icon: <HeartCrack class="w-6 h-6" />,
      badge: false,
      // url: "/home/invalid_media",
      url: "root.home_layout.invalid_media_list" as PageKeys,
      // view: homeInvalidMediaListPage,
    },
    {
      text: "集合管理",
      icon: <Folder class="w-6 h-6" />,
      // url: "/home/collection",
      url: "root.home_layout.collection_list" as PageKeys,
      // view: collectionListPage,
    },
    {
      text: "字幕管理",
      icon: <Subtitles class="w-6 h-6" />,
      // url: "/home/subtitle",
      url: "root.home_layout.subtitles_list" as PageKeys,
      // view: homeSubtitleListPage,
    },
    {
      text: "同步任务",
      icon: <AlarmClock class="w-6 h-6" />,
      // view: syncTaskListPage,
      url: "root.home_layout.resource_sync" as PageKeys,
    },
    {
      text: "任务",
      icon: <Bot class="w-6 h-6" />,
      badge: false,
      // url: "/home/log",
      // view: homeTaskListPage,
      url: "root.home_layout.job_list" as PageKeys,
    },
    {
      text: "问题反馈",
      icon: <CircuitBoard class="w-6 h-6" />,
      badge: false,
      // url: "/home/report",
      // view: homeReportListPage,
      url: "root.home_layout.report_list" as PageKeys,
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
    // {
    //   text: "群发消息",
    //   icon: <MessageCircle class="w-6 h-6" />,
    //   onClick() {
    //     pushDialog.show();
    //   },
    // },
    {
      text: "成员",
      icon: <Users class="w-6 h-6" />,
      // view: homeMemberListPage,
      url: "root.home_layout.member_list" as PageKeys,
    },
    {
      text: "转存资源",
      icon: <FolderInput class="w-6 h-6" />,
      // view: homeTransferPage,
      url: "root.home_layout.transfer" as PageKeys,
    },
    // {
    //   text: "文件名解析",
    //   icon: <FileSearch class="w-6 h-6" />,
    //   view: homeFilenameParsingPage,
    // },
  ]);
  const userDropdown = new DropdownMenuCore({
    align: "start",
    side: "bottom",
    items: [
      new MenuItemCore({
        icon: <Settings class="w-4 h-4" />,
        label: "设置",
        onClick() {
          settingsRequest.run();
          userDropdown.hide();
          settingsDialog.show();
        },
      }),
      new MenuItemCore({
        icon: <LogOut class="w-4 h-4" />,
        label: "退出登录",
        async onClick() {
          logoutBtn.setLoading(true);
          app.$user.logout();
          await sleep(2000);
          userDropdown.hide();
          logoutBtn.setLoading(false);
        },
      }),
    ],
  });

  const [curRouteName, setCurRouteName] = createSignal(history.$router.name);

  // onMount(() => {
  // console.log("[PAGE]home/layout onMount", history.$router.href);
  // });
  history.onRouteChange(({ name }) => {
    setCurRouteName(name);
  });
  onJobsChange((jobs) => {
    setMenus(
      menus().map((menu) => {
        const { url } = menu;
        if (url === "root.home_layout.job_list") {
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
      <div class="flex w-full h-full bg-white">
        <div class="w-[248px] py-4 pl-2 pr-2 border border-r-slate-300">
          <div class="flex flex-col justify-between h-full w-full">
            <div class="flex-1 space-y-1 p-2 w-full h-full overflow-y-auto rounded-xl self-start">
              <For each={menus()}>
                {(menu) => {
                  const { icon, text, url, badge, onClick } = menu;
                  return (
                    <Menu
                      app={app}
                      icon={icon}
                      history={history}
                      highlight={(() => {
                        return curRouteName() === url;
                      })()}
                      url={url}
                      badge={badge}
                      onClick={onClick}
                    >
                      {text}
                    </Menu>
                  );
                }}
              </For>
            </div>
            {/* <div class="flex justify-center space-x-2 h-[68rpx] py-2">
              <Button class="" store={logoutBtn} variant="subtle" icon={<LogOut class="w-4 h-4" />}>
                退出登录
              </Button>
              <Button class="" store={settingsBtn} variant="subtle" icon={<Settings class="w-4 h-4" />}>
                设置
              </Button>
            </div> */}
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
                      client={client}
                      storage={storage}
                      pages={pages}
                      history={history}
                      view={subView}
                    />
                  </KeepAliveRouteView>
                );
              }}
            </For>
          </div>
        </div>
      </div>
      <div class="absolute z-50 right-8 top-6">
        <DropdownMenu store={userDropdown}>
          <div class="w-12 h-12 rounded-full bg-slate-300"></div>
        </DropdownMenu>
      </div>
      <TMDBSearcherDialog store={tmdbDialog} />
      <FileSearchDialog store={fileSearchDialog} />
      <Dialog store={settingsDialog}>
        <div class="w-[520px]">
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
          <div class="mt-4">
            <div>转存忽略规则</div>
            <Textarea store={ignoreFilesRuleInput} />
          </div>
          {/* <div class="mt-4">
            <div>其他</div>
            <Button store={expiredDeletingBtn}>清除失效视频源</Button>
          </div> */}
        </div>
      </Dialog>
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
          // props.app.showView(props.view);
        }}
      >
        {inner}
      </div>
    </Show>
  );
}
