/**
 * @file 管理后台首页(云盘列表)
 */
import { createSignal, For, Show } from "solid-js";
import { RotateCcw, HardDrive, Search, Send, FileSearch } from "lucide-solid";

import { fetchDashboard } from "@/services/common";
import { Button, Dialog, ListView, Skeleton, ScrollView, Textarea, Checkbox, Input } from "@/components/ui";
import { DriveCard } from "@/components/DriveCard";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, CheckboxCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { addAliyunDrive } from "@/domains/drive";
import { fetchDriveInstanceList } from "@/domains/drive/services";
import { ListCore } from "@/domains/list";
import { code_get_drive_token, DriveTypes } from "@/constants";
import { ViewComponent } from "@/types";
import {
  driveProfilePage,
  homeDriveListPage,
  homeIndexPage,
  homeMovieListPage,
  homeReportListPage,
  homeSeasonListPage,
  homeInvalidMediaListPage,
} from "@/store";
import { pushMessageToMembers } from "@/services";
import { FilenameParserCore } from "@/components/FilenameParser";

export const HomePage: ViewComponent = (props) => {
  const { app, view } = props;

  const driveList = new ListCore(new RequestCore(fetchDriveInstanceList), {
    search: {
      hidden: 0,
    },
  });
  const dashboardRequest = new RequestCore(fetchDashboard, {
    defaultResponse: {
      drive_count: 0,
      drive_total_size_count: 0,
      drive_total_size_count_text: 0,
      drive_used_size_count: 0,
      drive_used_size_count_text: 0,
      movie_count: 0,
      tv_count: 0,
      season_count: 0,
      episode_count: 0,
      sync_task_count: 0,
      report_count: 0,
      media_request_count: 0,
      invalid_season_count: 0,
      invalid_sync_task_count: 0,
      updated_at: null,
    },
  });
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
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      driveList.loadMore();
    },
  });

  const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [dashboard, setDashboard] = createSignal(dashboardRequest.response);
  const [info, setInfo] = createSignal(filenameParser.state);

  driveList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });
  driveList.onStateChange((nextState) => {
    setDriveResponse(nextState);
  });
  dashboardRequest.onResponseChange((v) => {
    setDashboard(v);
  });
  filenameParser.onStateChange((nextState) => {
    setInfo(nextState);
  });

  driveList.initAny();
  dashboardRequest.run();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8 whitespace-nowrap">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl">
            <div>数据统计</div>
          </h1>
          <Show when={dashboard()}>
            <div>{dashboard()?.updated_at}</div>
          </Show>
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
                    app.showView(homeDriveListPage);
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
                    app.showView(homeSeasonListPage);
                  }}
                >
                  <div class="text-3xl">{dashboard()?.season_count}</div>
                  <div class="text-slate-800">电视剧</div>
                </div>
                <div
                  class="w-[240px] cursor-pointer"
                  onClick={() => {
                    app.showView(homeMovieListPage);
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
              <div
                class="w-[240px] cursor-pointer"
                onClick={() => {
                  app.showView(homeInvalidMediaListPage);
                }}
              >
                <div class="text-3xl">{dashboard()?.invalid_season_count}</div>
                <div class="text-slate-800">问题影视剧</div>
              </div>
              <div
                class="w-[240px] cursor-pointer"
                onClick={() => {
                  app.showView(homeInvalidMediaListPage);
                }}
              >
                <div class="text-3xl">{dashboard()?.invalid_sync_task_count}</div>
                <div class="text-slate-800">问题资源同步任务</div>
              </div>
              <div
                class="w-[240px] cursor-pointer"
                onClick={() => {
                  app.showView(homeReportListPage);
                }}
              >
                <div class="text-3xl">{dashboard()?.media_request_count}</div>
                <div class="text-slate-800">用户想看</div>
              </div>
              <div
                class="w-[240px] cursor-pointer"
                onClick={() => {
                  app.showView(homeReportListPage);
                }}
              >
                <div class="text-3xl">{dashboard()?.report_count}</div>
                <div class="text-slate-800">用户反馈</div>
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
