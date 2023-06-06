/**
 * @file 管理后台首页
 */
import { createSignal, For, onMount, Show } from "solid-js";
import { HardDrive } from "lucide-solid";

import { DriveCard } from "@/components/DriveCard";
import { ViewComponent } from "@/types";
import { Button } from "@/components/ui/button";
import { ButtonCore } from "@/domains/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DialogCore } from "@/domains/ui/dialog";
import { code_get_drive_token } from "@/constants";
import { Textarea } from "@/components/ui/textarea";
import { InputCore } from "@/domains/ui/input";
import { RequestCore } from "@/domains/client";
import { addAliyunDrive } from "@/domains/drive/services";

export const HomePage: ViewComponent = (props) => {
  const { app, view } = props;

  const addDriveRequest = new RequestCore(addAliyunDrive, {
    onLoading(loading) {
      addingDriveDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["添加云盘成功"] });
      addingDriveDialog.hide();
      driveTokenInput.clear();
      app.refreshDrives();
    },
    onFailed(error) {
      app.tip({ text: ["添加云盘失败", error.message] });
    },
  });
  const addingDriveDialog = new DialogCore({
    title: "新增阿里云盘",
    onOk() {
      if (!driveTokenInput.value) {
        app.tip({ text: ["请输入云盘信息"] });
        return;
      }
      addDriveRequest.run({ payload: driveTokenInput.value });
    },
  });
  const addingDriveBtn = new ButtonCore({
    onClick() {
      addingDriveDialog.show();
    },
  });
  const driveTokenInput = new InputCore({
    placeholder: "请输入",
  });

  const [drives, setDrives] = createSignal(app.drives);

  view.onShow(() => {
    console.log("home page show");
  });
  view.onHidden(() => {
    console.log("home page hide");
  });
  app.onDrivesChange((nextDrives) => {
    setDrives(nextDrives);
  });

  onMount(() => {
    app.fetchDrives();
  });

  return (
    <div class="">
      <h1 class="text-2xl">云盘列表</h1>
      <div class="mt-8">
        <Button store={addingDriveBtn} icon={<HardDrive class="w-4 h-4" />}>
          新增云盘
        </Button>
        <div class="grid grid-cols-3 gap-2 mt-4">
          <For each={drives()}>
            {(drive) => {
              return <DriveCard app={app} store={drive} />;
            }}
          </For>
        </div>
      </div>
      <Dialog store={addingDriveDialog}>
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
        <Textarea store={driveTokenInput} />
      </Dialog>
    </div>
  );
};
