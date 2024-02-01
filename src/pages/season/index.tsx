/**
 * @file 电视剧列表
 */
import { createSignal, For, Show } from "solid-js";
import {
  ArrowUpCircle,
  Award,
  BookOpen,
  Calendar,
  Info,
  Package,
  RotateCw,
  Search,
  Send,
  SlidersHorizontal,
  Smile,
} from "lucide-solid";

import {
  SeasonMediaItem,
  transferMediaToAnotherDrive,
  fetchSeasonMediaList,
  fetchPartialSeasonMedia,
} from "@/services/media";
import { moveSeasonToResourceDrive, refreshSeasonProfiles, refreshSeasonProfile } from "@/services";
import {
  Skeleton,
  Popover,
  ScrollView,
  Input,
  Button,
  LazyImage,
  Dialog,
  PurePopover,
  BackToTop,
  CheckboxGroup,
  ListView,
} from "@/components/ui";
import {
  ScrollViewCore,
  DialogCore,
  PopoverCore,
  InputCore,
  ButtonCore,
  ButtonInListCore,
  CheckboxCore,
  CheckboxGroupCore,
  ImageInListCore,
} from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { DriveCore } from "@/domains/drive";
import { consumeAction, pendingActions } from "@/store/actions";
import { createJob } from "@/store/job";
import { driveList } from "@/store/drives";
import { Result } from "@/types";
import { ViewComponent } from "@/store/types";
import { MediaSourceOptions, TVGenresOptions } from "@/constants";
import { cn } from "@/utils";

export const HomeSeasonListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const seasonList = new ListCore(new RequestCore(fetchSeasonMediaList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const moveToResourceDriveRequest = new RequestCore(moveSeasonToResourceDrive, {
    onLoading(loading) {
      moveToResourceDriveConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({
        text: ["移动失败", error.message],
      });
    },
    onSuccess(r) {
      app.tip({
        text: ["开始移动，请等待一段时间"],
      });
      createJob({
        job_id: r.job_id,
        onFinish() {
          if (!seasonRef.value) {
            return;
          }
          const { name } = seasonRef.value;
          app.tip({
            text: [`完成电视剧 '${name}' 移动到资源盘`],
          });
        },
      });
      moveToResourceDriveConfirmDialog.hide();
    },
  });
  const partialSeasonRequest = new RequestCore(fetchPartialSeasonMedia);

  const transferRequest = new RequestCore(transferMediaToAnotherDrive, {
    onLoading(loading) {
      transferConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({
        text: ["归档失败", error.message],
      });
    },
    onSuccess(r) {
      app.tip({
        text: ["开始归档，请等待一段时间"],
      });
      createJob({
        job_id: r.job_id,
        onFinish() {
          if (!seasonRef.value) {
            return;
          }
          const { name } = seasonRef.value;
          app.tip({
            text: [`完成电视剧 '${name}' 归档`],
          });
        },
      });
      transferConfirmDialog.hide();
    },
  });
  const seasonRef = new RefCore<SeasonMediaItem>();
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
      seasonList.search({
        drive_ids: options.join("|"),
      });
    },
  });
  const driveRef = new RefCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
    },
  });
  const tipPopover = new PopoverCore({
    align: "end",
  });
  const refreshPartialTV = async (id?: string) => {
    const media_id = id || seasonRef.value?.id;
    if (!media_id) {
      return Result.Err("缺少季 id");
    }
    const r = await partialSeasonRequest.run({ media_id: media_id });
    if (r.error) {
      app.tip({
        text: ["获取电视剧最新信息失败", r.error.message],
      });
      return Result.Err(r.error.message);
    }
    seasonList.modifyItem((item) => {
      if (item.id !== media_id) {
        return item;
      }
      return {
        ...r.data,
      };
    });
    return Result.Ok(null);
  };
  const nameSearchInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter() {
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      seasonList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      seasonList.reset();
      onlyInvalidCheckbox.uncheck();
      duplicatedCheckbox.uncheck();
      nameSearchInput.clear();
    },
  });
  const transferConfirmDialog = new DialogCore({
    title: "移动到其他云盘",
    onOk() {
      if (!driveRef.value) {
        app.tip({ text: ["请先选择目标云盘"] });
        return;
      }
      const curSeason = seasonRef.value;
      if (!curSeason) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      transferRequest.run({
        media_id: curSeason.id,
        to_drive_id: driveRef.value.id,
      });
    },
    onCancel() {
      driveRef.clear();
      transferConfirmDialog.hide();
    },
  });
  const transferBtn = new ButtonInListCore<SeasonMediaItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      seasonRef.select(record);
      transferConfirmDialog.show();
    },
  });
  const refreshPartialBtn = new ButtonInListCore<SeasonMediaItem>({
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
  // const refreshProfileBtn = new ButtonInListCore<SeasonMediaItem>({
  //   onClick(record) {
  //     app.tip({
  //       text: ["开始更新"],
  //     });
  //     refreshProfileBtn.setLoading(true);
  //     refreshProfileRequest.run({ season_id: record.id });
  //   },
  // });
  const profileBtn = new ButtonInListCore<SeasonMediaItem>({
    onClick(record) {
      // homeTVProfilePage.query = {
      //   id: record.id,
      // };
      // app.showView(homeTVProfilePage);
      history.push("root.home_layout.season_profile", { id: record.id });
    },
  });
  const refreshSeasonProfilesRequest = new RequestCore(refreshSeasonProfiles, {
    beforeRequest() {
      refreshSeasonListBtn.setLoading(true);
    },
    async onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          app.tip({ text: ["更新成功"] });
          seasonList.refresh();
          refreshSeasonListBtn.setLoading(false);
        },
      });
    },
    onFailed(error) {
      app.tip({ text: ["更新失败", error.message] });
      refreshSeasonListBtn.setLoading(false);
    },
  });
  const refreshSeasonListBtn = new ButtonCore({
    onClick() {
      app.tip({ text: ["开始更新"] });
      refreshSeasonProfilesRequest.run();
    },
  });
  // const gotoInvalidTVListPageBtn = new ButtonCore({
  //   onClick() {
  //     app.showView(homeInvalidTVListPage);
  //   },
  // });
  const gotoSeasonArchivePageBtn = new ButtonCore({
    onClick() {
      // app.showView(seasonArchivePage);
      history.push("root.archive");
    },
  });
  const moveToResourceDriveConfirmDialog = new DialogCore({
    title: "移动到资源盘",
    onOk() {
      const curSeason = seasonRef.value;
      if (!curSeason) {
        app.tip({ text: ["请先选择电视剧"] });
        return;
      }
      moveToResourceDriveRequest.run({
        season_id: curSeason.id,
      });
    },
    onCancel() {
      driveRef.clear();
      transferConfirmDialog.hide();
    },
  });
  const moveToResourceDriveBtn = new ButtonInListCore<SeasonMediaItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      seasonRef.select(record);
      moveToResourceDriveConfirmDialog.show();
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
  const poster = new ImageInListCore({});

  const [seasonListState, setSeasonListState] = createSignal(seasonList.response);
  const [tips, setTips] = createSignal<string[]>([]);
  const [driveListState, setDriveListState] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(driveRef.value);
  const [hasSearch, setHasSearch] = createSignal(false);

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
  view.onShow(() => {
    const { deleteTV } = pendingActions;
    if (!deleteTV) {
      return;
    }
    consumeAction("deleteTV");
    seasonList.deleteItem((season) => {
      if (season.id === deleteTV.id) {
        return true;
      }
      return false;
    });
  });
  seasonList.init();
  driveList.initAny();

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <div class="relative">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl">电视剧列表({seasonListState().total})</h1>
          </div>
          <div class="mt-8">
            <div class="flex items-center space-x-2">
              <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
                刷新
              </Button>
              <Button class="" store={resetBtn}>
                重置
              </Button>
              <PurePopover
                align="center"
                class="w-96"
                content={
                  <div class="h-[320px] py-4 pb-8 px-2 overflow-y-auto">
                    <div>
                      <div>来源</div>
                      <CheckboxGroup store={sourceCheckboxGroup} />
                    </div>
                    <div class="mt-4">
                      <div>类型</div>
                      <CheckboxGroup store={tvGenresCheckboxGroup} />
                    </div>
                    <div class="mt-4">
                      <div>云盘</div>
                      <CheckboxGroup store={driveCheckboxGroup} />
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
              {/* <Button icon={<ArrowUpCircle class="w-4 h-4" />} store={refreshSeasonListBtn}>
                更新近3月内电视剧详情
              </Button> */}
              <Button store={gotoSeasonArchivePageBtn}>归档电视剧</Button>
            </div>
            <div class="flex items-center space-x-2 mt-4">
              <Input class="" store={nameSearchInput} />
              <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
                搜索
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
                  <For each={seasonListState().dataSource}>
                    {(season) => {
                      const {
                        id,
                        name,
                        overview,
                        poster_path,
                        air_date,
                        vote_average,
                        cur_episode_count,
                        episode_count,
                      } = season;
                      const url = history.buildURLWithPrefix("root.home_layout.season_profile", {
                        id,
                      });
                      // const url = homeTVProfilePage.buildUrlWithPrefix({
                      //   id,
                      // });
                      return (
                        <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                          <div class="flex">
                            <div class="overflow-hidden mr-2 rounded-sm">
                              <LazyImage class="w-[180px] h-[272px]" store={poster.bind(poster_path)} alt={name} />
                            </div>
                            <div class="flex-1 w-0 p-4">
                              <div class="flex items-center">
                                <h2 class="text-2xl text-slate-800">
                                  <a href={url} target="_blank">
                                    {name}
                                  </a>
                                </h2>
                              </div>
                              <div class="mt-2 overflow-hidden text-ellipsis">
                                <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-3">
                                  {overview}
                                </p>
                              </div>
                              <div class="flex items-center space-x-4 mt-2 break-keep overflow-hidden">
                                <div class="flex items-center space-x-1 px-2 border border-slate-600 rounded-xl text-slate-600">
                                  <Calendar class="w-4 h-4 text-slate-800" />
                                  <div class="break-keep whitespace-nowrap">{air_date}</div>
                                </div>
                                <div class="flex items-center space-x-1 px-2 border border-yellow-600 rounded-xl text-yellow-600">
                                  <Award class="w-4 h-4" />
                                  <div>{vote_average}</div>
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
                                  <Button
                                    store={moveToResourceDriveBtn.bind(season)}
                                    variant="subtle"
                                    icon={<BookOpen class="w-4 h-4" />}
                                  >
                                    移动到资源盘
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
      <Dialog store={transferConfirmDialog}>
        <div class="w-[520px]">
          <div class="mt-2 space-y-4 h-[320px] overflow-y-auto">
            <For each={driveListState().dataSource}>
              {(drive) => {
                const { id, name, state } = drive;
                return (
                  <div
                    classList={{
                      "bg-gray-100 border rounded-sm p-2 cursor-pointer hover:bg-gray-200": true,
                      "border-green-500": curDrive()?.id === id,
                    }}
                    onClick={() => {
                      driveRef.select(drive);
                    }}
                  >
                    <div
                      classList={{
                        "py-2": true,
                      }}
                    >
                      <div class="text-xl">{name}</div>
                    </div>
                    <div class="text-slate-500 text-sm">
                      {state.used_size}/{state.total_size}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Dialog>
      <Dialog store={moveToResourceDriveConfirmDialog}>
        <div class="w-[520px]">
          <div>将电视剧移动到资源盘后才能公开分享</div>
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
