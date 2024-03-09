/**
 * @file TMDB 搜索器
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Search } from "lucide-solid";

import { Button, Input, LazyImage, Label, ListView, ScrollView, Dialog } from "@/components/ui";
import * as Form from "@/components/ui/form";
import { Presence } from "@/components/ui/presence";
import { TabHeader } from "@/components/ui/tab-header";
import { MediaSearchView } from "@/components/MediaSelect";
import { TabHeaderCore } from "@/domains/ui/tab-header";
import { TMDBSearcherCore } from "@/domains/tmdb";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { cn } from "@/utils";
import { DialogCore, ImageInListCore, PresenceCore } from "@/domains/ui";
import { MediaSearchCore } from "@/domains/media_search";
import { MediaTypes } from "@/constants";
import { prepareEpisodeList, prepareSeasonList } from "@/services/media_profile";

export const TMDBSearcherView = (props: { store: TMDBSearcherCore } & JSX.HTMLAttributes<HTMLElement>) => {
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
      const map: Record<string, MediaTypes> = {
        season: MediaTypes.Season,
        movie: MediaTypes.Movie,
      };
      store.search({
        type: map[value.id],
      });
    },
  });
  const searchPanel = new PresenceCore({
    open: true,
  });
  const seasonPanel = new PresenceCore();
  const episodePanel = new PresenceCore();
  // const episodePanel = new PresenceCore();
  const mediaSearch = new MediaSearchCore({
    type: MediaTypes.Season,
    async onSelect(value) {
      if (store.needEpisode) {
        if (!value) {
          return;
        }
        store.select(value);
        const r = await prepareEpisodeList({
          media_id: value.id,
        });
        if (r.error) {
          store.tip({
            text: ["获取剧集失败", r.error.message],
          });
          return;
        }
        seasonPanel.hide();
        episodePanel.show();
        setEpisodes(r.data.list);
        return;
      }
      if (value) {
        store.select(value);
        return;
      }
      store.unSelect();
    },
  });
  const poster = new ImageInListCore({});
  const scrollView = new ScrollViewCore({
    // onScroll(pos) {
    //   console.log('scroll', pos);
    // },
    onReachBottom() {
      store.$list.loadMore();
    },
  });

  const [state, setState] = createSignal(store.state);
  const [episodes, setEpisodes] = createSignal<
    {
      id: string | number;
      type: MediaTypes;
      name: string;
      original_name: string;
      poster_path: string;
      overview: string;
      air_date: string;
      order: number;
    }[]
  >([]);

  store.onStateChange((nextState) => {
    setState(nextState);
  });
  const dataSource = () => state().response.dataSource;
  const cur = () => state().cur;
  const curEpisode = () => state().curEpisode;

  return (
    <div>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={searchPanel}
      >
        <div class="grid gap-4 py-4">
          <Form.Root store={store.$form}>
            <div class="grid grid-cols-12 items-center gap-4">
              <Label class="col-span-2 text-right">名称</Label>
              <div class="col-span-10">
                <Input store={store.$input} />
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
        </Show>
        <ScrollView store={scrollView} class="relative h-[360px] overflow-y-auto py-2 space-y-4">
          <ListView
            store={store.$list}
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
                        searchPanel.hide();
                        seasonPanel.show();
                        const r = await prepareSeasonList({ series_id: String(id) });
                        if (r.error) {
                          return;
                        }
                        // @ts-ignore
                        mediaSearch.$list.modifyResponse((v) => {
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
                        store={poster.bind(poster_path)}
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
        store={seasonPanel}
      >
        <MediaSearchView store={mediaSearch} />
      </Presence>
      <Presence
        classList={{
          "opacity-100": true,
          "animate-in slide-in-from-right": true,
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right": true,
        }}
        store={episodePanel}
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
    </div>
  );
};
