/**
 * @file 未识别的季
 */
import { For, Show, createSignal, onMount } from "solid-js";
import { LucideBrush as Brush, LucideRotateCw as RotateCw, Trash } from "lucide-solid";

import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import {
  UnknownSeasonItem,
  UnknownTVItem,
  delete_unknown_season_list,
  fetch_unknown_season_list,
  fetch_unknown_tv_list,
  update_unknown_season_number,
} from "@/services";
import { FolderCard, FolderCardSkeleton } from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { SelectionCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { DialogCore } from "@/domains/ui/dialog";
import { InputCore } from "@/domains/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ListView } from "@/components/ListView";
import { Skeleton } from "@/components/ui/skeleton";

export const UnknownSeasonPage: ViewComponent = (props) => {
  const { app, view } = props;
  const list = new ListCore(new RequestCore(fetch_unknown_season_list), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const cur = new SelectionCore<UnknownSeasonItem>();
  const updateSeason = new RequestCore(update_unknown_season_number, {
    onLoading(loading) {
      dialog.okBtn.setLoading(loading);
      updateSeasonBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改季失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改季成功"] });
      dialog.hide();
      list.deleteItem((item) => {
        if (item.id === cur.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const seasonInput = new InputCore({
    placeholder: "请输入季，如 S01、S02",
  });
  const dialog = new DialogCore({
    title: "修改季",
    onOk() {
      if (!seasonInput.value) {
        app.tip({
          text: ["请输入季"],
        });
        return;
      }
      if (!cur.value) {
        app.tip({
          text: ["请先选择要修改的季"],
        });
        return;
      }
      updateSeason.run({ id: cur.value.id, season_number: seasonInput.value });
    },
  });
  const updateSeasonBtn = new ButtonInListCore<UnknownSeasonItem>({
    onClick(record) {
      cur.select(record);
      dialog.show();
    },
  });
  const deleteRequest = new RequestCore(delete_unknown_season_list, {
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
      list.deleteItem((item) => {
        if (item.id === cur.value?.id) {
          return true;
        }
        return false;
      });
      deleteConfirmDialog.hide();
    },
  });
  const deleteConfirmDialog = new DialogCore({
    title: "确认删除所有未识别季吗？",
    onOk() {
      deleteRequest.run();
    },
  });
  const deleteBtn = new ButtonCore({
    onClick() {
      deleteConfirmDialog.show();
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
        <Button icon={<RotateCw class="w-4 h-4" />} variant="subtle" store={refreshBtn}>
          刷新
        </Button>
        <Button icon={<Trash class="w-4 h-4" />} variant="subtle" store={deleteBtn}>
          删除所有
        </Button>
      </div>
      <ListView
        class="pb-4"
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
              const { id, name, season_number } = file;
              const n = `${name} - ${season_number}`;
              return (
                <div class="w-[152px] mb-4 rounded">
                  <FolderCard type="folder" name={n} />
                  <div class="flex justify-center mt-2">
                    <Button
                      class="box-content"
                      variant="subtle"
                      store={updateSeasonBtn.bind(file)}
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
      <Dialog store={dialog}>
        <Input store={seasonInput} />
      </Dialog>
      <Dialog store={deleteConfirmDialog}>
        <div>该操作并不会删除云盘内文件</div>
        <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
      </Dialog>
    </div>
  );
};
