import { TVItem } from "@/services/index";
import { media_request } from "@/biz/requests/index";
import { TmpRequestResp } from "@/domains/request/utils";
import { FetchParams } from "@/domains/list/typing";
import { ListResponse, RequestedResource, Unpacked } from "@/types/index";

/**
 * 判断是否有同名文件夹
 */
export function check_has_same_name_tv(body: {
  /** 检查是否有新增文件的文件夹名称 */
  file_name: string;
}) {
  return media_request.post<null | TVItem>("/api/admin/shared_file/check_same_name", body);
}

/**
 * 根据分享链接获取文件夹列表（支持分页）
 */
export function fetch_resource_files(body: { url: string; code?: string; file_id: string; next_marker: string }) {
  const { url, code, file_id, next_marker } = body;
  return media_request.post<{
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
}
export type AliyunFolderItem = NonNullable<Unpacked<TmpRequestResp<typeof fetch_resource_files>>>["items"][0];

/**
 * 搜索分享资源文件夹
 */
export function searchResourceFiles(body: { url: string; code?: string; keyword: string }) {
  const { url, code, keyword } = body;
  return media_request.post<{
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
}

/**
 * 转存指定的分享文件到指定云盘
 * @param body
 * @returns
 */
export function saveSharedFiles(body: {
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
  return media_request.post<{ job_id: string }>("/api/v2/admin/resource/transfer", body);
}

export function fetch_shared_file_save_list(body: FetchParams) {
  return media_request.get<
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
export type SharedFileSaveItem = NonNullable<
  Unpacked<TmpRequestResp<typeof fetch_shared_file_save_list>>
>["list"][number];
