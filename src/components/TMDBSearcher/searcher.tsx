/**
 * @file TMDB 搜索器
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { ChevronLeft, Search } from "lucide-solid";

import { Button, Input, LazyImage, Label, ListView, ScrollView, Dialog } from "@/components/ui";
import { Presence } from "@/components/ui/presence";
import { TabHeader } from "@/components/ui/tab-header";
import { MediaProfileValuesForm } from "@/components/ui/form";
import { MediaSearchView } from "@/components/MediaSelect";
import { TMDBSearcherCore } from "@/biz/tmdb";
import { prepareSeasonList } from "@/biz/services/media_profile";
import { RequestCore } from "@/domains/request";
import { MediaTypes } from "@/constants/index";
import { cn, sleep } from "@/utils/index";

export const TMDBSearcherView = (props: { store: TMDBSearcherCore } & JSX.HTMLAttributes<HTMLElement>) => {
  const { store } = props;

  const [state, setState] = createSignal(store.state);
  const [episodes, setEpisodes] = createSignal(store.episodes);

  store.onStateChange((v) => {
    setState(v);
  });
  store.onEpisodesChange((v) => {
    setEpisodes(v);
  });
  const dataSource = () => state().response.dataSource;
  const cur = () => state().cur;
  const curEpisode = () => state().curEpisode;

  return (
    <div class="min-h-[480px]">
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={store.ui.searchPanel}
      >
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-12 items-center gap-4">
            <Label class="col-span-2 text-right">名称</Label>
            <div class="col-span-10">
              <Input store={store.ui.$input} />
            </div>
          </div>
          <div class="grid grid-cols-12">
            <div class="col-span-2" />
            <div class="space-x-2 col-span-10">
              <Button class="" store={store.ui.searchBtn}>
                搜索
              </Button>
              <Button class="" variant="subtle" store={store.ui.resetBtn}>
                重置
              </Button>
            </div>
          </div>
        </div>
        <Show when={!store.type}>
          <TabHeader store={store.ui.tab} />
        </Show>
        <ScrollView store={store.ui.scrollView} class="relative h-[360px] overflow-y-auto py-2 space-y-4">
          <ListView
            store={store.ui.$list}
            skeleton={
              <div class="relative h-[360px] p-2 space-y-4">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="flex flex-col items-center justify-center text-slate-500">
                    <Search class="w-24 h-24" />
                    <div class="text-xl">搜索 TMDB 数据库</div>
                  </div>
                </div>
              </div>
            }
          >
            <For each={dataSource()}>
              {(media) => {
                const { id, type, name, original_name, overview, poster_path, air_date } = media;
                return (
                  <div
                    class={cn("p-2", media.id === cur()?.id ? "bg-slate-300" : "bg-white")}
                    onClick={async () => {
                      if (type === MediaTypes.Season) {
                        store.ui.searchPanel.hide();
                        store.ui.seasonPanel.show();
                        const r = await new RequestCore(prepareSeasonList).run({ series_id: String(id) });
                        if (r.error) {
                          return;
                        }
                        store.ui.mediaSearch.$list
                          // @ts-ignore
                          .modifyResponse((v) => {
                            return {
                              ...v,
                              initial: false,
                              dataSource: [...r.data.list],
                              noMore: !r.data.next_marker,
                            };
                          });
                        return;
                      }
                      store.toggle(media);
                    }}
                  >
                    <div class="flex">
                      <LazyImage
                        class="w-[120px] rounded-sm object-fit mr-4"
                        store={store.ui.poster.bind(poster_path)}
                        alt={name}
                      />
                      <div class="flex-1 overflow-hidden text-ellipsis">
                        <div class="text-2xl">{name}</div>
                        <div class="text-slate-500">{original_name}</div>
                        <div class="break-all whitespace-pre-wrap truncate line-clamp-4">{overview}</div>
                        <div>{air_date}</div>
                      </div>
                    </div>
                    {/* <Show when={episodes}>
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
                    </Show> */}
                  </div>
                );
              }}
            </For>
          </ListView>
        </ScrollView>
      </Presence>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={store.ui.seasonPanel}
      >
        <MediaSearchView store={store.ui.mediaSearch} />
      </Presence>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={store.ui.episodePanel}
      >
        <div class="h-[480px] overflow-y-auto space-y-2">
          <For each={episodes()}>
            {(episode) => {
              const { id, name, overview, air_date, order } = episode;
              return (
                <div
                  classList={{
                    "p-2": true,
                    "bg-slate-300": id === curEpisode()?.id,
                  }}
                  onClick={() => {
                    store.selectEpisode(episode);
                  }}
                >
                  <div>
                    {order}、{name}
                  </div>
                  <div>{overview}</div>
                  <div>{air_date}</div>
                </div>
              );
            }}
          </For>
        </div>
      </Presence>
      <Presence
        store={store.ui.$custom}
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
      >
        <div
          onClick={async () => {
            store.ui.$custom.hide();
            await sleep(200);
            store.ui.searchPanel.show();
          }}
        >
          <ChevronLeft class="w-8 h-8 cursor-pointer" />
        </div>
        <div class="h-[480px] overflow-y-auto">
          <MediaProfileValuesForm store={store.ui.$values} />
        </div>
      </Presence>
    </div>
  );
};
