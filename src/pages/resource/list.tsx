/**
 * @file 查询过的分享文件列表
 */
import { For, createSignal } from "solid-js";
import { Search } from "lucide-solid";

import { SharedFileHistoryItem, fetch_shared_files_histories } from "@/services";
import { Button, Input, ScrollView } from "@/components/ui";
import { ButtonCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { Result } from "@/types";
import { ViewComponent } from "@/store/types";

export const SharedFilesHistoryPage: ViewComponent = (props) => {
  const { app } = props;

  const list = new ListCore(new RequestCore(fetch_shared_files_histories));
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
      list.search({ name: nameSearchInput.value });
    },
  });
  const resetBtn = new ButtonCore({
    onClick() {
      list.reset();
    },
  });

  const [response, setResponse] = createSignal(ListCore.defaultResponse<SharedFileHistoryItem>());

  list.onLoadingChange((loading) => {
    searchBtn.setLoading(loading);
  });
  list.onStateChange((nextState) => {
    setResponse(nextState);
  });
  list.init();

  return (
    <>
      <ScrollView class="h-screen p-8" store={scrollView}>
        <h1 class="text-2xl">资源查询记录</h1>
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
                const { id, url, title } = sharedFile;
                return (
                  <div class="p-4">
                    <p>{title}</p>
                    <a href={url} target="_blank">
                      {url}
                    </a>
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
