import dayjs from "dayjs";

import { client } from "@/store/request";
import { FetchParams } from "@/domains/list/typing";
import { ListResponse, ListResponseWithCursor, RequestedResource, Result } from "@/types";

import { TaskStatus, TaskTypes } from "./constants";

/**
 * 获取当前用户所有异步任务
 */
export async function fetchJobList(params: FetchParams) {
  const res = await client.post<
    ListResponse<{
      id: string;
      unique_id: string;
      type: TaskTypes;
      status: TaskStatus;
      desc: string;
      output_id: string;
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
      const { created, output_id, status, ...rest } = task;
      return {
        ...rest,
        output_id,
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
export type JobItem = RequestedResource<typeof fetchJobList>["list"][0];

export function clear_expired_job_list() {
  return client.get("/api/admin/job/clear_expired");
}
/**
 * 查询索引任务详情
 */
export async function fetch_job_profile(id: string) {
  const r = await client.get<{
    id: string;
    desc: string;
    type: TaskTypes;
    status: TaskStatus;
    lines: string[];
    // more_line: boolean;
    created: string;
    content: string;
  }>(`/api/admin/job/${id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { desc, status, type, lines, created } = r.data;
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
    content: lines
      .map((l) => {
        try {
          const r = JSON.parse(l);
          return r;
        } catch (err) {
          console.log(l);
        }
        return null;
      })
      .filter(Boolean),
    hasMoreContent: false,
    created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
  };
  return Result.Ok(data);
}
export type JobProfile = RequestedResource<typeof fetch_job_profile>;

/** 获取指定异步任务的日志列表 */
export async function fetch_output_lines_of_job(body: { job_id: string; page: number; pageSize: number }) {
  const { job_id, page, pageSize } = body;
  const r = await client.get<
    ListResponse<{
      id: string;
      content: string;
      created: string;
    }>
  >(`/api/admin/job/${job_id}/logs`, {
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  const { no_more, total, list } = r.data;
  return Result.Ok({
    page: r.data.page,
    page_size: r.data.page_size,
    noMore: no_more,
    total,
    list: list.map((log) => {
      const { content, created } = log;
      return {
        ...JSON.parse(content),
        // created: dayjs(created).format("YYYY/MM/DD HH:mm:ss.SSS"),
      };
    }),
  });
}

/**
 * 查询索引任务状态
 */
export function fetch_job_status(id: string) {
  return client.get<{ id: string; desc: string; type: TaskTypes; status: TaskStatus; error?: string }>(
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
  return client.get<{ id: string }>(`/api/admin/job/pause/${id}`, {
    force: "1",
  });
}

export function fetchPersonList(params: FetchParams) {
  return client.post<
    ListResponseWithCursor<{
      id: string;
      name: string;
      avatar: string;
      unique_id: string;
    }>
  >("/api/admin/person/list", params);
}
