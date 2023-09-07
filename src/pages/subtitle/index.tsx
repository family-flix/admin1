/**
 * @file 字幕列表
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Eye, Film, Mails, RotateCw, Tv } from "lucide-solid";

import { SubtitleItem, deleteSubtitle, fetchSubtitleList, replyReport } from "@/services";
import { Button, Skeleton, ScrollView, ListView, LazyImage, Dialog } from "@/components/ui";
import { ButtonCore, DialogCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { RefCore } from "@/domains/cur";
import { ListCore } from "@/domains/list";
import { ReportTypes } from "@/constants";
import { ViewComponent } from "@/types";
import { refreshJobs } from "@/store";
import { cn } from "@/utils";

export const HomeSubtitleListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const curSubtitleRef = new RefCore<SubtitleItem["episodes"][number]["subtitles"][number]>();
  const subtitleList = new ListCore(new RequestCore(fetchSubtitleList), {});
  const subtitleDeletingRequest = new RequestCore(deleteSubtitle, {
    onLoading(loading) {
      subtitleDeletingConfirmDialog.okBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["删除成功"],
      });
      subtitleDeletingConfirmDialog.hide();
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
      subtitleList.refresh();
    },
  });
  //   const subtitleDeletingBtn = new ButtonCore({
  //     onClick() {
  //     },
  //   });
  const scrollView = new ScrollViewCore();

  const [response, setResponse] = createSignal(subtitleList.response);

  subtitleList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });
  subtitleList.onStateChange((nextState) => {
    setResponse(nextState);
  });
  scrollView.onReachBottom(() => {
    subtitleList.loadMore();
  });
  subtitleList.init();

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
        </div>
        <ListView
          class="mt-4"
          store={subtitleList}
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
                const { id, name, poster_path, episodes } = season;
                return (
                  <div class={cn("space-y-1 flex p-4 rounded-sm bg-white")}>
                    <div class="flex flex-1">
                      <LazyImage class="w-[120px] object-cover" src={poster_path} />
                      <div class="flex-1 ml-4 w-full">
                        <div class="text-xl">{name}</div>
                        <div class="grid grid-cols-3 gap-2 mt-4 w-full">
                          <For each={episodes}>
                            {(episode) => {
                              const { id, episode_text, subtitles } = episode;
                              return (
                                <div>
                                  <div>{episode_text}</div>
                                  <div>
                                    <For each={subtitles}>
                                      {(subtitle) => {
                                        const { id, file_id, name, language } = subtitle;
                                        return (
                                          <div class="flex items-center space-x-2">
                                            <div>{language}</div>
                                            <div
                                              onClick={() => {
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
        <div>该操作会同步删除字幕文件</div>
        <div>请确认后删除</div>
      </Dialog>
    </>
  );
};
