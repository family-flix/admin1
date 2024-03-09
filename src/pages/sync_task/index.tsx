/**
 * @file 同步列表
 */
import { createSignal, For, Show } from "solid-js";
import {
  ArrowUpCircle,
  Bell,
  ChevronRight,
  FileInput,
  Folder,
  FolderHeart,
  HardDriveDownload,
  Pen,
  RotateCw,
  Search,
  Send,
  Smile,
  Trash,
} from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { createJob } from "@/store/job";
import {
  SyncTaskItem,
  fetchSyncTaskList,
  runSyncTask,
  fetchPartialSyncTask,
  updateSyncTask,
  runSyncTaskList,
  completeSyncTask,
  deleteSyncTask,
  overrideResourceForSyncTask,
} from "@/services/resource_sync_task";
import { Skeleton, ScrollView, Input, Button, LazyImage, Dialog, Checkbox, BackToTop, ListView } from "@/components/ui";
import { FileSearcherCore } from "@/components/FileSearcher";
import { TVSeasonSelectCore, SeasonSelect } from "@/components/SeasonSelect";
import {
  ScrollViewCore,
  DialogCore,
  InputCore,
  ButtonCore,
  ButtonInListCore,
  CheckboxCore,
  PresenceCore,
  ImageInListCore,
} from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { SharedResourceCore } from "@/domains/shared_resource";
import { Result } from "@/types";
import { FileType } from "@/constants";

export const SyncTaskListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const syncTaskList = new ListCore(new RequestCore(fetchSyncTaskList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const partialTaskRequest = new RequestCore(fetchPartialSyncTask);
  const syncTaskUpdateRequest = new RequestCore(updateSyncTask);
  const syncTaskOverrideRequest = new RequestCore(overrideResourceForSyncTask, {
    onLoading(loading) {
      syncTaskOverrideDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["修改成功"],
      });
      syncTaskOverrideDialog.hide();
      refreshPartialTask();
    },
    onFailed(error) {
      app.tip({
        text: ["修改失败", error.message],
      });
    },
  });
  const syncTaskCompleteRequest = new RequestCore(completeSyncTask);
  const syncTaskDeletingRequest = new RequestCore(deleteSyncTask);
  // const syncTaskCreateRequest = new RequestCore(createSyncTaskWithUrl, {
  //   onLoading(loading) {
  //     syncTaskCreateDialog.okBtn.setLoading(loading);
  //   },
  //   onSuccess() {
  //     app.tip({ text: ["新增同步任务成功"] });
  //     resourceUrlInput.clear();
  //     sharedResource.clear();
  //     syncTaskCreateDialog.hide();
  //     refreshPartialTask();
  //   },
  //   onFailed(error) {
  //     // console.log("[PAGE]tv/index - addFileSyncTask onFailed 1", error.code, error.data);
  //     app.tip({ text: ["新增同步任务失败", error.message] });
  //     if (error.code === 20001) {
  //       folderPresence.show();
  //     }
  //   },
  // });
  const runTaskListRequest = new RequestCore(runSyncTaskList, {
    beforeRequest() {
      runTaskListBtn.setLoading(true);
    },
    async onSuccess(r) {
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
  const syncTaskRunningRequest = new RequestCore(runSyncTask, {
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
  const taskRef = new RefCore<SyncTaskItem>();
  const folderRef = new RefCore<{ file_id: string; file_name: string }>();
  const resourceRef = new RefCore<{ file_id: string; file_name: string }>();
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
  const folderPresence = new PresenceCore();
  const syncTaskOverrideDialog = new DialogCore({
    title: "修改同步任务",
    onOk() {
      if (!taskRef.value) {
        app.tip({ text: ["请选择同步任务"] });
        return;
      }
      if (!resourceUrlInput.value) {
        app.tip({ text: [resourceUrlInput.placeholder] });
        return;
      }
      syncTaskOverrideRequest.run({
        id: taskRef.value.id,
        url: resourceUrlInput.value,
      });
    },
  });
  // const syncTaskCreateDialog = new DialogCore({
  //   title: "新增同步任务",
  //   onOk() {
  //     if (!resourceUrlInput.value) {
  //       app.tip({
  //         text: ["请输入分享资源链接"],
  //       });
  //       return;
  //     }
  //     if (sharedResource.files.length === 0) {
  //       app.tip({
  //         text: ["请先获取分享资源内容"],
  //       });
  //       return;
  //     }
  //     if (sharedResource.files.length !== 1) {
  //       app.tip({
  //         text: ["请手动选择左边的分享资源"],
  //       });
  //       return;
  //     }
  //     const payload: Parameters<typeof createSyncTaskWithUrl>[0] = { url: resourceUrlInput.value };
  //     if (folderRef.value) {
  //       payload.drive_file_id = folderRef.value.file_id;
  //       payload.drive_file_name = folderRef.value.file_name;
  //     }
  //     if (resourceRef.value) {
  //       payload.resource_file_id = resourceRef.value.file_id;
  //       payload.resource_file_name = resourceRef.value.file_name;
  //     }
  //     syncTaskCreateRequest.run(payload);
  //   },
  // });
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
  const resourceUrlInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入资源链接",
    onChange(v) {
      sharedResource.input(v);
    },
    onEnter() {
      resourceFetchBtn.click();
    },
  });
  const resourceFetchBtn = new ButtonCore({
    onClick() {
      if (!resourceUrlInput.value) {
        return;
      }
      sharedResource.fetch();
    },
  });
  // const syncTaskCreateBtn = new ButtonCore<SyncTaskItem>({
  //   onClick() {
  //     syncTaskCreateDialog.show();
  //   },
  // });
  const completeTaskBtn = new ButtonInListCore<SyncTaskItem>({
    async onClick(record) {
      completeTaskBtn.setLoading(true);
      const r = await syncTaskCompleteRequest.run({ id: record.id });
      completeTaskBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["请求失败", r.error.message],
        });
        return;
      }
      app.tip({
        text: ["操作成功"],
      });
      syncTaskList.deleteItem((item) => {
        if (item.id === record.id) {
          return true;
        }
        return false;
      });
    },
  });
  const deleteTaskDialog = new DialogCore({
    title: "删除同步任务",
    async onOk() {
      if (!taskRef.value) {
        return;
      }
      const { id } = taskRef.value;
      deleteTaskDialog.okBtn.setLoading(true);
      const r = await syncTaskDeletingRequest.run({ id });
      deleteTaskDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["删除失败", r.error.message],
        });
        return;
      }
      deleteTaskDialog.hide();
      app.tip({
        text: ["删除成功"],
      });
      syncTaskList.deleteItem((item) => {
        if (item.id === id) {
          return true;
        }
        return false;
      });
    },
  });
  const deleteTaskBtn = new ButtonInListCore<SyncTaskItem>({
    async onClick(record) {
      taskRef.select(record);
      deleteTaskDialog.show();
    },
  });
  const syncTaskOverrideBtn = new ButtonInListCore<SyncTaskItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      taskRef.select(record);
      syncTaskOverrideDialog.show();
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
      const r = await syncTaskUpdateRequest.run({
        id: taskRef.value.id,
        season_id: seasonSelect.value.id,
      });
      seasonSelectDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["关联失败", r.error.message],
        });
        return;
      }
      seasonSelect.clear();
      refreshPartialTask(taskRef.value.id);
      seasonSelectDialog.hide();
    },
  });
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
      syncTaskRunningRequest.run({ id: record.id });
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
  const runTaskListBtn = new ButtonCore({
    onClick() {
      app.tip({ text: ["开始同步所有文件夹"] });
      runTaskListRequest.run();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      syncTaskList.refresh();
    },
  });
  const sharedResource = new SharedResourceCore();
  const folderSearcher = new FileSearcherCore({
    search: {
      type: FileType.Folder,
    },
    footer: false,
  });
  const seasonSelect = new TVSeasonSelectCore({});
  const scrollView = new ScrollViewCore({
    pullToRefresh: false,
    onReachBottom() {
      syncTaskList.loadMore();
    },
  });
  const poster = new ImageInListCore({});
  const folderImg = new ImageInListCore({});

  const [syncTaskListState, setSyncTaskListState] = createSignal(syncTaskList.response);
  const [resourceState, setResponseState] = createSignal(sharedResource.state);
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
  const [curDriveFolder, setCurFolder] = createSignal(folderRef.value);
  const [curResourceFolder, setCurResourceFolder] = createSignal(resourceRef.value);

  syncTaskList.onStateChange((nextState) => {
    // console.log("[PAGE]tv/index - tvList.onStateChange", nextState.dataSource[0]);
    setSyncTaskListState(nextState);
  });
  folderSearcher.onStateChange((nextState) => {
    const { list } = nextState;
    setFolders(list.dataSource);
  });
  folderRef.onStateChange((nextState) => {
    setCurFolder(nextState);
  });
  resourceRef.onStateChange((nextState) => {
    setCurResourceFolder(nextState);
  });
  sharedResource.onLoadingChange((loading) => {
    resourceFetchBtn.setLoading(loading);
  });
  sharedResource.onStateChange((values) => {
    setResponseState(values);
  });
  syncTaskList.init();

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="relative">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl">同步任务列表({syncTaskListState().total})</h1>
          </div>
          <div class="mt-8">
            <div class="flex items-center space-x-2">
              <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
                刷新
              </Button>
              <Button class="" store={resetBtn}>
                重置
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
                  <For each={syncTaskListState().dataSource}>
                    {(task) => {
                      const { id, url, resource_file_name, invalid, drive_file_name, season, drive } = task;
                      const name = `${resource_file_name} -> ${drive_file_name}`;
                      const driveURL = history.buildURLWithPrefix("root.home_layout.drive_profile", { id: drive.id });
                      const seasonURL = season
                        ? history.buildURLWithPrefix("root.home_layout.season_profile", {
                            id: season.tv_id,
                            season_id: season.id,
                          })
                        : undefined;
                      return (
                        <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                          <div class="flex">
                            <div class="overflow-hidden mr-2 rounded-sm">
                              <Show when={season} fallback={<div class="w-[180px] h-[272px] bg-slate-200" />}>
                                <div class="relative">
                                  <a href={seasonURL}>
                                    <LazyImage
                                      class="w-[180px] h-[272px]"
                                      store={poster.bind(season?.poster_path!)}
                                      alt={name}
                                    />
                                  </a>
                                  <div class="absolute right-2 bottom-2 flex items-center space-x-4 mt-2 break-keep overflow-hidden">
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
                                </div>
                              </Show>
                            </div>
                            <div class="flex-1 w-0 p-4">
                              <div
                                classList={{
                                  "opacity-20": invalid === 1,
                                }}
                              >
                                <div class="flex items-center">
                                  <div class="flex flex-1 flex-col items-center p-4 h-[132px] rounded-md bg-slate-100 border">
                                    <div>
                                      <FolderHeart class="w-8 h-8" />
                                    </div>
                                    <div class="mt-2">{resource_file_name}</div>
                                    <div class="text-slate-500">
                                      <a href={url} target="_blank">
                                        {url}
                                      </a>
                                    </div>
                                  </div>
                                  <div class="mx-4">
                                    <FileInput class="w-6 h-6 text-slate-800" />
                                  </div>
                                  <div class="flex flex-1 flex-col items-center p-4 h-[132px] rounded-md bg-slate-100 border">
                                    <div>
                                      <HardDriveDownload class="w-8 h-8" />
                                    </div>
                                    <div class="mt-2">{drive_file_name}</div>
                                    <div class="text-slate-500">
                                      <a href={driveURL} target="_blank">
                                        {drive.name}
                                      </a>
                                    </div>
                                  </div>
                                </div>
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
                                  store={syncTaskOverrideBtn.bind(task)}
                                  variant="subtle"
                                  icon={<Pen class="w-4 h-4" />}
                                >
                                  修改
                                </Button>
                                <Button
                                  store={completeTaskBtn.bind(task)}
                                  variant="subtle"
                                  icon={<Pen class="w-4 h-4" />}
                                >
                                  完成
                                </Button>
                                <Button
                                  store={deleteTaskBtn.bind(task)}
                                  variant="subtle"
                                  icon={<Trash class="w-4 h-4" />}
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
      {/* <Dialog store={syncTaskCreateDialog}>
        <div class="w-[680px] min-h-[360px]">
          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-9">
              <Input store={resourceUrlInput} />
            </div>
            <div class="col-span-3 grid">
              <Button store={resourceFetchBtn}>获取</Button>
            </div>
          </div>
          <div class="flex mt-4">
            <div class="flex-[50%]">
              <Show when={resourceState().files.length}>
                <div class="p-4 bg-white rounded-sm">
                  <div class="">
                    <Show when={resourceState().paths.length}>
                      <div class="flex items-center space-x-2">
                        <Folder class="w-4 h-4" />
                        <For each={resourceState().paths}>
                          {(path, index) => {
                            const { file_id, name } = path;
                            return (
                              <div class="flex items-center">
                                <div class="cursor-pointer hover:text-blue-500">{name}</div>
                                {index() === resourceState().paths.length - 1 ? null : (
                                  <div class="mx-1">
                                    <ChevronRight class="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </Show>
                  </div>
                  <div class="mt-2 max-h-[360px] overflow-auto">
                    <For each={resourceState().files}>
                      {(file) => {
                        const { file_id, name, type } = file;
                        return (
                          <div class="relative">
                            <div
                              classList={{
                                "w-full p-4 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500": true,
                                "bg-slate-200": curResourceFolder()?.file_id === file_id,
                              }}
                              onClick={() => {
                                resourceRef.select({
                                  file_id,
                                  file_name: name,
                                });
                              }}
                            >
                              <div class="flex">
                                <div class="w-[36px] mr-4">
                                  <LazyImage
                                    class="max-w-full max-h-full object-contain"
                                    src={(() => {
                                      if (type === "folder") {
                                        return "https://img.alicdn.com/imgextra/i1/O1CN01rGJZac1Zn37NL70IT_!!6000000003238-2-tps-230-180.png";
                                      }
                                      return "https://img.alicdn.com/imgextra/i2/O1CN01ROG7du1aV18hZukHC_!!6000000003334-2-tps-140-140.png";
                                    })()}
                                  />
                                </div>
                                <div>{name}</div>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
            <div class="flex-[50%]">
              <Presence store={folderPresence}>
                <div class="p-4">
                  <div class="grid grid-cols-12 gap-2">
                    <div class="col-span-9">
                      <Input store={folderSearcher.form.input} />
                    </div>
                    <div class="col-span-3 grid">
                      <Button store={folderSearcher.form.btn}>搜索</Button>
                    </div>
                  </div>
                  <div class="mt-2 max-h-[360px] overflow-auto">
                    <For each={folders()}>
                      {(file) => {
                        const { file_id, file_name, parent_paths, drive } = file;
                        return (
                          <div class="flex items-center justify-between py-4">
                            <div
                              classList={{
                                "bg-slate-200": curDriveFolder()?.file_id === file_id,
                              }}
                              onClick={() => {
                                folderRef.select(file);
                              }}
                            >
                              <div class="text-sm">{drive.name}</div>
                              <div>{[parent_paths, file_name].filter(Boolean).join("/")}</div>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Presence>
            </div>
          </div>
        </div>
      </Dialog> */}
      <Dialog store={syncTaskOverrideDialog}>
        <div class="w-[680px] min-h-[360px]">
          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-9">
              <Input store={resourceUrlInput} />
            </div>
            <div class="col-span-3 grid">
              <Button store={resourceFetchBtn}>获取</Button>
            </div>
          </div>
          <div class="mt-4">
            <div class="">
              <Show when={resourceState().files.length}>
                <div class="p-4 bg-white rounded-sm">
                  <div class="">
                    <Show when={resourceState().paths.length}>
                      <div class="flex items-center space-x-2">
                        <Folder class="w-4 h-4" />
                        <For each={resourceState().paths}>
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
                                {index() === resourceState().paths.length - 1 ? null : (
                                  <div class="mx-1">
                                    <ChevronRight class="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </Show>
                  </div>
                  <div class="mt-2 max-h-[360px] overflow-auto">
                    <For each={resourceState().files}>
                      {(file) => {
                        const { name, type } = file;
                        return (
                          <div class="relative">
                            <div class="w-full p-4 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500">
                              <div class="flex">
                                <div class="w-[36px] mr-4">
                                  <LazyImage
                                    class="max-w-full max-h-full object-contain"
                                    store={folderImg.bind(
                                      (() => {
                                        if (type === "folder") {
                                          return "https://img.alicdn.com/imgextra/i1/O1CN01rGJZac1Zn37NL70IT_!!6000000003238-2-tps-230-180.png";
                                        }
                                        return "https://img.alicdn.com/imgextra/i2/O1CN01ROG7du1aV18hZukHC_!!6000000003334-2-tps-140-140.png";
                                      })()
                                    )}
                                  />
                                </div>
                                <div>{name}</div>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Dialog>
      <Dialog store={seasonSelectDialog}>
        <div class="w-[520px]">
          <SeasonSelect store={seasonSelect} />
        </div>
      </Dialog>
      <Dialog store={deleteTaskDialog}>
        <div class="w-[520px]">
          <p>确认删除该同步任务吗？</p>
        </div>
      </Dialog>
      <BackToTop store={scrollView} />
    </>
  );
};
