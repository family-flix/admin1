import { Handler } from "mitt";
import dayjs, { Dayjs } from "dayjs";

import { BaseDomain } from "@/domains/base";
import { Result } from "@/types";

import { JobItem, fetch_job_profile, fetch_job_status, pause_job } from "./services";
import { TaskStatus } from "./constants";

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
  start?: Dayjs;
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
    this.start = dayjs();
    this.timer = setInterval(async () => {
      if (dayjs().diff(this.start, "minute") >= 10) {
        this.finish();
        return;
      }
      const r = await fetch_job_status(this.id);
      if (r.error) {
        this.state.loading = false;
        this.emit(Events.StateChange, { ...this.state });
        this.tip({ text: ["获取任务状态失败", r.error.message] });
        if (this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
        return;
      }
      const { status, error } = r.data;
      if (status === TaskStatus.Paused) {
        this.state.loading = false;
        this.tip({ text: error ? ["任务失败", error] : ["任务被中断"] });
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
        this.tip({ text: error ? ["任务失败", error] : ["任务完成"] });
        this.emit(Events.StateChange, { ...this.state });
        this.emit(Events.Finish);
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }, 3000);
  }
  /** 强制中断任务 */
  async finish() {
    if (this.timer === null) {
      return;
    }
    await pause_job(this.id);
    clearInterval(this.timer);
    this.timer = null;
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
