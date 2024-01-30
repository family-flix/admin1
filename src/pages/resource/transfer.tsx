/**
 * @file 查询过的分享文件列表
 */
import { For, createSignal } from "solid-js";
import { Search } from "lucide-solid";

import { SharedFileTransferItem, fetch_shared_files_transfer_list } from "@/services";
import { Button, Input, ScrollView } from "@/components/ui";
import { ButtonCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { ViewComponent } from "@/store/types";

export const SharedFilesTransferListPage: ViewComponent = (props) => {
  const { app } = props;

  const list = new ListCore(new RequestCore(fetch_shared_files_transfer_list));
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      list.loadMore();
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
      const url = nameSearchInput.value;
      const matched_share_id = url.match(/\/s\/([a-zA-Z0-9]{1,})$/);
      if (!matched_share_id) {
        app.tip({ text: ["不是合法阿里云盘链接"] });
        return;
      }
      list.search({ name: url });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      list.reset();
    },
  });

  const [response, setResponse] = createSignal(ListCore.defaultResponse<SharedFileTransferItem>());

  list.onStateChange((nextState) => {
    setResponse(nextState);
  });
  list.init();

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <h1 class="text-2xl">转存记录</h1>
        <div class="mt-8">
          <div class="flex items-center space-x-2 mt-4">
            <Input class="" store={nameSearchInput} />
            <Button class="" icon={<Search class="w-4 h-4" />} store={searchBtn}>
              搜索
            </Button>
            <Button class="" store={resetBtn}>
              重置
            </Button>
          </div>
          <div class="mt-8 space-y-4">
            <For each={response().dataSource}>
              {(sharedFile) => {
                const { id, url, name, created } = sharedFile;
                return (
                  <div class="p-4">
                    <div class="text-lg">{name}</div>
                    <div class="text-slate-800">
                      <a href={url} target="_blank">
                        {url}
                      </a>
                    </div>
                    <div class="text-sm text-slate-500">{created}</div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </ScrollView>
    </>
  );
};
