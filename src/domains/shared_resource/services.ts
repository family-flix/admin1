import { ListResponse, RequestedResource, Result, Unpacked, UnpackedResult } from "@/types";
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
 * 判断是否有同名文件夹
 */
export async function check_has_same_name_tv(body: {
  /** 检查是否有新增文件的文件夹名称 */
  file_name: string;
}) {
  return request.post<null | TVItem>("/api/admin/shared_file/check_same_name", body);
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
export async function fetch_shared_files(body: { url: string; file_id: string; next_marker: string }) {
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
export type AliyunFolderItem = RequestedResource<typeof fetch_shared_files>["items"][0];

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
