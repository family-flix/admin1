/**
 * @file 电视剧归档
 */
import { For, Show, createSignal } from "solid-js";
import {
  ArrowLeft,
  ArrowRight,
  HardDrive,
  Loader,
  RotateCcw,
  Search,
  Send,
  Smile,
  SwitchCamera,
  Trash,
} from "lucide-solid";

import {
  SeasonPrepareArchiveItem,
  deleteSourceFile,
  deleteSourceFiles,
  fetchPartialSeasonPrepareArchive,
  fetchSeasonPrepareArchiveList,
  moveSeasonToResourceDrive,
  transferSeasonToAnotherDrive,
} from "@/services";
import { Button, CheckboxGroup, Dialog, Input, ListView, ScrollView, Skeleton } from "@/components/ui";
import { ButtonCore, ButtonInListCore, CheckboxGroupCore, DialogCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { createJob, driveList, driveProfilePage, homeIndexPage, homeTVListPage } from "@/store";
import { ViewComponent } from "@/types";
import { DriveCore, DriveItem } from "@/domains/drive";
import { DriveSelectCore } from "@/components/DriveSelect";
import { DriveSelect } from "@/components/DriveSelect/dialog";
import { RefCore } from "@/domains/cur";

export const SeasonArchivePage: ViewComponent = (props) => {
  const { app, view } = props;
  const seasonList = new ListCore(new RequestCore(fetchSeasonPrepareArchiveList), {
    pageSize: 1,
    onLoadingChange(loading) {
      nameSearchInput.setLoading(loading);
      searchBtn.setLoading(loading);
    },
  });
  const refreshPartialSeasonRequest = new RequestCore(fetchPartialSeasonPrepareArchive);
  const moveToResourceDriveRequest = new RequestCore(moveSeasonToResourceDrive, {
    onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          const curSeason = seasonList.response.dataSource[0];
          if (!curSeason) {
            return;
          }
          const { name } = curSeason;
          app.tip({
            text: [`完成电视剧 '${name}' 移动到资源盘`],
          });
          refresh(curSeason);
          toResourceDriveBtn.setLoading(false);
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["移动失败", error.message],
      });
    },
  });
  const transferRequest = new RequestCore(transferSeasonToAnotherDrive, {
    beforeRequest() {
      app.tip({
        text: ["开始归档，请等待一段时间"],
      });
      transferBtn.setLoading(true);
    },
    onSuccess(r) {
      createJob({
        job_id: r.job_id,
        async onFinish() {
          transferBtn.setLoading(false);
          if (!seasonRef.value) {
            return;
          }
          const { name } = seasonRef.value;
          app.tip({
            text: [`完成电视剧 '${name}' 归档`],
          });
          if (toDriveRef.value) {
            await toDriveRef.value.refresh();
            setToDriveState(toDriveRef.value.state);
          }
          refresh(seasonRef.value);
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["归档失败", error.message],
      });
    },
  });
  const sourcesDeletingRequest = new RequestCore(deleteSourceFiles, {
    onSuccess() {
      const theDrive = curDriveRef.value;
      if (!theDrive) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      const theSeason = seasonRef.value;
      if (!theSeason) {
        app.tip({
          text: ["删除成功"],
        });
        return;
      }
      refresh({ id: theSeason.id });
    },
    onFailed(error) {
      app.tip({
        text: ["删除视频源失败", error.message],
      });
    },
  });
  const sourceDeletingRequest = new RequestCore(deleteSourceFile, {
    onLoading(loading) {
      // fileDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      const theEpisode = episodeRef.value;
      const theSource = sourceRef.value;
      if (!theEpisode || !theSource) {
        app.tip({
          text: ["删除成功，请刷新页面"],
        });
        return;
      }
      seasonList.modifyResponse((response) => {
        return {
          ...response,
          dataSource: response.dataSource.map((season) => {
            return {
              ...season,
              episodes: season.episodes.map((episode) => {
                if (episode.id !== theEpisode.id) {
                  return episode;
                }
                return {
                  ...episode,
                  drives: episode.drives.map((drive) => {
                    return {
                      ...drive,
                      sources: drive.sources.filter((source) => {
                        if (source.id !== theSource.id) {
                          return true;
                        }
                        return false;
                      }),
                    };
                  }),
                };
              }),
            };
          }),
        };
      });
      app.tip({
        text: ["删除成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["删除视频源失败", error.message],
      });
    },
  });
  const seasonRef = new RefCore<SeasonPrepareArchiveItem>();
  const toDriveRef = new RefCore<DriveCore>();
  const curDriveRef = new RefCore<{ id: string }>();
  const episodeRef = new RefCore<{ id: string }>();
  const sourceRef = new RefCore<{ id: String; file_id: string }>();
  const driveCheckboxGroup = new CheckboxGroupCore({
    options: [] as { value: string; label: string }[],
    onChange(options) {
      seasonList.search({
        next_marker: "",
        drive_ids: options.join("|"),
      });
    },
  });
  const toResourceDriveBtn = new ButtonInListCore<SeasonPrepareArchiveItem>({
    onClick(record) {
      toResourceDriveBtn.setLoading(true);
      app.tip({
        text: ["开始移动，请等待一段时间"],
      });
      moveToResourceDriveRequest.run({
        season_id: record.id,
      });
    },
  });
  async function refresh(record: { id: string }) {
    refreshPartialBtn.setLoading(true);
    const r = await refreshPartialSeasonRequest.run({ id: record.id });
    refreshPartialBtn.setLoading(false);
    if (r.error) {
      app.tip({
        text: ["刷新失败"],
      });
      return;
    }
    seasonList.modifyDataSource((item) => {
      if (item.id === record.id) {
        return r.data;
      }
      return item;
    });
  }
  const refreshPartialBtn = new ButtonInListCore<SeasonPrepareArchiveItem>({
    async onClick(record) {
      refresh(record);
    },
  });
  const transferBtn = new ButtonInListCore<SeasonPrepareArchiveItem>({
    onClick(record) {
      seasonRef.select(record);
      if (!toDriveRef.value) {
        toDriveSelectDialog.show();
        return;
      }
      transferRequest.run({ season_id: record.id, target_drive_id: toDriveRef.value.id });
    },
  });
  const gotoDriveProfileBtn = new ButtonCore({
    onClick() {
      if (!toDriveRef.value) {
        app.tip({
          text: ["请先选择云盘"],
        });
        return;
      }
      const drive = toDriveRef.value;
      driveProfilePage.query = {
        id: drive.id,
        name: drive.name,
      };
      const url = driveProfilePage.buildUrlWithPrefix();
      window.open(url, "black");
      // app.showView(driveProfilePage);
    },
  });
  const toDriveSelectBtn = new ButtonCore({
    onClick() {
      toDriveSelectDialog.show();
    },
  });
  const toDriveSelectDialog = new DialogCore({
    title: "选择云盘",
    onOk() {
      if (!toDriveSelect.value) {
        app.tip({
          text: ["请选择云盘"],
        });
        return;
      }
      toDriveRef.select(toDriveSelect.value);
      setToDriveState(toDriveSelect.value.state);
      toDriveSelectDialog.hide();
    },
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      if (!nameSearchInput.value) {
        app.tip({
          text: ["请输入关键字"],
        });
        return;
      }
      seasonList.search({
        name: nameSearchInput.value,
      });
    },
  });
  const toDriveSelect = new DriveSelectCore({});
  // const drive = new DriveCore({ id});
  const scrollView = new ScrollViewCore({});

  const [seasonListState, setSeasonListState] = createSignal(seasonList.response);
  const [toDriveState, setToDriveState] = createSignal<null | DriveCore["state"]>(null);
  const [driveListState, setDriveListState] = createSignal(driveList.response);

  driveList.onStateChange((nextState) => {
    const driveCheckBoxGroupOptions = nextState.dataSource.map((d) => {
      const { name, id } = d;
      return {
        value: id,
        label: name,
      };
    });
    driveCheckboxGroup.setOptions(driveCheckBoxGroupOptions);
    setDriveListState(nextState);
  });
  seasonList.onStateChange((nextState) => {
    setSeasonListState(nextState);
  });
  seasonList.init();
  driveList.initAny();

  return (
    <>
      <ScrollView class="h-screen p-8 bg-white" store={scrollView}>
        <div class="relative">
          <div class="flex items-center space-x-1">
            <div
              class="p-1 cursor-pointer"
              onClick={() => {
                app.showView(homeTVListPage);
              }}
            >
              <ArrowLeft class="w-6 h-6" />
            </div>
            <h1 class="text-2xl">电视剧列表({seasonListState().total})</h1>
          </div>
          <div class="mt-8">
            <div class="flex items-center space-x-2 mt-4">
              <Input class="" store={nameSearchInput} />
              <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
                搜索
              </Button>
            </div>
            <div class="flex items-center mt-4">
              <CheckboxGroup store={driveCheckboxGroup} />
              <Show when={!driveListState().noMore}>
                <div
                  class="inline-block ml-4"
                  onClick={() => {
                    driveList.loadMore();
                  }}
                >
                  全部云盘
                </div>
              </Show>
            </div>
            <div class="flex items-center space-x-2"></div>
            <div class="mt-4">
              <ListView
                store={seasonList}
                skeleton={
                  <div>
                    <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                      <div class="flex">
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
                  <For each={seasonListState().dataSource}>
                    {(season) => {
                      const {
                        id,
                        name,
                        cur_episode_count,
                        season_text,
                        can_archive,
                        need_to_resource,
                        size_count_text,
                        episode_count,
                        episodes,
                        drives,
                      } = season;
                      return (
                        <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                          <div class="flex">
                            <div class="flex-1 w-0 p-4">
                              <div class="flex items-center">
                                <h2 class="text-2xl text-slate-800">{name}</h2>
                                <p class="ml-4 text-slate-500">{season_text}</p>
                              </div>
                              <div class="mt-2 overflow-hidden text-ellipsis">{size_count_text}</div>
                              <div class="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
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
                              </div>
                              <div class="flex items-center space-x-2 mt-4 p-1 overflow-hidden whitespace-nowrap">
                                <Button
                                  store={refreshPartialBtn.bind(season)}
                                  icon={<RotateCcw class="w-4 h-4" />}
                                  variant="subtle"
                                ></Button>
                                <Show when={drives.length !== 1}>
                                  <For each={drives}>
                                    {(drive) => {
                                      return (
                                        <div
                                          class="cursor-pointer"
                                          onClick={() => {
                                            seasonRef.select(season);
                                            curDriveRef.select(drive);
                                            sourcesDeletingRequest.run({
                                              drive_id: drive.id,
                                              season_id: id,
                                            });
                                          }}
                                        >
                                          <div class="p-2">删除 {drive.name} 内文件</div>
                                        </div>
                                      );
                                    }}
                                  </For>
                                </Show>
                                <Show when={can_archive}>
                                  <Button store={transferBtn.bind(season)} variant="subtle">
                                    归档
                                  </Button>
                                </Show>
                                <Show when={need_to_resource}>
                                  <Button store={toResourceDriveBtn.bind(season)} variant="subtle">
                                    移动到资源盘
                                  </Button>
                                </Show>
                              </div>
                              <div class="mt-6 space-y-4">
                                <For each={episodes}>
                                  {(episode) => {
                                    const { id: episode_id, name: episode_name, drives } = episode;
                                    return (
                                      <div>
                                        <div class="text-lg">{episode_name}</div>
                                        <div>
                                          <For each={drives}>
                                            {(drive) => {
                                              const { id: drive_id, name: drive_name, sources } = drive;
                                              return (
                                                <div class="mt-2">
                                                  <div class="flex items-center">
                                                    <div>{drive_name}</div>
                                                  </div>
                                                  <div>
                                                    <For each={sources}>
                                                      {(source) => {
                                                        const { file_id, file_name, parent_paths } = source;
                                                        return (
                                                          <div class="flex items-center text-slate-500">
                                                            <div class="break-all">
                                                              {parent_paths}/{file_name}
                                                              <span
                                                                class="p-1 cursor-pointer"
                                                                onClick={() => {
                                                                  episodeRef.select(episode);
                                                                  sourceRef.select(source);
                                                                  sourceDeletingRequest.run({
                                                                    id: source.id,
                                                                  });
                                                                }}
                                                              >
                                                                <Trash class="inline-block w-4 h-4" />
                                                              </span>
                                                            </div>
                                                          </div>
                                                        );
                                                      }}
                                                    </For>
                                                  </div>
                                                </div>
                                              );
                                            }}
                                          </For>
                                        </div>
                                      </div>
                                    );
                                  }}
                                </For>
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
      <div class="fixed right-12 top-12 rounded-sm bg-white p-4 shadow-xl">
        <Show
          when={toDriveState()}
          fallback={
            <div class="flex space-x-2">
              <Button store={toDriveSelectBtn}>选择目标云盘</Button>
            </div>
          }
        >
          <div class="">
            <div>{toDriveState()?.name}</div>
            <div
              classList={{
                "relative w-full h-[240px] bg-state-500": true,
              }}
            >
              <div
                classList={{
                  "absolute w-full bottom-0 bg-green-500": true,
                  "bg-yellow-500": (toDriveState()?.used_percent || 0) >= 70,
                  "bg-red-500": (toDriveState()?.used_percent || 0) >= 90,
                }}
                style={{ height: `${toDriveState()?.used_percent || 0}%` }}
              ></div>
              <div class="absolute left-0 bottom-4 w-full text-center">{toDriveState()?.used_percent || 0}%</div>
            </div>
            <div>
              {toDriveState()?.used_size}/{toDriveState()?.total_size}
            </div>
            <div>
              <Button store={toDriveSelectBtn} icon={<SwitchCamera class="w-4 h-4" />} variant="subtle"></Button>
              <Button store={gotoDriveProfileBtn} icon={<HardDrive class="w-4 h-4" />} variant="subtle"></Button>
            </div>
          </div>
        </Show>
      </div>
      <Show when={!seasonListState().noMore}>
        <div class="fixed right-12 bottom-12 rounded-sm bg-white p-4 shadow-xl">
          <div
            class="flex flex-col items-center cursor-pointer"
            onClick={() => {
              // @ts-ignore
              const next_marker = seasonList.response.next_marker;
              seasonList.params.next_marker = next_marker;
              seasonList.next();
            }}
          >
            <div class="p-2">
              <Show when={seasonListState().loading} fallback={<ArrowRight class="w-12 h-12" />}>
                <Loader class="w-12 h-12 animate animate-spin" />
              </Show>
            </div>
          </div>
        </div>
      </Show>
      <Dialog store={toDriveSelectDialog}>
        <div class="w-[520px]">
          <DriveSelect store={toDriveSelect} />
        </div>
      </Dialog>
    </>
  );
};
