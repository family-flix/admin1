/**
 * @file 未识别的季
 */
import { For, createSignal } from "solid-js";
import { Brush, RotateCw, Trash } from "lucide-solid";

import { Button, Dialog, Input, ListView, LazyImage } from "@/components/ui";
import { ButtonCore, ButtonInListCore, InputCore, DialogCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import {
  UnknownSeasonItem,
  delete_unknown_season_list,
  fetch_unknown_season_list,
  update_unknown_season_number,
} from "@/services";
import { ViewComponent } from "@/types";

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
  const cur = new RefCore<UnknownSeasonItem>();
  const bindSeasonRequest = new RequestCore(update_unknown_season_number, {
    onLoading(loading) {
      bindSeasonDialog.okBtn.setLoading(loading);
      bindSeasonBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改季失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改季成功"] });
      bindSeasonDialog.hide();
      list.deleteItem((item) => {
        if (item.id === cur.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const seasonInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入季，如 S01、S02",
  });
  const bindSeasonDialog = new DialogCore({
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
      bindSeasonRequest.run({ id: cur.value.id, season_number: seasonInput.value });
    },
  });
  const bindSeasonBtn = new ButtonInListCore<UnknownSeasonItem>({
    onClick(record) {
      cur.select(record);
      bindSeasonDialog.show();
    },
  });
  const seasonDeletingRequest = new RequestCore(delete_unknown_season_list, {
    onLoading(loading) {
      seasonDeletingConfirmDialog.okBtn.setLoading(loading);
      seasonDeletingBtn.setLoading(loading);
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
      seasonDeletingConfirmDialog.hide();
    },
  });
  const seasonDeletingConfirmDialog = new DialogCore({
    title: "确认删除所有未识别季吗？",
    onOk() {
      seasonDeletingRequest.run();
    },
  });
  const seasonDeletingBtn = new ButtonCore({
    onClick() {
      seasonDeletingConfirmDialog.show();
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
    <div class="">
      <div class="my-4 space-x-2">
        <Button icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
          刷新
        </Button>
        <Button icon={<Trash class="w-4 h-4" />} variant="subtle" store={seasonDeletingBtn}>
          删除所有
        </Button>
      </div>
      <ListView
        class=""
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
              const { id, name, season_number } = file;
              const n = `${name} - ${season_number}`;
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
                    <div class="text-lg">{n}</div>
                    {/* <div class="mt-2 text-sm text-slate-800 break-all">
                      [{drive.name}]{parent_paths}/{file_name}
                    </div> */}
                    <div class="flex items-center mt-4 space-x-2">
                      <Button
                        class="box-content"
                        variant="subtle"
                        store={bindSeasonBtn.bind(file)}
                        icon={<Brush class="w-4 h-4" />}
                      >
                        修改
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </ListView>
      <Dialog store={bindSeasonDialog}>
        <Input store={seasonInput} />
      </Dialog>
      <Dialog store={seasonDeletingConfirmDialog}>
        <div>该操作并不会删除云盘内文件</div>
        <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
      </Dialog>
    </div>
  );
};
