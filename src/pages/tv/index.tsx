/**
 * @file 电视剧列表
 */
import { createSignal, For, Show } from "solid-js";
import { effect } from "solid-js/web";
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
  SlidersHorizontal,
  Smile,
} from "lucide-solid";

import {
  add_file_sync_task_of_tv,
  fetch_folder_can_add_sync_task,
  fetch_partial_season,
  fetch_season_list,
  refresh_tv_profile,
  run_all_file_sync_tasks,
  run_file_sync_task_of_tv,
  transfer_tv_to_another_drive,
  TVSeasonItem,
} from "@/services";
import { driveList } from "@/store/drives";
import { Result, ViewComponent } from "@/types";
import {
  Skeleton,
  Popover,
  ScrollView,
  Input,
  Button,
  LazyImage,
  Dialog,
  Checkbox,
  PurePopover,
  BackToTop,
  CheckboxGroup,
} from "@/components/ui";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ListView } from "@/components/ListView";
import {
  ScrollViewCore,
  DialogCore,
  PopoverCore,
  InputCore,
  ButtonCore,
  ButtonInListCore,
  CheckboxCore,
} from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/client";
import { SelectionCore } from "@/domains/cur";
import { SharedResourceCore } from "@/domains/shared_resource";
import { JobCore } from "@/domains/job";
import { DriveCore } from "@/domains/drive";
import { createJob } from "@/store";
import { cn } from "@/utils";
import { FileSearcherCore } from "@/components/FileSearcher/store";
import { FileType, MediaSourceOptions, TVGenresOptions } from "@/constants";
import { consumeAction, pendingActions } from "@/store/actions";
import { CheckboxGroupCore } from "@/domains/ui/checkbox/group";

export const TVManagePage: ViewComponent = (props) => {
  const { app, router, view } = props;

  const seasonList = new ListCore(new RequestCore(fetch_season_list), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const partialSeasonRequest = new RequestCore(fetch_partial_season);
  const tvSelection = new SelectionCore<TVSeasonItem>();
  const onlyInvalidCheckbox = new CheckboxCore({
    onChange(checked) {
      seasonList.search({
        invalid: Number(checked),
      });
    },
  });
  const duplicatedCheckbox = new CheckboxCore({
    onChange(checked) {
      seasonList.search({
        duplicated: Number(checked),
      });
    },
  });
  const sourceCheckboxGroup = new CheckboxGroupCore({
    options: MediaSourceOptions,
    onChange(options) {
      setHasSearch(!!options.length);
      seasonList.search({
        language: options.join("|"),
      });
    },
  });
  const tvGenresCheckboxGroup = new CheckboxGroupCore({
    options: TVGenresOptions,
    onChange(options) {
      setHasSearch(!!options.length);
      seasonList.search({
        genres: options.join("|"),
      });
    },
  });
  const driveSelection = new SelectionCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
    },
  });
  const bindSearchedTVForTVRequest = new RequestCore(refresh_tv_profile, {
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      seasonList.refresh();
    },
    onFailed(error) {
      app.tip({
        text: ["修改失败", error.message],
      });
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
      refreshPartialTV();
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
      createJob({
        job_id: r.job_id,
        onFinish() {
          if (!tvSelection.value) {
            return;
          }
          const { name } = tvSelection.value;
          app.tip({
            text: [`完成电视剧 '${name}' 复制`],
          });
        },
      });
      transferConfirmDialog.hide();
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
      if (!tvSelection.value) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      if (!sharedResourceUrlInput.value) {
        app.tip({ text: ["请先输入资源链接"] });
        return;
      }
      const { file_id, file_name } = record;
      addFileSyncTask.run({
        tv_id: tvSelection.value.tv_id,
        url: sharedResourceUrlInput.value,
        target_file_id: file_id,
        target_file_name: file_name,
      });
    },
  });
  const refreshPartialTV = async (id?: string) => {
    const season_id = id || tvSelection.value?.id;
    if (!season_id) {
      return Result.Err("缺少季 id");
    }
    const r = await partialSeasonRequest.run({ season_id });
    if (r.error) {
      app.tip({
        text: ["获取电视剧最新信息失败", r.error.message],
      });
      return Result.Err(r.error.message);
    }
    seasonList.modifyItem((item) => {
      if (item.id !== season_id) {
        return item;
      }
      return {
        ...r.data,
      };
    });
    return Result.Ok(null);
  };
  const runFileSyncTask = new RequestCore(run_file_sync_task_of_tv, {
    beforeRequest() {
      execSyncTaskBtn.setLoading(true);
    },
    onSuccess(resp) {
      createJob({
        job_id: resp.job_id,
        onFinish() {
          execSyncTaskBtn.setLoading(false);
          refreshPartialTV();
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
  const dialog = new TMDBSearcherDialogCore({
    onOk(searchedTV) {
      const tvId = tvSelection.value?.tv_id;
      if (!tvId) {
        app.tip({ text: ["请先选择要修改的电视剧"] });
        return;
      }
      bindSearchedTVForTVRequest.run({
        tv_id: tvId,
        tmdb_id: searchedTV.id,
      });
    },
  });
  const addSyncTaskDialog = new DialogCore({
    title: "新增更新任务",
    footer: false,
  });
  const input1 = new InputCore({ placeholder: "请输入名称搜索" });
  const searchBtn = new ButtonCore({
    onClick() {
      if (!input1.value) {
        return;
      }
      seasonList.search({ name: input1.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      seasonList.reset();
      onlyInvalidCheckbox.uncheck();
      duplicatedCheckbox.uncheck();
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
      if (!tvSelection.value) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      addFileSyncTask.run({
        tv_id: tvSelection.value.tv_id,
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
        tv_id: curTV.tv_id,
        target_drive_id: driveSelection.value.id,
      });
    },
  });
  const folderSearcher = new FileSearcherCore({
    search: {
      type: FileType.Folder,
    },
    footer: false,
  });
  const transferBtn = new ButtonInListCore<TVSeasonItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      tvSelection.select(record);
      transferConfirmDialog.show();
    },
  });
  const addSyncTaskBtn = new ButtonInListCore<TVSeasonItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      tvSelection.select(record);
      addSyncTaskDialog.show();
    },
  });
  const execSyncTaskBtn = new ButtonInListCore<TVSeasonItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      tvSelection.select(record);
      runFileSyncTask.run({ id: record.tv_id });
    },
  });
  const refreshPartialBtn = new ButtonInListCore<TVSeasonItem>({
    async onClick(record) {
      refreshPartialBtn.setLoading(true);
      const r = await refreshPartialTV(record.id);
      refreshPartialBtn.setLoading(false);
      if (r.error) {
        return;
      }
      app.tip({
        text: ["刷新成功"],
      });
    },
  });
  const profileBtn = new ButtonInListCore<TVSeasonItem>({
    onClick(record) {
      router.push(`/home/tv/${record.tv_id}?season_id=${record.id}`);
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
        seasonList.refresh();
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
      seasonList.refresh();
    },
  });
  const scrollView = new ScrollViewCore({
    pullToRefresh: false,
    onReachBottom() {
      seasonList.loadMore();
    },
    onScroll() {
      tipPopover.hide();
    },
  });

  const [tvListResponse, setTVListResponse] = createSignal(seasonList.response);
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
  const [curDrive, setCurDrive] = createSignal(driveSelection.value);
  const [hasSearch, setHasSearch] = createSignal(false);
  // effect(() => {
  //   console.log(tvListResponse().dataSource[0]?.name);
  // });

  driveList.onStateChange((nextResponse) => {
    setDriveResponse(nextResponse);
  });
  seasonList.onStateChange((nextState) => {
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
  folderSearcher.onStateChange((nextState) => {
    const { list } = nextState;
    setFolders(list.dataSource);
  });
  view.onShow(() => {
    const { deleteTV } = pendingActions;
    console.log("[PAGE]tv/index - view.onShow", deleteTV);
    if (!deleteTV) {
      return;
    }
    consumeAction("deleteTV");
    seasonList.deleteItem((season) => {
      if (season.tv_id === deleteTV.tv_id) {
        return true;
      }
      return false;
    });
  });
  seasonList.init();
  driveList.init();

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="relative">
          <h1 class="text-2xl">电视剧列表</h1>
          <div class="mt-8">
            <div class="flex items-center space-x-2">
              <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
                刷新
              </Button>
              <Button icon={<ArrowUpCircle class="w-4 h-4" />} store={syncAllTVBtn}>
                更新所有电视剧
              </Button>
              <div class="flex items-center space-x-2">
                <Checkbox store={onlyInvalidCheckbox}></Checkbox>
                <span>待处理</span>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox store={duplicatedCheckbox}></Checkbox>
                <span>重复内容</span>
              </div>
              <PurePopover
                align="center"
                content={
                  <div class="h-[320px] py-4 pb-8 px-2 overflow-y-auto">
                    <div>
                      <CheckboxGroup store={sourceCheckboxGroup} />
                    </div>
                    <div>
                      <CheckboxGroup store={tvGenresCheckboxGroup} />
                    </div>
                  </div>
                }
              >
                <div class="relative p-2 cursor-pointer">
                  <SlidersHorizontal class={cn("w-5 h-5")} />
                  <Show when={hasSearch()}>
                    <div class="absolute top-[2px] right-[2px] w-2 h-2 rounded-full bg-red-500"></div>
                  </Show>
                </div>
              </PurePopover>
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
                store={seasonList}
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
                    {(season) => {
                      const {
                        name,
                        overview,
                        poster_path,
                        first_air_date,
                        popularity,
                        sync_task,
                        cur_episode_count,
                        season_text,
                        episode_count,
                        need_bind,
                      } = season;
                      return (
                        <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                          <div class="flex">
                            <div class="overflow-hidden mr-2 rounded-sm">
                              <LazyImage class="w-[180px] h-[272px]" src={poster_path} alt={name} />
                            </div>
                            <div class="flex-1 w-0 p-4">
                              <div class="flex items-center">
                                <h2 class="text-2xl text-slate-800">{name}</h2>
                                <p class="ml-4 text-slate-500">{season_text}</p>
                              </div>
                              <div class="mt-2 overflow-hidden text-ellipsis">
                                <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-3">
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
                                <Show
                                  when={cur_episode_count !== episode_count}
                                  fallback={
                                    <div class="flex items-center space-x-1 px-2 border border-green-600 rounded-xl text-green-600">
                                      <Smile class="w-4 h-4" />
                                      <div>全{episode_count}集</div>
                                    </div>
                                  }
                                >
                                  <div class="flex items-center space-x-1 px-2 border border-blue-600 rounded-xl text-blue-600">
                                    <Send class="w-4 h-4" />
                                    <div>
                                      {cur_episode_count}/{episode_count}
                                    </div>
                                  </div>
                                </Show>
                                <Show when={season.tips.length}>
                                  <div
                                    class="flex items-center space-x-1 px-2 border border-red-500 rounded-xl text-red-500"
                                    onMouseEnter={(event) => {
                                      const { x, y, width, height, left, top, right, bottom } =
                                        event.currentTarget.getBoundingClientRect();
                                      setTips(season.tips);
                                      tipPopover.show({ x, y, width, height: height + 8, left, top, right, bottom });
                                    }}
                                    onMouseLeave={() => {
                                      tipPopover.hide();
                                    }}
                                  >
                                    <Info class="w-4 h-4" />
                                    <div>{season.tips.length}个问题</div>
                                  </div>
                                </Show>
                              </div>
                              <div class="space-x-2 mt-4 p-1 overflow-hidden whitespace-nowrap">
                                <Button
                                  store={refreshPartialBtn.bind(season)}
                                  variant="subtle"
                                  icon={<RotateCw class="w-4 h-4" />}
                                ></Button>
                                <Button
                                  store={profileBtn.bind(season)}
                                  variant="subtle"
                                  icon={<BookOpen class="w-4 h-4" />}
                                >
                                  详情
                                </Button>
                                <Show when={cur_episode_count === episode_count}>
                                  <Button
                                    store={transferBtn.bind(season)}
                                    variant="subtle"
                                    icon={<Package class="w-4 h-4" />}
                                  >
                                    归档
                                  </Button>
                                </Show>
                                <Show when={need_bind}>
                                  <Button
                                    store={addSyncTaskBtn.bind(season)}
                                    variant="subtle"
                                    icon={<BellPlus class="w-4 h-4" />}
                                  >
                                    创建更新任务
                                  </Button>
                                </Show>
                                <Show when={sync_task}>
                                  <Button
                                    store={execSyncTaskBtn.bind(season)}
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
        <div class="h-[360px] overflow-auto">
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
        <div
          onClick={() => {
            setFolders([]);
            folderSearcher.dialog.show();
          }}
        >
          从云盘中选择文件夹
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
      <Dialog store={folderSearcher.dialog}>
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-9">
            <Input store={folderSearcher.form.input} />
          </div>
          <div class="col-span-3 grid">
            <Button store={folderSearcher.form.btn}>确定</Button>
          </div>
        </div>
        <div class="h-[360px] overflow-auto">
          <For each={folders()}>
            {(file) => {
              const { file_name, drive } = file;
              return (
                <div class="flex items-center justify-between py-4 space-x-2">
                  <div>{drive.name}</div>
                  <div>{file_name}</div>
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
      <BackToTop store={scrollView} />
    </>
  );
};
