/**
 * @file 电视剧列表
 */
import { createSignal, For, Show } from "solid-js";
import { Award, Bell, BellPlus, BookOpen, Calendar, Check, Info, RotateCw, Send, Smile, X } from "lucide-solid";

import {
  add_file_sync_task_of_tv,
  bind_searched_tv_for_tv,
  fetch_folder_can_add_sync_task,
  fetch_tv_list,
  FolderCanAddingSyncTaskItem,
  run_all_file_sync_tasks,
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
import { LazyImage } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ViewComponent } from "@/types";
import { Dialog } from "@/components/ui/dialog";
import { DialogCore } from "@/domains/ui/dialog";
import { SharedResourceCore } from "@/domains/shared_resource";
import { JobCore } from "@/domains/job";

export const TVManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const list = new ListCore(new RequestCore(fetch_tv_list), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
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
  const addFileSyncTask = new RequestCore(add_file_sync_task_of_tv, {
    onLoading(loading) {
      sharedResourceBtn.setLoading(loading);
      folderSelectBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["新增更新任务成功"] });
      setFolders([]);
      sharedResourceUrlInput.clear();
      addSyncTaskDialog.hide();
    },
    onFailed(error) {
      console.log(error);
      app.tip({ text: ["新增更新任务失败", error.message] });
      const { code, data } = error;
      if (code !== "20001") {
        return;
      }
      const folders = data as {
        file_id: string;
        file_name: string;
      }[];
      setFolders(folders);
    },
  });
  const folderSelectBtn = new ButtonInListCore<{ file_name: string; file_id: string }>({
    onClick(record) {
      if (!record) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      if (!tvSelection.value) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      if (!sharedResourceUrlInput.value) {
        app.tip({ text: ["请先输入资源链接"] });
        return;
      }
      const { file_id } = record;
      addFileSyncTask.run({
        tv_id: tvSelection.value.id,
        url: sharedResourceUrlInput.value,
        target_file_id: file_id,
      });
    },
  });
  const runFileSyncTask = new RequestCore(run_file_sync_task_of_tv, {
    onBeforeRequest() {
      execSyncTaskBtn.setLoading(true);
    },
    onSuccess(resp) {
      const job = new JobCore({ id: resp.job_id });
      job.onTip((msg) => {
        app.tip(msg);
      });
      job.onFinish(() => {
        execSyncTaskBtn.setLoading(false);
        list.refresh();
      });
      job.wait_finish();
    },
    onFailed(error) {
      app.tip({ text: ["更新失败", error.message] });
      execSyncTaskBtn.setLoading(false);
    },
  });
  const folderCanAddSyncTaskList = new ListCore(new RequestCore(fetch_folder_can_add_sync_task));
  const dialog = new TMDBSearcherDialogCore({
    onOk(searchedTV) {
      if (!tvSelection.value?.id) {
        app.tip({ text: ["请先选择要修改的电视剧"] });
        return;
      }
      bindSearchedTVForTV.run(tvSelection.value.id, searchedTV);
    },
  });
  const addSyncTaskDialog = new DialogCore({
    title: "新增更新任务",
    footer: false,
    onOk() {
      if (!folderSelection.value) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      const { url, name, file_id } = folderSelection.value;
      // 还要看该电视剧有没有同名的 parsed_tv.file_name，如果没有，弹出所有的 parsed_tv 让用户选
    },
  });
  // const contextMenu = new ContextMenuCore({
  //   items: [
  //     new MenuItemCore({
  //       label: "修改",
  //       onClick() {
  //         dialog.show();
  //       },
  //     }),
  //     new MenuItemCore({
  //       label: "隐藏",
  //       onClick() {
  //         if (tvSelection.value === null) {
  //           return;
  //         }
  //         hiddenTV.run({ id: tvSelection.value.id });
  //       },
  //     }),
  //   ],
  // });
  const input1 = new InputCore({ placeholder: "请输入名称搜索" });
  const searchBtn = new ButtonCore({
    onClick() {
      if (!input1.value) {
        return;
      }
      list.search({ name: input1.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      list.reset();
      input1.clear();
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
      // sharedResource.fetch();
      if (!tvSelection.value) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      addFileSyncTask.run({
        tv_id: tvSelection.value.id,
        url: sharedResourceUrlInput.value,
      });
    },
  });
  const addSyncTaskBtn = new ButtonInListCore<TVItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
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
      if (record === null) {
        return;
      }
      runFileSyncTask.run({ id: record.id });
    },
  });
  const profileBtn = new ButtonInListCore<TVItem>({
    onClick(record) {
      router.push(`/home/tv/${record.id}`);
    },
  });
  const syncAllTVRequest = new RequestCore(run_all_file_sync_tasks, {
    onLoading(loading) {
      syncAllTVBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["同步更新成功"] });
    },
    onFailed(error) {
      app.tip({ text: ["同步更新失败", error.message] });
    },
  });
  const syncAllTVBtn = new ButtonCore({
    onClick() {
      syncAllTVRequest.run();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });

  const [state, setState] = createSignal(list.response);
  const [folders, setFolders] = createSignal<
    {
      file_id: string;
      file_name: string;
    }[]
  >([]);
  const [resourceState, setResourceState] = createSignal(sharedResource.state);

  list.onStateChange((nextState) => {
    setState(nextState);
  });
  // folderCanAddSyncTaskList.onStateChange((nextState) => {
  //   setFolders(nextState);
  // });
  sharedResource.onStateChange((nextState) => {
    setResourceState(nextState);
  });
  list.init();

  const dataSource = () => state().dataSource;
  const noMore = () => state().noMore;

  return (
    <>
      <div class="">
        <h1 class="text-2xl">电视剧列表</h1>
        <div class="mt-8">
          <div>
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            {/* <Button class="mt-4" store={syncAllTVBtn}>
            更新所有电视剧
          </Button> */}
          </div>
          <div class="grid grid-cols-12 gap-2 mt-4">
            <Input class="col-span-10" store={input1} />
            <Button class="col-span-1" store={searchBtn}>
              搜索
            </Button>
            <Button class="col-span-1" store={resetBtn}>
              重置
            </Button>
          </div>
          <div class="mt-4">
            <div class="space-y-4">
              <For each={dataSource()}>
                {(tv) => {
                  const {
                    id,
                    name,
                    overview,
                    poster_path,
                    first_air_date,
                    popularity,
                    tips,
                    need_bind,
                    sync_task,
                    cur_episode_count,
                    episode_count,
                  } = tv;
                  return (
                    <div
                      class="rounded-md border border-slate-300 bg-white shadow-sm"
                      // onContextMenu={(event: MouseEvent & { currentTarget: HTMLDivElement }) => {
                      //   event.stopPropagation();
                      //   event.preventDefault();
                      //   const { x, y } = event;
                      //   tvSelection.select(tv);
                      //   contextMenu.show({ x, y });
                      // }}
                    >
                      <div class="flex">
                        <div class="overflow-hidden mr-2 rounded-sm">
                          <LazyImage class="w-[180px] h-[272px]" src={poster_path} alt={name} />
                        </div>
                        <div class="flex-1 p-4">
                          <h2 class="text-2xl text-slate-800">{name}</h2>
                          <div class="mt-2 overflow-hidden text-ellipsis">
                            <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-4">{overview}</p>
                          </div>
                          <div class="flex items-center space-x-4 mt-2">
                            <div class="flex items-center space-x-1 px-2 border border-slate-600 rounded-xl text-slate-600">
                              <Calendar class="w-4 h-4 text-slate-800" />
                              <div>{first_air_date}</div>
                            </div>
                            <div class="flex items-center space-x-1 px-2 border border-yellow-600 rounded-xl text-yellow-600">
                              <Award class="w-4 h-4" />
                              <div>{popularity}</div>
                            </div>
                            <Show when={cur_episode_count === episode_count}>
                              <div class="flex items-center space-x-1 px-2 border border-green-600 rounded-xl text-green-600">
                                <Smile class="w-4 h-4" />
                                <div>全{episode_count}集</div>
                              </div>
                            </Show>
                            <Show when={cur_episode_count !== episode_count}>
                              <div class="flex items-center space-x-1 px-2 border border-blue-600 rounded-xl text-blue-600">
                                <Send class="w-4 h-4" />
                                <div>
                                  {cur_episode_count}/{episode_count}
                                </div>
                              </div>
                            </Show>
                            <Show when={tips.length}>
                              <div class="flex items-center space-x-1 px-2 border border-red-500 rounded-xl text-red-500">
                                <Info class="w-4 h-4" />
                                <div>{tips.length}个问题</div>
                              </div>
                            </Show>
                          </div>
                          {/* <For each={tips}>
                              {(tip) => {
                                return <div>{tip}</div>;
                              }}
                            </For> */}
                          <div class="space-x-2 mt-6">
                            <Button store={profileBtn.bind(tv)} variant="subtle" icon={<BookOpen class="w-4 h-4" />}>
                              详情
                            </Button>
                            <Show when={need_bind}>
                              <Button
                                store={addSyncTaskBtn.bind(tv)}
                                variant="subtle"
                                icon={<BellPlus class="w-4 h-4" />}
                              >
                                创建更新任务
                              </Button>
                            </Show>
                            <Show when={sync_task}>
                              <Button store={execSyncTaskBtn.bind(tv)} variant="subtle" icon={<Bell class="w-4 h-4" />}>
                                更新
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
            <Show when={!noMore()}>
              <div
                class="mt-4 text-center text-slate-500 cursor-pointer"
                onClick={() => {
                  list.loadMore();
                }}
              >
                加载更多
              </div>
            </Show>
          </div>
        </div>
      </div>
      <TMDBSearcherDialog store={dialog} />
      <Dialog store={addSyncTaskDialog}>
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-9">
            <Input store={sharedResourceUrlInput} />
          </div>
          <div class="col-span-3 grid">
            <Button store={sharedResourceBtn}>确定</Button>
          </div>
        </div>
        <div>
          <For each={folders()}>
            {(file) => {
              const { file_name } = file;
              return (
                <div class="flex items-center justify-between py-4 space-x-2">
                  <div>{file_name}</div>
                  <Button
                    store={folderSelectBtn.bind(file)}
                    class="ml-4 cursor-pointer"
                    icon={<Check class="w-4 h-4" />}
                  >
                    确定
                  </Button>
                </div>
              );
            }}
          </For>
        </div>
      </Dialog>
    </>
  );
};
