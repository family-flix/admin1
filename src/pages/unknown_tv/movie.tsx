/**
 * @file 未识别的电影
 */
import { For, Show, createSignal } from "solid-js";
import { Brush, RotateCcw, Train, Trash } from "lucide-solid";

import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import {
  UnknownMovieItem,
  bind_movie_profile_for_movie,
  delete_unknown_movie,
  fetch_unknown_movie_list,
} from "@/services";
import { FolderCard } from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { SelectionCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { DialogCore } from "@/domains/ui/dialog";
import { Dialog } from "@/components/ui/dialog";

export const UnknownMoviePage: ViewComponent = (props) => {
  const { app } = props;

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
  const bindProfileForMovie = new RequestCore(bind_movie_profile_for_movie, {
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

  const [response, setResponse] = createSignal(list.response);

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });

  list.init();

  const dataSource = () => response().dataSource;
  const empty = () => response().empty;
  const noMore = () => response().noMore;

  return (
    <div class="px-4">
      <div class="my-4">
        <Button icon={<RotateCcw class="w-4 h-4" />} variant="subtle" store={refreshBtn}>
          刷新电影
        </Button>
      </div>
      <Show when={empty()}>
        <div class="w-full h-[240px] center flex items-center justify-center">
          <div class="text-slate-500 text-xl">列表为空</div>
        </div>
      </Show>
      <div class="grid grid-cols-6 gap-2 2xl:grid-cols-8">
        <For each={dataSource()}>
          {(file) => {
            const { id, name } = file;
            return (
              <div class="w-[152px] rounded">
                <FolderCard type="folder" name={name} />
                <div class="flex justify-center space-x-2 mt-2">
                  <Button
                    class="block box-content"
                    variant="subtle"
                    size="sm"
                    store={selectMatchedProfileBtn.bind(file)}
                    icon={<Brush class="w-4 h-4" />}
                  >
                    修改
                  </Button>
                  <Button
                    class="block box-content"
                    variant="subtle"
                    size="sm"
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
      <Show when={!noMore()}>
        <div
          class="mt-4 text-center text-slate-500 cursor-pointer"
          onClick={() => {
            list.loadMore();
          }}
        >
          加载更多
        </div>
      </Show>
      <TMDBSearcherDialog store={dialog} />
      <Dialog store={deleteConfirmDialog}>
        <div>仅删除该记录，不删除云盘文件。</div>
      </Dialog>
    </div>
  );
};
