import {
  ListResponse,
  RequestedResource,
  Result,
  Unpacked,
  UnpackedResult,
} from "@/types";
import { request } from "@/utils/request";
import { FetchParams } from "@/domains/list/typing";
import dayjs from "dayjs";
import { TVItem } from "@/services";
import { TaskStatus } from "@/constants";

/**
 * 开始对分享的文件进行分析
 */
// export function start_shared_files_analysis_task(url: string) {
//   return request.get<{ async_task_id: string }>(
//     `/api/admin/task/start?url=${url}`
//   );
// }
/**
 * 查询异步任务状态
 */
export function fetch_async_task(id: string) {
  return request.get<{ id: string; status: string }>(`/api/admin/task/${id}`);
}
/**
 * 获取当前用户所有异步任务
 */
export async function fetch_async_tasks(params: FetchParams) {
  const resp = await request.get<
    ListResponse<{
      id: string;
      unique_id: string;
      status: TaskStatus;
      desc: string;
      created: string;
    }>
  >(`/api/admin/task/list`, params);
  if (resp.error) {
    return Result.Err(resp.error);
  }
  const result = {
    ...resp.data,
    list: resp.data.list.map((task) => {
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
      };
    }),
  };
  return Result.Ok(result);
}
export type AsyncTask = RequestedResource<typeof fetch_async_tasks>["list"][0];

export function stop_async_task(id: string) {
  return request.get<{ id: string }>(`/api/admin/task/stop/${id}`, {
    force: "1",
  });
}

export function fetch_async_task_profile(id: string) {
  return request.get<{
    id: string;
    desc: string;
    list: {
      async_task_id: string;
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      size_count: string;
      folder_id: string;
      in_same_root_folder: boolean;
      seasons: {
        id: string;
        season: string;
        folders: {
          folder: string;
          resolution: string;
          episodes: {
            id: string;
            file_id: string;
            file_path: string;
            episode: string;
          }[];
        }[];
      }[];
    }[];
  }>(`/api/admin/task/result/${id}`);
}

export type TaskResultOfSharedTV = UnpackedResult<
  Unpacked<ReturnType<typeof fetch_async_task_profile>>
>;

export function complete_async_task(
  id: string,
  options: {
    action: "save" | "drop";
    folder_id: string;
    tv_id: string;
    drive_id?: string;
  }
) {
  const { action, drive_id, tv_id, folder_id } = options;
  return request.get(
    `/api/admin/task/complete/${id}?action=${action}&drive_id=${drive_id}&folder_id=${folder_id}&tv_id=${tv_id}`
  );
}

/**
 * 判断是否有同名文件夹
 */
export async function check_has_same_name_tv(body: {
  /** 检查是否有新增文件的文件夹名称 */
  file_name: string;
}) {
  return request.post<null | TVItem>(
    "/api/admin/shared_file/check_same_name",
    body
  );
}

/**
 * 将分享文件夹和网盘内的文件夹建立关联关系，用于后续更新
 */
export async function build_link_between_shared_files_with_folder(body: {
  /** 分享链接 */
  url: string;
  /** 分享文件夹 id */
  file_id: string;
  /** 分享文件夹名称 */
  file_name: string;
  /** 要建立关联的网盘内文件夹名称 */
  target_file_name?: string;
  /** 要建立关联的网盘内文件夹id */
  target_file_id?: string;
}) {
  return request.post("/api/admin/shared_file/link", body);
}

/**
 * 根据分享链接获取文件夹列表（支持分页）
 */
export async function fetch_shared_files(body: {
  url: string;
  file_id: string;
  next_marker: string;
}) {
  const { url, file_id, next_marker } = body;
  const r = await request.get<{
    items: {
      file_id: string;
      name: string;
      next_marker: string;
      parent_file_id: string;
      size: number;
      type: "folder" | "file";
      thumbnail: string;
    }[];
    next_marker: string;
  }>("/api/admin/shared_file", { url, file_id, next_marker });
  return r;
}
export type AliyunFolderItem = RequestedResource<
  typeof fetch_shared_files
>["items"][0];

/**
 * 转存指定的分享文件到指定网盘
 * @param body
 * @returns
 */
export async function save_shared_files(body: {
  /** 分享链接 */
  url: string;
  /** 要转存的文件/文件夹 file_id */
  file_id: string;
  /** 要转存的文件/文件夹名称 */
  file_name: string;
  /** 转存到指定网盘 */
  drive_id: string;
  /** 转存到指定网盘的哪个文件夹，默认是根目录 */
  target_folder_id?: string;
}) {
  return request.post("/api/admin/shared_file/save", body);
}
