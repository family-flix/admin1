/**
 * @file 电影列表
 */
import { createSignal, For } from "solid-js";
import { Award, BookOpen, Calendar, Clock, RotateCw, Search, Star } from "lucide-solid";

import {
  setProfileForUnknownMovie,
  fetchMovieList,
  moveMovieToResourceDrive,
  MovieItem,
  refreshMovieProfiles,
  transferMovieToAnotherDrive,
} from "@/services";
import { LazyImage, Input, Button, Skeleton, ScrollView, ListView, Checkbox, Dialog } from "@/components/ui";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import {
  InputCore,
  ButtonCore,
  ButtonInListCore,
  ScrollViewCore,
  CheckboxCore,
  DialogCore,
  CheckboxGroupCore,
} from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { consumeAction, createJob, driveList, homeMovieProfilePage, pendingActions } from "@/store";
import { DriveCore } from "@/domains/drive";

export const MovieManagePage: ViewComponent = (props) => {
  const { app, view } = props;

  const transferRequest = new RequestCore(transferMovieToAnotherDrive, {
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
          if (!movieRef.value) {
            return;
          }
          const { name } = movieRef.value;
          app.tip({
            text: [`完成电影 '${name}' 移动到资源盘`],
          });
        },
      });
      moveToResourceDriveConfirmDialog.hide();
    },
  });
  const movieList = new ListCore(new RequestCore(fetchMovieList), {
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
  const movieRef = new RefCore<MovieItem>();
  const driveRef = new RefCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
    },
  });
  const bindSearchedMovieForMovie = new RequestCore(setProfileForUnknownMovie, {
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      movieList.refresh();
    },
    onFailed(error) {
      app.tip({
        text: ["修改失败", error.message],
      });
    },
  });
  const dialog = new TMDBSearcherDialogCore({
    onOk(searchedTV) {
      if (!movieRef.value?.id) {
        app.tip({ text: ["请先选择要修改的电视剧"] });
        return;
      }
      bindSearchedMovieForMovie.run(movieRef.value.id, {
        unique_id: searchedTV.id,
      });
    },
  });
  const duplicatedCheckbox = new CheckboxCore({
    onChange(checked) {
      movieList.search({
        duplicated: Number(checked),
      });
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
      duplicatedCheckbox.uncheck();
      nameSearchInput.clear();
    },
  });
  const profileBtn = new ButtonInListCore<MovieItem>({
    onClick(record) {
      homeMovieProfilePage.query = {
        id: record.id,
      };
      app.showView(homeMovieProfilePage);
      // homeLayout.showSubView(homeMovieProfilePage);
      // router.push(`/home/movie/${record.id}`);
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
        movie_id: curMovie.id,
        target_drive_id: driveRef.value.id,
      });
    },
    onCancel() {
      driveRef.clear();
      transferConfirmDialog.hide();
    },
  });
  const transferBtn = new ButtonInListCore<MovieItem>({
    onClick(record) {
      if (record === null) {
        return;
      }
      movieRef.select(record);
      transferConfirmDialog.show();
    },
  });
  const moveToResourceDriveConfirmDialog = new DialogCore({
    title: "移动到资源盘",
    onOk() {
      const curMovie = movieRef.value;
      if (!curMovie) {
        app.tip({ text: ["请先选择电影"] });
        return;
      }
      movieToResourceDriveRequest.run({
        movie_id: curMovie.id,
      });
    },
    onCancel() {
      driveRef.clear();
      transferConfirmDialog.hide();
    },
  });
  const moveToResourceDriveBtn = new ButtonInListCore<MovieItem>({
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
        <h1 class="text-2xl">电影列表</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshMovieListBtn}>
              更新近3月内电影详情
            </Button>
            <div class="flex items-center space-x-2">
              <Checkbox store={duplicatedCheckbox}></Checkbox>
              <span>重复内容</span>
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
                    const { id, name, overview, poster_path, air_date, popularity, vote_average, runtime } = movie;
                    homeMovieProfilePage.query = {
                      id,
                    };
                    const url = homeMovieProfilePage.buildUrlWithPrefix();
                    return (
                      <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                        <div class="flex">
                          <div class="overflow-hidden mr-2 rounded-sm">
                            <LazyImage class="w-[180px] h-[272px]" src={poster_path} alt={name} />
                          </div>
                          <div class="flex-1 w-0 p-4">
                            <h2 class="text-2xl text-slate-800">
                              <a href={url}>{name}</a>
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
                              <div class="flex items-center space-x-1 px-2 border border-yellow-600 rounded-xl text-yellow-600">
                                <Award class="w-4 h-4" />
                                <div>{popularity}</div>
                              </div>
                              <div class="flex items-center space-x-1 px-2 border border-green-600 rounded-xl text-green-600">
                                <Star class="w-4 h-4" />
                                <div>{vote_average}</div>
                              </div>
                              <div class="flex items-center space-x-1 px-2 border border-gray-600 rounded-xl text-gray-600">
                                <Clock class="w-4 h-4" />
                                <div>{runtime}</div>
                              </div>
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
      <TMDBSearcherDialog store={dialog} />
    </>
  );
};
