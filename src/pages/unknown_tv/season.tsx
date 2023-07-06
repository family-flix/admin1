/**
 * @file 未识别的季
 */
import { For, Show, createSignal } from "solid-js";
import { LucideBrush as Brush, LucideRotateCw as RotateCw } from "lucide-solid";

import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import {
  UnknownSeasonItem,
  UnknownTVItem,
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
import { Skeleton } from "@/packages/ui/skeleton";

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
    onSuccess() {
      app.tip({ text: ["修改季成功"] });
      dialog.hide();
      list.refresh();
    },
    onFailed(error) {
      app.tip({ text: ["修改季失败", error.message] });
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

  const [response, setResponse] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });

  view.onShow(() => {
    list.init();
  });

  const dataSource = () => response().dataSource;
  const empty = () => response().empty;
  const noMore = () => response().noMore;

  return (
    <div class="px-4">
      <div class="my-4">
        <Button icon={<RotateCw class="w-4 h-4" />} variant="subtle" store={refreshBtn}>
          刷新季
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
              const { id, name, season_number } = file;
              const n = `${name} - ${season_number}`;
              return (
                <div class="w-[152px] rounded">
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
    </div>
  );
};
