import { JobCore } from "@/domains/job";

const jobs: JobCore[] = [];

export function appendJob(job: JobCore) {
  if (jobs.includes(job)) {
    return;
  }
  jobs.push(job);
}

function removeJob(job: JobCore) {
  if (!jobs.includes(job)) {
    return;
  }
  const index = jobs.findIndex((j) => j === job);
  if (index === -1) {
    return;
  }
  const targetJob = jobs[index];
  targetJob.finish();
}
export function clearJobs() {}
