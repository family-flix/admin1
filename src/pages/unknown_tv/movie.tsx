/**
 * @file 未识别的电影
 */
import { For, createSignal } from "solid-js";
import { Brush, RotateCcw, Trash } from "lucide-solid";

import {
  UnknownMovieItem,
  setProfileForUnknownMovie,
  delete_unknown_movie,
  delete_unknown_movie_list,
  fetch_unknown_movie_list,
} from "@/services";
import { Button, Dialog, ListView, LazyImage, ScrollView } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { ButtonCore, ButtonInListCore, DialogCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";

export const UnknownMoviePage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = new ListCore(new RequestCore(fetch_unknown_movie_list), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const deleteUnknownMovie = new RequestCore(delete_unknown_movie, {
    onLoading(loading) {
      deleteConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["删除成功"] });
      deleteConfirmDialog.hide();
      const theMovie = movieRef.value;
      if (!theMovie) {
        return;
      }
      list.deleteItem((item) => {
        if (item.id === theMovie.id) {
          return true;
        }
        return false;
      });
    },
    onFailed(error) {
      app.tip({ text: ["删除电影失败", error.message] });
    },
  });
  const movieRef = new RefCore<UnknownMovieItem>();
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const selectMatchedProfileBtn = new ButtonInListCore<UnknownMovieItem>({
    onClick(record) {
      movieRef.select(record);
      dialog.show();
    },
  });
  const deleteConfirmDialog = new DialogCore({
    title: "删除",
    onOk() {
      if (!movieRef.value) {
        app.tip({ text: ["请先选择要删除的电影"] });
        return;
      }
      deleteUnknownMovie.run({ id: movieRef.value.id });
    },
  });
  const deleteBtn = new ButtonInListCore<UnknownMovieItem>({
    onClick(record) {
      movieRef.select(record);
      deleteConfirmDialog.setTitle(`确认删除 ${record.name} 吗？`);
      deleteConfirmDialog.show();
    },
  });
  const bindProfileForMovie = new RequestCore(setProfileForUnknownMovie, {
    onLoading(loading) {
      dialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      list.deleteItem((movie) => {
        if (movie.id === movieRef.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const dialog = new TMDBSearcherDialogCore({
    type: "movie",
    onOk(searched_tv) {
      if (!movieRef.value) {
        app.tip({ text: ["请先选择未识别的电影"] });
        return;
      }
      const { id } = movieRef.value;
      bindProfileForMovie.run(id, {
        unique_id: searched_tv.id,
      });
    },
  });
  const deleteRequest = new RequestCore(delete_unknown_movie_list, {
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
      deleteListConfirmDialog.hide();
      list.refresh();
    },
  });
  const deleteListConfirmDialog = new DialogCore({
    title: "确认删除所有未识别电影吗？",
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
        <div class="my-4 space-x-2">
          <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
            刷新
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
              {(file) => {
                const { id, name, file_name, parent_paths, drive } = file;
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
                      <div class="mt-2 text-sm text-slate-800 break-all">
                        [{drive.name}]{parent_paths}/{file_name}
                      </div>
                      <div class="flex items-center mt-4 space-x-2">
                        <Button
                          class="box-content"
                          variant="subtle"
                          store={selectMatchedProfileBtn.bind(file)}
                          icon={<Brush class="w-4 h-4" />}
                        >
                          修改
                        </Button>
                        <Button
                          class="box-content"
                          variant="subtle"
                          store={deleteBtn.bind(file)}
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
      <TMDBSearcherDialog store={dialog} />
      <Dialog store={deleteConfirmDialog}>
        <div class="w-[520px]">
          <div>仅删除该记录，不删除云盘文件。</div>
        </div>
      </Dialog>
      <Dialog store={deleteListConfirmDialog}>
        <div class="w-[520px]">
          <div>该操作并不会删除云盘内文件</div>
          <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
        </div>
      </Dialog>
    </>
  );
};
