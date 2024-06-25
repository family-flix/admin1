import { media_request } from "@/biz/requests/index";
import { ListResponse } from "@/biz/requests/types";
import { FetchParams } from "@/domains/list/typing";
import { Result, UnpackedResult } from "@/domains/result/index";
import { TmpRequestResp } from "@/domains/request/utils";
import { FileType, MediaTypes } from "@/constants/index";

/**
 * 获取指定云盘内文件夹列表
 */
export function fetchDriveFiles(
  body: {
    /** 云盘id */
    drive_id: string;
    /** 文件夹id（如果传入说明是获取指定文件夹下的文件列表，不传就是获取根文件夹 */
    file_id: string;
    /** 在获取文件列表时，如果是获取下一页，就需要传入该值 */
    next_marker: string;
    /** 按名称搜索时的关键字 */
    name?: string;
  } & FetchParams
) {
  const { drive_id, file_id, name, next_marker, page, pageSize = 24 } = body;
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
  }>("/api/v2/drive/file/list", {
    drive_id,
    name,
    file_id,
    next_marker,
    page,
    page_size: pageSize,
  });
}
export function fetchDriveFilesProcess(r: TmpRequestResp<typeof fetchDriveFiles>) {
  if (r.error) {
    return Result.Err(r.error);
  }
  const { items, next_marker } = r.data;
  return Result.Ok({
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
    no_more: next_marker === "",
    next_marker,
  });
}
// export type AliyunDriveFile = UnpackedResult<Unpacked<ReturnType<typeof fetchDriveFiles>>>["list"][number];

/**
 * 获取文件详情
 * 主要是看该文件关联的影视剧信息
 */
export function fetchFileProfile(values: { file_id: string; drive_id: string }) {
  const { drive_id, file_id } = values;
  return media_request.post<{
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

/**
 * 用正则重命名指定文件夹下的所有子文件
 */
export function renameFilesInDriveWithRegexp(values: {
  drive_id: string;
  file_id: string;
  name: string;
  regexp: string;
  replace: string;
}) {
  const { drive_id, file_id, name, regexp, replace } = values;
  return media_request.post<{ job_id: string }>("/api/v2/drive/rename_files", {
    drive_id,
    file_id,
    name,
    regexp,
    replace,
  });
}

/**
 * 重命名指定云盘的指定文件
 */
export function renameFileInDrive(body: { drive_id: string; file_id: string; name: string }) {
  const { drive_id, file_id, name } = body;
  return media_request.post<{ job_id: string }>("/api/v2/drive/file/rename", {
    drive_id,
    file_id,
    name,
  });
}

/**
 * 删除指定云盘的指定文件
 */
export function deleteFileInDrive(body: { drive_id: string; file_id: string; file_name: string }) {
  const { drive_id, file_id, file_name } = body;
  return media_request.post<{ job_id: string }>("/api/v2/drive/file/delete", {
    drive_id,
    file_id,
    file_name,
  });
}

/**
 * 归档指定文件到资源盘
 */
export function transferFileToAnotherDrive(values: { drive_id: string; file_id: string; to_drive_id: string }) {
  const { drive_id, to_drive_id, file_id } = values;
  return media_request.post<{ job_id: string }>("/api/v2/drive/file/transfer", {
    file_id,
    from_drive_id: drive_id,
    to_drive_id,
  });
}
/**
 * 移动指定文件到对应的资源盘
 * 只有阿里云盘支持
 */
export function transferFileToResourceDrive(values: { drive_id: string; file_id: string }) {
  const { drive_id, file_id } = values;
  return media_request.post<{ job_id: string }>("/api/v2/drive/file/to_resource_drive", {
    file_id,
    from_drive_id: drive_id,
  });
}
/**
 * 使用关键字搜索云盘内的文件
 */
export function searchDriveFiles() {
  return media_request.post<
    ListResponse<{
      id: string;
      file_id: string;
      drive: {
        id: string;
        name: string;
      };
      parent_paths: string;
      name: string;
      type: number;
    }>
  >("/api/admin/file/search");
}
export type FileItem = NonNullable<UnpackedResult<TmpRequestResp<typeof searchDriveFilesProcess>>>["list"][number];
export function searchDriveFilesProcess(r: TmpRequestResp<typeof searchDriveFiles>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((file) => {
      const { id, file_id, name, parent_paths, type, drive } = file;
      return {
        id,
        file_id,
        name,
        file_name: name,
        parent_paths,
        type,
        drive,
      };
    }),
  });
}
/**
 * 获取文件下载链接
 */
export function getFileDownloadURL(values: { file_id: string; drive_id: string }) {
  const { file_id, drive_id } = values;
  return media_request.post<{ url: string }>("/api/v2/drive/file/download", {
    file_id,
    drive_id,
  });
}
/**
 * 删除指定云盘
 */
export function deleteDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post("/api/v2/admin/drive/delete", {
    drive_id,
  });
}
