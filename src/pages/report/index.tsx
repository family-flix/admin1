/**
 * @file 任务列表
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Eye, Film, Mails, RotateCw, Tv } from "lucide-solid";

import { MovieItem, ReportItem, fetchReportList, fetchMovieList, replyReport } from "@/services";
import { Button, Skeleton, ScrollView, ListView, Dialog, Input, LazyImage, Textarea } from "@/components/ui";
import { TVSeasonSelectCore, SeasonSelect } from "@/components/SeasonSelect";
import { ButtonCore, ButtonInListCore, DialogCore, ImageInListCore, InputCore, ScrollViewCore } from "@/domains/ui";
import { RefCore } from "@/domains/cur";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { clear_expired_job_list } from "@/domains/job";
import { MediaTypes, ReportTypes } from "@/constants";
import { ViewComponent } from "@/store/types";
import { refreshJobs } from "@/store/job";
import { cn } from "@/utils";
import { fetchMovieMediaList } from "@/services/media";

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
  const curMovie = new RefCore<MovieItem>();
  const reportList = new ListCore(new RequestCore(fetchReportList), {});
  const reportDeletingRequest = new RequestCore(clear_expired_job_list, {
    onLoading(loading) {
      reportDeletingBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["清除成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["清除失败", error.message],
      });
    },
  });
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
      if (report.media && report.media.type === MediaTypes.Season) {
        seasonSelect.nameInput.setValue(report.media.name);
        seasonSelect.list.search({ name: report.media.name });
      }
      commentInput.setValue(buildMsg(report));
      seasonSelectDialog.show();
    },
  });

  const movieList = new ListCore(new RequestCore(fetchMovieMediaList), {
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
      if (!curMovie.value) {
        app.tip({
          text: ["请选择电影"],
        });
        return;
      }
      movieDialog.okBtn.setLoading(true);
      const r = await replyRequest.run({
        report_id: curReport.value.id,
        content: commentInput.value,
        media_id: curMovie.value.id,
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
      curMovie.clear();
      commentInput.clear();
    },
  });
  const movieSelectBtn = new ButtonInListCore<ReportItem>({
    onClick(report) {
      curReport.select(report);
      // console.log(report.movie);
      if (report.media && report.media.type === MediaTypes.Movie) {
        movieNameSearchInput.setValue(report.media.name);
        movieList.search({ name: report.media.name });
      }
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
  const reportDeletingBtn = new ButtonCore({
    onClick() {
      reportDeletingRequest.run();
    },
  });
  const scrollView = new ScrollViewCore();
  const poster = new ImageInListCore({});

  const [response, setResponse] = createSignal(reportList.response);
  const [movieListResponse, setMovieListResponse] = createSignal(movieList.response);
  const [curMovieState, setCurMovieState] = createSignal(curMovie.value);

  movieList.onStateChange((nextState) => {
    setMovieListResponse(nextState);
  });
  curMovie.onStateChange((nextState) => {
    setCurMovieState(nextState);
  });
  reportList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });
  reportList.onStateChange((nextState) => {
    setResponse(nextState);
  });
  scrollView.onReachBottom(() => {
    reportList.loadMore();
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
          <div>
            <Textarea store={commentInput} />
          </div>
          <SeasonSelect store={seasonSelect} />
        </div>
      </Dialog>
      <Dialog store={movieDialog}>
        <div class="w-[520px]">
          <div>
            <Textarea store={commentInput} />
          </div>
          <div class="flex items-center space-x-2 mt-4">
            <Input store={movieNameSearchInput} />
            <Button store={movieSearchBtn} variant="subtle">
              搜索
            </Button>
          </div>
          <div class="mt-2">
            <ListView
              store={movieList}
              skeleton={
                <div>
                  <div class="rounded-md border border-slate-300 bg-white shadow-sm">
                    <div class="flex">
                      <div class="overflow-hidden mr-2 rounded-sm">
                        <Skeleton class="w-[120px] h-[180px]" />
                      </div>
                      <div class="flex-1 p-4">
                        <Skeleton class="h-[36px] w-[180px]"></Skeleton>
                        <div class="mt-2 space-y-1">
                          <Skeleton class="h-[24px] w-[120px]"></Skeleton>
                          <Skeleton class="h-[24px] w-[240px]"></Skeleton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <div class="space-y-4 max-h-[240px] overflow-y-auto">
                <For each={movieListResponse().dataSource}>
                  {(movie) => {
                    const { name, overview, poster_path, air_date, vote_average, runtime } = movie;
                    return (
                      <div
                        classList={{
                          "rounded-md border border-slate-300 bg-white shadow-sm": true,
                          "border-green-500": curMovieState()?.id === movie.id,
                        }}
                        onClick={() => {
                          if (curReport.value?.type === ReportTypes.Want) {
                            commentInput.setValue(`你想看的电影「${movie.name}」已收录，点击观看`);
                          }
                          curMovie.select(movie);
                        }}
                      >
                        <div class="flex">
                          <div class="overflow-hidden mr-2 rounded-sm">
                            <LazyImage class="w-[120px] h-[180px]" store={poster.bind(poster_path)} alt={name} />
                          </div>
                          <div class="flex-1 w-0 p-4">
                            <h2 class="text-2xl text-slate-800">{name}</h2>
                            <div class="mt-2 overflow-hidden text-ellipsis">
                              <p class="text-slate-700 break-all whitespace-pre-wrap truncate line-clamp-4">
                                {overview}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </ListView>
          </div>
        </div>
      </Dialog>
    </>
  );
};
