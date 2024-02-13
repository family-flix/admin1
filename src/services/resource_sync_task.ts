import { client } from "@/store/request";
import { FetchParams } from "@/domains/list/typing";
import { ListResponseWithCursor, RequestedResource } from "@/types";

/** 获取同步任务列表 */
export function fetchSyncTaskList(body: FetchParams & { in_production: number; invalid: number; name: string }) {
  return client.post<
    ListResponseWithCursor<{
      id: string;
      resource_file_id: string;
      resource_file_name: string;
      drive_file_id: string;
      drive_file_name: string;
      url: string;
      invalid: number;
      season: null | {
        id: string;
        tv_id: string;
        name: string;
        overview: string;
        air_date: string;
        poster_path: string;
        cur_episode_count: number;
        episode_count: number;
      };
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }>
  >("/api/v2/admin/sync_task/list", body);
}
export type SyncTaskItem = RequestedResource<typeof fetchSyncTaskList>["list"][number];
/**
 * 添加分享资源的同步任务
 * @param body
 * @returns
 */
export function createSyncTaskWithUrl(body: {
  url: string;
  resource_file_id?: string;
  resource_file_name?: string;
  drive_file_id?: string;
  drive_file_name?: string;
  drive_id?: string;
}) {
  const { url, resource_file_id, resource_file_name, drive_file_id, drive_file_name, drive_id } = body;
  return client.post<{}>(`/api/v2/admin/sync_task/create`, {
    url,
    resource_file_id,
    resource_file_name,
    drive_file_id,
    drive_file_name,
    drive_id,
  });
}

/** 获取同步任务列表 */
export function fetchPartialSyncTask(params: { id: string }) {
  return client.post<{
    id: string;
    resource_file_id: string;
    resource_file_name: string;
    drive_file_id: string;
    drive_file_name: string;
    url: string;
    invalid: number;
    season: null | {
      id: string;
      tv_id: string;
      name: string;
      overview: string;
      air_date: string;
      poster_path: string;
      cur_episode_count: number;
      episode_count: number;
    };
    drive: {
      id: string;
      name: string;
      avatar: string;
    };
  }>("/api/v2/admin/sync_task/partial", {
    id: params.id,
  });
}

/**
 * 执行一次分享资源的同步任务
 * @param body
 * @returns
 */
export function runSyncTask(body: { id: string }) {
  const { id } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/sync_task/run", {
    id,
  });
}

/** 修改同步任务管理的电视剧 */
export function updateSyncTask(params: { id: string; season_id: string }) {
  const { id, season_id } = params;
  return client.post<{
    id: string;
    resource_file_id: string;
    resource_file_name: string;
    drive_file_id: string;
    drive_file_name: string;
    url: string;
    season: null | {
      id: string;
      name: string;
      overview: string;
      poster_path: string;
    };
    drive: {
      id: string;
    };
  }>("/api/v2/admin/sync_task/update", { id, season_id });
}
/**
 * 执行所有电视剧同步任务
 */
export function runSyncTaskList() {
  return client.get<{ job_id: string }>("/api/v2/admin/sync_task/run_all");
}

/** 标记同步任务已完结 */
export function completeSyncTask(params: { id: string }) {
  const { id } = params;
  return client.post<{}>("/api/v2/admin/sync_task/complete", { id });
}
/** 删除同步任务 */
export function deleteSyncTask(params: { id: string }) {
  const { id } = params;
  return client.post<{}>("/api/v2/admin/sync_task/delete", { id });
}
/** 给指定同步任务覆盖另一个分享资源 */
export function overrideResourceForSyncTask(values: {
  id: string;
  url: string;
  resource_file_id?: string;
  resource_file_name?: string;
}) {
  const { id, url, resource_file_id, resource_file_name } = values;
  return client.post<{}>("/api/v2/admin/sync_task/override", {
    id,
    url,
    resource_file_id,
    resource_file_name,
  });
}
