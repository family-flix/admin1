/**
 * @file 管理后台首页(云盘列表)
 */
import { createSignal, For, Show } from "solid-js";
import { Send, FileSearch, RefreshCcw, AlertTriangle, Loader, Bird } from "lucide-solid";

import { fetchDashboard, fetchMediaRecentlyCreated, refreshDashboard } from "@/services/common";
import { pushMessageToMembers } from "@/services";
import { Button, Dialog, ListView, Skeleton, ScrollView, Textarea, Checkbox, Input, LazyImage } from "@/components/ui";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, CheckboxCore } from "@/domains/ui";
import { ImageInListCore } from "@/domains/ui/image";
import { RequestCore } from "@/domains/request";
import { addAliyunDrive } from "@/domains/drive";
import { fetchDriveInstanceList } from "@/domains/drive/services";
import { ListCore } from "@/domains/list";
import { FilenameParserCore } from "@/components/FilenameParser";
import { DynamicContent } from "@/components/DynamicContent";
import { DynamicContentCore } from "@/domains/ui/dynamic-content";
import { DriveTypes, ReportTypes } from "@/constants";
import { ViewComponent } from "@/store/types";

export const HomeIndexPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const driveList = new ListCore(new RequestCore(fetchDriveInstanceList), {
    search: {
      hidden: 0,
    },
  });
  const dashboardRequest = new RequestCore(fetchDashboard, {
    defaultResponse: {
      drive_count: 0,
      drive_total_size_count: 0,
      drive_total_size_count_text: "0",
      drive_used_size_count: 0,
      drive_used_size_count_text: "0",
      movie_count: 0,
      tv_count: 0,
      season_count: 0,
      episode_count: 0,
      sync_task_count: 0,
      report_count: 0,
      media_request_count: 0,
      invalid_season_count: 0,
      invalid_movie_count: 0,
      invalid_sync_task_count: 0,
      updated_at: null,
    },
  });
  const mediaListRecentlyCreated = new ListCore(new RequestCore(fetchMediaRecentlyCreated));
  const pushRequest = new RequestCore(pushMessageToMembers, {
    onLoading(loading) {
      pushDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["推送成功"],
      });
      pushDialog.hide();
    },
  });
  const driveCreateRequest = new RequestCore(addAliyunDrive, {
    onLoading(loading) {
      driveCreateDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["添加云盘成功"] });
      driveCreateDialog.hide();
      driveTokenInput.clear();
      driveList.refresh();
    },
    onFailed(error) {
      app.tip({ text: ["添加云盘失败", error.message] });
    },
  });
  const refreshRequest = new RequestCore(refreshDashboard, {
    onSuccess() {
      app.tip({
        text: ["刷新成功"],
      });
      dashboardRequest.reload();
    },
  });
  const driveCreateDialog = new DialogCore({
    title: "新增阿里云盘",
    onOk() {
      if (!driveTokenInput.value) {
        app.tip({ text: ["请输入云盘信息"] });
        return;
      }
      driveCreateRequest.run({ type: DriveTypes.AliyunBackupDrive, payload: driveTokenInput.value });
    },
  });
  const driveCreateBtn = new ButtonCore({
    onClick() {
      driveCreateDialog.show();
    },
  });
  const driveTokenInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入",
  });
  const allDriveCheckbox = new CheckboxCore({
    onChange(checked) {
      driveList.search({
        hidden: checked ? null : 0,
      });
    },
  });
  const pushInput = new InputCore({
    defaultValue: "",
    onEnter() {
      pushDialog.okBtn.click();
    },
  });
  const pushDialog = new DialogCore({
    title: "群发消息",
    onOk() {
      if (!pushInput.value) {
        app.tip({
          text: ["请输入推送内容"],
        });
        return;
      }
      pushRequest.run({
        content: pushInput.value,
      });
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      driveList.refresh();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      if (!nameSearchInput.value) {
        app.tip({
          text: ["请输入搜索关键字"],
        });
        return;
      }
      driveList.search({
        name: nameSearchInput.value,
      });
    },
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    onEnter() {
      searchBtn.click();
    },
  });
  const filenameParseDialog = new DialogCore({
    title: "文件名解析",
    footer: false,
  });
  const filenameParser = new FilenameParserCore({});
  const resetBtn = new ButtonCore({
    onClick() {
      driveList.reset();
    },
  });
  const poster = new ImageInListCore({});
  const refreshIcon = new DynamicContentCore({
    value: 1,
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      driveList.loadMore();
    },
  });

  // const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [dashboard, setDashboard] = createSignal(dashboardRequest.response);
  const [info, setInfo] = createSignal(filenameParser.state);
  const [mediaResponse, setMediaResponse] = createSignal(mediaListRecentlyCreated.response);

  driveList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });
  // driveList.onStateChange((nextState) => {
  //   setDriveResponse(nextState);
  // });
  mediaListRecentlyCreated.onStateChange((v) => {
    setMediaResponse(v);
  });
  dashboardRequest.onResponseChange((v) => {
    setDashboard(v);
  });
  filenameParser.onStateChange((nextState) => {
    setInfo(nextState);
  });

  // driveList.initAny();
  mediaListRecentlyCreated.init();
  dashboardRequest.run();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8 whitespace-nowrap">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl">
            <div>数据统计</div>
          </h1>
          <div class="flex items-center space-x-2">
            <Show when={dashboard()}>
              <div>{dashboard()?.updated_at}</div>
              <div
                onClick={async () => {
                  refreshIcon.show(2);
                  mediaListRecentlyCreated.refresh();
                  const r = await refreshRequest.run();
                  if (r.error) {
                    refreshIcon.show(3);
                    return;
                  }
                  refreshIcon.show(1);
                }}
              >
                <DynamicContent
                  store={refreshIcon}
                  options={[
                    {
                      value: 1,
                      content: <RefreshCcw class="w-4 h-4 cursor-pointer" />,
                    },
                    {
                      value: 2,
                      content: <RefreshCcw class="w-4 h-4 animate animate-spin" />,
                    },
                    {
                      value: 3,
                      content: <AlertTriangle class="w-4 h-4" />,
                    },
                  ]}
                />
              </div>
            </Show>
          </div>
        </div>
        <div class="mt-8">
          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-8 p-4 rounded-md border bg-white">
              <div>
                <div class="text-lg">云盘信息</div>
              </div>
              <div class="flex items-center mt-4">
                <div class="w-[240px]">
                  <div class="text-3xl">{dashboard()?.drive_total_size_count_text}</div>
                  <div class="text-slate-800">云盘总容量</div>
                </div>
                <div class="w-[240px]">
                  <div class="text-3xl">{dashboard()?.drive_used_size_count_text}</div>
                  <div class="text-slate-800">云盘已用容量</div>
                </div>
                <div
                  class="w-[240px] cursor-pointer"
                  onClick={() => {
                    history.push("root.home_layout.drive_list");
                    // app.showView(homeDriveListPage);
                  }}
                >
                  <div class="text-3xl">{dashboard()?.drive_count}</div>
                  <div class="text-slate-800">云盘总数</div>
                </div>
              </div>
            </div>
            <div class="col-span-4 p-4 rounded-md border bg-white">
              <div>
                <div class="text-lg">媒体信息</div>
              </div>
              <div class="flex items-center mt-4">
                <div
                  class="w-[240px] cursor-pointer"
                  onClick={() => {
                    history.push("root.home_layout.season_list");
                    // app.showView(homeSeasonListPage);
                  }}
                >
                  <div class="text-3xl">{dashboard()?.season_count}</div>
                  <div class="text-slate-800">电视剧</div>
                </div>
                <div
                  class="w-[240px] cursor-pointer"
                  onClick={() => {
                    history.push("root.home_layout.movie_list");
                    // app.showView(homeMovieListPage);
                  }}
                >
                  <div class="text-3xl">{dashboard()?.movie_count}</div>
                  <div class="text-slate-800">电影</div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 p-4 rounded-md border bg-white">
            <div>
              <div class="text-lg">待处理问题</div>
            </div>
            <div class="flex items-center mt-4">
              <div class="w-[240px]">
                <span
                  class="text-3xl cursor-pointer"
                  onClick={() => {
                    history.push("root.home_layout.invalid_media_list");
                    // app.showView(homeInvalidMediaListPage);
                  }}
                >
                  {dashboard()?.invalid_season_count}
                </span>
                <div class="text-slate-800">问题电视剧</div>
              </div>
              <div class="w-[240px]">
                <div
                  class="text-3xl cursor-pointer"
                  onClick={() => {
                    history.push("root.home_layout.invalid_media_list");
                    // app.showView(homeInvalidMediaListPage);
                  }}
                >
                  {dashboard()?.invalid_movie_count}
                </div>
                <div class="text-slate-800">问题电影</div>
              </div>
              <div
                class="w-[240px] cursor-pointer"
                onClick={() => {
                  history.push("root.home_layout.resource_sync");
                  // app.showView(homeInvalidMediaListPage);
                }}
              >
                <div class="text-3xl">{dashboard()?.invalid_sync_task_count}</div>
                <div class="text-slate-800">问题资源同步任务</div>
              </div>
              <div
                class="w-[240px] cursor-pointer"
                onClick={() => {
                  history.push("root.home_layout.report_list", { type: String(ReportTypes.Want) });
                  // app.showView(homeReportListPage);
                }}
              >
                <div class="text-3xl">{dashboard()?.media_request_count}</div>
                <div class="text-slate-800">用户想看</div>
              </div>
              <div
                class="w-[240px] cursor-pointer"
                onClick={() => {
                  history.push("root.home_layout.report_list");
                  // app.showView(homeReportListPage);
                }}
              >
                <div class="text-3xl">{dashboard()?.report_count}</div>
                <div class="text-slate-800">用户反馈</div>
              </div>
            </div>
          </div>
          <div class="mt-8">
            <h1 class="text-2xl">
              <div>今日更新</div>
            </h1>
            <div class="relative mt-4 p-4 min-h-[270px] rounded-md border bg-white  max-w-full overflow-x-auto">
              <Show when={mediaResponse().loading}>
                <div class="absolute inset-0 flex items-center justify-center">
                  <Loader class="w-12 h-12 text-slate-500 animate animate-spin" />
                </div>
              </Show>
              <div class="flex flex-row space-x-4">
                <Show
                  when={!mediaResponse().empty}
                  fallback={
                    <div class="absolute inset-0 flex items-center justify-center">
                      <Bird class="w-16 h-16 text-slate-500" />
                    </div>
                  }
                >
                  <For each={mediaResponse().dataSource}>
                    {(media) => {
                      const { name, poster_path, text } = media;
                      return (
                        <div class="w-[128px]">
                          <LazyImage class="w-[128px]" store={poster.bind(poster_path)} />
                          <div class="max-w-full">
                            <div class="truncate">{name}</div>
                            <div class="max-w-full truncate text-sm">{text}</div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </Show>
              </div>
            </div>
          </div>
          <div class="mt-8">
            <h1 class="text-2xl">
              <div>常用工具</div>
            </h1>
            <div class="mt-4 flex items-center space-x-2">
              <div class=" relative">
                <div
                  class="flex flex-col items-center p-4 rounded-md bg-white border cursor-pointer"
                  onClick={() => {
                    pushDialog.show();
                  }}
                >
                  <Send class="w-6 h-6" />
                </div>
                <div class="mt-2 break-all text-sm text-center">消息推送</div>
              </div>
              <div class=" relative">
                <div
                  class="flex flex-col items-center p-4 rounded-md bg-white border cursor-pointer"
                  onClick={() => {
                    filenameParseDialog.show();
                  }}
                >
                  <FileSearch class="w-6 h-6" />
                </div>
                <div class="mt-2 break-all text-sm text-center">文件名解析</div>
              </div>
            </div>
          </div>
        </div>
      </ScrollView>
      <Dialog store={pushDialog}>
        <div class="w-[520px]">
          <div>
            <div>消息内容</div>
            <Textarea store={pushInput} />
          </div>
        </div>
      </Dialog>
      <Dialog store={filenameParseDialog}>
        <div class="w-[520px]">
          <div class="flex items-center space-x-2">
            <Input store={filenameParser.input} />
            <Button store={filenameParser.btn} class="btn btn--primary btn--block">
              解析
            </Button>
          </div>
          <div class="mt-4">
            <For each={info().fields}>
              {(field) => {
                return (
                  <div class="flex align-middle">
                    <div class="align-left min-w-[114px]">{field.label}</div>
                    <span>：</span>
                    <div class="align-left w-full break-all whitespace-pre-wrap">{field.text}</div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Dialog>
    </>
  );
};
