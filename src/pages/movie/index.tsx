/**
 * @file 电影列表
 */
import { createSignal, For } from "solid-js";
import { Award, BookOpen, Calendar, Clock, RotateCw, Search, Star } from "lucide-solid";

import { bind_profile_for_unknown_movie, fetch_movie_list, MovieItem } from "@/services";
import { LazyImage, Input, Button, Skeleton, ScrollView, ListView, Checkbox } from "@/components/ui";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { InputCore, ButtonCore, ButtonInListCore, ScrollViewCore, CheckboxCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { consumeAction, homeLayout, homeMovieProfilePage, pendingActions } from "@/store";

export const MovieManagePage: ViewComponent = (props) => {
  const { app, view } = props;

  const movieList = new ListCore(new RequestCore(fetch_movie_list), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const movieSelection = new RefCore<MovieItem>();
  const bindSearchedMovieForMovie = new RequestCore(bind_profile_for_unknown_movie, {
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
      if (!movieSelection.value?.id) {
        app.tip({ text: ["请先选择要修改的电视剧"] });
        return;
      }
      bindSearchedMovieForMovie.run(movieSelection.value.id, searchedTV);
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
  const refreshBtn = new ButtonCore({
    onClick() {
      movieList.refresh();
    },
  });
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(movieList.response);

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
  movieList.init();

  const dataSource = () => state().dataSource;

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">电影列表</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
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
                <For each={dataSource()}>
                  {(movie) => {
                    const { id, name, overview, poster_path, air_date, popularity, vote_average, runtime } = movie;
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
      <TMDBSearcherDialog store={dialog} />
    </>
  );
};
