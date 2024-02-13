/**
 * @file 字幕列表
 */
import { For, JSX, createSignal } from "solid-js";
import { Eye, Film, Mails, RotateCw, Tv } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { refreshJobs } from "@/store/job";
import { SubtitleItem, deleteSubtitle, fetchSubtitleList } from "@/services";
import { Button, Skeleton, ScrollView, ListView, LazyImage, Dialog } from "@/components/ui";
import { ButtonCore, DialogCore, ImageInListCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { ReportTypes } from "@/constants";
import { cn } from "@/utils";

export const HomeSubtitleListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const curSeasonRef = new RefCore<SubtitleItem>();
  const curEpisodeRef = new RefCore<SubtitleItem["sources"][number]>();
  const curSubtitleRef = new RefCore<SubtitleItem["sources"][number]["subtitles"][number]>();
  const seasonList = new ListCore(new RequestCore(fetchSubtitleList), {});
  const subtitleDeletingRequest = new RequestCore(deleteSubtitle, {
    onLoading(loading) {
      subtitleDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      subtitleDeletingConfirmDialog.hide();
      const curSeasonId = curSeasonRef.value?.id;
      const curEpisodeId = curEpisodeRef.value?.id;
      const curSubtitleId = curSubtitleRef.value?.id;
      seasonList.modifyDataSource((item) => {
        if (item.id !== curSeasonId) {
          return item;
        }
        const { sources } = item;
        return {
          ...item,
          episodes: sources.map((episode) => {
            if (episode.id !== curEpisodeId) {
              return episode;
            }
            return {
              ...episode,
              subtitles: episode.subtitles.filter((subtitle) => {
                if (subtitle.id !== curSubtitleId) {
                  return true;
                }
                return false;
              }),
            };
          }),
        };
      });
      curSeasonRef.clear();
      curEpisodeRef.clear();
      curSubtitleRef.clear();
    },
    onFailed(error) {
      app.tip({
        text: ["删除失败", error.message],
      });
    },
  });
  const subtitleDeletingConfirmDialog = new DialogCore({
    title: "删除字幕",
    onOk() {
      if (!curSubtitleRef.value) {
        return;
      }
      subtitleDeletingRequest.run({
        subtitle_id: curSubtitleRef.value.id,
      });
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      refreshJobs();
      seasonList.refresh();
    },
  });
  const gotoUploadBtn = new ButtonCore({
    onClick() {
      // app.showView(homeSubtitleAddingPage);
      history.push("root.home_layout.subtitles_create");
    },
  });
  //   const subtitleDeletingBtn = new ButtonCore({
  //     onClick() {
  //     },
  //   });
  const scrollView = new ScrollViewCore();
  const poster = new ImageInListCore({});

  const [response, setResponse] = createSignal(seasonList.response);

  seasonList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });
  seasonList.onStateChange((nextState) => {
    setResponse(nextState);
  });
  scrollView.onReachBottom(() => {
    seasonList.loadMore();
  });
  seasonList.init();

  const typeIcons: Record<ReportTypes, () => JSX.Element> = {
    [ReportTypes.TV]: () => <Tv class="w-4 h-4" />,
    [ReportTypes.Movie]: () => <Film class="w-4 h-4" />,
    [ReportTypes.Question]: () => <Mails class="w-4 h-4" />,
    [ReportTypes.Want]: () => <Eye class="w-4 h-4" />,
  };

  const dataSource = () => response().dataSource;

  return (
    <>
      <ScrollView store={scrollView} class="h-screen p-8">
        <h1 class="text-2xl">字幕列表</h1>
        <div class="mt-8 flex space-x-2">
          <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
            刷新
          </Button>
          <Button class="space-x-1" store={gotoUploadBtn}>
            新增
          </Button>
        </div>
        <ListView
          class="mt-4"
          store={seasonList}
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
              {(season, i) => {
                const { id, name, poster_path, sources } = season;
                return (
                  <div class={cn("space-y-1 flex p-4 rounded-sm bg-white")}>
                    <div class="flex flex-1">
                      <LazyImage class="w-[120px] object-cover" store={poster.bind(poster_path)} />
                      <div class="flex-1 ml-4 w-full">
                        <div class="text-xl">{name}</div>
                        <div class="grid grid-cols-3 gap-2 mt-4 w-full">
                          <For each={sources}>
                            {(episode) => {
                              const { id, name, order, subtitles } = episode;
                              return (
                                <div>
                                  <div>
                                    {order}、{name}
                                  </div>
                                  <div>
                                    <For each={subtitles}>
                                      {(subtitle) => {
                                        const { id, unique_id, language } = subtitle;
                                        return (
                                          <div class="flex items-center space-x-2">
                                            <div>{unique_id}</div>
                                            <div>{language}</div>
                                            <div
                                              onClick={() => {
                                                curSeasonRef.select(season);
                                                curEpisodeRef.select(episode);
                                                curSubtitleRef.select(subtitle);
                                                subtitleDeletingConfirmDialog.show();
                                              }}
                                            >
                                              删除
                                            </div>
                                          </div>
                                        );
                                      }}
                                    </For>
                                  </div>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </ScrollView>
      <Dialog store={subtitleDeletingConfirmDialog}>
        <div class="w-[520px]">
          <div>该操作会同步删除字幕文件</div>
          <div>请确认后删除</div>
        </div>
      </Dialog>
    </>
  );
};
