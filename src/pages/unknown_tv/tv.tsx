/**
 * @file 未识别的电视剧
 */
import { For, Show, createSignal } from "solid-js";
import { Brush, RotateCcw, Search, Trash } from "lucide-solid";

import {
  UnknownTVItem,
  bind_profile_for_unknown_tv,
  deleteUnknownTV,
  deleteUnknownTVList,
  fetchUnknownTVList,
  modifyUnknownTVName,
} from "@/services";
import { Button, ListView, Dialog, LazyImage, ScrollView, Input } from "@/components/ui";
import { TMDBSearcherDialog, TMDBSearcherDialogCore } from "@/components/TMDBSearcher";
import { ButtonCore, ButtonInListCore, DialogCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { RefCore } from "@/domains/cur";
import { ViewComponent } from "@/types";

export const UnknownTVPage: ViewComponent = (props) => {
  const { app, view } = props;

  const list = new ListCore(new RequestCore(fetchUnknownTVList), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
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
  const tvListDeletingRequest = new RequestCore(deleteUnknownTVList, {
    onLoading(loading) {
      tvListDeletingConfirmDialog.okBtn.setLoading(loading);
      tvListDeletingBtn.setLoading(loading);
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
      tvListDeletingConfirmDialog.hide();
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
      const theParsedTV = parsedTVRef.value;
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
  const unknownTVNameModifyRequest = new RequestCore(modifyUnknownTVName, {
    onLoading(loading) {
      unknownTVNameModifyDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      unknownTVNameModifyDialog.hide();
      list.deleteItem((item) => {
        if (item.id === parsedTVRef.value?.id) {
          return true;
        }
        return false;
      });
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
  });
  const bindTVRequest = new RequestCore(bind_profile_for_unknown_tv, {
    onLoading(loading) {
      tvProfileSetDialog.okBtn.setLoading(loading);
    },
    onFailed(error) {
      app.tip({ text: ["修改失败", error.message] });
    },
    onSuccess() {
      app.tip({ text: ["修改成功"] });
      tvProfileSetDialog.hide();
      list.deleteItem((item) => {
        if (item.id === parsedTVRef.value?.id) {
          return true;
        }
        return false;
      });
    },
  });
  const tvListDeletingConfirmDialog = new DialogCore({
    title: "确认删除所有未识别电视剧吗？",
    onOk() {
      tvListDeletingRequest.run();
    },
  });
  const tvListDeletingBtn = new ButtonCore({
    onClick() {
      tvListDeletingConfirmDialog.show();
    },
  });
  const tvDeletingConfirmDialog = new DialogCore({
    title: "删除未识别电视剧",
    onOk() {
      if (!parsedTVRef.value) {
        app.tip({
          text: ["请选择要删除的记录"],
        });
        return;
      }
      tvDeletingRequest.run({
        parsed_tv_id: parsedTVRef.value.id,
      });
    },
  });
  const tvDeletingBtn = new ButtonInListCore<UnknownTVItem>({
    onClick(record) {
      parsedTVRef.select(record);
      tvDeletingConfirmDialog.show();
    },
  });
  const parsedTVRef = new RefCore<UnknownTVItem>();
  const unknownTVProfileSetBtn = new ButtonInListCore<UnknownTVItem>({
    onClick(record) {
      parsedTVRef.select(record);
      tvProfileSetDialog.show();
    },
  });
  const unknownTVNameModifyBtn = new ButtonInListCore<UnknownTVItem>({
    onClick(record) {
      parsedTVRef.select(record);
      unknownTVNameModifyDialog.show();
    },
  });
  const unknownTVNameModifyInput = new InputCore({
    defaultValue: "",
    onEnter() {
      unknownTVNameModifyDialog.okBtn.click();
    },
  });
  const unknownTVNameModifyDialog = new DialogCore({
    onOk() {
      if (!unknownTVNameModifyInput.value) {
        app.tip({
          text: ["请输入新的文件名称"],
        });
        return;
      }
    },
  });
  const tvProfileSetDialog = new TMDBSearcherDialogCore({
    onOk(searched_tv) {
      if (!parsedTVRef.value) {
        app.tip({ text: ["请先选择未识别的电视剧"] });
        return;
      }
      const { id } = parsedTVRef.value;
      bindTVRequest.run(id, {
        source: 1,
        unique_id: searched_tv.id,
      });
    },
  });
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
    },
  });

  const [response, setResponse] = createSignal(list.response);
  const [cur, setCur] = createSignal(parsedTVRef.value);

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });
  parsedTVRef.onStateChange((nextState) => {
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
              {(unknown_tv) => {
                const { id, name, file_name, drive, parsed_seasons, parsed_episodes } = unknown_tv;
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
                      <div class="text-lg">{name}</div>
                      <Show when={file_name}>
                        <div class="mt-2 text-sm text-slate-800 break-all">
                          [{drive.name}]{file_name}
                        </div>
                      </Show>
                      <Show when={parsed_episodes}>
                        <div class="mt-4 p-2 text-sm">
                          <For each={parsed_episodes}>
                            {(parsed_episode) => {
                              const { episode_text, file_name } = parsed_episode;
                              return (
                                <div>
                                  <div>{episode_text}</div>
                                  <div>{file_name}</div>
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
                          store={unknownTVProfileSetBtn.bind(unknown_tv)}
                          icon={<Brush class="w-4 h-4" />}
                        >
                          设置
                        </Button>
                        <Show when={file_name}>
                          <Button
                            class="box-content"
                            variant="subtle"
                            store={unknownTVNameModifyBtn.bind(unknown_tv)}
                            icon={<Brush class="w-4 h-4" />}
                          >
                            修改文件名称
                          </Button>
                        </Show>
                        <Button
                          class="box-content"
                          variant="subtle"
                          store={tvDeletingBtn.bind(unknown_tv)}
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
      <TMDBSearcherDialog store={tvProfileSetDialog} />
      <Dialog store={unknownTVNameModifyDialog}>
        <div class="w-[520px]">
          <Input store={unknownTVNameModifyInput} />
        </div>
      </Dialog>
      <Dialog store={tvListDeletingConfirmDialog}>
        <div class="w-[520px]">
          <div>该操作并不会删除云盘内文件</div>
          <div>更新云盘内文件名或解析规则后可删除所有文件重新索引</div>
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
