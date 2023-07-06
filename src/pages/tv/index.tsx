/**
 * @file 电视剧列表
 */
import { createSignal, For, onMount, Show } from "solid-js";
import {
  ArrowUpCircle,
  Award,
  Bell,
  BellPlus,
  BookOpen,
  Calendar,
  Check,
  Info,
  Package,
  RotateCw,
  Search,
  Send,
  Smile,
  X,
} from "lucide-solid";

import {
  add_file_sync_task_of_tv,
  bind_searched_tv_for_tv,
  fetch_folder_can_add_sync_task,
  fetch_tv_list,
  FolderCanAddingSyncTaskItem,
  run_all_file_sync_tasks,
  run_file_sync_task_of_tv,
  transfer_tv_to_another_drive,
  TVItem,
} from "@/services";
import { driveList } from "@/store/drives";
import { ViewComponent } from "@/types";
import { hidden_tv } from "@/domains/tv/services";
import { ListCore } from "@/domains/list";
import { InputCore } from "@/domains/ui/input";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { RequestCore } from "@/domains/client";
import { SelectionCore } from "@/domains/cur";
import { LazyImage } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { Dialog } from "@/components/ui/dialog";
import { DialogCore } from "@/domains/ui/dialog";
import { SharedResourceCore } from "@/domains/shared_resource";
import { JobCore } from "@/domains/job";
import { Popover, PurePopover } from "@/components/ui/popover";
import { ListView } from "@/components/ListView";
import { Skeleton } from "@/packages/ui/skeleton";
import { PopoverCore } from "@/domains/ui/popover";
import { ScrollView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { DriveItem } from "@/domains/drive/services";
import { cn } from "@/utils";
import { Drive } from "@/domains/drive";
import { effect } from "solid-js/web";
import { appendJob } from "@/store";

export const TVManagePage: ViewComponent = (props) => {
  const { app, router, view } = props;

  let $page: HTMLDivElement | undefined;

  const list = new ListCore(new RequestCore(fetch_tv_list), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const tvSelection = new SelectionCore<TVItem>();
  const driveSelection = new SelectionCore<Drive>({
    onChange(v) {
      // console.log('SelectionCore change', v);
      setCurDrive(v);
    },
  });
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
      if (code !== 20001) {
        return;
      }
      const folders = data as {
        file_id: string;
        file_name: string;
      }[];
      setFolders(folders);
    },
  });
  const transferRequest = new RequestCore(transfer_tv_to_another_drive, {
    onLoading(loading) {
      transferConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({
        text: ["复制失败", error.message],
      });
    },
    onSuccess(r) {
      app.tip({
        text: ["开始复制，请等待一段时间"],
      });
      const job = new JobCore({ id: r.job_id });
      job.onFinish(() => {
        if (!tvSelection.value) {
          return;
        }
        const { name, original_name } = tvSelection.value;
        app.tip({
          text: [`完成电视剧 '${name || original_name}' 复制`],
        });
      });
      job.waitFinish();
      appendJob(job);
      transferConfirmDialog.hide();
    },
  });
  const tipPopover = new PopoverCore({
    // side: "right",
    align: "end",
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
    beforeRequest() {
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
      job.waitFinish();
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
  const transferConfirmDialog = new DialogCore({
    title: "移动到其他云盘",
    onOk() {
      if (!driveSelection.value) {
        app.tip({ text: ["请先选择目标云盘"] });
        return;
      }
      const curTV = tvSelection.value;
      if (!curTV) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      transferRequest.run({
        tv_id: curTV.id,
        target_drive_id: driveSelection.value.id,
      });
    },
  });
  const transferBtn = new ButtonInListCore<TVItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      tvSelection.select(record);
      transferConfirmDialog.show();
    },
  });
  const addSyncTaskBtn = new ButtonInListCore<TVItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      tvSelection.select(record);
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
    beforeRequest() {
      syncAllTVBtn.setLoading(true);
    },
    async onSuccess(resp) {
      app.tip({ text: ["开始同步所有电视剧"] });
      const job_res = await JobCore.New({ id: resp.job_id });
      if (job_res.error) {
        app.tip({ text: [job_res.error.message] });
        return;
      }
      const job = job_res.data;
      job.onFinish(() => {
        list.refresh();
        syncAllTVBtn.setLoading(false);
      });
      job.onPause(() => {
        syncAllTVBtn.setLoading(false);
      });
      job.waitFinish();
    },
    onFailed(error) {
      app.tip({ text: ["同步更新失败", error.message] });
      syncAllTVBtn.setLoading(false);
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
  const scrollView = new ScrollViewCore({
    pullToRefresh: false,
  });

  const [state, setState] = createSignal(list.response);
  const [folders, setFolders] = createSignal<
    {
      file_id: string;
      file_name: string;
    }[]
  >([]);
  const [resourceState, setResourceState] = createSignal(sharedResource.state);
  const [tips, setTips] = createSignal<string[]>([]);
  const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(driveSelection.value);

  driveList.onStateChange((nextResponse) => {
    setDriveResponse(nextResponse);
  });
  list.onStateChange((nextState) => {
    setState(nextState);
  });
  folderCanAddSyncTaskList.onStateChange((nextState) => {
    setFolders(
      nextState.dataSource.map((folder) => {
        const { file_id, name } = folder;
        return {
          file_id,
          file_name: name,
        };
      })
    );
  });
  sharedResource.onStateChange((nextState) => {
    setResourceState(nextState);
  });
  scrollView.onScroll(() => {
    tipPopover.hide();
  });
  list.init();
  driveList.init();

  const dataSource = () => state().dataSource;

  effect(() => {
    console.log(curDrive());
  });

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="relative" ref={$page}>
          <h1 class="text-2xl">电视剧列表</h1>
          <div class="mt-8">
            <div class="flex items-center space-x-2">
              <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
                刷新
              </Button>
              <Button icon={<ArrowUpCircle class="w-4 h-4" />} store={syncAllTVBtn}>
                更新所有电视剧
              </Button>
            </div>
            <div class="flex items-center space-x-2 mt-4">
              <Input class="" store={input1} />
              <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
                搜索
              </Button>
              <Button class="" store={resetBtn}>
                重置
              </Button>
            </div>
            <div class="mt-4">
              <ListView
                store={list}
                skeleton={
                  <div>
                    <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                      <div class="flex">
                        <div class="overflow-hidden mr-2 rounded-sm">
                          <Skeleton class="w-[180px] h-[272px]" />
                        </div>
                        <div class="flex-1 p-4">
                          <Skeleton class="h-[36px] w-[180px]"></Skeleton>
                          <div class="mt-2 space-y-1">
                            <Skeleton class="h-[24px] w-[120px]"></Skeleton>
                            <Skeleton class="h-[24px] w-[240px]"></Skeleton>
                          </div>
                          <div class="flex items-center space-x-4 mt-2">
                            <Skeleton class="w-10 h-6"></Skeleton>
                            <Skeleton class="w-10 h-6"></Skeleton>
                            <Skeleton class="w-10 h-6"></Skeleton>
                          </div>
                          <div class="flex space-x-2 mt-6">
                            <Skeleton class="w-24 h-8"></Skeleton>
                            <Skeleton class="w-24 h-8"></Skeleton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              >
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
                        need_bind,
                        sync_task,
                        cur_episode_count,
                        episode_count,
                      } = tv;
                      return (
                        <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                          <div class="flex">
                            <div class="overflow-hidden mr-2 rounded-sm">
                              <LazyImage class="w-[180px] h-[272px]" src={poster_path} alt={name} />
                            </div>
                            <div class="flex-1 w-0 p-4">
                              <h2 class="text-2xl text-slate-800">{name}</h2>
                              <div class="mt-2 overflow-hidden text-ellipsis">
                                <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-4">
                                  {overview}
                                </p>
                              </div>
                              <div class="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
                                <div class="flex items-center space-x-1 px-2 border border-slate-600 rounded-xl text-slate-600">
                                  <Calendar class="w-4 h-4 text-slate-800" />
                                  <div class="break-keep whitespace-nowrap">{first_air_date}</div>
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
                                <Show when={tv.tips.length}>
                                  <div
                                    class="flex items-center space-x-1 px-2 border border-red-500 rounded-xl text-red-500"
                                    onClick={(event) => {
                                      const { x, y, width, height, left, top, right, bottom } =
                                        event.currentTarget.getBoundingClientRect();
                                      setTips(tv.tips);
                                      tipPopover.show({ x, y, width, height: height + 8, left, top, right, bottom });
                                    }}
                                  >
                                    <Info class="w-4 h-4" />
                                    <div>{tv.tips.length}个问题</div>
                                  </div>
                                </Show>
                              </div>

                              <div class="space-x-2 mt-6 py-2 overflow-hidden whitespace-nowrap">
                                <Button
                                  store={profileBtn.bind(tv)}
                                  variant="subtle"
                                  icon={<BookOpen class="w-4 h-4" />}
                                >
                                  详情
                                </Button>
                                <Show when={cur_episode_count === episode_count}>
                                  <Button
                                    store={transferBtn.bind(tv)}
                                    variant="subtle"
                                    icon={<Package class="w-4 h-4" />}
                                  >
                                    复制到其他云盘
                                  </Button>
                                </Show>
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
                                  <Button
                                    store={execSyncTaskBtn.bind(tv)}
                                    variant="subtle"
                                    icon={<Bell class="w-4 h-4" />}
                                  >
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
              </ListView>
            </div>
          </div>
        </div>
      </ScrollView>
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
      <Dialog store={transferConfirmDialog}>
        <div>
          <div>选择了 {curDrive()?.name}</div>
          <div class="mt-8 space-y-4">
            <For each={driveResponse().dataSource}>
              {(drive) => {
                const { id, name, state } = drive;
                return (
                  <div>
                    {id}
                    <div
                      class={cn("py-2 cursor-pointer", {
                        underline: curDrive()?.id === id,
                      })}
                      onClick={() => {
                        driveSelection.select(drive);
                      }}
                    >
                      <div class="text-lg">{name}</div>
                    </div>
                    <div>
                      {state.used_size}/{state.total_size}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Dialog>
      <Popover
        store={tipPopover}
        content={
          <div class="space-y-2">
            <For each={tips()}>
              {(tip) => {
                return <div class="text-sm text-slate-800">{tip}</div>;
              }}
            </For>
          </div>
        }
      ></Popover>
    </>
  );
};
