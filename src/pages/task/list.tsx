import { For, Show, createSignal } from "solid-js";

import Helper from "@list-helper/core/core";
import {
  AsyncTask,
  fetch_async_tasks,
  stop_async_task,
} from "@/domains/shared_files/services";
import { Button } from "@/components/ui/button";
import { ViewCore } from "@/domains/router";
import { PageCore } from "@/domains/router/something";
import { NavigatorCore } from "@/domains/navigator";

export const TaskListPage = (props: {
  page: PageCore;
  router: NavigatorCore;
  view: ViewCore;
}) => {
  const { view, router } = props;

  const [hidden, setHidden] = createSignal(view.hidden);
  const [response, setResponse] = createSignal(Helper.defaultResponse);
  const helper = new Helper<AsyncTask>(fetch_async_tasks);
  helper.onChange = (nextResponse) => {
    setResponse(nextResponse);
  };
  view.onShow(() => {
    setHidden(false);
  });
  view.onHide(() => {
    setHidden(true);
  });
  helper.init();
  const dataSource = () => response().dataSource;

  return (
    <Show when={!hidden()}>
      <h2 class="my-2 text-2xl">任务列表</h2>
      <div class="space-y-4">
        <For each={dataSource()}>
          {(task, i) => {
            const { id, desc, unique_id, created, status } = task;
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
                  <div>{status}</div>
                  <div>{created}</div>
                </div>
                {status === "Running" ? (
                  <Button
                    size="default"
                    variant="default"
                    onClick={async (event) => {
                      event.stopPropagation();
                      const r = await stop_async_task(id);
                      if (r.error) {
                        alert(r.error.message);
                        return;
                      }
                      helper.refresh();
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
    </Show>
  );
};
