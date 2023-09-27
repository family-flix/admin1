/**
 * @file 管理后台首页(云盘列表)
 */
import { createSignal, For } from "solid-js";
import { RotateCcw, HardDrive, Search } from "lucide-solid";

import { Button, Dialog, ListView, Skeleton, ScrollView, Textarea, Checkbox, Input } from "@/components/ui";
import { DriveCard } from "@/components/DriveCard";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, CheckboxCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { addAliyunDrive } from "@/domains/drive";
import { fetchDriveInstanceList } from "@/domains/drive/services";
import { ListCore } from "@/domains/list";
import { code_get_drive_token } from "@/constants";
import { ViewComponent } from "@/types";
import { driveProfilePage } from "@/store";

export const HomePage: ViewComponent = (props) => {
  const { app, view } = props;

  const driveList = new ListCore(new RequestCore(fetchDriveInstanceList), {
    search: {
      hidden: 0,
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
      driveCreateRequest.run({ payload: driveTokenInput.value });
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
        hidden: checked ? null : 1,
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

  driveList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });
  driveList.onStateChange((nextState) => {
    setDriveResponse(nextState);
  });
  driveList.initAny();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8 whitespace-nowrap">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl">云盘列表</h1>
        </div>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button class="" store={resetBtn}>
              重置
            </Button>
            <Button store={driveCreateBtn} icon={<HardDrive class="w-4 h-4" />}>
              新增云盘
            </Button>
          </div>
          <div class="mt-4 space-x-2">
            <div class="flex items-center space-x-2">
              <Checkbox store={allDriveCheckbox}></Checkbox>
              <span>全部内容</span>
            </div>
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={nameSearchInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
              搜索
            </Button>
          </div>
          <ListView
            store={driveList}
            skeleton={
              <div class="grid grid-cols-1 gap-2 mt-4 lg:grid-cols-2">
                <div class="relative p-4 bg-white rounded-xl border border-1">
                  <div class="flex">
                    <Skeleton class="w-16 h-16 mr-4 rounded"></Skeleton>
                    <div class="flex-1 pr-12">
                      <Skeleton class="h-[24px]"></Skeleton>
                      <Skeleton class="mt-2 h-[18px]"></Skeleton>
                      <Skeleton class="mt-2 h-[24px]"></Skeleton>
                      <div class="flex items-center mt-4 space-x-2">
                        <Skeleton class="w-[56px] h-[28px]"></Skeleton>
                        <Skeleton class="w-[56px] h-[28px]"></Skeleton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div class="grid grid-cols-1 gap-2 mt-4 lg:grid-cols-2">
              <For each={driveResponse().dataSource}>
                {(drive) => {
                  const { name, avatar, used_percent, used_size } = drive.state;
                  return (
                    <DriveCard
                      app={app}
                      store={drive}
                      onRefresh={() => {
                        driveList.refresh();
                      }}
                      onClick={() => {
                        driveProfilePage.query = {
                          id: drive.id,
                          name,
                          avatar,
                        };
                        app.showView(driveProfilePage);
                        // const url = `/home/drive/${drive.id}?${query_stringify({})}`;
                        // router.push(url);
                        // const pathname = `/home/drive/${drive.id}`;
                        // router.push(pathname, {
                        //   name,
                        //   avatar,
                        //   used_percent: String(used_percent),
                        //   used_size,
                        // });
                      }}
                    />
                  );
                }}
              </For>
            </div>
          </ListView>
        </div>
      </ScrollView>
      <Dialog store={driveCreateDialog}>
        <div class="w-[520px] p-4">
          <p>1、在网页端登录阿里云盘</p>
          <p
            onClick={() => {
              app.copy(code_get_drive_token);
              app.tip({ text: ["复制成功"] });
            }}
          >
            2、点击复制下面代码
          </p>
          <div
            class="mt-2 border rounded-sm bg-gray-200"
            onClick={() => {
              app.copy(code_get_drive_token);
              app.tip({ text: ["复制成功"] });
            }}
          >
            <div class="relative p-2">
              <div class="overflow-y-auto h-[120px] break-all whitespace-pre-wrap">{code_get_drive_token}</div>
            </div>
          </div>
          <p>3、回到已登录的阿里云盘页面，在浏览器「地址栏」手动输入 `javascript:`</p>
          <p>4、紧接着粘贴复制的代码并回车</p>
          <p>5、将得到的代码粘贴到下方输入框，点击确认即可</p>
        </div>
        <Textarea store={driveTokenInput} />
      </Dialog>
    </>
  );
};
