/**
 * @file 同步列表
 */
import { createSignal, For, Show } from "solid-js";
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
  Pen,
  RotateCw,
  Search,
  Send,
  Smile,
} from "lucide-solid";

import {
  add_file_sync_task_of_tv,
  fetch_folder_can_add_sync_task,
  fetch_partial_season,
  fetchPartialSyncTask,
  fetchSyncTaskList,
  refresh_tv_profile,
  runSyncTaskList,
  runSyncTask,
  SyncTaskItem,
  transferSeasonToAnotherDrive,
  updateSyncTask,
  modifyResourceForSyncTask,
} from "@/services";
import {
  Skeleton,
  Popover,
  ScrollView,
  Input,
  Button,
  LazyImage,
  Dialog,
  Checkbox,
  BackToTop,
  ListView,
} from "@/components/ui";
import { FileSearcherCore } from "@/components/FileSearcher";
import { TVSeasonSelectCore, TVSeasonSelect } from "@/components/TVSeasonSelect";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import {
  ScrollViewCore,
  DialogCore,
  PopoverCore,
  InputCore,
  ButtonCore,
  ButtonInListCore,
  CheckboxCore,
  CheckboxGroupCore,
} from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { SharedResourceCore, fetch_shared_file_save_list, SharedFileSaveItem } from "@/domains/shared_resource";
import { JobCore } from "@/domains/job";
import { DriveCore } from "@/domains/drive";
import { createJob, driveList, consumeAction, pendingActions } from "@/store";
import { Result, ViewComponent } from "@/types";
import { FileType } from "@/constants";

export const SyncTaskListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const syncTaskList = new ListCore(new RequestCore(fetchSyncTaskList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const partialTaskRequest = new RequestCore(fetchPartialSyncTask);
  const taskUpdateRequest = new RequestCore(updateSyncTask);
  const overrideResourceRequest = new RequestCore(modifyResourceForSyncTask, {
    onLoading(loading) {
      sharedResourceBtn.setLoading(loading);
    },
    onSuccess() {
      folderSearcher.dialog.hide();
      refreshPartialTask();
    },
  });
  const taskRef = new RefCore<SyncTaskItem>();
  const onlyInvalidCheckbox = new CheckboxCore({
    onChange(checked) {
      syncTaskList.search({
        invalid: Number(checked),
      });
    },
  });
  const duplicatedCheckbox = new CheckboxCore({
    onChange(checked) {
      syncTaskList.search({
        duplicated: Number(checked),
      });
    },
  });
  const driveCheckboxGroup = new CheckboxGroupCore({
    options: driveList.response.dataSource.map((d) => {
      const { name, id } = d;
      return {
        value: id,
        label: name,
      };
    }),
    onChange(options) {
      setHasSearch(!!options.length);
      syncTaskList.search({
        drive_ids: options.join("|"),
      });
    },
  });
  const driveRef = new RefCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
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
      folderSearcher.dialog.hide();
      refreshPartialTask();
    },
    onFailed(error) {
      console.log("[PAGE]tv/index - addFileSyncTask onFailed 1", error.code, error.data);
      app.tip({ text: ["新增更新任务失败", error.message] });
      const { code, data } = error;
      if (code === 20001) {
        const folders = data as {
          file_id: string;
          file_name: string;
          parent_paths: string;
          drive: {
            id: string;
            name: string;
          };
        }[];
        console.log("[PAGE]tv/index - addFileSyncTask onFailed", data);
        setFolders(folders);
        return;
      }
      if (code === 20002) {
        folderSearcher.dialog.show();
      }
    },
  });
  const tipPopover = new PopoverCore({
    align: "end",
  });
  const folderSelectBtn = new ButtonInListCore<{ file_name: string; file_id: string }>({
    onClick(record) {
      if (!record) {
        app.tip({ text: ["请先选择文件夹"] });
        return;
      }
      if (!taskRef.value) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      if (!sharedResourceUrlInput.value) {
        app.tip({ text: ["请先输入资源链接"] });
        return;
      }
      const { file_id, file_name } = record;
      // addFileSyncTask.run({
      //   url: sharedResourceUrlInput.value,
      //   target_file_id: file_id,
      //   target_file_name: file_name,
      // });
    },
  });
  const refreshPartialTask = async (id?: string) => {
    const task_id = id || taskRef.value?.id;
    if (!task_id) {
      return Result.Err("缺少任务 id");
    }
    const r = await partialTaskRequest.run({ id: task_id });
    if (r.error) {
      app.tip({
        text: ["获取最新信息失败", r.error.message],
      });
      return Result.Err(r.error.message);
    }
    syncTaskList.modifyItem((item) => {
      if (item.id !== task_id) {
        return item;
      }
      return {
        ...r.data,
      };
    });
    return Result.Ok(null);
  };
  const runFileSyncTask = new RequestCore(runSyncTask, {
    beforeRequest() {
      execSyncTaskBtn.setLoading(true);
    },
    onSuccess(resp) {
      createJob({
        job_id: resp.job_id,
        onFinish() {
          execSyncTaskBtn.setLoading(false);
          refreshPartialTask();
        },
        onTip(msg) {
          app.tip(msg);
        },
      });
    },
    onFailed(error) {
      app.tip({ text: ["更新失败", error.message] });
      execSyncTaskBtn.setLoading(false);
    },
  });
  const folderCanAddSyncTaskList = new ListCore(new RequestCore(fetch_folder_can_add_sync_task));
  const addSyncTaskDialog = new DialogCore({
    title: "新增更新任务",
    footer: false,
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      syncTaskList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      syncTaskList.reset();
      onlyInvalidCheckbox.uncheck();
      duplicatedCheckbox.uncheck();
      nameSearchInput.clear();
    },
  });
  const sharedResourceUrlInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入资源链接",
    onChange(v) {
      sharedResource.input(v);
    },
  });
  const sharedResource = new SharedResourceCore();
  const sharedResourceBtn = new ButtonCore({
    onClick() {
      if (!taskRef.value) {
        app.tip({ text: ["请选择同步任务"] });
        return;
      }
      if (!sharedResourceUrlInput.value) {
        app.tip({ text: [sharedResourceUrlInput.placeholder] });
        return;
      }
      overrideResourceRequest.run({
        id: taskRef.value.id,
        url: sharedResourceUrlInput.value,
      });
    },
  });
  const folderSearcher = new FileSearcherCore({
    search: {
      type: FileType.Folder,
    },
    footer: false,
  });
  const addSyncTaskBtn = new ButtonInListCore<SyncTaskItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      taskRef.select(record);
      addSyncTaskDialog.show();
    },
  });
  const modifySyncTaskBtn = new ButtonInListCore<SyncTaskItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      taskRef.select(record);
      addSyncTaskDialog.setTitle("修改更新任务");
      addSyncTaskDialog.show();
    },
  });
  const seasonSelectDialog = new DialogCore({
    title: "关联电视剧",
    async onOk() {
      if (!taskRef.value) {
        app.tip({
          text: ["请选择同步任务"],
        });
        return;
      }
      if (!seasonSelect.value) {
        app.tip({
          text: ["请选择电视剧"],
        });
        return;
      }
      seasonSelectDialog.okBtn.setLoading(true);
      const r = await taskUpdateRequest.run({
        id: taskRef.value.id,
        season_id: seasonSelect.value.id,
      });
      seasonSelectDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["更新失败", r.error.message],
        });
        return;
      }
      seasonSelect.clear();
      refreshPartialTask(taskRef.value.id);
      seasonSelectDialog.hide();
    },
  });
  const seasonSelect = new TVSeasonSelectCore({});
  const linkSeasonBtn = new ButtonInListCore<SyncTaskItem>({
    onClick(record) {
      taskRef.select(record);
      seasonSelect.list.init();
      seasonSelectDialog.show();
    },
  });
  const execSyncTaskBtn = new ButtonInListCore<SyncTaskItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      taskRef.select(record);
      runFileSyncTask.run({ id: record.id });
    },
  });
  const refreshPartialBtn = new ButtonInListCore<SyncTaskItem>({
    async onClick(record) {
      refreshPartialBtn.setLoading(true);
      const r = await refreshPartialTask(record.id);
      refreshPartialBtn.setLoading(false);
      if (r.error) {
        return;
      }
      app.tip({
        text: ["刷新成功"],
      });
    },
  });
  const sharedFileSaveListDialog = new DialogCore({
    title: "最近的转存记录",
    footer: false,
  });
  const sharedFileSaveList = new ListCore(new RequestCore(fetch_shared_file_save_list));
  const sharedFileSaveScrollView = new ScrollViewCore({
    onReachBottom() {
      sharedFileSaveList.loadMore();
    },
  });
  const addSyncFromSharedRecordBtn = new ButtonInListCore<SharedFileSaveItem>({
    onClick(record) {
      sharedFileSaveListDialog.hide();
      sharedResourceUrlInput.setValue(record.url);
      sharedResourceBtn.click();
    },
  });
  const runTaskListRequest = new RequestCore(runSyncTaskList, {
    beforeRequest() {
      runTaskListBtn.setLoading(true);
    },
    async onSuccess(r) {
      app.tip({ text: ["开始同步所有电视剧"] });
      createJob({
        job_id: r.job_id,
        onFinish() {
          syncTaskList.refresh();
          runTaskListBtn.setLoading(false);
        },
      });
    },
    onFailed(error) {
      app.tip({ text: ["同步更新失败", error.message] });
      runTaskListBtn.setLoading(false);
    },
  });
  const runTaskListBtn = new ButtonCore({
    onClick() {
      runTaskListRequest.run();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      syncTaskList.refresh();
    },
  });
  const scrollView = new ScrollViewCore({
    pullToRefresh: false,
    onReachBottom() {
      syncTaskList.loadMore();
    },
    onScroll() {
      tipPopover.hide();
    },
  });

  const [tvListResponse, setTVListResponse] = createSignal(syncTaskList.response);
  const [folders, setFolders] = createSignal<
    {
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
      };
    }[]
  >([]);
  // const [resourceState, setResourceState] = createSignal(sharedResource.state);
  const [tips, setTips] = createSignal<string[]>([]);
  const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(driveRef.value);
  const [hasSearch, setHasSearch] = createSignal(false);
  const [sharedFileSaveResponse, setSharedFileSaveResponse] = createSignal(sharedFileSaveList.response);
  // effect(() => {
  //   console.log(tvListResponse().dataSource[0]?.name);
  // });

  driveList.onStateChange((nextResponse) => {
    const driveCheckBoxGroupOptions = nextResponse.dataSource.map((d) => {
      const { name, id } = d;
      return {
        value: id,
        label: name,
      };
    });
    driveCheckboxGroup.setOptions(driveCheckBoxGroupOptions);
    setDriveResponse(nextResponse);
  });
  syncTaskList.onStateChange((nextState) => {
    // console.log("[PAGE]tv/index - tvList.onStateChange", nextState.dataSource[0]);
    setTVListResponse(nextState);
  });
  folderCanAddSyncTaskList.onStateChange((nextState) => {
    setFolders(
      nextState.dataSource.map((folder) => {
        const { file_id, name } = folder;
        return {
          file_id,
          file_name: name,
          parent_paths: "",
          drive: {
            id: "",
            name: "",
          },
        };
      })
    );
  });
  sharedFileSaveList.onStateChange((nextResponse) => {
    setSharedFileSaveResponse(nextResponse);
  });
  folderSearcher.onStateChange((nextState) => {
    const { list } = nextState;
    setFolders(list.dataSource);
  });
  view.onShow(() => {
    const { deleteTV } = pendingActions;
    // console.log("[PAGE]tv/index - view.onShow", deleteTV);
    if (!deleteTV) {
      return;
    }
    consumeAction("deleteTV");
    syncTaskList.deleteItem((season) => {
      if (season.id === deleteTV.id) {
        return true;
      }
      return false;
    });
  });
  syncTaskList.init();
  driveList.initIfInitial();

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="relative">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl">同步任务列表</h1>
          </div>
          <div class="mt-8">
            <div class="flex items-center space-x-2">
              <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
                刷新
              </Button>
              <Button icon={<ArrowUpCircle class="w-4 h-4" />} store={runTaskListBtn}>
                同步所有文件夹
              </Button>
              <div class="flex items-center space-x-2">
                <Checkbox store={onlyInvalidCheckbox}></Checkbox>
                <span>待处理</span>
              </div>
            </div>
            <div class="flex items-center space-x-2 mt-4">
              <Input class="" store={nameSearchInput} />
              <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
                搜索
              </Button>
              <Button class="" store={resetBtn}>
                重置
              </Button>
            </div>
            <div class="mt-4">
              <ListView
                store={syncTaskList}
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
                  <For each={tvListResponse().dataSource}>
                    {(task) => {
                      const { id, resource_file_name, drive_file_name, season } = task;
                      const name = `${resource_file_name} -> ${drive_file_name}`;
                      return (
                        <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                          <div class="flex">
                            <div class="overflow-hidden mr-2 rounded-sm">
                              <LazyImage class="w-[180px] h-[272px]" src={season?.poster_path} alt={name} />
                            </div>
                            <div class="flex-1 w-0 p-4">
                              <div class="flex items-center">
                                <h2 class="text-2xl text-slate-800">{name}</h2>
                              </div>
                              <div class="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
                                <Show when={season}>
                                  <Show
                                    when={season?.cur_episode_count !== season?.episode_count}
                                    fallback={
                                      <div class="flex items-center space-x-1 px-2 border border-green-600 rounded-xl text-green-600">
                                        <Smile class="w-4 h-4" />
                                        <div>全{season?.episode_count}集</div>
                                      </div>
                                    }
                                  >
                                    <div class="flex items-center space-x-1 px-2 border border-blue-600 rounded-xl text-blue-600">
                                      <Send class="w-4 h-4" />
                                      <div>
                                        {season?.cur_episode_count}/{season?.episode_count}
                                      </div>
                                    </div>
                                  </Show>
                                </Show>
                              </div>
                              <div class="space-x-2 mt-4 p-1 overflow-hidden whitespace-nowrap">
                                <Button
                                  store={refreshPartialBtn.bind(task)}
                                  variant="subtle"
                                  icon={<RotateCw class="w-4 h-4" />}
                                ></Button>
                                <Button
                                  store={linkSeasonBtn.bind(task)}
                                  variant="subtle"
                                  icon={<Pen class="w-4 h-4" />}
                                >
                                  关联电视剧
                                </Button>
                                <Button
                                  store={execSyncTaskBtn.bind(task)}
                                  variant="subtle"
                                  icon={<Bell class="w-4 h-4" />}
                                >
                                  运行
                                </Button>
                                <Button
                                  store={modifySyncTaskBtn.bind(task)}
                                  variant="subtle"
                                  icon={<Pen class="w-4 h-4" />}
                                >
                                  修改
                                </Button>
                                <Button
                                  store={modifySyncTaskBtn.bind(task)}
                                  variant="subtle"
                                  icon={<Pen class="w-4 h-4" />}
                                >
                                  删除
                                </Button>
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
      <Dialog store={addSyncTaskDialog}>
        <div class="w-[520px]">
          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-9">
              <Input store={sharedResourceUrlInput} />
            </div>
            <div class="col-span-3 grid">
              <Button store={sharedResourceBtn}>确定</Button>
            </div>
          </div>
          <div class="max-h-[360px] overflow-auto">
            <For each={folders()}>
              {(file) => {
                const { file_name, parent_paths, drive } = file;
                return (
                  <div class="flex items-center justify-between py-4">
                    <div class="">
                      <div class="text-sm">{drive.name}</div>
                      <div>{[parent_paths, file_name].filter(Boolean).join("/")}</div>
                    </div>
                    <Button
                      store={folderSelectBtn.bind(file)}
                      class="ml-4 cursor-pointer"
                      icon={<Check class="w-4 h-4" />}
                    >
                      选择
                    </Button>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Dialog>
      <Dialog store={folderSearcher.dialog}>
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-9">
            <Input store={folderSearcher.form.input} />
          </div>
          <div class="col-span-3 grid">
            <Button store={folderSearcher.form.btn}>确定</Button>
          </div>
        </div>
        <div class="h-[360px] overflow-y-auto">
          <For each={folders()}>
            {(file) => {
              const { file_name, parent_paths, drive } = file;
              return (
                <div class="flex items-center justify-between py-4 space-x-2">
                  <div>
                    <div class="text-sm text-slate-500">{drive.name}</div>
                    <div>
                      {parent_paths}/{file_name}
                    </div>
                  </div>
                  <Button
                    store={folderSelectBtn.bind(file)}
                    class="ml-4 cursor-pointer"
                    icon={<Check class="w-4 h-4" />}
                  ></Button>
                </div>
              );
            }}
          </For>
        </div>
      </Dialog>
      <Dialog store={sharedFileSaveListDialog}>
        <ScrollView store={sharedFileSaveScrollView} class="h-[360px] overflow-y-auto">
          <ListView store={sharedFileSaveList}>
            <For each={sharedFileSaveResponse().dataSource}>
              {(save) => {
                return (
                  <div>
                    <div class="flex items-center justify-between py-4 space-x-2">
                      <div>
                        <div class="text-sm text-slate-500">{save.drive.name}</div>
                        <div>
                          <div>{save.url}</div>
                          <div class="break-all">{save.name}</div>
                        </div>
                      </div>
                      <Button
                        store={addSyncFromSharedRecordBtn.bind(save)}
                        class="ml-4 cursor-pointer"
                        icon={<Check class="w-4 h-4" />}
                      ></Button>
                    </div>
                  </div>
                );
              }}
            </For>
          </ListView>
        </ScrollView>
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
      <Dialog store={seasonSelectDialog}>
        <div class="w-[520px]">
          <TVSeasonSelect store={seasonSelect} />
        </div>
      </Dialog>
      <BackToTop store={scrollView} />
    </>
  );
};
