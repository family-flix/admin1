/**
 * @file 演职人员列表
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { RotateCw } from "lucide-solid";

import { Button, Skeleton, ScrollView, ListView, Checkbox, LazyImage } from "@/components/ui";
import { ButtonCore, CheckboxCore, ImageInListCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request/index";
import { ListCore } from "@/domains/list/index";
import { fetchPersonList } from "@/biz/job/index";
import { ViewComponent } from "@/store/types";
import { cn } from "@/utils/index";

export const PersonListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const personList = new ListCore(new RequestCore(fetchPersonList), {});
  const refreshBtn = new ButtonCore({
    onClick() {
      personList.refresh();
    },
  });
  const runningCheckbox = new CheckboxCore({
    onChange(checked) {
      personList.search({});
    },
  });
  const scrollView = new ScrollViewCore();
  const personAvatar = new ImageInListCore({});

  personList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });

  const [response, setResponse] = createSignal(personList.response);
  personList.onStateChange((nextState) => {
    setResponse(nextState);
  });

  scrollView.onReachBottom(async () => {
    await personList.loadMore();
    scrollView.finishLoadingMore();
  });
  // view.onShow(() => {
  personList.init();
  // });

  const dataSource = () => response().dataSource;

  return (
    <ScrollView store={scrollView} class="h-screen p-8">
      <h1 class="text-2xl">演职人员</h1>
      <div class="mt-8 flex space-x-2">
        <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
          刷新
        </Button>
      </div>
      <div class="flex items-center space-x-2 mt-4">
        <Checkbox store={runningCheckbox} />
      </div>
      <ListView
        class="mt-4"
        store={personList}
        skeleton={
          <div class="p-4 rounded-sm bg-white">
            <div class={cn("space-y-1")}>
              <Skeleton class="w-[240px] h-8"></Skeleton>
              <div class="flex space-x-4">
                <Skeleton class="w-[320px] h-4"></Skeleton>
              </div>
              <div class="flex space-x-2">
                <Skeleton class="w-24 h-8"></Skeleton>
                <Skeleton class="w-24 h-8"></Skeleton>
              </div>
            </div>
          </div>
        }
      >
        <div class="space-y-4">
          <For each={dataSource()}>
            {(task, i) => {
              const { id, name, avatar, unique_id } = task;
              return (
                <div
                  class={cn("space-y-1 p-4 rounded-sm bg-white")}
                  onClick={() => {
                    window.open(`https://www.themoviedb.org/person/${unique_id}`);
                  }}
                >
                  <div>
                    <LazyImage class="w-[120px]" store={personAvatar.bind(avatar)} />
                  </div>
                  <h2 class="text-xl">{name}</h2>
                  <div class="flex space-x-4"></div>
                  <div class="mt-2 space-x-2"></div>
                </div>
              );
            }}
          </For>
        </div>
      </ListView>
    </ScrollView>
  );
};
