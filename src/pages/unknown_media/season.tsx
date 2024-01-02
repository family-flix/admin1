/**
 * @file 未识别的电视剧
 */
import { For, Show, createSignal } from "solid-js";
import { Brush, RotateCcw, Search, Trash } from "lucide-solid";

import { UnknownSeasonMediaItem, deleteUnknownTV, fetchUnknownSeasonMediaList } from "@/services";
import { Button, ListView, Dialog, LazyImage, ScrollView, Input } from "@/components/ui";
import { TMDBSearcherView } from "@/components/TMDBSearcher";
import { ButtonCore, ButtonInListCore, CheckboxCore, DialogCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { setParsedSeasonMediaProfile } from "@/services/parsed_media";
import { TMDBSearcherCore } from "@/domains/tmdb";

export const UnknownSeasonMediaPage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = new ListCore(new RequestCore(fetchUnknownSeasonMediaList), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
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
  const setProfileRequest = new RequestCore(setParsedSeasonMediaProfile, {
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
  const resetBtn = new ButtonCore({
    onClick() {
      nameSearchInput.clear();
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
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
    },
  });

  const [response, setResponse] = createSignal(list.response);
  const [cur, setCur] = createSignal(seasonRef.value);

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
      <ScrollView class="px-8 pb-12" store={scrollView}>
        <div class="my-4 flex items-center space-x-2">
          <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
            刷新
          </Button>
          <Button store={resetBtn}>重置</Button>
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
                const { id, name, season_text, sources } = parsedMedia;
                return (
                  <div class="flex p-4 bg-white rounded-sm">
                    <div class="mr-2 w-[80px]">
                      <div class="w-full rounded">
                        <LazyImage
                          class="max-w-full max-h-full object-contain"
                          src={(() => {
                            return "https://img.alicdn.com/imgextra/i1/O1CN01rGJZac1Zn37NL70IT_!!6000000003238-2-tps-230-180.png";
                          })()}
                        />
                      </div>
                    </div>
                    <div class="flex-1 w-0 mt-2">
                      <div class="text-lg">
                        {name} {season_text}
                      </div>
                      <Show when={sources}>
                        <div class="mt-4 p-2">
                          <For each={sources}>
                            {(parsedSource) => {
                              const { name, episode_text, parent_paths, file_name, drive } = parsedSource;
                              return (
                                <div title={name}>
                                  <div>{episode_text}</div>
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
      </ScrollView>
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
