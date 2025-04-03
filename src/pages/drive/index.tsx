/**
 * @file 管理后台/云盘列表
 */
import { createSignal, For, Switch } from "solid-js";
import { RotateCcw, HardDrive, Search } from "lucide-solid";

import { driveList } from "@/store/drives";
import { ViewComponent, ViewComponentProps } from "@/store/types";
import { Button, Dialog, ListView, Skeleton, ScrollView, Textarea, Checkbox, Input } from "@/components/ui";
import { DriveCard } from "@/components/DriveCard";
import { TabHeader } from "@/components/ui/tab-header";
import { DriveFiles } from "@/components/DriveFiles";
import { FieldObjectValuesView } from "@/components/ui/field-object-view";
import { ButtonCore, DialogCore, ScrollViewCore, InputCore, CheckboxCore, SelectCore } from "@/domains/ui";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { RequestCore } from "@/domains/request/index";
import { fetchLocalFiles } from "@/biz/services/drive";
import { addDrive, DriveFilesCore } from "@/biz/drive/index";
import { code_get_drive_token, DriveTypes } from "@/constants/index";

import { AlipanDriveCreateInput, AlipanOpenDriveCreateInput } from "./profile_input";
import { ObjectFieldCore, SingleFieldCore } from "@/domains/ui/formv2";

function DriveCreateViewModel(props: ViewComponentProps) {
  const drives = [
    {
      id: DriveTypes.AlipanOpenDrive,
      text: "阿里云盘/开放接口",
    },
    {
      id: DriveTypes.AliyunBackupDrive,
      text: "阿里云盘",
    },
    {
      id: DriveTypes.Drive115,
      text: "115",
    },
    {
      id: DriveTypes.Alist,
      text: "Alist",
    },
  ];

  const request = {
    drive: {
      list: driveList,
      create: new RequestCore(addDrive, {
        onLoading(loading) {
          $drive_create_dialog.okBtn.setLoading(loading);
        },
        onSuccess() {
          props.app.tip({ text: ["添加云盘成功"] });
          $drive_create_dialog.hide();
          $drive_token_input.clear();
          driveList.refresh();
        },
        onFailed(error) {
          props.app.tip({ text: ["添加云盘失败", error.message] });
        },
      }),
    },
  };

  const $tabs = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: DriveTypes.AlipanOpenDrive,
        text: "阿里云盘/开放接口",
      },
      {
        id: DriveTypes.AliyunBackupDrive,
        text: "阿里云盘",
      },
      // {
      //   id: DriveTypes.Drive115,
      //   text: "115",
      // },
      // {
      //   id: DriveTypes.Cloud189Drive,
      //   text: "天翼云盘",
      // },
      // {
      //   id: DriveTypes.QuarkDrive,
      //   text: "夸克",
      // },
      // {
      //   id: DriveTypes.XunleiDrive,
      //   text: "迅雷",
      // },
      {
        id: DriveTypes.Alist,
        text: "Alist",
      },
      // {
      //   id: DriveTypes.BOJU,
      //   text: "boju.cc",
      // },
      {
        id: DriveTypes.LocalFolder,
        text: "本地文件夹",
      },
    ],
    onMounted() {
      $tabs.selectById(DriveTypes.AlipanOpenDrive);
    },
    onChange(value) {
      if (value.id === DriveTypes.LocalFolder) {
        $files.appendColumn({
          file_id: "root",
          name: "文件",
        });
      }
    },
  });
  const $pan115_values = new ObjectFieldCore({
    label: "115",
    name: "pan115",
    fields: {
      user_id: new SingleFieldCore({
        name: "qrcode_token",
        label: "二维码Token",
        input: new InputCore({
          defaultValue: "",
        }),
      }),
      cookie: new SingleFieldCore({
        name: "qrcode_source",
        label: "二维码来源",
        input: new SelectCore({
          defaultValue: "alipaymini",
          options: [
            {
              value: "web",
              label: "web",
            },
            {
              value: "android",
              label: "android",
            },
            {
              value: "ios",
              label: "ios",
            },
            {
              value: "tv",
              label: "tv",
            },
            {
              value: "alipaymini",
              label: "alipaymini",
            },
            {
              value: "wechatmini",
              label: "wechatmini",
            },
            {
              value: "qandroid",
              label: "qandroid",
            },
          ],
        }),
      }),
    },
  });
  const $alist_values = new ObjectFieldCore({
    label: "Alist",
    name: "alist",
    fields: {
      url: new SingleFieldCore({
        name: "url",
        label: "URL",
        input: new InputCore({
          defaultValue: "",
        }),
      }),
      token: new SingleFieldCore({
        name: "token",
        label: "token",
        input: new InputCore({
          defaultValue: "",
        }),
      }),
      password: new SingleFieldCore({
        name: "password",
        label: "密码",
        input: new InputCore({
          defaultValue: "",
        }),
      }),
    },
  });
  const $drive_create_dialog = new DialogCore({
    title: "新增云盘",
    async onOk() {
      if ([DriveTypes.AlipanOpenDrive, DriveTypes.AliyunBackupDrive].includes($tabs.selectedTabId)) {
        if (!$drive_token_input.value) {
          props.app.tip({ text: ["请输入云盘信息"] });
          return;
        }
        request.drive.create.run({ type: $tabs.selectedTabId, payload: $drive_token_input.value });
        return;
      }
      if ($tabs.selectedTabId === DriveTypes.BOJU) {
        request.drive.create.run({ type: $tabs.selectedTabId, payload: JSON.stringify({}) });
        return;
      }
      if ($tabs.selectedTabId === DriveTypes.LocalFolder) {
        const selected = $files.selectedFolder;
        if (!selected) {
          props.app.tip({ text: ["请选择文件夹"] });
          return;
        }
        console.log("[PAGE]drive/index - before createDrive", selected);
        request.drive.create.run({ type: $tabs.selectedTabId, payload: JSON.stringify({ dir: selected.file_id }) });
        return;
      }
      if ($tabs.selectedTabId === DriveTypes.Drive115) {
        const r = await $pan115_values.validate();
        if (r.error) {
          props.app.tip({ text: ["请输入正确的115信息"] });
          return;
        }
        const payload = r.data;
        request.drive.create.run({ type: $tabs.selectedTabId, payload: JSON.stringify(payload) });
        return;
      }
      if ($tabs.selectedTabId === DriveTypes.Alist) {
        const r = await $alist_values.validate();
        if (r.error) {
          props.app.tip({ text: ["请输入正确的Alist信息"] });
          return;
        }
        const payload = r.data;
        if (!payload.url) {
          props.app.tip({ text: ["请输入正确的Alist信息"] });
          return;
        }
        request.drive.create.run({ type: $tabs.selectedTabId, payload: JSON.stringify(payload) });
        return;
      }
      props.app.tip({ text: ["暂不支持的云盘类型"] });
    },
  });
  const $drive_create_btn = new ButtonCore({
    onClick() {
      $drive_create_dialog.show();
    },
  });
  const $drive_token_input = new InputCore({
    defaultValue: "",
    placeholder: "请输入",
  });
  const $checkbox = new CheckboxCore({
    onChange(checked) {
      driveList.search({
        hidden: checked ? null : 0,
      });
    },
  });
  const $boju = new ButtonCore({
    onClick() {},
  });
  const $refresh_btn = new ButtonCore({
    onClick() {
      driveList.refresh();
    },
  });
  const $search_btn = new ButtonCore({
    onClick() {
      if (!$search_input.value) {
        props.app.tip({
          text: ["请输入搜索关键字"],
        });
        return;
      }
      driveList.search({
        name: $search_input.value,
      });
    },
  });
  const $search_input = new InputCore({
    defaultValue: "",
    onEnter() {
      $search_btn.click();
    },
  });
  const $reset_btn = new ButtonCore({
    onClick() {
      driveList.reset();
    },
  });
  const $files = new DriveFilesCore({ id: "", service: fetchLocalFiles });
  const $view = new ScrollViewCore({
    async onReachBottom() {
      await driveList.loadMore();
      $view.finishLoadingMore();
    },
  });

  return {
    request,
    ui: {
      $drive_create_dialog,
      $drive_create_btn,
      $drive_token_input,
      $refresh_btn,
      $reset_btn,
      $search_btn,
      $search_input,
      $tabs,
      $checkbox,
      $view,
      $files,
      $pan115_values,
      $alist_values,
    },
  };
}

export const DriveListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const $model = DriveCreateViewModel(props);

  const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [tabId, setTabId] = createSignal($model.ui.$tabs.selectedTabId);

  $model.ui.$tabs.onChange((event) => setTabId(event.id));
  driveList.onLoadingChange((v) => $model.ui.$refresh_btn.setLoading(v));
  driveList.onStateChange((v) => setDriveResponse(v));

  driveList.initAny();

  return (
    <>
      <ScrollView store={$model.ui.$view} class="h-screen p-8 whitespace-nowrap">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl">云盘列表</h1>
        </div>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCcw class="w-4 h-4" />} store={$model.ui.$refresh_btn}>
              刷新
            </Button>
            <Button class="" store={$model.ui.$reset_btn}>
              重置
            </Button>
            <Button store={$model.ui.$drive_create_btn} icon={<HardDrive class="w-4 h-4" />}>
              新增云盘
            </Button>
            <div class="flex items-center space-x-2">
              <Checkbox store={$model.ui.$checkbox}></Checkbox>
              <span>全部云盘</span>
            </div>
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={$model.ui.$search_input} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={$model.ui.$search_btn}>
              搜索
            </Button>
          </div>
          <ListView
            store={$model.request.drive.list}
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
      <Dialog store={$model.ui.$drive_create_dialog}>
        <div class="w-[520px] min-h-[120px]">
          <TabHeader store={$model.ui.$tabs} />
          {(() => {
            if (tabId() === DriveTypes.AlipanOpenDrive) {
              return (
                <>
                  <AlipanOpenDriveCreateInput app={app} store={$model.ui.$drive_token_input} />
                </>
              );
            }
            if (tabId() === DriveTypes.AliyunBackupDrive) {
              return (
                <>
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
                        <div class="overflow-y-auto h-[120px] break-all whitespace-pre-wrap">
                          {code_get_drive_token}
                        </div>
                      </div>
                    </div>
                    <p>3、回到已登录的阿里云盘页面，在浏览器「地址栏」手动输入 `javascript:`</p>
                    <p>4、紧接着粘贴复制的代码并回车</p>
                    <p>5、将得到的代码粘贴到下方输入框，点击确认即可</p>
                  </div>
                  <AlipanDriveCreateInput store={$model.ui.$drive_token_input} />
                </>
              );
            }
            if (tabId() === DriveTypes.Drive115) {
              return (
                <div class="py-4">
                  <FieldObjectValuesView store={$model.ui.$pan115_values} />
                </div>
              );
            }
            if (tabId() === DriveTypes.Alist) {
              return (
                <div class="py-4">
                  <FieldObjectValuesView store={$model.ui.$alist_values} />
                </div>
              );
            }
            // if (tabId() === DriveTypes.Cloud189Drive) {
            //   return (
            //     <div class="p-4">
            //       <div>1、准备天翼云盘账户名、密码。账户名即手机号；如果没有密码请先设置密码</div>
            //       <div>
            //         2、构造 <pre class="inline p-1 rounded-sm bg-gray-200">{`{"account": "", "pwd": ""}`}</pre>
            //         格式数据并粘贴到下方输入框，点击确认即可
            //       </div>
            //     </div>
            //   );
            // }
            // if (tabId() === DriveTypes.QuarkDrive) {
            //   return (
            //     <div class="p-4">
            //       <div>1、在网页端登录夸克云盘</div>
            //       <div>
            //         2、构造 <pre class="inline p-1 rounded-sm bg-gray-200">{`{"id": "","token": ""}`}</pre>
            //         格式数据并粘贴到下方输入框，点击确认即可
            //       </div>
            //     </div>
            //   );
            // }
            if (tabId() === DriveTypes.LocalFolder) {
              return (
                <div class="p-4">
                  <DriveFiles store={$model.ui.$files} />
                </div>
              );
            }
          })()}
        </div>
      </Dialog>
    </>
  );
};
