/**
 * @file 任务列表
 */
import { For, JSX, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Eye, Film, Mails, RotateCw, Tv } from "lucide-solid";

import { fetchReportList } from "@/services";
import { Button, Skeleton, ScrollView, ListView } from "@/components/ui";
import { ButtonCore, ButtonInListCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import { JobItem, clear_expired_job_list } from "@/domains/job/services";
import { ReportTypes } from "@/constants";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";
import { refreshJobs } from "@/store";

export const HomeReportListPage: ViewComponent = (props) => {
  const { app, view, router } = props;

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
  const reportProfileBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      router.push(`/home/task/${task.id}`);
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

  const [response, setResponse] = createSignal(reportList.response);

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
              const { id, type, typeText, data, member, created } = report;
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
                    <div class="flex space-x-4">
                      <div>{created}</div>
                      <div class="flex items-center space-x-1">
                        <Dynamic component={typeIcons[type]} />
                        <div class={cn({})}>{typeText}</div>
                      </div>
                    </div>
                    <div class="mt-2 space-x-2">
                      {/* <Button store={reportProfileBtn.bind(report)} variant="subtle">
                      详情
                    </Button> */}
                      {/* <Show when={status === TaskStatus.Running}>
                      <Button store={pauseJobBtn.bind(report)} icon={<ParkingCircle class="w-4 h-4" />} variant="subtle">
                        停止任务
                      </Button>
                    </Show> */}
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </ListView>
    </ScrollView>
  );
};
