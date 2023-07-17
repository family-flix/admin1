/**
 * @file 未识别的电影
 */
import { For, Show, createSignal } from "solid-js";
import {
  LucideBrush as Brush,
  LucideRotateCcw as RotateCcw,
  LucideTrain as Train,
  LucideTrash as Trash,
} from "lucide-solid";

import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import {
  UnknownMovieItem,
  bind_profile_for_unknown_movie,
  delete_unknown_movie,
  delete_unknown_movie_list,
  fetch_unknown_movie_list,
} from "@/services";
import { FolderCard, FolderCardSkeleton } from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { SelectionCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { DialogCore } from "@/domains/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import { ListView } from "@/components/ListView";
import { Skeleton } from "@/components/ui/skeleton";

export const UnknownMoviePage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = new ListCore(new RequestCore(fetch_unknown_movie_list), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const cur = new SelectionCore<UnknownMovieItem>();
  const selectMatchedProfileBtn = new ButtonInListCore<UnknownMovieItem>({
    onClick(record) {
      cur.select(record);
      dialog.show();
    },
  });
  const deleteUnknownMovie = new RequestCore(delete_unknown_movie, {
    onLoading(loading) {
      deleteConfirmDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["删除电影失败", error.message] });
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
      if (!cur.value) {
        app.tip({ text: ["请先选择要删除的电影"] });
        return;
      }
      deleteUnknownMovie.run({ id: cur.value.id });
    },
  });
  const deleteBtn = new ButtonInListCore<UnknownMovieItem>({
    onClick(record) {
      cur.select(record);
      deleteConfirmDialog.setTitle(`确认删除 ${record.name} 吗？`);
      deleteConfirmDialog.show();
    },
  });
  const bindProfileForMovie = new RequestCore(bind_profile_for_unknown_movie, {
    onLoading(loading) {
      dialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      dialog.hide();
      list.refresh();
    },
  });
  const dialog = new TMDBSearcherDialogCore({
    type: "2",
    onOk(searched_tv) {
      if (!cur.value) {
        app.tip({ text: ["请先选择未识别的电影"] });
        return;
      }
      const { id } = cur.value;
      bindProfileForMovie.run(id, searched_tv);
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
      list.deleteItem((item) => {
        if (item.id === cur.value?.id) {
          return true;
        }
        return false;
      });
      deleteListConfirmDialog.hide();
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

  const [response, setResponse] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });

  view.onShow(() => {
    list.init();
  });

  const dataSource = () => response().dataSource;

  return (
    <div class="px-4">
      <div class="my-4 space-x-2">
        <Button icon={<RotateCcw class="w-4 h-4" />} variant="subtle" store={refreshBtn}>
          刷新
        </Button>
        <Button icon={<Trash class="w-4 h-4" />} variant="subtle" store={deleteListBtn}>
          删除所有
        </Button>
      </div>
      <ListView
        store={list}
        skeleton={
          <div class="grid grid-cols-3 gap-2 lg:grid-cols-6">
            <div class="w-[152px] rounded">
              <FolderCardSkeleton />
              <div class="flex justify-center mt-2">
                <Skeleton class="block box-content"></Skeleton>
              </div>
            </div>
          </div>
        }
      >
        <div class="grid grid-cols-3 gap-2 lg:grid-cols-4 xl:grid-cols-6">
          <For each={dataSource()}>
            {(file) => {
              const { id, name } = file;
              return (
                <div class="w-[152px] rounded">
                  <FolderCard type="folder" name={name} />
                  <div class="flex justify-center space-x-2 mt-2">
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
              );
            }}
          </For>
        </div>
      </ListView>
      <TMDBSearcherDialog store={dialog} />
      <Dialog store={deleteConfirmDialog}>
        <div>仅删除该记录，不删除云盘文件。</div>
      </Dialog>
      <Dialog store={deleteListConfirmDialog}>
        <div>该操作并不会删除云盘内文件</div>
        <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
      </Dialog>
    </div>
  );
};
