/**
 * @file 管理后台/云盘列表
 */
import { createSignal, For, Switch } from "solid-js";
import { RotateCcw, HardDrive, Search } from "lucide-solid";

import { Button, Dialog, ListView, Skeleton, ScrollView, Textarea, Checkbox, Input } from "@/components/ui";
import { DriveCard } from "@/components/DriveCard";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, CheckboxCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { addDrive } from "@/domains/drive";
import { fetchDriveInstanceList } from "@/domains/drive/services";
import { ListCore } from "@/domains/list";
import { code_get_drive_token, DriveTypes } from "@/constants";
import { ViewComponent } from "@/store/types";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { TabHeader } from "@/components/ui/tab-header";

export const DriveListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const driveList = new ListCore(new RequestCore(fetchDriveInstanceList), {
    search: {
      hidden: 0,
    },
  });
  const driveCreateRequest = new RequestCore(addDrive, {
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
  const driveTabs = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: DriveTypes.AliyunBackupDrive,
        text: "阿里云盘",
      },
      {
        id: DriveTypes.Cloud189Drive,
        text: "天翼云盘",
      },
      {
        id: DriveTypes.QuarkDrive,
        text: "夸克",
      },
      {
        id: DriveTypes.XunleiDrive,
        text: "迅雷",
      },
      {
        id: DriveTypes.LocalFolder,
        text: "文件夹",
      },
    ],
    onMounted() {
      driveTabs.selectById(DriveTypes.AliyunBackupDrive);
    },
  });
  const driveCreateDialog = new DialogCore({
    title: "新增云盘",
    onOk() {
      if (!driveTokenInput.value) {
        app.tip({ text: ["请输入云盘信息"] });
        return;
      }
      driveCreateRequest.run({ type: driveTabs.selectedTabId, payload: driveTokenInput.value });
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
  const [tabId, setTabId] = createSignal(driveTabs.selectedTabId);

  driveTabs.onChange((event) => {
    setTabId(event.id);
  });
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
                  const { name, avatar, drive_id, used_percent, used_size } = drive.state;
                  return (
                    <DriveCard
                      app={app}
                      store={drive}
                      onRefresh={() => {
                        driveList.refresh();
                      }}
                      onClick={() => {
                        // driveProfilePage.query = {
                        //   id: drive.id,
                        //   name,
                        //   avatar,
                        // };
                        // app.showView(driveProfilePage);
                        history.push("root.home_layout.drive_profile", {
                          id: drive.id,
                          name,
                          avatar,
                        });
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
        <div class="w-[520px]">
          <TabHeader store={driveTabs} />
          {(() => {
            if (tabId() === DriveTypes.AliyunBackupDrive) {
              return (
                <div class="p-4">
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
              );
            }
            if (tabId() === DriveTypes.Cloud189Drive) {
              return (
                <div class="p-4">
                  <p>1、准备天翼云盘账户名、密码。账户名即手机号；如果没有密码请先设置密码</p>
                  <p>2、构造 {`{"account": "", "pwd": ""}`}格式数据并粘贴到下方输入框，点击确认即可</p>
                </div>
              );
            }
            if (tabId() === DriveTypes.QuarkDrive) {
              return (
                <div class="p-4">
                  <p>1、在网页端登录夸克云盘</p>
                  <p>2、构造 {`{"id": "","token": ""}`}格式数据并粘贴到下方输入框，点击确认即可</p>
                </div>
              );
            }
            if (tabId() === DriveTypes.LocalFolder) {
              return (
                <div class="p-4">
                  <p>1、获取存放视频文件的文件夹「绝对路径」</p>
                  <p>2、构造 {`{"dir": ""}`}格式数据并粘贴到下方输入框，点击确认即可</p>
                </div>
              );
            }
          })()}
        </div>
        <Textarea store={driveTokenInput} />
      </Dialog>
    </>
  );
};
