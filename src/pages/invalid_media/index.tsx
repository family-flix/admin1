/**
 * @file 问题影视剧列表
 */
import { createSignal, For, JSXElement, Show } from "solid-js";
import { AlertCircle, RotateCw, Search, Trash } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { deleteMedia, fetchInvalidMediaList, MediaErrorItem } from "@/biz/services/media";
import { LazyImage, Input, Button, Skeleton, ScrollView, ListView } from "@/components/ui";
import { InputCore, ButtonCore, ButtonInListCore, ScrollViewCore, ImageInListCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/ui/cur";
import { MediaErrorTypes, MediaTypes } from "@/constants/index";

export const InvalidMediaListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const errorList = new ListCore(new RequestCore(fetchInvalidMediaList), {
    onLoadingChange(loading) {
      searchBtn.setLoading(loading);
      resetBtn.setLoading(loading);
      refreshBtn.setLoading(loading);
    },
  });
  const mediaDeleteRequest = new RequestCore(deleteMedia);
  const errorRef = new RefCore<{
    id: string;
  }>();
  const $delete = new ButtonInListCore<MediaErrorItem>({
    async onClick(record) {
      $delete.setLoading(true);
      const r = await mediaDeleteRequest.run({ media_id: record.media.id });
      $delete.setLoading(false);
      if (r.error) {
        return;
      }
      app.tip({
        text: ["删除成功"],
      });
      errorList.deleteItem((item) => item.id === record.id);
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
      nameSearchInput.clear();
    },
  });
  const poster = new ImageInListCore();
  const refreshBtn = new ButtonCore({
    onClick() {
      errorList.refresh();
    },
  });
  const scrollView = new ScrollViewCore();

  const [state, setState] = createSignal(errorList.response);

  scrollView.onReachBottom(async () => {
    await errorList.loadMore();
    scrollView.finishLoadingMore();
  });
  errorList.onStateChange((v) => setState(v));
  errorList.init();

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">待处理问题列表({state().total})</h1>
        <div class="mt-8">
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
                    const operations = (
                      <div class="mt-4">
                        <Button store={$delete.bind(mediaError)}>删除</Button>
                      </div>
                    );
                    const { name, poster_path } = media;
                    const url = (() => {
                      if (media.type === MediaTypes.Season) {
                        return history.buildURLWithPrefix("root.home_layout.season_profile", { id: media.id });
                      }
                      if (media.type === MediaTypes.Movie) {
                        return history.buildURLWithPrefix("root.home_layout.movie_profile", { id: media.id });
                      }
                      return history.buildURLWithPrefix("root.notfound");
                    })();
                    return (
                      <div class="p-4 bg-white">
                        <a class="inline-flex mt-2" href={url} target="_blank">
                          <LazyImage class="w-[80px] h-[120px] mr-2" store={poster.bind(poster_path)} alt={name!} />
                          <div>
                            <div class="text-xl">{name}</div>
                            <div class="text-sm">{id}</div>
                            <div class="mt-4">{typeTextMap[type]}</div>
                          </div>
                        </a>
                        <div class="mt-4 space-y-1">
                          <For each={texts}>
                            {(text) => {
                              return (
                                <div class="flex items-center text-sm">
                                  <div class="mr-1 text-red-500">
                                    <AlertCircle class="w-4 h-4" />
                                  </div>
                                  <div>{text}</div>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                        {operations}
                      </div>
                    );
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
