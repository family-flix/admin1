import { TVItem } from "@/services";
import { client } from "@/store/request";
import { FetchParams } from "@/domains/list/typing";
import { ListResponse, RequestedResource } from "@/types";

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
  return client.post<null | TVItem>("/api/admin/shared_file/check_same_name", body);
}

/**
 * 将分享文件夹和云盘内的文件夹建立关联关系，用于后续更新
 */
export async function build_link_between_shared_files_with_folder(body: {
  /** 分享链接 */
  url: string;
  /** 分享文件夹 id */
  file_id: string;
  /** 分享文件夹名称 */
  file_name: string;
  /** 要建立关联的云盘内文件夹名称 */
  target_file_name?: string;
  /** 要建立关联的云盘内文件夹id */
  target_file_id?: string;
}) {
  return client.post("/api/admin/shared_file/link", body);
}

/**
 * 根据分享链接获取文件夹列表（支持分页）
 */
export async function fetch_resource_files(body: { url: string; code?: string; file_id: string; next_marker: string }) {
  const { url, code, file_id, next_marker } = body;
  const r = await client.post<{
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
  }>("/api/v2/admin/resource/files", { url, code, file_id, next_marker });
  return r;
}
export type AliyunFolderItem = RequestedResource<typeof fetch_resource_files>["items"][0];

/**
 * 搜索分享资源文件夹
 */
export async function search_resource_files(body: { url: string; code?: string; keyword: string }) {
  const { url, code, keyword } = body;
  const r = await client.post<{
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
  }>("/api/admin/shared_file/search", { url, code, keyword });
  return r;
}

/**
 * 转存指定的分享文件到指定云盘
 * @param body
 * @returns
 */
export async function save_shared_files(body: {
  /** 分享链接 */
  url: string;
  /** 转存码 */
  code?: string;
  /** 要转存的文件/文件夹 file_id */
  file_id: string;
  /** 要转存的文件/文件夹名称 */
  file_name: string;
  /** 转存到指定云盘 */
  drive_id: string;
  /** 转存到指定云盘的哪个文件夹，默认是根目录 */
  target_folder_id?: string;
}) {
  return client.post<{ job_id: string }>("/api/v2/admin/resource/transfer", body);
}

export function fetch_shared_file_save_list(body: FetchParams) {
  return client.get<
    ListResponse<{
      id: string;
      url: string;
      name: string;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }>
  >("/api/admin/shared_file_save/list", body);
}
export type SharedFileSaveItem = RequestedResource<typeof fetch_shared_file_save_list>["list"][number];
