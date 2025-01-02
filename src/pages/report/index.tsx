/**
 * @file 任务列表
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Eye, Film, Mails, RotateCw, Tv } from "lucide-solid";

import { ViewComponent } from "@/store/types";
import { refreshJobs } from "@/store/job";
import {
  MovieItem,
  ReportItem,
  fetchReportList,
  fetchMovieList,
  replyReport,
  fetchReportListProcess,
} from "@/biz/services/index";
import { fetchMovieMediaList, fetchMovieMediaListProcess } from "@/biz/services/media";
import { Button, Skeleton, ScrollView, ListView, Dialog, Input, LazyImage, Textarea } from "@/components/ui";
import { TVSeasonSelectCore, SeasonSelect } from "@/components/SeasonSelect";
import { MovieSelect, MovieSelectCore } from "@/components/MovieSelect";
import { ButtonCore, ButtonInListCore, DialogCore, ImageInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RefCore } from "@/domains/ui/cur/index";
import { RequestCore } from "@/domains/request/index";
import { ListCore } from "@/domains/list/index";
import { MediaTypes, ReportTypes } from "@/constants/index";
import { cn } from "@/utils/index";

function buildMsg(report: ReportItem) {
  const { type, data, member, media, media_source } = report;
  if (type === ReportTypes.Want) {
    if (media) {
      return `${media.name}」已收录，点击观看`;
    }
    return "你想看的电视剧/电影已收录";
  }
  if (type === ReportTypes.Movie && media && media.type === MediaTypes.Movie) {
    return `电影《${media.name}》的问题 '${data}' 已解决`;
  }
  if (type === ReportTypes.TV && media && media.type === MediaTypes.Season) {
    return `电视剧《${media.name}》的问题 '${data}' 已解决`;
  }
  return `你反馈的问题 '${data}' 已解决`;
}

export const HomeReportListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const curReport = new RefCore<ReportItem>();
  const reportList = new ListCore(new RequestCore(fetchReportList, { process: fetchReportListProcess }), {});
  const replyRequest = new RequestCore(replyReport, {});
  const commentDialog = new DialogCore({
    title: "回复",
    async onOk() {
      if (!curReport.value) {
        app.tip({
          text: ["请先选择要回复的问题/反馈"],
        });
        return;
      }
      if (!commentInput.value) {
        app.tip({
          text: [commentInput.placeholder],
        });
        return;
      }
      commentDialog.okBtn.setLoading(true);
      const r = await replyRequest.run({
        report_id: curReport.value.id,
        content: commentInput.value,
      });
      commentDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["回复失败", r.error.message],
        });
        return;
      }
      app.tip({
        text: ["回复成功"],
      });
      commentDialog.hide();
    },
    onCancel() {
      curReport.clear();
      commentInput.clear();
    },
  });
  const commentInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入回复内容",
  });
  const replyBtn = new ButtonInListCore<ReportItem>({
    onClick(report) {
      curReport.select(report);
      commentInput.setValue(buildMsg(report));
      commentDialog.show();
    },
  });
  const seasonSelect = new TVSeasonSelectCore({
    onSelect(season) {
      if (curReport.value?.type === ReportTypes.Want) {
        commentInput.setValue(`你想看的电视剧「${season.name}」已收录，点击观看`);
      }
    },
  });
  const seasonSelectDialog = new DialogCore({
    title: "选择电视剧",
    async onOk() {
      if (!curReport.value) {
        app.tip({
          text: ["请先选择要回复的问题/反馈"],
        });
        return;
      }
      if (!commentInput.value) {
        app.tip({
          text: [commentInput.placeholder],
        });
        return;
      }
      if (!seasonSelect.value) {
        app.tip({
          text: ["请选择电视剧"],
        });
        return;
      }
      seasonSelectDialog.okBtn.setLoading(true);
      const { id, name, poster_path, air_date } = seasonSelect.value;
      const r = await replyRequest.run({
        report_id: curReport.value.id,
        content: commentInput.value,
        media_id: id,
      });
      seasonSelectDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["回复失败", r.error.message],
        });
        return;
      }
      app.tip({
        text: ["回复成功"],
      });
      seasonSelectDialog.hide();
    },
    onCancel() {
      curReport.clear();
      seasonSelect.clear();
      commentInput.clear();
    },
  });
  const tvSelectBtn = new ButtonInListCore<ReportItem>({
    onClick(report) {
      curReport.select(report);
      // console.log("[PAGE]report/index - onClick", report);
      if (report.media && report.media.type === MediaTypes.Season) {
        seasonSelect.nameInput.setValue(report.media.name);
        seasonSelect.list.search({ name: report.media.name });
      }
      commentInput.setValue(buildMsg(report));
      seasonSelectDialog.show();
    },
  });
  const movieList = new ListCore(new RequestCore(fetchMovieMediaList, { process: fetchMovieMediaListProcess }), {
    onLoadingChange(loading) {
      movieSearchBtn.setLoading(loading);
    },
  });
  const movieNameSearchInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入名称搜索",
    onEnter() {
      movieSearchBtn.click();
    },
  });
  const movieSearchBtn = new ButtonCore({
    onClick() {
      movieList.search({ name: movieNameSearchInput.value });
    },
  });
  const movieSelect = new MovieSelectCore({
    onSelect(season) {
      if (curReport.value?.type === ReportTypes.Want) {
        commentInput.setValue(`你想看的电影「${season.name}」已收录，点击观看`);
      }
    },
  });
  const movieDialog = new DialogCore({
    title: "选择电影",
    async onOk() {
      if (!curReport.value) {
        app.tip({
          text: ["请先选择要回复的问题/反馈"],
        });
        return;
      }
      if (!commentInput.value) {
        app.tip({
          text: [commentInput.placeholder],
        });
        return;
      }
      if (!movieSelect.value) {
        app.tip({
          text: ["请选择电影"],
        });
        return;
      }
      movieDialog.okBtn.setLoading(true);
      const r = await replyRequest.run({
        report_id: curReport.value.id,
        content: commentInput.value,
        media_id: movieSelect.value.id,
      });
      movieDialog.okBtn.setLoading(false);
      if (r.error) {
        app.tip({
          text: ["回复失败", r.error.message],
        });
        return;
      }
      app.tip({
        text: ["回复成功"],
      });
      movieDialog.hide();
    },
    onCancel() {
      curReport.clear();
      commentInput.clear();
    },
  });
  const movieSelectBtn = new ButtonInListCore<ReportItem>({
    onClick(report) {
      curReport.select(report);
      // console.log("[PAGE]report/index - onClick", report);
      (() => {
        if (report.media && report.media.type === MediaTypes.Movie) {
          movieNameSearchInput.setValue(report.media.name);
          movieList.search({ name: report.media.name });
          return;
        }
        movieList.init();
      })();
      commentInput.setValue(buildMsg(report));
      movieDialog.show();
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      refreshJobs();
      reportList.refresh();
    },
  });
  const scrollView = new ScrollViewCore();
  const poster = new ImageInListCore({});

  const [response, setResponse] = createSignal(reportList.response);
  const [movieListResponse, setMovieListResponse] = createSignal(movieList.response);

  movieList.onStateChange((v) => setMovieListResponse(v));
  reportList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });
  reportList.onStateChange((v) => setResponse(v));
  scrollView.onReachBottom(async () => {
    await reportList.loadMore();
    scrollView.finishLoadingMore();
  });
  reportList.init();

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
        <h1 class="text-2xl">问题列表</h1>
        <div class="mt-8 flex space-x-2">
          <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
            刷新
          </Button>
        </div>
        <ListView
          class="mt-4"
          store={reportList}
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
              {(report, i) => {
                const { id, type, typeText, data, answer, media, member, created } = report;
                return (
                  <div class={cn("space-y-1 flex p-4 rounded-sm bg-white")}>
                    <div class="mr-4">
                      <div class="relative">
                        <div class="w-16 h-16 rounded-full bg-slate-200"></div>
                        <div class="absolute left-[50%] translate-x-[-50%] bottom-0">
                          <div class="px-2 text-sm bg-white rounded-sm">{member.name}</div>
                        </div>
                      </div>
                    </div>
                    <div class="flex-1">
                      <h2 class="text-xl">{data}</h2>
                      <Show when={media}>
                        {(() => {
                          if (!media) {
                            return null;
                          }
                          const url = history.buildURLWithPrefix("root.home_layout.movie_profile", { id: media.id });
                          // const url = homeMovieProfilePage.buildUrlWithPrefix({
                          //   id: media.id,
                          // });
                          return (
                            <div class="flex p-2 bg-gray-100 rounded-sm">
                              <div class="overflow-hidden mr-2 rounded-sm">
                                <LazyImage
                                  class="w-[68px] h-[102px]"
                                  store={poster.bind(media.poster_path)}
                                  alt={media.name}
                                />
                              </div>
                              <div class="flex-1 w-0">
                                <div class="flex items-center">
                                  <h2 class="text-2xl text-slate-800">
                                    <a href={url}>{media.name}</a>
                                    <div>{media.type === MediaTypes.Movie ? "电影" : "电视剧"}</div>
                                  </h2>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </Show>
                      <Show when={!!answer}>
                        <div class="my-2 p-2 bg-gray-100 rounded-sm">{answer}</div>
                      </Show>
                      <div class="flex space-x-4">
                        <div>{created}</div>
                        <div class="flex items-center space-x-1">
                          <Dynamic component={typeIcons[type]} />
                          <div class={cn({})}>{typeText}</div>
                        </div>
                      </div>
                      <div class="mt-2 flex items-center space-x-2">
                        <Button store={replyBtn.bind(report)} variant="subtle">
                          回复
                        </Button>
                        <Button store={tvSelectBtn.bind(report)} variant="subtle">
                          选择电视剧
                        </Button>
                        <Button store={movieSelectBtn.bind(report)} variant="subtle">
                          选择电影
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </ListView>
      </ScrollView>
      <Dialog store={commentDialog}>
        <Textarea store={commentInput} />
      </Dialog>
      <Dialog store={seasonSelectDialog}>
        <div class="w-[520px]">
          <div class="mb-2">
            <Textarea store={commentInput} />
          </div>
          <SeasonSelect store={seasonSelect} />
        </div>
      </Dialog>
      <Dialog store={movieDialog}>
        <div class="w-[520px]">
          <div class="mb-2">
            <Textarea store={commentInput} />
          </div>
          <MovieSelect store={movieSelect} />
        </div>
      </Dialog>
    </>
  );
};
