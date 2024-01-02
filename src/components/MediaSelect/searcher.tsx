/**
 * @file TMDB 搜索器
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Search } from "lucide-solid";

import { Button, Input, LazyImage, Label, ListView, ScrollView } from "@/components/ui";
import * as Form from "@/components/ui/form";
import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { MediaSearchCore } from "@/domains/media_search";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";

export const MediaSearchView = (props: { store: MediaSearchCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const tab = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: "season",
        text: "电视剧",
      },
      {
        id: "movie",
        text: "电影",
      },
    ],
    onChange(value) {
      store.search({
        type: value.value as string,
      });
    },
  });
  const scrollView = new ScrollViewCore({
    // onScroll(pos) {
    //   console.log('scroll', pos);
    // },
    onReachBottom() {
      store.$list.loadMore();
    },
  });
  const [state, setState] = createSignal(store.state);

  store.onStateChange((nextState) => {
    console.log("----2", nextState.response.dataSource);
    setState(nextState);
  });

  const dataSource = () => state().response.dataSource;
  const cur = () => state().cur;

  console.log("----3", state().response.dataSource);

  return (
    <div>
      {/* <div class="grid gap-4 py-4">
        <Form.Root store={store.form}>
          <div class="grid grid-cols-12 items-center gap-4">
            <Label class="col-span-2 text-right">名称</Label>
            <div class="col-span-10">
              <Input store={store.input} />
            </div>
          </div>
        </Form.Root>
        <div class="grid grid-cols-12">
          <div class="col-span-2" />
          <div class="space-x-2 col-span-10">
            <Button class="" store={store.searchBtn}>
              搜索
            </Button>
            <Button class="" variant="subtle" store={store.resetBtn}>
              重置
            </Button>
          </div>
        </div>
      </div>
      <Show when={!store.type}>
        <TabHeader store={tab} />
      </Show> */}
      <ListView store={store.$list}>
        <div class="relative">
          <ScrollView store={scrollView} class="relative max-h-[480px] overflow-y-auto space-y-4">
            <For each={dataSource()}>
              {(tv) => {
                const { name, original_name, overview, poster_path, air_date, episodes } = tv;
                return (
                  <div
                    class={cn("p-2", tv.id === cur()?.id ? "bg-slate-300" : "bg-white")}
                    onClick={() => {
                      store.toggle(tv);
                    }}
                  >
                    <div class="flex">
                      <LazyImage class="w-[120px] rounded-sm object-fit mr-4" src={poster_path} alt={name} />
                      <div class="flex-1 overflow-hidden text-ellipsis">
                        <div class="text-2xl">{name}</div>
                        <div class="text-slate-500">{original_name}</div>
                        <div class="break-all whitespace-pre-wrap truncate line-clamp-4">{overview}</div>
                        <div>{air_date}</div>
                      </div>
                    </div>
                    <Show when={episodes}>
                      <For each={episodes}>
                        {(episode) => {
                          const { name, air_date } = episode;
                          return (
                            <div>
                              <div>{name}</div>
                              <div>{air_date}</div>
                            </div>
                          );
                        }}
                      </For>
                    </Show>
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
