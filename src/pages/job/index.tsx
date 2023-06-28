import { For, JSX, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Ban, Bug, Bus, CheckCircle, ParkingCircle, Recycle, RotateCw, Timer } from "lucide-solid";

import { ListCore } from "@/domains/list";
import { Button } from "@/components/ui/button";
import { RouteViewCore } from "@/domains/route_view";
import { NavigatorCore } from "@/domains/navigator";
import { RequestCore } from "@/domains/client";
import { Application } from "@/domains/app";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { JobItem, fetch_job_list, pause_job } from "@/domains/job/services";
import { TaskStatus } from "@/constants";
import { cn } from "@/utils";
import { ListView } from "@/components/ListView";
import { Skeleton } from "@/packages/ui/skeleton";

export const TaskListPage = (props: { app: Application; router: NavigatorCore; view: RouteViewCore }) => {
  const { app, view, router } = props;

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
  const pauseJobBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      pauseJob.run(task.id);
    },
  });
  const profileBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      router.push(`/home/task/${task.id}`);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      jobList.refresh();
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

  jobList.init();

  const dataSource = () => response().dataSource;
  const noMore = () => response().noMore;

  return (
    <div>
      <h1 class="text-2xl">任务列表</h1>
      <div class="mt-8">
        <Button class="space-x-1" icon={<RotateCw class="w-4 h-4" />} store={refreshBtn}>
          刷新
        </Button>
        <ListView
          store={jobList}
          skeleton={
            <div class="space-y-8 mt-8">
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
          <div class="space-y-8 mt-8">
            <For each={dataSource()}>
              {(task, i) => {
                const { id, desc, unique_id, created, status, statusText } = task;
                return (
                  <div class={cn("space-y-1")}>
                    <h2 class="text-xl">{desc}</h2>
                    <div class="flex space-x-4">
                      <div>{created}</div>
                      <div class="flex items-center space-x-1">
                        <Dynamic component={statusIcons[status]} />
                        <div class={cn({})}>{statusText}</div>
                      </div>
                    </div>
                    <div class="space-x-2">
                      <Button store={profileBtn.bind(task)} icon={<Bus class="w-4 h-4" />} variant="subtle">
                        详情
                      </Button>
                      <Show when={status === TaskStatus.Running}>
                        <Button
                          store={pauseJobBtn.bind(task)}
                          icon={<ParkingCircle class="w-4 h-4" />}
                          variant="subtle"
                        >
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
      </div>
    </div>
  );
};
