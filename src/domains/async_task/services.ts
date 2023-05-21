import { TaskStatus } from "@/constants";
import { RequestedResource } from "@/types";
import { request } from "@/utils/request";

/**
 * 查询索引任务状态
 */
export function fetch_async_task(id: string) {
  return request.get<{ id: string; desc: string; status: TaskStatus }>(
    `/api/admin/task/${id}`
  );
}
export type PartialAsyncTask = RequestedResource<typeof fetch_async_task>;
