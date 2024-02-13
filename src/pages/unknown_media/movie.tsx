/**
 * @file 未识别的电影
 */
import { For, Show, createSignal } from "solid-js";
import { Brush, Edit, RotateCcw, Search, Trash } from "lucide-solid";

import {
  UnknownMovieMediaItem,
  fetchUnknownMediaList,
  setParsedMediaProfile,
  setParsedSeasonMediaSourceProfile,
} from "@/services/parsed_media";
import { ViewComponent } from "@/store/types";
import { Button, ListView, LazyImage, ScrollView, Input, Dialog, Checkbox } from "@/components/ui";
import { TMDBSearcherView } from "@/components/TMDBSearcher";
import {
  ButtonCore,
  ButtonInListCore,
  CheckboxCore,
  DialogCore,
  ImageCore,
  ImageInListCore,
  InputCore,
  ScrollViewCore,
} from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { ListCore } from "@/domains/list";
import { RefCore } from "@/domains/cur";
import { MediaTypes } from "@/constants";

export const UnknownMovieListPage: ViewComponent = (props) => {
  const { app, view, parent } = props;

  const list = new ListCore(new RequestCore(fetchUnknownMediaList), {
    pageSize: 50,
    search: {
      type: MediaTypes.Movie,
    },
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const setProfileRequest = new RequestCore(setParsedMediaProfile, {
    onLoading(loading) {
      dialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["设置失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["设置成功"] });
      dialog.hide();
      list.deleteItem((movie) => {
        if (movie.id === mediaRef.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const setMediaSourceProfileRequest = new RequestCore(setParsedSeasonMediaSourceProfile, {
    onLoading(loading) {
      dialog2.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["设置失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["设置成功"] });
      dialog2.hide();
      const curSource = mediaSourceRef.value;
      if (!curSource) {
        return;
      }
      const curMedia = mediaRef.value;
      if (!curMedia) {
        return;
      }
      list.modifyItem((item) => {
        if (item.id !== curMedia.id) {
          return item;
        }
        return {
          ...item,
          sources: item.sources.filter((s) => {
            if (s.id === curSource.id) {
              return false;
            }
            return true;
          }),
        };
      });
    },
  });
  const mediaRef = new RefCore<UnknownMovieMediaItem>();
  const checkbox = new CheckboxCore({
    onChange(checked) {
      list.search({
        empty: checked ? 1 : 0,
      });
    },
  });
  const mediaSourceRef = new RefCore<UnknownMovieMediaItem["sources"][number]>();
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      list.reset();
    },
  });
  const nameSearchInput = new InputCore({
    defaultValue: "",
    onEnter() {
      // console.log(nameSearchInput.value);
      searchBtn.click();
    },
  });
  const searchBtn = new ButtonCore({
    onClick() {
      if (!nameSearchInput.value) {
        return;
      }
      list.search({ name: nameSearchInput.value });
    },
  });
  const selectMatchedProfileBtn = new ButtonInListCore<UnknownMovieMediaItem>({
    onClick(record) {
      mediaRef.select(record);
      dialog.show();
    },
  });
  const searcher = new TMDBSearcherCore({
    type: MediaTypes.Movie,
  });
  const dialog = new DialogCore({
    onOk() {
      if (!mediaRef.value) {
        app.tip({ text: ["请先选择未识别的电影"] });
        return;
      }
      const media = searcher.cur;
      if (!media) {
        app.tip({ text: ["请先选择电影详情"] });
        return;
      }
      const { id } = mediaRef.value;
      setProfileRequest.run({
        parsed_media_id: id,
        media_profile: {
          id: String(media.id),
          type: media.type,
          name: media.name,
        },
      });
    },
  });
  const selectMatchedSourceProfileBtn = new ButtonInListCore<UnknownMovieMediaItem["sources"][number]>({
    onClick(record) {
      mediaSourceRef.select(record);
      dialog2.show();
    },
  });
  const searcher2 = new TMDBSearcherCore({
    episode: true,
  });
  const dialog2 = new DialogCore({
    onOk() {
      if (!mediaSourceRef.value) {
        app.tip({ text: ["请先选择未识别的电影"] });
        return;
      }
      const mediaProfile = searcher2.cur;
      if (!mediaProfile) {
        app.tip({ text: ["请先选择电影详情"] });
        return;
      }
      const { id } = mediaSourceRef.value;
      const sourceProfile = searcher2.curEpisode;
      if (mediaProfile.type === MediaTypes.Season) {
        if (!sourceProfile) {
          app.tip({ text: ["请先选择剧集详情"] });
          return;
        }
        setMediaSourceProfileRequest.run({
          parsed_media_source_id: id,
          media_profile: {
            id: String(mediaProfile.id),
            type: mediaProfile.type,
            name: mediaProfile.name,
          },
          media_source_profile: {
            id: String(sourceProfile.id),
          },
        });
        return;
      }
      setMediaSourceProfileRequest.run({
        parsed_media_source_id: id,
        media_profile: {
          id: String(mediaProfile.id),
          type: mediaProfile.type,
          name: mediaProfile.name,
        },
      });
    },
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
    },
  });
  const poster = new ImageInListCore({});
  const folderImg = new ImageCore({
    src: "https://img.alicdn.com/imgextra/i1/O1CN01rGJZac1Zn37NL70IT_!!6000000003238-2-tps-230-180.png",
  });

  const [response, setResponse] = createSignal(list.response);

  console.log("[PAGE]/unknown_media/season - ", parent);
  if (parent?.scrollView) {
    parent?.scrollView.onReachBottom(() => {
      list.loadMore();
    });
  }
  list.onStateChange((nextState) => {
    setResponse(nextState);
  });
  view.onShow(() => {
    list.init();
  });

  const dataSource = () => response().dataSource;

  return (
    <>
      <ScrollView class="px-8 pb-12" store={scrollView}>
        <div class="flex items-center my-4 space-x-2">
          <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
            刷新
          </Button>
          <Button store={resetBtn}>重置</Button>
          <div class="flex items-center space-x-2">
            <Checkbox store={checkbox}></Checkbox>
            <span>待处理</span>
          </div>
        </div>
        <div class="flex items-center space-x-2 mt-4">
          <Input class="" store={nameSearchInput} />
          <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
            搜索
          </Button>
        </div>
        <ListView
          class="mt-4"
          store={list}
          // skeleton={
          //   <div class="grid grid-cols-3 gap-2 lg:grid-cols-6">
          //     <div class="w-[152px] rounded">
          //       <FolderCardSkeleton />
          //       <div class="flex justify-center mt-2">
          //         <Skeleton class="block box-content"></Skeleton>
          //       </div>
          //     </div>
          //   </div>
          // }
        >
          <div class="space-y-4">
            <For each={response().dataSource}>
              {(parsedMedia) => {
                const { id, name, profile, sources } = parsedMedia;
                return (
                  <div class="flex p-4 bg-white rounded-sm">
                    <div class="mr-2 w-[80px]">
                      <Show
                        when={!profile}
                        fallback={
                          <div>
                            <div class="w-full rounded">
                              <LazyImage
                                class="max-w-full max-h-full object-contain"
                                store={poster.bind(profile?.poster_path)}
                              />
                            </div>
                            <div>{profile?.name}</div>
                          </div>
                        }
                      >
                        <div class="w-full rounded">
                          <LazyImage class="max-w-full max-h-full object-contain" store={folderImg} />
                        </div>
                      </Show>
                    </div>
                    <div class="flex-1 w-0 mt-2">
                      <div class="text-lg">{name}</div>
                      <Show when={sources}>
                        <div class="mt-4 py-2">
                          <For each={sources}>
                            {(mediaSource) => {
                              const { name, parent_paths, file_name, drive } = mediaSource;
                              return (
                                <div class="flex items-center space-x-2" title={name}>
                                  <div class="text-sm text-gray-500">
                                    [{drive.name}]{parent_paths}/{file_name}
                                  </div>
                                  <div
                                    class="p-1 cursor-pointer"
                                    onClick={() => {
                                      mediaRef.select(parsedMedia);
                                      mediaSourceRef.select(mediaSource);
                                      dialog2.show();
                                    }}
                                  >
                                    <Edit class="w-4 h-4" />
                                  </div>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                      <div class="flex items-center mt-4 space-x-2">
                        <Button
                          class="box-content"
                          variant="subtle"
                          store={selectMatchedProfileBtn.bind(parsedMedia)}
                          icon={<Brush class="w-4 h-4" />}
                        >
                          设置
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </ScrollView>
      <Dialog store={dialog}>
        <div class="w-[520px]">
          <TMDBSearcherView store={searcher} />
        </div>
      </Dialog>
      <Dialog store={dialog2}>
        <div class="w-[520px]">
          <TMDBSearcherView store={searcher2} />
        </div>
      </Dialog>
    </>
  );
};
