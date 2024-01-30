/**
 * @file 分享文件转存
 */
import { For, Show, createSignal } from "solid-js";
import { ChevronRight, Folder, FolderInput, MoreHorizontal, Send } from "lucide-solid";

import { createSyncTaskWithUrl } from "@/services/resource_sync_task";
import { Button, DropdownMenu, Input } from "@/components/ui";
import { ButtonCore, DropdownMenuCore, InputCore, MenuCore, MenuItemCore } from "@/domains/ui";
import { SharedResourceCore } from "@/domains/shared_resource";
import { RequestCore } from "@/domains/request";
import { FolderCard } from "@/components/FolderCard";
import { createJob } from "@/store/job";
import { driveList } from "@/store/drives";
import { ViewComponent } from "@/store/types";

export const SharedFilesTransferPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const sharedResource = new SharedResourceCore();
  const syncTaskCreateRequest = new RequestCore(createSyncTaskWithUrl, {
    beforeRequest() {
      syncTaskMenu.disable();
    },
    onSuccess() {
      app.tip({ text: ["新增同步任务成功"] });
      dropdownMenu.hide();
    },
    onFailed(error) {
      app.tip({ text: ["新增同步任务失败", error.message] });
      if (error.code === 20001) {
      }
    },
    onCompleted() {
      syncTaskMenu.enable();
    },
  });
  const driveSubMenu = new MenuCore({
    _name: "menus-of-drives",
    side: "right",
    align: "start",
  });
  const syncTaskMenu = new MenuItemCore({
    label: "建立同步任务",
    onClick() {
      if (!sharedResource.url) {
        app.tip({
          text: ["请先查询分享资源"],
        });
        return;
      }
      const payload: Parameters<typeof createSyncTaskWithUrl>[0] = { url: sharedResource.url };
      // if (folderRef.value) {
      //   payload.drive_file_id = folderRef.value.file_id;
      //   payload.drive_file_name = folderRef.value.file_name;
      // }
      const resource_folder = sharedResource.selectedFolder;
      if (resource_folder) {
        payload.resource_file_id = resource_folder.file_id;
        payload.resource_file_name = resource_folder.name;
      }
      syncTaskCreateRequest.run(payload);
    },
  });
  const dropdownMenu = new DropdownMenuCore({
    _name: "shared-resource-dropdown",
    items: [
      new MenuItemCore({
        _name: "transfer_to",
        label: "转存到",
        icon: <FolderInput class="w-4 h-4" />,
        menu: driveSubMenu,
      }),
      syncTaskMenu,
    ],
  });
  const sharedFileUrlInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入分享链接",
    onChange(v) {
      sharedResource.input(v);
    },
    onEnter() {
      sharedFileRequestBtn.click();
    },
  });
  const sharedFileCodeInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入提取码",
    onChange(v) {
      sharedResource.inputCode(v);
    },
    onEnter() {
      sharedFileRequestBtn.click();
    },
  });
  const sharedFileRequestBtn = new ButtonCore({
    async onClick() {
      sharedFileRequestBtn.setLoading(true);
      await sharedResource.fetch();
      sharedFileRequestBtn.setLoading(false);
    },
  });
  const searchHistoryBtn = new ButtonCore({
    onClick() {
      // app.showView(sharedFilesHistoryPage);
      history.push("root.home_layout.season_list");
    },
  });
  const transferHistoryBtn = new ButtonCore({
    onClick() {
      history.push("root.home_layout.transfer_history_list");
      // app.showView(sharedFilesTransferListPage);
    },
  });
  const searchInput = new InputCore({
    defaultValue: "",
    onEnter(v) {
      if (!v) {
        return;
      }
      sharedResource.search(v);
    },
  });

  driveList.onStateChange((nextResponse) => {
    driveSubMenu.setItems(
      nextResponse.dataSource.map((drive) => {
        const { name } = drive;
        const item = new MenuItemCore({
          label: name,
          async onClick() {
            item.disable();
            const r = await sharedResource.transferSelectedFolderToDrive(drive);
            if (r.data) {
              createJob({
                job_id: r.data.job_id,
                onFinish() {
                  app.tip({
                    text: ["转存完成"],
                  });
                },
              });
            }
            item.enable();
            dropdownMenu.hide();
          },
        });
        return item;
      })
    );
  });
  sharedResource.onTip((msg) => {
    app.tip(msg);
  });
  sharedResource.onStateChange((values) => {
    setState(values);
  });
  driveList.initAny();

  const [state, setState] = createSignal(sharedResource.state);

  const paths = () => state().paths;
  const files = () => state().files;

  return (
    <div class="h-screen p-8 overflow-y-auto">
      <h1 class="text-2xl">转存资源</h1>
      <div class="mt-8">
        <div class="flex items-center space-x-2">
          <Button class="space-x-1" store={searchHistoryBtn}>
            查询记录
          </Button>
          <Button class="space-x-1" store={transferHistoryBtn}>
            转存记录
          </Button>
        </div>
        <div class="flex items-center space-x-2 mt-4">
          <Input store={sharedFileUrlInput} />
          <Input store={sharedFileCodeInput} />
          <Button size="default" variant="default" icon={<Send class="w-4 h-4" />} store={sharedFileRequestBtn}>
            获取
          </Button>
        </div>
        <div class="relative mt-4 p-4 bg-white rounded-sm">
          <Show when={paths().length}>
            <div class="flex items-center flex-wrap space-x-2">
              <Folder class="w-4 h-4" />
              <For each={paths()}>
                {(path, index) => {
                  const { file_id, name } = path;
                  return (
                    <div class="flex items-center">
                      <div
                        class="cursor-pointer hover:text-blue-500"
                        onClick={() => {
                          sharedResource.fetch({ file_id, name });
                        }}
                      >
                        {name}
                      </div>
                      {index() === paths().length - 1 ? null : (
                        <div class="mx-1">
                          <ChevronRight class="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                }}
              </For>
            </div>
            <div class="fixed right-12 bottom-12 p-4 bg-white rounded-md">
              <Input store={searchInput} />
            </div>
          </Show>
          <Show when={files().length} fallback={<div></div>}>
            <div class="mt-8 grid grid-cols-3 gap-2 lg:grid-cols-4 xl:grid-cols-6">
              <For each={files()}>
                {(file) => {
                  const { name, type } = file;
                  return (
                    <div class="relative">
                      <div
                        class="w-full p-4 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500"
                        onClick={() => {
                          sharedResource.fetch(file);
                        }}
                      >
                        <FolderCard type={type} name={name} />
                      </div>
                      <div
                        class="absolute right-0 top-0 p-2 cursor-pointer"
                        onClick={(event) => {
                          const { pageX, pageY } = event;
                          sharedResource.selectFolder(file);
                          dropdownMenu.toggle({ x: pageX, y: pageY });
                        }}
                      >
                        <MoreHorizontal class="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
          <Show when={state().next_marker}>
            <div
              class="text-center"
              onClick={() => {
                sharedResource.loadMore();
              }}
            >
              加载更多
            </div>
          </Show>
        </div>
      </div>
      <DropdownMenu store={dropdownMenu}></DropdownMenu>
    </div>
  );
};
