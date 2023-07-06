/**
 * @file 转存任务详情页面
 */
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { LucideCalendar as Calendar } from "lucide-solid";

import { JobProfile, fetch_job_profile, pause_job } from "@/domains/job/services";
import { RequestCore } from "@/domains/client";
import { Article } from "@/components/Article";
import { ViewComponent } from "@/types";
import { TimerCore } from "@/domains/timer";
import { TaskStatus } from "@/domains/job/constants";
import { ButtonCore, ButtonInListCore } from "@/domains/ui/button";
import { Button } from "@/components/ui/button";

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
  const request = new RequestCore(fetch_job_profile, {
    onLoading(loading) {
      // ...
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

  const [profile, setProfile] = createSignal(request.response);

  onMount(() => {
    const { id } = view.params as { id?: string };
    if (!id) {
      return;
    }
    request.run(id);
  });

  return (
    <div class="h-screen p-8">
      <Show when={!!profile()}>
        <div>
          <h1 class="text-3xl">{profile()!.desc}</h1>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-1">
              <Calendar class="w-4 h-4" />
              <div>{profile()!.created}</div>
            </div>
            <p>{profile()!.statusText}</p>
          </div>
        </div>
        <Show when={profile()!.status === TaskStatus.Running}>
          <Button store={pauseBtn}>暂停任务</Button>
        </Show>
        <div class="divider-x-2"></div>
        <div class="mt-8">
          <Article nodes={profile()!.content} />
        </div>
      </Show>
    </div>
  );
};
