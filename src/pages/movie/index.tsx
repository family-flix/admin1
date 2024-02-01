/**
 * @file 电影列表
 */
import { createSignal, For, Show } from "solid-js";
import { Award, BookOpen, Calendar, Clock, Info, LocateIcon, MapPin, RotateCw, Search, Star } from "lucide-solid";

import { MovieMediaItem, fetchMovieMediaList, transferMediaToAnotherDrive } from "@/services/media";
import { moveMovieToResourceDrive, refreshMovieProfiles, transferMovieToAnotherDrive } from "@/services";
import { LazyImage, Input, Button, Skeleton, ScrollView, ListView, Dialog } from "@/components/ui";
import {
  InputCore,
  ButtonCore,
  ButtonInListCore,
  ScrollViewCore,
  DialogCore,
  CheckboxGroupCore,
  PopoverCore,
  ImageInListCore,
} from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { DriveCore } from "@/domains/drive";
import { ViewComponent } from "@/store/types";
import { consumeAction, pendingActions } from "@/store/actions";
import { createJob } from "@/store/job";
import { driveList } from "@/store/drives";

export const MovieListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

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
          if (!movieRef.value) {
            return;
          }
          const { name } = movieRef.value;
          app.tip({
            text: [`完成电影 '${name}' 归档`],
          });
        },
      });
      transferConfirmDialog.hide();
    },
  });
  const movieToResourceDriveRequest = new RequestCore(moveMovieToResourceDrive, {
    onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          moveToResourceDriveConfirmDialog.okBtn.setLoading(false);
          if (!movieRef.value) {
            return;
          }
          const { name } = movieRef.value;
          app.tip({
            text: [`完成电影「${name}」移动到资源盘`],
          });
        },
      });
      moveToResourceDriveConfirmDialog.hide();
    },
    onFailed(error) {
      moveToResourceDriveConfirmDialog.okBtn.setLoading(false);
      app.tip({
        text: ["移动失败", error.message],
      });
    },
  });
  const movieList = new ListCore(new RequestCore(fetchMovieMediaList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const refreshMovieProfilesRequest = new RequestCore(refreshMovieProfiles, {
    beforeRequest() {
      refreshMovieListBtn.setLoading(true);
    },
    async onSuccess(r) {
      createJob({
        job_id: r.job_id,
        onFinish() {
          app.tip({ text: ["更新成功"] });
          movieList.refresh();
          refreshMovieListBtn.setLoading(false);
        },
      });
    },
    onFailed(error) {
      app.tip({ text: ["更新失败", error.message] });
      refreshMovieListBtn.setLoading(false);
    },
  });
  const refreshMovieListBtn = new ButtonCore({
    onClick() {
      app.tip({ text: ["开始更新"] });
      refreshMovieProfilesRequest.run();
    },
  });
  const movieRef = new RefCore<MovieMediaItem>();
  const driveRef = new RefCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
    },
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
      movieList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      movieList.reset();
      nameSearchInput.clear();
    },
  });
  const tipPopover = new PopoverCore({
    align: "end",
  });
  const profileBtn = new ButtonInListCore<MovieMediaItem>({
    onClick(record) {
      // homeMovieProfilePage.query = {
      //   id: record.id,
      // };
      // app.showView(homeMovieProfilePage);
      // homeLayout.showSubView(homeMovieProfilePage);
      history.push("root.home_layout.movie_profile", { id: record.id });
    },
  });
  const transferConfirmDialog = new DialogCore({
    title: "移动到其他云盘",
    onOk() {
      if (!driveRef.value) {
        app.tip({ text: ["请先选择目标云盘"] });
        return;
      }
      const curMovie = movieRef.value;
      if (!curMovie) {
        app.tip({ text: ["请先选择电影"] });
        return;
      }
      transferRequest.run({
        media_id: curMovie.id,
        to_drive_id: driveRef.value.id,
      });
    },
    onCancel() {
      driveRef.clear();
      transferConfirmDialog.hide();
    },
  });
  const transferBtn = new ButtonInListCore<MovieMediaItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      movieRef.select(record);
      transferConfirmDialog.show();
    },
  });
  const avatar = new ImageInListCore({});
  const poster = new ImageInListCore({});
  const moveToResourceDriveConfirmDialog = new DialogCore({
    title: "移动到资源盘",
    onOk() {
      const curMovie = movieRef.value;
      if (!curMovie) {
        app.tip({ text: ["请先选择电影"] });
        return;
      }
      app.tip({
        text: ["开始移动，请等待一段时间"],
      });
      movieToResourceDriveRequest.run({
        movie_id: curMovie.id,
      });
    },
    onCancel() {
      driveRef.clear();
      transferConfirmDialog.hide();
    },
  });
  const moveToResourceDriveBtn = new ButtonInListCore<MovieMediaItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      movieRef.select(record);
      moveToResourceDriveConfirmDialog.show();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      movieList.refresh();
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
      // setHasSearch(!!options.length);
      // seasonList.search({
      //   drive_ids: options.join("|"),
      // });
    },
  });
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(movieList.response);
  const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(driveRef.value);
  const [tips, setTips] = createSignal<string[]>([]);

  view.onShow(() => {
    const { deleteMovie } = pendingActions;
    if (!deleteMovie) {
      return;
    }
    consumeAction("deleteMovie");
    movieList.deleteItem((movie) => {
      if (movie.id === deleteMovie.movie_id) {
        return true;
      }
      return false;
    });
  });
  scrollView.onReachBottom(() => {
    movieList.loadMore();
  });
  movieList.onStateChange((nextState) => {
    setState(nextState);
  });
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
  movieList.init();
  driveList.initAny();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">电影列表({state().total})</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button class="" store={resetBtn}>
              重置
            </Button>
            {/* <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshMovieListBtn}>
              更新近3月内电影详情
            </Button> */}
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={nameSearchInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
              搜索
            </Button>
          </div>
          <div class="mt-4">
            <ListView
              store={movieList}
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
                <For each={state().dataSource}>
                  {(movie) => {
                    const { id, name, overview, poster_path, air_date, vote_average, origin_country, tips, persons } =
                      movie;
                    const url = history.buildURLWithPrefix("root.home_layout.movie_profile", { id });
                    return (
                      <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                        <div class="flex">
                          <div class="overflow-hidden mr-2 rounded-sm">
                            <LazyImage class="w-[180px] h-[272px]" store={poster.bind(poster_path)} alt={name} />
                          </div>
                          <div class="flex-1 w-0 p-4">
                            <h2 class="text-2xl text-slate-800">
                              <a href={url} target="_blank">
                                {name}
                              </a>
                            </h2>
                            <div class="mt-2 overflow-hidden text-ellipsis">
                              <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-4">
                                {overview}
                              </p>
                            </div>
                            <div class="flex items-center space-x-4 mt-2">
                              <div class="flex items-center space-x-1 px-2 border border-slate-600 rounded-xl text-slate-600">
                                <Calendar class="w-4 h-4 text-slate-800" />
                                <div class="break-keep whitespace-nowrap">{air_date}</div>
                              </div>
                              <Show when={origin_country}>
                                <div class="flex items-center space-x-1 px-2 border border-blue-600 rounded-xl text-blue-600">
                                  <MapPin class="w-4 h-4 text-blue-600" />
                                  <div class="break-keep whitespace-nowrap">{origin_country}</div>
                                </div>
                              </Show>
                              <div class="flex items-center space-x-1 px-2 border border-green-600 rounded-xl text-green-600">
                                <Star class="w-4 h-4" />
                                <div>{vote_average}</div>
                              </div>
                              <Show when={tips.length}>
                                <div
                                  class="flex items-center space-x-1 px-2 border border-red-500 rounded-xl text-red-500"
                                  onMouseEnter={(event) => {
                                    const { x, y, width, height, left, top, right, bottom } =
                                      event.currentTarget.getBoundingClientRect();
                                    setTips(tips);
                                    tipPopover.show({ x, y, width, height: height + 8, left, top, right, bottom });
                                  }}
                                  onMouseLeave={() => {
                                    tipPopover.hide();
                                  }}
                                >
                                  <Info class="w-4 h-4" />
                                  <div>{tips.length}个问题</div>
                                </div>
                              </Show>
                            </div>
                            <div class="flex flex-wrap gap-4 mt-4">
                              <For each={persons}>
                                {(person) => {
                                  return (
                                    <div class="flex flex-col items-center w-[80px]">
                                      <LazyImage
                                        class="w-8 h-8 rounded-full"
                                        store={avatar.bind(person.profile_path)}
                                      />
                                      <div class="mt-2 text-center">{person.name}</div>
                                    </div>
                                  );
                                }}
                              </For>
                            </div>
                            <div class="space-x-2 mt-6">
                              <Button
                                store={profileBtn.bind(movie)}
                                variant="subtle"
                                icon={<BookOpen class="w-4 h-4" />}
                              >
                                详情
                              </Button>
                              <Button
                                store={transferBtn.bind(movie)}
                                variant="subtle"
                                icon={<BookOpen class="w-4 h-4" />}
                              >
                                归档
                              </Button>
                              <Button
                                store={moveToResourceDriveBtn.bind(movie)}
                                variant="subtle"
                                icon={<BookOpen class="w-4 h-4" />}
                              >
                                移动到资源盘
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
      </ScrollView>
      <Dialog store={transferConfirmDialog}>
        <div class="w-[520px]">
          <div class="mt-2 space-y-4 h-[320px] overflow-y-auto">
            <For each={driveResponse().dataSource}>
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
          <div>将电影移动到资源盘后才能公开分享</div>
        </div>
      </Dialog>
    </>
  );
};
