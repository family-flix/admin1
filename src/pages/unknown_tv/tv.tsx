/**
 * @file 未识别的电视剧
 */
import { For, createSignal } from "solid-js";
import { Brush, RotateCcw, Trash } from "lucide-solid";

import { UnknownTVItem, bind_profile_for_unknown_tv, delete_unknown_tv_list, fetch_unknown_tv_list } from "@/services";
import { Button, ListView, Dialog, LazyImage } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { ButtonCore, ButtonInListCore, DialogCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { SelectionCore } from "@/domains/cur";
import { ViewComponent } from "@/types";

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
  const tvDeletingRequest = new RequestCore(delete_unknown_tv_list, {
    onLoading(loading) {
      tvDeletingConfirmDialog.okBtn.setLoading(loading);
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
      tvDeletingConfirmDialog.hide();
    },
  });
  const tvDeletingConfirmDialog = new DialogCore({
    title: "确认删除所有未识别电视剧吗？",
    onOk() {
      tvDeletingRequest.run();
    },
  });
  const deleteBtn = new ButtonCore({
    onClick() {
      tvDeletingConfirmDialog.show();
    },
  });
  const cur = new SelectionCore<UnknownTVItem>();
  const bindTVBtn = new ButtonInListCore<UnknownTVItem>({
    onClick(record) {
      cur.select(record);
      bindTVDialog.show();
    },
  });
  const bindTVRequest = new RequestCore(bind_profile_for_unknown_tv, {
    onLoading(loading) {
      bindTVDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      bindTVDialog.hide();
      list.deleteItem((item) => {
        if (item.id === cur.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const bindTVDialog = new TMDBSearcherDialogCore({
    onOk(searched_tv) {
      if (!cur.value) {
        app.tip({ text: ["请先选择未识别的电视剧"] });
        return;
      }
      const { id } = cur.value;
      bindTVRequest.run(id, searched_tv);
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
    <div class="">
      <div class="my-4 flex items-center space-x-2">
        <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
          刷新
        </Button>
        <Button icon={<Trash class="w-4 h-4" />} variant="subtle" store={deleteBtn}>
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
          <For each={response().dataSource}>
            {(file) => {
              const { id, name } = file;
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
                    {/* <div class="mt-2 text-sm text-slate-800 break-all">
                      [{drive.name}]{parent_paths}/{file_name}
                    </div> */}
                    <div class="flex items-center mt-4 space-x-2">
                      <Button
                        class="box-content"
                        variant="subtle"
                        store={bindTVBtn.bind(file)}
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
      <TMDBSearcherDialog store={bindTVDialog} />
      <Dialog store={tvDeletingConfirmDialog}>
        <div>该操作并不会删除云盘内文件</div>
        <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
      </Dialog>
    </div>
  );
};
