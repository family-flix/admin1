/**
 * @file 权限配置
 */
import { For, Show, createSignal } from "solid-js";
import { Lock, RotateCcw } from "lucide-solid";

import { addPermission, fetchPermissionList } from "@/services";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { Button, Dialog, Input, ListView } from "@/components/ui";
import { ButtonCore, DialogCore, InputCore } from "@/domains/ui";
import { ViewComponent } from "@/store/types";

export const HomePermissionPage: ViewComponent = (props) => {
  const { app } = props;

  const addPermissionRequest = new RequestCore(addPermission, {
    onLoading(loading) {
      addPermissionDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      addPermissionDialog.hide();
    },
  });
  const list = new ListCore(new RequestCore(fetchPermissionList));
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const permissionInput = new InputCore({
    defaultValue: "",
    placeholder: "请填写权限描述",
    onEnter() {
      addPermissionDialog.okBtn.click();
    },
  });
  const addPermissionBtn = new ButtonCore({
    onClick() {
      addPermissionDialog.show();
    },
  });
  const addPermissionDialog = new DialogCore({
    title: "新增权限",
    onOk() {
      if (!permissionInput.value) {
        app.tip({
          text: [permissionInput.placeholder],
        });
        return;
      }
      addPermissionRequest.run({
        desc: permissionInput.value,
      });
    },
  });

  const [response, setResponse] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });

  list.init();

  return (
    <>
      <div class="p-8">
        <h1 class="text-2xl">权限管理</h1>
        <div class="mt-8">
          <div class="space-x-2">
            <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button store={addPermissionBtn} icon={<Lock class="w-4 h-4" />}>
              新增权限
            </Button>
          </div>
        </div>
      </div>
      <div class="mt-4">
        <ListView store={list} class="space-y-8">
          <For each={response().dataSource}>
            {(permission) => {
              const { code, desc } = permission;
              return (
                <div class="px-8 py-4">
                  <div class="">{desc}</div>
                </div>
              );
            }}
          </For>
        </ListView>
      </div>
      <Dialog title="新增权限" store={addPermissionDialog}>
        <div class="w-[520px]">
          <Input store={permissionInput} />
        </div>
      </Dialog>
    </>
  );
};
