import { For, JSX, Show, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Ban, CheckCircle, Recycle, RotateCw, Timer } from "lucide-solid";

import { ListCore } from "@/domains/list";
import { Button } from "@/components/ui/button";
import { RouteViewCore } from "@/domains/route_view";
import { NavigatorCore } from "@/domains/navigator";
import { RequestCore } from "@/domains/client";
import { Application } from "@/domains/app";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { JobItem, fetch_job_list, pause_job } from "@/domains/job/services";
import { TaskStatus } from "@/constants";

export const TaskListPage = (props: { app: Application; router: NavigatorCore; view: RouteViewCore }) => {
  const { app, view, router } = props;

  const helper = new ListCore<JobItem>(fetch_job_list, {});
  const pauseJob = new RequestCore(pause_job);
  const pauseJobBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      pauseJob.run(task.id);
    },
  });
  const profileBtn = new ButtonInListCore<JobItem>({
    onClick(task) {
      router.push(`/task/${task.id}`);
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      helper.refresh();
    },
  });
  helper.onLoadingChange((loading) => {
    refreshBtn.setLoading(loading);
  });

  const [response, setResponse] = createSignal(helper.response);
  helper.onStateChange((nextState) => {
    setResponse(nextState);
  });
  pauseJob.onFailed((err) => {
    app.tip({ text: ["中止任务失败", err.message] });
  });
  pauseJob.onSuccess(() => {
    app.tip({ text: ["中止任务成功"] });
    helper.refresh();
  });

  const statusIcons: Record<TaskStatus, () => JSX.Element> = {
    [TaskStatus.Finished]: () => <CheckCircle class="w-4 h-4" />,
    [TaskStatus.Paused]: () => <Ban class="w-4 h-4" />,
    [TaskStatus.Running]: () => <Timer class="w-4 h-4" />,
  };

  helper.init();

  const dataSource = () => response().dataSource;
  const noMore = () => response().noMore;

  return (
    <div>
      <h1 class="text-2xl">任务列表</h1>
      <div class="mt-8">
        <Button class="space-x-1" store={refreshBtn}>
          <RotateCw class="w-4 h-4" />
        </Button>
        <div class="space-y-8 mt-8 divide-y-2">
          <For each={dataSource()}>
            {(task, i) => {
              const { id, desc, unique_id, created, status, statusText } = task;
              return (
                <div class="space-y-1">
                  <h2 class="text-xl">{desc}</h2>
                  <div class="flex space-x-4">
                    <div>{created}</div>
                    <div class="flex items-center space-x-1">
                      <Dynamic component={statusIcons[status]} />
                      <div>{statusText}</div>
                    </div>
                  </div>
                  <div class="space-x-2">
                    <Button store={profileBtn.bind(task)} size="default" variant="default">
                      详情
                    </Button>
                    <Show when={status === TaskStatus.Running}>
                      <Button store={pauseJobBtn.bind(task)} size="default" variant="default">
                        停止任务
                      </Button>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
        <Show when={!noMore()}>
          <div
            class="mt-6 text-center cursor-pointer"
            onClick={() => {
              helper.loadMore();
            }}
          >
            加载更多
          </div>
        </Show>
      </div>
    </div>
  );
};
