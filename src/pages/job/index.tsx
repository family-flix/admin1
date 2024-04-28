/**
 * @file 任务列表
 */
import { For, JSX, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Ban, CheckCircle, ParkingCircle, RotateCw, Timer, Trash } from "lucide-solid";

import { Button, Skeleton, ScrollView, ListView, Checkbox } from "@/components/ui";
import { ButtonCore, ButtonInListCore, CheckboxCore, ScrollViewCore } from "@/domains/ui";
import { RequestCore } from "@/domains/request";
import { ListCore } from "@/domains/list";
import { JobItem, fetchJobList, pause_job, TaskStatus } from "@/domains/job";
import { refreshJobs } from "@/store/job";
import { ViewComponent } from "@/store/types";
import { cn } from "@/utils";
import { TabHeader } from "@/components/ui/tab-header";
import { TabHeaderCore } from "@/domains/ui/tab-header";

export const LogListPage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const jobList = new ListCore(new RequestCore(fetchJobList), {});
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
  const pauseJobBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      pauseJob.run(task.id);
    },
  });
  const profileBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      history.push("root.home_layout.job_profile", { id: task.id });
      // homeTaskProfilePage.query = {
      //   id: task.id,
      // };
      // app.showView(homeTaskProfilePage);
      // homeLayout.showSubView(homeTaskProfilePage);
      // router.push(`/home/task/${task.id}`);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      refreshJobs();
      jobList.refresh();
    },
  });
  const runningCheckbox = new CheckboxCore({
    onChange(checked) {
      jobList.search({});
    },
  });
  const scrollView = new ScrollViewCore();
  const tab = new TabHeaderCore({
    key: "id",
    options: [
      {
        id: String(TaskStatus.Running),
        text: "进行中",
      },
      {
        id: String(TaskStatus.Finished),
        text: "已完成",
      },
    ],
    onChange(opt) {
      jobList.search({
        status: Number(opt.id),
      });
    },
  });

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
      </div>
      <TabHeader store={tab} />
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
              const { id, desc, output_id, created, status, statusText } = task;
              return (
                <div class={cn("space-y-1 p-4 rounded-sm bg-white")}>
                  <div>{output_id}</div>
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
