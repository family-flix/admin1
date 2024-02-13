/**
 * @file 云盘文件搜索器
 */
import { For, JSX, createSignal } from "solid-js";

import { Button, Input, Label, ListView, ScrollView } from "@/components/ui";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";

import { FileSearcherCore } from "./store";

export const FileSearcher = (props: { store: FileSearcherCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;
  const scrollView = new ScrollViewCore({
    onReachBottom() {
      store.$list.loadMore();
    },
  });
  const [state, setState] = createSignal(store.state);
  store.onStateChange((nextState) => {
    setState(nextState);
  });

  const dataSource = () => state().list.dataSource;

  return (
    <div>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-12 items-center gap-4">
          <Label class="col-span-2 text-right">名称</Label>
          <div class="col-span-10">
            <Input store={store.form.input} />
          </div>
        </div>
        <div class="grid grid-cols-12">
          <div class="col-span-2" />
          <div class="space-x-2 col-span-10">
            <Button class="" store={store.form.btn}>
              搜索
            </Button>
            <Button class="" variant="subtle" store={store.form.reset}>
              重置
            </Button>
          </div>
        </div>
      </div>
      <ListView store={store.$list}>
        <div class="relative">
          <ScrollView store={scrollView} class="relative max-h-[360px] overflow-y-auto p-2 space-y-2">
            <For each={dataSource()}>
              {(file) => {
                const { name, parent_paths, drive } = file;
                return (
                  <div class={cn("py-2", "bg-white")}>
                    <div class="text-slate-500 text-sm">{drive.name}</div>
                    <div class="flex-1 overflow-hidden text-ellipsis">
                      <div class="break-all">
                        {parent_paths}/{name}
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </ScrollView>
        </div>
      </ListView>
    </div>
  );
};
