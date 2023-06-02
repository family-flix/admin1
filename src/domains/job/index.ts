import { BaseDomain } from "@/domains/base";

import { JobItem, fetch_job_profile, fetch_job_status } from "./services";
import { TaskStatus } from "./constants";
import { Handler } from "mitt";
import { Result } from "@/types";

enum Events {
  StateChange,
  Finish,
  Pause,
}
type TheTypesOfEvents = {
  [Events.StateChange]: JobState;
  [Events.Finish]: void;
  [Events.Pause]: void;
};
type JobState = {
  loading: boolean;
};
type JobProps = {
  /** job id */
  id: string;
};

export class JobCore extends BaseDomain<TheTypesOfEvents> {
  static async New(body: { id: string }) {
    const { id } = body;
    const r = await fetch_job_profile(id);
    if (r.error) {
      return Result.Err(r.error);
    }
    const job = new JobCore({ id });
    return Result.Ok(job);
  }

  timer: null | NodeJS.Timeout = null;
  id: string;
  // profile: JobItem;
  state: JobState = {
    loading: false,
  };

  constructor(options: JobProps) {
    super();

    const { id } = options;
    this.id = id;
  }

  fetch_profile() {}

  wait_finish() {
    this.timer = setInterval(async () => {
      const r = await fetch_job_status(this.id);
      if (r.error) {
        this.state.loading = false;
        this.emit(Events.StateChange, { ...this.state });
        this.tip({ text: ["获取索引状态失败", r.error.message] });
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        return;
      }
      const { status, error } = r.data;
      if (status === TaskStatus.Paused) {
        this.state.loading = false;
        this.tip({ text: error ? ["索引失败", error] : ["索引被中断"] });
        this.emit(Events.StateChange, { ...this.state });
        this.emit(Events.Pause);
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        return;
      }
      if (status === TaskStatus.Finished) {
        this.state.loading = false;
        this.tip({ text: error ? ["索引失败", error] : ["索引完成"] });
        this.emit(Events.StateChange, { ...this.state });
        this.emit(Events.Finish);
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }, 3000);
  }

  onFinish(handler: Handler<TheTypesOfEvents[Events.Finish]>) {
    return this.on(Events.Finish, handler);
  }
  onPause(handler: Handler<TheTypesOfEvents[Events.Pause]>) {
    return this.on(Events.Pause, handler);
  }
  onStateChange(handler: Handler<TheTypesOfEvents[Events.StateChange]>) {
    return this.on(Events.StateChange, handler);
  }
}
