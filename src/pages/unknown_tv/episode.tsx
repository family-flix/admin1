/**
 * @file 未识别的剧集
 */
import { For, createSignal } from "solid-js";
import { Edit, RotateCcw, Trash } from "lucide-solid";

import {
  UnknownEpisodeItem,
  bind_profile_for_unknown_movie,
  delete_unknown_episode,
  delete_unknown_episode_list,
  fetch_unknown_episode_list,
} from "@/services";
import { renameFileOfDrive } from "@/domains/drive";
import { Button, Dialog, Input, LazyImage, ListView, ScrollView } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { ButtonCore, ButtonInListCore, DialogCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { SelectionCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/types";

export const UnknownEpisodePage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = new ListCore(new RequestCore(fetch_unknown_episode_list), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const curEpisode = new SelectionCore<UnknownEpisodeItem>();
  const bindEpisodeBtn = new ButtonInListCore<UnknownEpisodeItem>({
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
      const { file_id, drive } = theEpisode;
      renameFileRequest.run({
        name: renameFileInput.value,
        drive_id: drive.id,
        file_id,
      });
    },
  });
  const renameFileRequest = new RequestCore(renameFileOfDrive, {
    onLoading(loading) {
      renameFileDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      const theEpisode = curEpisode.value;
      if (!theEpisode) {
        return;
      }
      list.modifyItem((item) => {
        if (item.id === theEpisode.id) {
          const { id, name, episode_number, season_number, file_id, file_name, parent_paths, drive } = item;
          return {
            id,
            name: renameFileInput.value,
            episode_number,
            season_number,
            file_id,
            file_name,
            parent_paths,
            drive,
          };
        }
        return item;
      });
    },
    onFailed(error) {
      app.tip({
        text: ["重命名失败", error.message],
      });
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
      list.refresh();
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
  const bindMovieRequest = new RequestCore(bind_profile_for_unknown_movie, {
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
  const bindEpisodeDialog = new TMDBSearcherDialogCore({
    type: "movie",
    onOk(searched_tv) {
      if (!curEpisode.value) {
        app.tip({ text: ["请先选择未识别的电影"] });
        return;
      }
      const { id } = curEpisode.value;
      bindMovieRequest.run(id, searched_tv);
    },
  });
  const deleteRequest = new RequestCore(delete_unknown_episode_list, {
    onLoading(loading) {
      deleteListConfirmDialog.okBtn.setLoading(loading);
      deleteListBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      list.refresh();
      deleteListConfirmDialog.hide();
    },
  });
  const deleteListConfirmDialog = new DialogCore({
    title: "确认删除所有未识别剧集吗？",
    onOk() {
      deleteRequest.run();
    },
  });
  const deleteListBtn = new ButtonCore({
    onClick() {
      deleteListConfirmDialog.show();
    },
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
    },
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
          <Button icon={<Trash class="w-4 h-4" />} variant="subtle" store={deleteListBtn}>
            删除所有
          </Button>
        </div>
        <ListView
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
                const { id, name, episode_number, season_number, file_name, parent_paths, drive } = episode;
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
                    <div class="flex-1 mt-2">
                      <div class="text-lg">{name}</div>
                      <div>
                        {season_number}/{episode_number}
                      </div>
                      <div class="mt-2 flex items-center space-x-2 text-slate-800">
                        <div class="text-sm break-all">
                          [{drive.name}]{parent_paths}/{file_name}
                        </div>
                        <div
                          class="p-1 cursor-pointer"
                          onClick={() => {
                            curEpisode.select(episode);
                            renameFileInput.change(episode.file_name);
                            renameFileDialog.show();
                          }}
                        >
                          <Edit class="w-4 h-4" />
                        </div>
                      </div>
                      <div class="flex items-center mt-4 space-x-2">
                        {/* <Button
                        class="box-content"
                        variant="subtle"
                        store={bindEpisodeBtn.bind(file)}
                        icon={<Brush class="w-4 h-4" />}
                      >
                        修改
                      </Button> */}
                        <Button
                          class="box-content"
                          variant="subtle"
                          store={deleteBtn.bind(episode)}
                          icon={<Trash class="w-4 h-4" />}
                        >
                          删除
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
      <TMDBSearcherDialog store={bindEpisodeDialog} />
      <Dialog store={deleteConfirmDialog}>
        <div>仅删除该记录，不删除云盘文件。</div>
      </Dialog>
      <Dialog store={deleteListConfirmDialog}>
        <div>该操作并不会删除云盘内文件</div>
        <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
      </Dialog>
      <Dialog store={renameFileDialog}>
        <div>该操作将修改云盘内的文件名称</div>
        <div>
          <Input store={renameFileInput} />
        </div>
      </Dialog>
    </>
  );
};
