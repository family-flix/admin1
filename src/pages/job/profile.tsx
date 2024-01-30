/**
 * @file 转存任务详情页面
 */
import { Show, createSignal, onMount } from "solid-js";
import { ArrowLeft, Calendar } from "lucide-solid";

import { Button, ScrollView, Skeleton, ListView } from "@/components/ui";
import { Article } from "@/components/Article";
import { ScrollViewCore, ButtonCore } from "@/domains/ui";
import { ListCore } from "@/domains/list";
import { JobProfile, fetch_job_profile, fetch_output_lines_of_job, pause_job, TaskStatus } from "@/domains/job";
import { RequestCore } from "@/domains/request";
import { ViewComponent } from "@/store/types";

export const LogProfilePage: ViewComponent = (props) => {
  const { app, history, view } = props;

  const pauseBtn = new ButtonCore<JobProfile>({
    onClick() {
      pauseJob.run(view.query.id);
    },
  });
  const pauseJob = new RequestCore(pause_job, {
    onLoading(loading) {
      pauseBtn.setLoading(loading);
    },
    onSuccess() {
      app.tip({
        text: ["任务暂停成功"],
      });
    },
    onFailed(error) {
      app.tip({
        text: ["任务暂停失败", error.message],
      });
    },
  });
  const logList = new ListCore(
    new RequestCore(fetch_output_lines_of_job, {
      delay: null,
    }),
    { pageSize: 100 }
  );
  const request = new RequestCore(fetch_job_profile, {
    onLoading(loading) {
      refreshBtn.setLoading(loading);
    },
    onSuccess(v) {
      setProfile(v);
      logList.setDataSource(v.content);
    },
    onFailed(error) {
      app.tip({
        text: ["获取任务详情失败", error.message],
      });
    },
  });
  const refreshBtn = new ButtonCore({
    onClick() {
      request.reload();
    },
  });
  const scrollView = new ScrollViewCore({
    // onReachBottom() {
    //   logList.loadMore();
    // },
  });

  const [profile, setProfile] = createSignal(request.response);
  const [logResponse, setLogResponse] = createSignal(logList.response);

  logList.onStateChange((nextResponse) => {
    setLogResponse(nextResponse);
  });
  onMount(() => {
    const { id } = view.query as { id?: string };
    if (!id) {
      return;
    }
    request.run(id);
  });

  return (
    <ScrollView store={scrollView} class="h-screen p-8">
      <div>
        <div
          class="mb-2 cursor-pointer"
          onClick={() => {
            history.back();
            // homeLayout.showPrevView({ destroy: true });
          }}
        >
          <ArrowLeft class="w-6 h-6" />
        </div>
      </div>
      <Show
        when={!!profile()}
        fallback={
          <div>
            <div>
              <Skeleton class="w-32 h-[36px]"></Skeleton>
              <div class="mt-2 flex items-center space-x-4">
                <Skeleton class="w-64 h-[24px]"></Skeleton>
              </div>
              <div class="mt-4 space-y-1">
                <Skeleton class="w-[60px] h-[36px]"></Skeleton>
              </div>
            </div>
            <div class="mt-8 space-y-1">
              <Skeleton class="w-12 h-[24px]"></Skeleton>
              <Skeleton class="w-full h-[24px]"></Skeleton>
              <Skeleton class="w-32 h-[24px]"></Skeleton>
              <Skeleton class="w-64 h-[24px]"></Skeleton>
            </div>
          </div>
        }
      >
        <div>
          <h1 class="text-3xl">{profile()!.desc}</h1>
          <div class="mt-2 flex items-center space-x-4">
            <div class="flex items-center space-x-1">
              <Calendar class="w-4 h-4" />
              <div>{profile()!.created}</div>
            </div>
            <p>{profile()!.statusText}</p>
          </div>
          <div class="flex items-center mt-4 space-x-2">
            <Button store={refreshBtn}>刷新</Button>
            <Show when={profile()!.status === TaskStatus.Running}>
              <Button store={pauseBtn}>暂停任务</Button>
            </Show>
          </div>
        </div>
        <div class="mt-8">
          <Article nodes={logResponse().dataSource} />
        </div>
      </Show>
    </ScrollView>
  );
};
