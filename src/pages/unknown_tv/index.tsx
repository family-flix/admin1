/**
 * @file 索引后没有找到匹配信息的电视剧（后面称为「未知电视剧」）
 */
import { createSignal, For, Show } from "solid-js";
import { Brush, List, RotateCw } from "lucide-solid";

import { TMDBSearcherDialog } from "@/components/TMDBSearcher/dialog";
import { bind_searched_tv_for_tv, fetch_unknown_tv_list, UnknownTVItem } from "@/services";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";
import { ContextMenuCore } from "@/domains/ui/context-menu";
import { MenuItemCore } from "@/domains/ui/menu/item";
import { ContextMenu } from "@/components/ui/context-menu";
import { FolderCard } from "@/components/FolderCard";
import { RequestCore } from "@/domains/client";
import { SelectionCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/types";
import { Dialog } from "@/components/ui/dialog";
import { DialogCore } from "@/domains/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputCore } from "@/domains/ui/input";
import { Button } from "@/components/ui/button";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";

export const UnknownTVManagePage: ViewComponent = (props) => {
  const { app, router } = props;

  const cur = new SelectionCore<UnknownTVItem>();
  const list = new ListCore(new RequestCore(fetch_unknown_tv_list), {
    onLoadingChange(loading) {
      refreshBtn.setLoading(loading);
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
  const selectMatchedProfileBtn = new ButtonInListCore<UnknownTVItem>({
    onClick(record) {
      cur.select(record);
      dialog.show();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      list.refresh();
    },
  });
  const bindProfileForTV = new RequestCore(bind_searched_tv_for_tv, {
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
  const contextMenu = new ContextMenuCore({
    items: [
      new MenuItemCore({
        label: "选择匹配的电视剧",
        onClick() {
          dialog.show();
          contextMenu.hide();
        },
      }),
    ],
  });
  dialog.onTip((msg) => {
    app.tip(msg);
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
    <>
      <div class="">
        <h1 class="text-2xl">未识别的影视剧</h1>
        <div class="mt-8">
          <div class="space-x-2">
            <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
              刷新
            </Button>
          </div>
          <div>
            <Show when={empty()}>
              <div class="w-full h-[240px] center flex items-center justify-center">
                <div class="text-slate-500 text-xl">列表为空</div>
              </div>
            </Show>
            <div class="grid grid-cols-6 gap-2">
              <For each={dataSource()}>
                {(file) => {
                  const { id, name } = file;
                  return (
                    <div
                      class="w-[152px] rounded"
                      // onClick={async () => {
                      //   router.push(`/admin/unknown_tv/${id}`);
                      // }}
                      // onContextMenu={(event: MouseEvent) => {
                      //   event.preventDefault();
                      //   cur.select(file);
                      // }}
                    >
                      <FolderCard type="folder" name={name} />
                      <div class="flex justify-center mt-2">
                        <Button
                          class="block box-content"
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
          </div>
        </div>
      </div>
      <TMDBSearcherDialog store={dialog} />
    </>
  );
};
