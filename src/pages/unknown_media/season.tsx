/**
 * @file 未识别的电视剧
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { Brush, CheckCircle, RotateCcw, Search, Trash } from "lucide-solid";

import { UnknownSeasonMediaItem, fetchUnknownMediaList, setParsedMediaProfile } from "@/services/parsed_media";
import { deleteUnknownTV } from "@/services";
import { Button, ListView, Dialog, LazyImage, ScrollView, Input, Checkbox } from "@/components/ui";
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
import { ListCore } from "@/domains/list";
import { RefCore } from "@/domains/cur";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { ViewComponent } from "@/store/types";
import { MediaTypes } from "@/constants";

export const UnknownSeasonListPage: ViewComponent = (props) => {
  const { app, view, parent } = props;

  const list = new ListCore(new RequestCore(fetchUnknownMediaList), {
    pageSize: 50,
    search: {
      type: MediaTypes.Season,
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
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      list.deleteItem((item) => {
        if (item.id === seasonRef.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const tvDeletingRequest = new RequestCore(deleteUnknownTV, {
    onLoading(loading) {
      tvDeletingConfirmDialog.okBtn.setLoading(loading);
      tvDeletingBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      tvDeletingConfirmDialog.hide();
      const theParsedTV = seasonRef.value;
      if (!theParsedTV) {
        return;
      }
      list.deleteItem((item) => {
        if (item.id === theParsedTV.id) {
          return true;
        }
        return false;
      });
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      nameSearchInput.clear();
      checkbox.reset();
      list.reset();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
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
        return;
      }
      list.search({ name: nameSearchInput.value });
    },
  });
  const tvDeletingConfirmDialog = new DialogCore({
    title: "删除未识别电视剧",
    onOk() {
      if (!seasonRef.value) {
        app.tip({
          text: ["请选择要删除的记录"],
        });
        return;
      }
      tvDeletingRequest.run({
        parsed_tv_id: seasonRef.value.id,
      });
    },
  });
  const tvDeletingBtn = new ButtonInListCore<UnknownSeasonMediaItem>({
    onClick(record) {
      seasonRef.select(record);
      tvDeletingConfirmDialog.show();
    },
  });
  const seasonRef = new RefCore<UnknownSeasonMediaItem>();
  const checkbox = new CheckboxCore({
    onChange(checked) {
      list.search({
        empty: checked ? 1 : 0,
      });
    },
  });
  const unknownTVProfileSetBtn = new ButtonInListCore<UnknownSeasonMediaItem>({
    onClick(record) {
      seasonRef.select(record);
      dialog.show();
    },
  });
  const dialog = new DialogCore({
    onOk() {
      if (!seasonRef.value) {
        app.tip({ text: ["请先选择未识别的电视剧"] });
        return;
      }
      const { id } = seasonRef.value;
      const media = mediaSearch.cur;
      if (!media) {
        app.tip({ text: ["请先选择设置的详情"] });
        return;
      }
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
  const mediaSearch = new TMDBSearcherCore({
    // type: MediaTypes.Season,
  });
  const poster = new ImageInListCore({});
  const folderImg = new ImageCore({
    src: "https://img.alicdn.com/imgextra/i1/O1CN01rGJZac1Zn37NL70IT_!!6000000003238-2-tps-230-180.png",
  });

  const [response, setResponse] = createSignal(list.response);
  const [cur, setCur] = createSignal(seasonRef.value);

  console.log("[PAGE]/unknown_media/season - ", parent);
  if (parent?.scrollView) {
    parent?.scrollView.onReachBottom(() => {
      list.loadMore();
    });
  }
  list.onStateChange((nextState) => {
    setResponse(nextState);
  });
  seasonRef.onStateChange((nextState) => {
    setCur(nextState);
  });
  view.onShow(() => {
    list.init();
  });

  return (
    <>
      <div class="px-8 pb-12">
        <div class="my-4 flex items-center space-x-2">
          <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
            刷新
          </Button>
          <Button store={resetBtn}>重置</Button>
          <div class="flex items-center space-x-2">
            <Checkbox store={checkbox}></Checkbox>
            <span>未匹配详情</span>
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
                const { id, name, season_text, profile, sources } = parsedMedia;
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
                      <div class="text-lg">
                        {name}/{season_text}
                      </div>
                      <Show when={sources}>
                        <div class="mt-4 p-2 space-y-2">
                          <For each={sources}>
                            {(parsedSource) => {
                              const { name, episode_text, parent_paths, profile, file_name, drive } = parsedSource;
                              return (
                                <div title={name}>
                                  <div>{episode_text}</div>
                                  <Show when={profile}>
                                    <div class="flex items-center">
                                      <CheckCircle class="w-4 h-4 text-green-500" />
                                      <div>{profile?.order}、</div>
                                      <div>{profile?.name}</div>
                                    </div>
                                  </Show>
                                  <div class="text-sm text-gray-500">
                                    [{drive.name}]{parent_paths}/{file_name}
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
                          store={unknownTVProfileSetBtn.bind(parsedMedia)}
                          icon={<Brush class="w-4 h-4" />}
                        >
                          设置详情
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </div>
      <Dialog store={dialog}>
        <div class="w-[520px]">
          <TMDBSearcherView store={mediaSearch} />
        </div>
      </Dialog>
      <Dialog store={tvDeletingConfirmDialog}>
        <div class="w-[520px]">
          <div class="text-lg">确认删除 {cur()?.name} 吗？</div>
          <div class="text-sm text-slate-800">
            <div>该操作并不会删除云盘内文件</div>
            <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
          </div>
        </div>
      </Dialog>
    </>
  );
};
