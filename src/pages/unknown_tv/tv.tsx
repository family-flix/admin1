/**
 * @file 未识别的电视剧
 */
import { For, Show, createSignal } from "solid-js";
import { Brush, RotateCcw } from "lucide-solid";

import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import { UnknownTVItem, bind_searched_tv_for_tv, fetch_unknown_tv_list } from "@/services";
import { FolderCard } from "@/components/FolderCard";
import { Button } from "@/components/ui/button";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { SelectionCore } from "@/domains/cur";
import { ViewComponent } from "@/types";
import { TMDBSearcherDialog } from "@/components/TMDBSearcher";
import { TMDBSearcherDialogCore } from "@/components/TMDBSearcher/store";

export const UnknownTVPage: ViewComponent = (props) => {
  const { app } = props;

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
  const cur = new SelectionCore<UnknownTVItem>();
  const selectMatchedProfileBtn = new ButtonInListCore<UnknownTVItem>({
    onClick(record) {
      cur.select(record);
      //       dialog.show();
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

  list.init();

  const dataSource = () => response().dataSource;
  const empty = () => response().empty;
  const noMore = () => response().noMore;

  return (
    <div>
      <div class="my-4">
        <Button icon={<RotateCcw class="w-4 h-4" />} store={refreshBtn}>
          刷新电视剧
        </Button>
      </div>
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
              <div class="w-[152px] rounded">
                <FolderCard type="folder" name={name} />
                <div class="flex justify-center mt-2">
                  <Button
                    class="block box-content"
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
    </div>
  );
};
