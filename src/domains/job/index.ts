import { Handler } from "mitt";
import dayjs, { Dayjs } from "dayjs";

import { BaseDomain } from "@/domains/base";
import { Result } from "@/types";

import { fetch_job_profile, fetch_job_status, pause_job } from "./services";
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
  completed: boolean;
};
type JobProps = {
  /** job id */
  id: string;
};

export class JobCore extends BaseDomain<TheTypesOfEvents> {
  /** 创建一个异步任务 */
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
  /** 记录id */
  id: string;
  /** 是否处于请求中 */
  loading = false;
  /** 任务是否已结束 */
  completed = false;
  /** 开始时间 */
  start?: Dayjs;

  get state(): JobState {
    return {
      loading: this.loading,
      completed: this.completed,
    };
  }

  constructor(options: JobProps) {
    super();

    const { id } = options;
    this.id = id;
  }

  fetch_profile() {}
  async fetch_status() {
    const r = await fetch_job_status(this.id);
    if (r.error) {
      return Result.Err(r.error);
    }
    const { status, error } = r.data;
    if ([TaskStatus.Finished, TaskStatus.Paused].includes(status)) {
      this.completed = true;
    }
    return Result.Ok(r.data);
  }

  waitFinish() {
    this.start = dayjs();
    this.timer = setInterval(async () => {
      if (dayjs().diff(this.start, "minute") >= 10) {
        this.finish();
        return;
      }
      const r = await fetch_job_status(this.id);
      if (r.error) {
        this.loading = false;
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
        this.loading = false;
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
        this.loading = false;
        this.tip({ text: error ? ["任务失败", error] : ["任务完成"] });
        this.emit(Events.StateChange, { ...this.state });
        this.emit(Events.Finish);
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }, 5000);
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
