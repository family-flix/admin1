/**
 * @file 未识别的剧集
 */
import { For, Show, createSignal } from "solid-js";
import { Brush, Edit, RotateCcw, Search, Trash } from "lucide-solid";

import {
  UnknownEpisodeItem,
  fetchParsedMediaSourceList,
  setParsedSeasonMediaSourceProfile,
} from "@/services/parsed_media";
import { delete_unknown_episode } from "@/services";
import { renameFile } from "@/domains/drive";
import { Button, Dialog, Input, LazyImage, ListView, ScrollView } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore, TMDBSearcherView } from "@/components/TMDBSearcher";
import {
  ButtonCore,
  ButtonInListCore,
  DialogCore,
  ImageCore,
  ImageInListCore,
  InputCore,
  ScrollViewCore,
} from "@/domains/ui";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { RefCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/store/types";
import { createJob } from "@/store/job";
import { MediaTypes } from "@/constants";

export const UnknownEpisodeListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = new ListCore(new RequestCore(fetchParsedMediaSourceList), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const renameFileRequest = new RequestCore(renameFile, {
    beforeRequest() {
      renameFileDialog.okBtn.setLoading(true);
    },
    onSuccess(v) {
      const theEpisode = curEpisode.value;
      createJob({
        job_id: v.job_id,
        onFinish() {
          app.tip({
            text: ["重命名完成"],
          });
          renameFileDialog.okBtn.setLoading(false);
          if (!theEpisode) {
            return;
          }
          list.modifyItem((item) => {
            if (item.id === theEpisode.id) {
              const { id, name, episode_text, season_text, parent_paths, profile, drive } = item;
              return {
                id,
                name,
                episode_text,
                season_text,
                file_name: renameFileInput.value,
                parent_paths,
                profile,
                drive,
              };
            }
            return item;
          });
          renameFileDialog.hide();
        },
      });
    },
    onFailed(error) {
      app.tip({
        text: ["重命名失败", error.message],
      });
      renameFileDialog.okBtn.setLoading(false);
    },
  });
  const deleteUnknownEpisode = new RequestCore(delete_unknown_episode, {
    onLoading(loading) {
      deleteConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["删除剧集失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["删除成功"] });
      deleteConfirmDialog.hide();
      list.deleteItem((item) => {
        if (item.id === curEpisode.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const curEpisode = new RefCore<UnknownEpisodeItem>();
  const mediaSourceRef = new RefCore<UnknownEpisodeItem>();
  const selectMatchedProfileBtn = new ButtonInListCore<UnknownEpisodeItem>({
    onClick(record) {
      curEpisode.select(record);
      bindEpisodeDialog.show();
    },
  });
  const renameFileInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入新的文件名称",
  });
  const renameFileDialog = new DialogCore({
    title: "修改文件名称",
    onOk() {
      if (!renameFileInput.value) {
        app.tip({
          text: [renameFileInput.placeholder],
        });
        return;
      }
      const theEpisode = curEpisode.value;
      if (!theEpisode) {
        app.tip({
          text: ["请选择要修改名称的剧集"],
        });
        return;
      }
      const { id, drive } = theEpisode;
      renameFileRequest.run({
        parsed_media_source_id: id,
        name: renameFileInput.value,
      });
    },
  });
  const deleteConfirmDialog = new DialogCore({
    title: "删除",
    onOk() {
      if (!curEpisode.value) {
        app.tip({ text: ["请先选择要删除的剧集"] });
        return;
      }
      deleteUnknownEpisode.run({ id: curEpisode.value.id });
    },
  });
  const deleteBtn = new ButtonInListCore<UnknownEpisodeItem>({
    onClick(record) {
      curEpisode.select(record);
      deleteConfirmDialog.setTitle(`确认删除 ${record.name} 吗？`);
      deleteConfirmDialog.show();
    },
  });
  const setMediaSourceProfileRequest = new RequestCore(setParsedSeasonMediaSourceProfile, {
    onLoading(loading) {
      bindEpisodeDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      bindEpisodeDialog.hide();
      list.deleteItem((movie) => {
        if (movie.id === curEpisode.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const mediaSearch = new TMDBSearcherCore({
    episode: true,
  });
  const bindEpisodeDialog = new DialogCore({
    onOk() {
      if (!curEpisode.value) {
        app.tip({ text: ["请先选择设置的剧集"] });
        return;
      }
      const mediaProfile = mediaSearch.cur;
      const sourceProfile = mediaSearch.curEpisode;
      if (!mediaProfile) {
        app.tip({ text: ["请先选择详情"] });
        return;
      }
      if (!sourceProfile) {
        app.tip({ text: ["请先选择剧集详情"] });
        return;
      }
      const { id } = curEpisode.value;
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
  const resetBtn = new ButtonCore({
    onClick() {
      nameSearchInput.clear();
      list.reset();
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
            <For each={dataSource()}>
              {(episode) => {
                const { id, name, episode_text, season_text, file_name, parent_paths, profile, drive } = episode;
                return (
                  <div class="flex p-4 bg-white rounded-sm">
                    <div class="mr-2 w-[80px]">
                      <Show
                        when={profile}
                        fallback={
                          <div class="w-full rounded">
                            <LazyImage class="max-w-full max-h-full object-contain" store={folderImg} />
                          </div>
                        }
                      >
                        <LazyImage class="w-full" store={poster.bind(profile?.poster_path)} />
                        <div>{profile?.name}</div>
                      </Show>
                    </div>
                    <div class="flex-1">
                      <div class="text-lg">{name}</div>
                      <div>
                        {season_text}/{episode_text}
                      </div>
                      <div class="mt-2 flex items-center space-x-2 text-slate-800">
                        <div class="text-sm break-all">
                          [{drive.name}]{parent_paths}/{file_name}
                        </div>
                        <div
                          class="p-1 cursor-pointer"
                          onClick={() => {
                            curEpisode.select(episode);
                            mediaSourceRef.select(episode);
                            dialog2.show();
                          }}
                        >
                          <Edit class="w-4 h-4" />
                        </div>
                      </div>
                      <div class="flex items-center mt-4 space-x-2">
                        <Button
                          class="box-content"
                          variant="subtle"
                          store={selectMatchedProfileBtn.bind(episode)}
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
      <Dialog store={bindEpisodeDialog}>
        <div class="w-[520px]">
          <TMDBSearcherView store={mediaSearch} />
        </div>
      </Dialog>
      <Dialog store={dialog2}>
        <div class="w-[520px]">
          <TMDBSearcherView store={searcher2} />
        </div>
      </Dialog>
      <Dialog store={deleteConfirmDialog}>
        <div>仅删除该记录，不删除云盘文件。</div>
      </Dialog>
      <Dialog store={renameFileDialog}>
        <div class="w-[520px]">
          <div>该操作将修改云盘内的文件名称</div>
          <div>
            <Input store={renameFileInput} />
          </div>
        </div>
      </Dialog>
    </>
  );
};
