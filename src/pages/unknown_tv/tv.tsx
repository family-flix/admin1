/**
 * @file 未识别的电视剧
 */
import { For, createSignal, onMount } from "solid-js";
import { LucideBrush as Brush, LucideRotateCcw as RotateCcw, Trash } from "lucide-solid";

import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import {
  UnknownTVItem,
  bind_profile_for_unknown_movie,
  bind_profile_for_unknown_tv,
  delete_unknown_tv_list,
  fetch_unknown_tv_list,
} from "@/services";
import { FolderCard, FolderCardSkeleton } from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { SelectionCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ListView } from "@/components/ListView";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogCore } from "@/domains/ui/dialog";
import { Dialog } from "@/components/ui/dialog";

export const UnknownTVPage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = new ListCore(new RequestCore(fetch_unknown_tv_list), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const deleteRequest = new RequestCore(delete_unknown_tv_list, {
    onLoading(loading) {
      deleteConfirmDialog.okBtn.setLoading(loading);
      deleteBtn.setLoading(loading);
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
      deleteConfirmDialog.hide();
    },
  });
  const deleteConfirmDialog = new DialogCore({
    title: "确认删除所有未识别电视剧吗？",
    onOk() {
      deleteRequest.run();
    },
  });
  const deleteBtn = new ButtonCore({
    onClick() {
      deleteConfirmDialog.show();
    },
  });
  const cur = new SelectionCore<UnknownTVItem>();
  const selectMatchedProfileBtn = new ButtonInListCore<UnknownTVItem>({
    onClick(record) {
      cur.select(record);
      dialog.show();
    },
  });
  const bindProfileForTV = new RequestCore(bind_profile_for_unknown_tv, {
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
        if (item.id === cur.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const dialog = new TMDBSearcherDialogCore({
    onOk(searched_tv) {
      if (!cur.value) {
        app.tip({ text: ["请先选择未识别的电视剧"] });
        return;
      }
      const { id } = cur.value;
      bindProfileForTV.run(id, searched_tv);
    },
  });

  const [response, setResponse] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });

  view.onShow(() => {
    list.init();
  });

  return (
    <div class="px-4">
      <div class="my-4 flex items-center space-x-2">
        <Button icon={<RotateCcw class="w-4 h-4" />} variant="subtle" store={refreshBtn}>
          刷新
        </Button>
        <Button icon={<Trash class="w-4 h-4" />} variant="subtle" store={deleteBtn}>
          删除所有
        </Button>
      </div>
      <ListView
        class="pb-8"
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
          <For each={response().dataSource}>
            {(file) => {
              const { id, name } = file;
              return (
                <div class="w-[152px] mb-4 rounded">
                  <FolderCard type="folder" name={name} />
                  <div class="flex justify-center mt-2">
                    <Button
                      class="box-content"
                      variant="subtle"
                      store={selectMatchedProfileBtn.bind(file)}
                      icon={<Brush class="w-4 h-4" />}
                    >
                      修改
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
        <div>该操作并不会删除云盘内文件</div>
        <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
      </Dialog>
    </div>
  );
};
