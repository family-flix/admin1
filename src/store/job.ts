/**
 * @file 进行中的异步任务
 */
import mitt, { Handler } from "mitt";

import { JobCore } from "@/domains/job";
import { TaskStatus } from "@/domains/job/constants";

import { cache } from "./cache";

enum Events {
  JobsChange,
}
type TheTypesOfEvents = {
  [Events.JobsChange]: JobCore[];
};
const jobs: JobCore[] = [];
const emitter = mitt<TheTypesOfEvents>();

export async function refreshJobs() {
  const jobs = cache.get<string[]>("jobs", []);
  if (jobs.length === 0) {
    return;
  }
  for (let i = 0; i < jobs.length; i += 1) {
    const job = new JobCore({ id: jobs[i] });
    const status_res = await job.fetchStatus();
    if (status_res.error) {
      continue;
    }
    const { status } = status_res.data;
    if ([TaskStatus.Finished, TaskStatus.Paused].includes(status)) {
      removeJob(job);
    }
  }
}
export async function initializeJobs() {
  const jobs = cache.get<string[]>("jobs", []).filter(Boolean);
  if (jobs.length === 0) {
    return;
  }
  for (let i = 0; i < jobs.length; i += 1) {
    const job = new JobCore({ id: jobs[i] });
    const status_res = await job.fetchStatus();
    if (status_res.error) {
      continue;
    }
    const { status } = status_res.data;
    if ([TaskStatus.Finished, TaskStatus.Paused].includes(status)) {
      removeJob(job);
      continue;
    }
    job.waitFinish();
    appendJob(job);
  }
}

/** 向异步任务队列中添加任务 */
export function appendJob(job: JobCore) {
  if (jobs.includes(job)) {
    return;
  }
  const unlisten = job.onFinish(() => {
    removeJob(job);
    const nextJobs = jobs.filter((j) => j.id !== job.id);
    emitter.emit(Events.JobsChange, nextJobs);
    unlisten();
  });
  const prevJobs = cache.get<string[]>("jobs", []);
  if (!prevJobs.includes(job.id)) {
    prevJobs.push(job.id);
    cache.set("jobs", prevJobs);
  }
  jobs.push(job);
  emitter.emit(Events.JobsChange, jobs);
}

/** 从异步任务队列中移除指定任务 */
export function removeJob(job: JobCore) {
  const prevJobs = cache.get<string[]>("jobs", []);
  const nextJobs = prevJobs.filter((j) => j !== job.id);
  if (prevJobs.includes(job.id)) {
    cache.set("jobs", nextJobs);
  }
  if (!jobs.includes(job)) {
    return;
  }
  const index = jobs.findIndex((j) => j === job);
  if (index === -1) {
    return;
  }
  const targetJob = jobs[index];
  targetJob.forceFinish();
}
/**
 * job 工厂函数
 * @param body
 */
export function createJob(body: {
  job_id: string;
  onTip?: (msg: { icon?: unknown; text: string[] }) => void;
  onFinish?: () => void;
  onCompleted?: () => void;
}) {
  const { job_id, onTip, onFinish, onCompleted } = body;
  const job = new JobCore({ id: job_id });
  job.onFinish(() => {
    if (onFinish) {
      onFinish();
    }
  });
  job.onCompleted(() => {
    if (onFinish) {
      onFinish();
    }
  });
  if (onTip) {
    job.onTip((msg) => {
      onTip(msg);
    });
  }
  appendJob(job);
  job.waitFinish();
}

/** 清空异步任务队列 */
export function clearJobs() {}

export function onJobsChange(handler: Handler<TheTypesOfEvents[Events.JobsChange]>) {
  emitter.on(Events.JobsChange, handler);
}
