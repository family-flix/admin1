/**
 * @file 问题影视剧列表
 */
import { createSignal, For, JSXElement, Show } from "solid-js";
import { RotateCw, Search, Trash } from "lucide-solid";

import { fetchInvalidMediaList } from "@/services/media";
import {
  // fetchInvalidMediaList,
  deleteSeasonProfileInMediaError,
  MediaErrorItem,
  deleteEpisodeProfileInMediaError,
  deleteMovieProfileInMediaError,
} from "@/services";
import { LazyImage, Input, Button, Skeleton, ScrollView, ListView } from "@/components/ui";
import { InputCore, ButtonCore, ButtonInListCore, ScrollViewCore, CheckboxCore, CheckboxGroupCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { DriveCore } from "@/domains/drive";
import { ViewComponent } from "@/types";
import { consumeAction, driveList, homeMovieProfilePage, homeTVProfilePage, pendingActions } from "@/store";
import { MediaErrorTypeOptions, MediaErrorTypes } from "@/constants";

export const InvalidMediaManagePage: ViewComponent = (props) => {
  const { app, view } = props;

  const errorList = new ListCore(new RequestCore(fetchInvalidMediaList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const tvProfileDeletingRequest = new RequestCore(deleteEpisodeProfileInMediaError, {
    onLoading(loading) {
      tvProfileDeletingBtn.setLoading(loading);
    },
    onSuccess(v) {
      app.tip({
        text: ["删除成功"],
      });
      if (v === null && errorRef.value) {
        const errorId = errorRef.value.id;
        errorList.deleteItem((item) => {
          if (item.id === errorId) {
            return true;
          }
          return false;
        });
        return;
      }
      console.log(v);
    },
  });
  const seasonProfileDeletingRequest = new RequestCore(deleteSeasonProfileInMediaError, {
    onLoading(loading) {
      seasonProfileDeletingBtn.setLoading(loading);
    },
    onSuccess(v) {
      app.tip({
        text: ["删除成功"],
      });
      if (v === null && errorRef.value) {
        const errorId = errorRef.value.id;
        errorList.deleteItem((item) => {
          if (item.id === errorId) {
            return true;
          }
          return false;
        });
        return;
      }
      console.log(v);
    },
  });
  const episodeProfileDeletingRequest = new RequestCore(deleteEpisodeProfileInMediaError, {
    onLoading(loading) {
      episodeProfileDeletingBtn.setLoading(loading);
    },
    onSuccess(v) {
      app.tip({
        text: ["删除成功"],
      });
      if (v === null && errorRef.value) {
        const errorId = errorRef.value.id;
        errorList.deleteItem((item) => {
          if (item.id === errorId) {
            return true;
          }
          return false;
        });
        return;
      }
      console.log(v);
    },
  });
  const movieProfileDeletingRequest = new RequestCore(deleteMovieProfileInMediaError, {
    onLoading(loading) {
      movieProfileDeletingBtn.setLoading(loading);
    },
    onSuccess(v) {
      app.tip({
        text: ["删除成功"],
      });
      if (v === null && errorRef.value) {
        const errorId = errorRef.value.id;
        errorList.deleteItem((item) => {
          if (item.id === errorId) {
            return true;
          }
          return false;
        });
        return;
      }
      console.log(v);
    },
  });
  const errorRef = new RefCore<{
    id: string;
  }>();
  const driveRef = new RefCore<DriveCore>({
    onChange(v) {
      setCurDrive(v);
    },
  });
  const tvProfileDeletingBtn = new ButtonInListCore<{
    id: string;
    profile_id: string;
  }>({
    onClick(record) {
      errorRef.select(record);
      tvProfileDeletingRequest.run({ id: record.id, profile_id: record.profile_id });
    },
  });
  const seasonProfileDeletingBtn = new ButtonInListCore<{
    id: string;
    profile_id: string;
  }>({
    onClick(record) {
      errorRef.select(record);
      seasonProfileDeletingRequest.run({ id: record.id, profile_id: record.profile_id });
    },
  });
  const episodeProfileDeletingBtn = new ButtonInListCore<{
    id: string;
    profile_id: string;
  }>({
    onClick(record) {
      errorRef.select(record);
      episodeProfileDeletingRequest.run({ id: record.id, profile_id: record.profile_id });
    },
  });
  const movieProfileDeletingBtn = new ButtonInListCore<{
    id: string;
    profile_id: string;
  }>({
    onClick(record) {
      errorRef.select(record);
      movieProfileDeletingRequest.run({ id: record.id, profile_id: record.profile_id });
    },
  });
  const duplicatedCheckbox = new CheckboxCore({
    onChange(checked) {
      errorList.search({
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
      errorList.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      errorList.reset();
      duplicatedCheckbox.uncheck();
      nameSearchInput.clear();
    },
  });
  const profileBtn = new ButtonInListCore<MediaErrorItem>({
    onClick(record) {
      homeMovieProfilePage.query = {
        id: record.id,
      };
      app.showView(homeMovieProfilePage);
      // homeLayout.showSubView(homeMovieProfilePage);
      // router.push(`/home/movie/${record.id}`);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      errorList.refresh();
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

  const [state, setState] = createSignal(errorList.response);
  const [driveResponse, setDriveResponse] = createSignal(driveList.response);
  const [curDrive, setCurDrive] = createSignal(driveRef.value);

  view.onShow(() => {
    const { deleteMovie } = pendingActions;
    if (!deleteMovie) {
      return;
    }
    consumeAction("deleteMovie");
    errorList.deleteItem((movie) => {
      if (movie.id === deleteMovie.movie_id) {
        return true;
      }
      return false;
    });
  });
  scrollView.onReachBottom(() => {
    errorList.loadMore();
  });
  errorList.onStateChange((nextState) => {
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
  errorList.init();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">待处理问题列表</h1>
        <div class="mt-8">
          {/* <div class="flex space-x-2">
            <For each={MediaErrorTypeOptions}>
              {(opt) => {
                return (
                  <div
                    onClick={() => {
                      errorList.search({
                        type: opt.value,
                      });
                    }}
                  >
                    <div>{opt.label}</div>
                  </div>
                );
              }}
            </For>
          </div> */}
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
            <Button class="" store={resetBtn}>
              重置
            </Button>
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={nameSearchInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
              搜索
            </Button>
          </div>
          <div class="mt-4">
            <ListView
              store={errorList}
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
                  {(mediaError) => {
                    const { id, type, media, tips: texts } = mediaError;
                    const typeTextMap: Record<MediaErrorTypes, JSXElement> = {
                      [MediaErrorTypes.Unknown]: <div>未知</div>,
                      [MediaErrorTypes.TV]: <div>电视剧问题</div>,
                      [MediaErrorTypes.Season]: <div>季问题</div>,
                      [MediaErrorTypes.Episode]: <div>剧集问题</div>,
                      [MediaErrorTypes.Movie]: <div>电影问题</div>,
                      [MediaErrorTypes.EpisodeProfile]: <div>重复剧集详情</div>,
                      [MediaErrorTypes.SeasonProfile]: <div>重复季详情</div>,
                      [MediaErrorTypes.TVProfile]: <div>重复电视剧详情</div>,
                      [MediaErrorTypes.MovieProfile]: <div>重复电影详情</div>,
                    };
                    if (type === MediaErrorTypes.Season) {
                      const { id, name, poster_path } = media;
                      // console.log("[]季", name, data);
                      return (
                        <div class="p-4 bg-white">
                          <div>{typeTextMap[type]}</div>
                          <div class="text-sm">{id}</div>
                          <LazyImage class="w-[80px] h-[120px]" src={poster_path!} alt={name!} />
                          <div class="">{name}</div>
                          <div class="mt-4 space-y-2">
                            <For each={texts}>
                              {(text) => {
                                return <div>{text}</div>;
                              }}
                            </For>
                          </div>
                        </div>
                      );
                    }
                    if (type === MediaErrorTypes.Episode) {
                      // console.log("[]剧集", name, data);
                      const href = homeTVProfilePage.buildUrlWithPrefix({
                        id: media.id,
                      });
                      return (
                        <div class="p-4 bg-white">
                          <a href={href} target="_blank">
                            <div>{typeTextMap[type]}</div>
                            {/* <div class="text-sm">{id}</div> */}
                            <div class="text-xl">{media.name}</div>
                            <div class="mt-4 space-y-2">
                              <For each={texts}>
                                {(text) => {
                                  return <div>{text}</div>;
                                }}
                              </For>
                            </div>
                          </a>
                        </div>
                      );
                    }
                    if (type === MediaErrorTypes.Movie) {
                      const href = homeMovieProfilePage.buildUrlWithPrefix({
                        id: media.id,
                      });
                      return (
                        <div class="p-4 bg-white">
                          <a href={href} target="_blank">
                            <div>{typeTextMap[type]}</div>
                            {/* <div class="text-sm">{id}</div> */}
                            <div class="text-xl">{media.name}</div>
                            <div class="mt-4 space-y-2">
                              <For each={texts}>
                                {(text) => {
                                  return <div>{text}</div>;
                                }}
                              </For>
                            </div>
                          </a>
                        </div>
                      );
                    }
                    return null;
                  }}
                </For>
              </div>
            </ListView>
          </div>
        </div>
      </ScrollView>
    </>
  );
};
