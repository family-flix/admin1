/**
 * @file 电影列表
 */
import { createSignal, For, Show } from "solid-js";
import { Award, BookOpen, Calendar, RotateCw, Search } from "lucide-solid";

import { bind_searched_tv_for_tv, fetch_movie_list, MovieItem } from "@/services";
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
import { ViewComponent } from "@/types";
import { ListView } from "@/components/ListView";
import { Skeleton } from "@/packages/ui/skeleton";

export const MovieManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const list = new ListCore(new RequestCore(fetch_movie_list), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const movieSelection = new SelectionCore<MovieItem>();
  const bindSearchedMovieForMovie = new RequestCore(bind_searched_tv_for_tv, {
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
  const dialog = new TMDBSearcherDialogCore({
    onOk(searchedTV) {
      if (!movieSelection.value?.id) {
        app.tip({ text: ["请先选择要修改的电视剧"] });
        return;
      }
      bindSearchedMovieForMovie.run(movieSelection.value.id, searchedTV);
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
  const profileBtn = new ButtonInListCore<MovieItem>({
    onClick(record) {
      router.push(`/home/movie/${record.id}`);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });

  const [state, setState] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setState(nextState);
  });
  list.init();

  const dataSource = () => state().dataSource;

  return (
    <>
      <div class="">
        <h1 class="text-2xl">电影列表</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
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
                    const { id, name, overview, poster_path, air_date, popularity } = tv;
                    return (
                      <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                        <div class="flex">
                          <div class="overflow-hidden mr-2 rounded-sm">
                            <LazyImage class="w-[180px] h-[272px]" src={poster_path} alt={name} />
                          </div>
                          <div class="flex-1 p-4">
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
                            </div>
                            <div class="space-x-2 mt-6">
                              <Button store={profileBtn.bind(tv)} variant="subtle" icon={<BookOpen class="w-4 h-4" />}>
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
      </div>
      <TMDBSearcherDialog store={dialog} />
    </>
  );
};
