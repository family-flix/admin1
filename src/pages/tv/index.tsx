/**
 * @file 电视剧列表
 */
import { createSignal, For, Show } from "solid-js";

import {
  bind_searched_tv_for_tv,
  fetch_folder_can_add_sync_task,
  fetch_tv_list,
  FolderCanAddingSyncTaskItem,
  run_file_sync_task_of_tv,
  TVItem,
} from "@/services";
import { hidden_tv } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { ContextMenu } from "@/components/ui/context-menu";
import { RequestCore } from "@/domains/client";
import { SelectionCore } from "@/domains/cur";
import { LazyImage } from "@/components/LazyImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ViewComponent } from "@/types";
import { Modal } from "@/components/SingleModal";
import { DialogCore } from "@/domains/ui/dialog";
import { SharedResourceCore } from "@/domains/shared_resource";

export const TVManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const list = new ListCore<TVItem>(fetch_tv_list);
  const tvSelection = new SelectionCore<TVItem>();
  const folderSelection = new SelectionCore<{
    url: string;
    name: string;
    file_id: string;
  }>();
  const bindSearchedTVForTV = new RequestCore(bind_searched_tv_for_tv, {
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      list.refresh();
    },
    onFailed(error) {
      app.tip({
        text: ["修改失败", error.message],
      });
    },
  });
  const hiddenTV = new RequestCore(hidden_tv, {
    onSuccess() {
      list.refresh();
    },
    onFailed(error) {
      app.tip({ text: ["隐藏失败", error.message] });
    },
  });
  const runFileSyncTask = new RequestCore(run_file_sync_task_of_tv, {
    onLoading(loading) {
      execSyncTaskBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["同步成功"] });
    },
    onFailed(error) {
      app.tip({ text: ["同步失败", error.message] });
    },
  });
  const folderCanAddSyncTaskList = new ListCore<FolderCanAddingSyncTaskItem>(
    fetch_folder_can_add_sync_task
  );
  const dialog = new TMDBSearcherDialogCore({
    onOk(searchedTV) {
      if (!tvSelection.value.id) {
        app.tip({ text: ["请先选择要修改的电视剧"] });
        return;
      }
      bindSearchedTVForTV.run(tvSelection.value.id, searchedTV);
    },
  });
  const addSyncTaskDialog = new DialogCore({
    onOk() {
      if (!folderSelection.value) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      const { url, name, file_id } = folderSelection.value;
      // 还要看该电视剧有没有同名的 parsed_tv.file_name，如果没有，弹出所有的 parsed_tv 让用户选
    },
  });
  const contextMenu = new ContextMenuCore({
    items: [
      new MenuItemCore({
        label: "修改",
        onClick() {
          dialog.show();
        },
      }),
      new MenuItemCore({
        label: "隐藏",
        onClick() {
          hiddenTV.run({ id: tvSelection.value.id });
        },
      }),
    ],
  });
  const input1 = new InputCore({ placeholder: "请输入名称搜索" });
  const button1 = new ButtonCore({
    onClick() {
      if (!input1.value) {
        return;
      }
      list.search({ name: input1.value });
    },
  });
  const button2 = new ButtonCore({
    onClick() {
      list.reset();
      input1.empty();
    },
  });
  const sharedResourceUrlInput = new InputCore({
    placeholder: "请输入资源链接",
    onChange(v) {
      sharedResource.input(v);
    },
  });
  const sharedResource = new SharedResourceCore();
  const sharedResourceBtn = new ButtonCore({
    onClick() {
      sharedResource.fetch();
    },
  });
  const addSyncTaskBtn = new ButtonInListCore<TVItem>({
    onClick(record) {
      tvSelection.select(record);
      // sharedResource.input();
      folderCanAddSyncTaskList.search({
        name: [record.name],
      });
      addSyncTaskDialog.show();
    },
  });
  const execSyncTaskBtn = new ButtonInListCore<TVItem>({
    onClick(record) {
      runFileSyncTask.run({ id: record.id });
    },
  });
  const profileBtn = new ButtonInListCore<TVItem>({
    onClick(record) {
      router.push(`/tv/${record.id}`);
    },
  });

  const [state, setState] = createSignal(list.response);
  const [folders, setFolders] = createSignal(folderCanAddSyncTaskList.response);
  const [resourceState, setResourceState] = createSignal(sharedResource.state);

  list.onStateChange((nextState) => {
    setState(nextState);
  });
  folderCanAddSyncTaskList.onStateChange((nextState) => {
    setFolders(nextState);
  });
  sharedResource.onStateChange((nextState) => {
    setResourceState(nextState);
  });
  list.init();

  const response = () => state().dataSource;

  return (
    <>
      <div class="min-h-screen">
        <div class="">
          <div class="">
            <div class="flex space-x-2">
              <Input store={input1} />
              <Button class="w-[80px]" store={button1}>
                搜索
              </Button>
              <Button class="w-[80px]" store={button2}>
                重置
              </Button>
            </div>
          </div>
          <div class="mt-4">
            <ContextMenu store={contextMenu}>
              <div class="space-y-4">
                <For each={response()}>
                  {(tv) => {
                    const {
                      id,
                      name,
                      overview,
                      poster_path,
                      first_air_date,
                      tips,
                      need_bind,
                      sync_task,
                    } = tv;
                    return (
                      <div
                        class="card cursor-pointer"
                        onContextMenu={(
                          event: MouseEvent & { currentTarget: HTMLDivElement }
                        ) => {
                          event.stopPropagation();
                          event.preventDefault();
                          const { x, y } = event;
                          tvSelection.select(tv);
                          contextMenu.show({ x, y });
                        }}
                      >
                        <div class="flex">
                          <LazyImage
                            class="mr-4 w-[120px] object-fit"
                            src={poster_path}
                            alt={name}
                          />
                          <div class="flex-1">
                            <h2 class="text-2xl">{name}</h2>
                            <div class="mt-2">
                              <p class="">{overview}</p>
                              <p class="">{first_air_date}</p>
                            </div>
                            <For each={tips}>
                              {(tip) => {
                                return <div>{tip}</div>;
                              }}
                            </For>
                            <div class="space-x-2">
                              <Button store={profileBtn.bind(tv)}>详情</Button>
                              <Show when={need_bind}>
                                <Button store={addSyncTaskBtn.bind(tv)}>
                                  创建同步任务
                                </Button>
                              </Show>
                              <Show when={sync_task}>
                                <Button store={execSyncTaskBtn.bind(tv)}>
                                  执行同步任务
                                </Button>
                              </Show>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </ContextMenu>
          </div>
        </div>
      </div>
      <TMDBSearcherDialog store={dialog} />
      <Modal store={addSyncTaskDialog}>
        <div class="flex items-center space-x-2">
          <Input store={sharedResourceUrlInput} />
          <Button store={sharedResourceBtn}>查询</Button>
        </div>
        <div>
          <For each={resourceState().files}>
            {(file) => {
              const { name, file_id } = file;
              return (
                <div
                  class="py-4 cursor-pointer"
                  onClick={() => {
                    folderSelection.select({
                      url: sharedResource.url,
                      name,
                      file_id,
                    });
                  }}
                >
                  {name}
                </div>
              );
            }}
          </For>
        </div>
        <div>
          <div class="text-xl">资源转存记录</div>
          <Show when={!!folders().dataSource.length}>
            <For each={folders().dataSource}>
              {(folder) => {
                const { url, name } = folder;
                return (
                  <div
                    class="py-4 cursor-pointer"
                    onClick={() => {
                      folderSelection.select(folder);
                    }}
                  >
                    {name}
                  </div>
                );
              }}
            </For>
          </Show>
        </div>
      </Modal>
    </>
  );
};
