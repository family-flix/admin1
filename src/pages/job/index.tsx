/**
 * @file 任务列表
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Ban, CheckCircle, ParkingCircle, RotateCw, Timer, Trash } from "lucide-solid";

import { Button, Skeleton, ScrollView, ListView } from "@/components/ui";
import { ButtonCore, ButtonInListCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/client";
import { ListCore } from "@/domains/list";
import { JobItem, clear_expired_job_list, fetch_job_list, pause_job, TaskStatus } from "@/domains/job";
import { homeLayout, homeTaskProfilePage, refreshJobs } from "@/store";
import { ViewComponent } from "@/types";
import { cn } from "@/utils";

export const TaskListPage: ViewComponent = (props) => {
  const { app, view } = props;

  const jobList = new ListCore(new RequestCore(fetch_job_list), {});
  const pauseJob = new RequestCore(pause_job, {
    onLoading(loading) {
      pauseJobBtn.setLoading(loading);
    },
    onFailed: (err) => {
      app.tip({ text: ["中止任务失败", err.message] });
    },
    onSuccess: () => {
      app.tip({ text: ["中止任务成功"] });
      jobList.refresh();
    },
  });
  const jobDeletingRequest = new RequestCore(clear_expired_job_list, {
    onLoading(loading) {
      jobDeletingBtn.setLoading(loading);
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
  const pauseJobBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      pauseJob.run(task.id);
    },
  });
  const profileBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      homeTaskProfilePage.params = {
        id: task.id,
      };
      homeLayout.showSubView(homeTaskProfilePage);
      // router.push(`/home/task/${task.id}`);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      refreshJobs();
      jobList.refresh();
    },
  });
  const jobDeletingBtn = new ButtonCore({
    onClick() {
      jobDeletingRequest.run();
    },
  });
  const scrollView = new ScrollViewCore();

  jobList.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });

  const [response, setResponse] = createSignal(jobList.response);
  jobList.onStateChange((nextState) => {
    setResponse(nextState);
  });

  const statusIcons: Record<TaskStatus, () => JSX.Element> = {
    [TaskStatus.Finished]: () => <CheckCircle class="w-4 h-4" />,
    [TaskStatus.Paused]: () => <Ban class="w-4 h-4" />,
    [TaskStatus.Running]: () => <Timer class="w-4 h-4" />,
  };

  scrollView.onReachBottom(() => {
    jobList.loadMore();
  });
  // view.onShow(() => {
  jobList.init();
  // });

  const dataSource = () => response().dataSource;

  return (
    <ScrollView store={scrollView} class="h-screen p-8">
      <h1 class="text-2xl">任务列表</h1>
      <div class="mt-8 flex space-x-2">
        <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
          刷新
        </Button>
        <Button class="space-x-1" icon={<Trash class="w-4 h-4" />} variant="subtle" store={jobDeletingBtn}>
          删除7天前任务记录
        </Button>
      </div>
      <ListView
        class="mt-4"
        store={jobList}
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
              const { id, desc, unique_id, created, status, statusText } = task;
              return (
                <div class={cn("space-y-1 p-4 rounded-sm bg-white")}>
                  <h2 class="text-xl">{desc}</h2>
                  <div class="flex space-x-4">
                    <div>{created}</div>
                    <div class="flex items-center space-x-1">
                      <Dynamic component={statusIcons[status]} />
                      <div class={cn({})}>{statusText}</div>
                    </div>
                  </div>
                  <div class="mt-2 space-x-2">
                    <Button store={profileBtn.bind(task)} variant="subtle">
                      详情
                    </Button>
                    <Show when={status === TaskStatus.Running}>
                      <Button store={pauseJobBtn.bind(task)} icon={<ParkingCircle class="w-4 h-4" />} variant="subtle">
                        停止任务
                      </Button>
                    </Show>
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
