import { FetchParams } from "@/domains/list/typing";
import { FileType, MediaTypes } from "@/constants";
import { request } from "@/utils/request";
import { Result } from "@/types";

/**
 * 获取指定云盘内文件夹列表
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 * @param {string} body.file_id 文件夹id（如果传入说明是获取指定文件夹下的文件列表
 * @param {string} body.next_marker 在获取文件列表时，如果是获取下一页，就需要传入该值
 * @param {string} body.name 传入该值时，使用该值进行搜索
 * @param {string} body.page_size 每页文件数量
 */
export async function fetchDriveFiles(
  body: {
    /** 云盘id */
    drive_id: string;
    /** 文件夹id */
    file_id: string;
    next_marker: string;
    /** 按名称搜索时的关键字 */
    name?: string;
  } & FetchParams
) {
  const { drive_id, file_id, name, next_marker, page, pageSize = 24 } = body;
  const r = await request.post<{
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
  }>("/api/v2/drive/file/list", {
    drive_id,
    name,
    file_id,
    next_marker,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  const { items } = r.data;
  return Result.Ok({
    page,
    page_size: pageSize,
    list: items.map((file) => {
      const { file_id, name, parent_file_id, size, type, thumbnail } = file;
      return {
        file_id,
        name,
        type: type === "file" ? FileType.File : FileType.Folder,
        size,
        parent_paths: [
          {
            file_id: parent_file_id,
            name: "",
          },
        ],
      };
    }),
    no_more: r.data.next_marker === "",
    next_marker: r.data.next_marker,
  });
}
// export type AliyunDriveFile = UnpackedResult<Unpacked<ReturnType<typeof fetchDriveFiles>>>["list"][number];

/**
 * 获取文件详情
 * 主要是看该文件关联的影视剧信息
 */
export function fetchFileProfile(values: { file_id: string; drive_id: string }) {
  const { drive_id, file_id } = values;
  return request.post<{
    id: string;
    type: FileType;
    file_name: string;
    content_hash: string | null;
    size: number | null;
    thumbnail_path: string | null;
    mine_type: string;
    media: null | {
      id: string;
      step: number;
      type: MediaTypes;
      name: string;
      poster_path: string;
      episode_text: string | null;
      episode_name: string | null;
    };
    unknown_media: null | {
      id: string;
      step: number;
      type: MediaTypes;
      name: string;
      original_name: string | null;
      season_text: string | null;
      episode_text: string | null;
    };
  }>("/api/v2/drive/file/profile", {
    drive_id,
    file_id,
  });
}

/** 用正则重命名多个文件 */
export function renameFilesInDrive(values: { drive_id: string; file_id: string; regexp: string; replace: string }) {
  const { drive_id, file_id, regexp, replace } = values;
  return request.post<{ job_id: string }>(`/api/v2/drive/rename_files`, {
    drive_id,
    file_id,
    regexp,
    replace,
  });
}

/**
 * 重命名指定云盘的文件
 */
export function renameFileInDrive(body: { drive_id: string; file_id: string; name: string }) {
  const { drive_id, file_id, name } = body;
  return request.post<{ job_id: string }>(`/api/v2/drive/file/rename`, {
    drive_id,
    file_id,
    name,
  });
}

/**
 * 删除指定云盘的文件
 */
export function deleteFileInDrive(body: { drive_id: string; file_id: string }) {
  const { drive_id, file_id } = body;
  return request.post<{ job_id: string }>("/api/v2/drive/file/delete", {
    drive_id,
    file_id,
  });
}
