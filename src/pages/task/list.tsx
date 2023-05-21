import { For, Show, createSignal } from "solid-js";

import { ListCore } from "@/domains/list";
import {
  AsyncTask,
  fetch_async_tasks,
  stop_async_task,
} from "@/domains/shared_resource/services";
import { Button } from "@/components/ui/button";
import { ViewCore } from "@/domains/view";
import { NavigatorCore } from "@/domains/navigator";
import { RequestCore } from "@/domains/client";
import { Application } from "@/domains/app";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { TaskStatus } from "@/constants";

export const TaskListPage = (props: {
  app: Application;
  router: NavigatorCore;
  view: ViewCore;
}) => {
  const { app, view, router } = props;

  const helper = new ListCore<AsyncTask>(fetch_async_tasks);
  const request = new RequestCore(stop_async_task);
  const btn = new ButtonInListCore<AsyncTask>({
    onClick(task) {
      request.run(task.id);
    },
  });

  const [response, setResponse] = createSignal(helper.response);
  helper.onStateChange((nextState) => {
    setResponse(nextState);
  });
  request.onFailed((err) => {
    app.tip({ text: ["中止任务失败", err.message] });
  });
  request.onSuccess(() => {
    app.tip({ text: ["中止任务成功"] });
    helper.refresh();
  });
  helper.init();

  const dataSource = () => response().dataSource;

  return (
    <div>
      <h2 class="my-2 text-2xl">任务列表</h2>
      <div class="space-y-4">
        <For each={dataSource()}>
          {(task, i) => {
            const { id, desc, unique_id, created, status, statusText } = task;
            return (
              <div
                class="card cursor-pointer"
                onClick={() => {
                  router.push(`/task/${id}`);
                }}
              >
                <h2 class="text-xl">{desc}</h2>
                <div>{unique_id}</div>
                <div class="flex items-center justify-between">
                  <div>{statusText}</div>
                  <div>{created}</div>
                </div>
                {status === TaskStatus.Running ? (
                  <Button
                    store={btn.bind(task)}
                    size="default"
                    variant="default"
                    onClick={async (event) => {
                      event.stopPropagation();
                    }}
                  >
                    停止任务
                  </Button>
                ) : null}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
