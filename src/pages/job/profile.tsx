/**
 * @file 转存任务详情页面
 */
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { LucideCalendar as Calendar } from "lucide-solid";

import { JobProfile, fetch_job_profile, fetch_output_lines_of_job, pause_job } from "@/domains/job/services";
import { RequestCore } from "@/domains/client";
import { Article } from "@/components/Article";
import { ViewComponent } from "@/types";
import { TimerCore } from "@/domains/timer";
import { TaskStatus } from "@/domains/job/constants";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { Button } from "@/components/ui/button";
import { ScrollView } from "@/components/ui/scroll-view";
import { ScrollViewCore } from "@/domains/ui/scroll-view";
import { Skeleton } from "@/components/ui/skeleton";
import { ListCore } from "@/domains/list";
import { ListView } from "@/components/ListView";

export const TaskProfilePage: ViewComponent = (props) => {
  const { app, router, view } = props;
  // const router = useRouter();
  // const { id } = router.query as { id: string };

  const pauseBtn = new ButtonCore<JobProfile>({
    onClick() {
      pauseJob.run(view.params.id);
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
    })
  );
  const request = new RequestCore(fetch_job_profile, {
    onLoading(loading) {
      refreshBtn.setLoading(loading);
    },
    onSuccess(v) {
      setProfile(v);
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
    onReachBottom() {
      logList.loadMore();
    },
  });

  const [profile, setProfile] = createSignal(request.response);
  const [logResponse, setLogResponse] = createSignal(logList.response);

  logList.onStateChange((nextResponse) => {
    setLogResponse(nextResponse);
  });
  onMount(() => {
    const { id } = view.params as { id?: string };
    if (!id) {
      return;
    }
    request.run(id);
    logList.setParams((prev) => {
      return {
        ...prev,
        job_id: id,
      };
    });
    logList.init();
  });

  return (
    <ScrollView store={scrollView} class="h-screen p-8">
      <Show
        when={!!profile()}
        fallback={
          <div>
            <div>
              <Skeleton class="w-32 h-[64px]"></Skeleton>
              <div class="mt-2 flex items-center space-x-4">
                <div class="flex items-center space-x-1">
                  <Skeleton class="w-4 h-4"></Skeleton>
                  <Skeleton class="w-18 h-[18px]"></Skeleton>
                </div>
                <Skeleton class="mt-2 w-18 h-[18px]"></Skeleton>
              </div>
            </div>
            <div class="divider-x-2"></div>
            <div class="mt-8 space-y-1">
              <Skeleton class="w-full h-[18]"></Skeleton>
              <Skeleton class="w-32 h-[18]"></Skeleton>
              <Skeleton class="w-24 h-[18]"></Skeleton>
            </div>
          </div>
        }
      >
        <div>
          <h1 class="text-3xl">{profile()!.desc}</h1>
          <div class="flex items-center mt-2 space-x-4">
            <div class="flex items-center space-x-1">
              <Calendar class="w-4 h-4" />
              <div>{profile()!.created}</div>
            </div>
            <p>{profile()!.statusText}</p>
          </div>
        </div>
        <div class="flex items-center mt-4 space-x-2">
          <Button store={refreshBtn}>刷新</Button>
          <Show when={profile()!.status === TaskStatus.Running}>
            <Button store={pauseBtn}>暂停任务</Button>
          </Show>
        </div>
        <div class="divider-x-2"></div>
        <div class="mt-8">
          <ListView store={logList}>
            <Article nodes={logResponse().dataSource} />
          </ListView>
        </div>
      </Show>
    </ScrollView>
  );
};
