import dayjs from "dayjs";

import { FetchParams } from "@/domains/list/typing";
import { request } from "@/utils/request";
import { ListResponse, RequestedResource, Result } from "@/types";

import { TaskStatus, TaskTypes } from "./constants";

/**
 * 获取当前用户所有异步任务
 */
export async function fetch_job_list(params: FetchParams) {
  const res = await request.get<
    ListResponse<{
      id: string;
      unique_id: string;
      type: TaskTypes;
      status: TaskStatus;
      desc: string;
      error?: string;
      created: string;
    }>
  >(`/api/admin/job/list`, params);
  if (res.error) {
    return Result.Err(res.error);
  }
  const result = {
    ...res.data,
    list: res.data.list.map((task) => {
      const { created, status, ...rest } = task;
      return {
        ...rest,
        status,
        statusText: (() => {
          if (status === TaskStatus.Running) {
            return "运行中";
          }
          if (status === TaskStatus.Paused) {
            return "已终止";
          }
          if (status === TaskStatus.Finished) {
            return "已完成";
          }
          return "未知";
        })(),
        created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
        // created: relative_time_from_now(created),
      };
    }),
  };
  return Result.Ok(result);
}
export type JobItem = RequestedResource<typeof fetch_job_list>["list"][0];

/**
 * 查询索引任务详情
 */
export async function fetch_job_profile(id: string) {
  const r = await request.get<{
    id: string;
    desc: string;
    type: TaskTypes;
    status: TaskStatus;
    created: string;
    content: string;
  }>(`/api/admin/job/${id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { desc, status, type, content, created } = r.data;
  const data = {
    id,
    desc,
    status,
    type,
    statusText: (() => {
      if (status === TaskStatus.Running) {
        return "运行中";
      }
      if (status === TaskStatus.Paused) {
        return "已终止";
      }
      if (status === TaskStatus.Finished) {
        return "已完成";
      }
      return "未知";
    })(),
    content: JSON.parse(content),
    created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
  };
  return Result.Ok(data);
}
export type JobProfile = RequestedResource<typeof fetch_job_profile>;

/**
 * 查询索引任务状态
 */
export function fetch_job_status(id: string) {
  return request.get<{ id: string; desc: string; type: TaskTypes; status: TaskStatus; error?: string }>(
    `/api/admin/job/status/${id}`
  );
}
// export type JobItem = RequestedResource<typeof fetch_job_status>;

/**
 * 中止指定任务
 * @param id
 * @returns
 */
export function pause_job(id: string) {
  return request.get<{ id: string }>(`/api/admin/job/pause/${id}`, {
    force: "1",
  });
}
