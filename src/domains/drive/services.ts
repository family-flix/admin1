/**
 * @file 云盘相关 service
 */
import dayjs from "dayjs";

import { client } from "@/store/request";
import { FetchParams } from "@/domains/list/typing";
import { JSONObject, ListResponse, ListResponseWithCursor, RequestedResource, Result } from "@/types";
import { DriveTypes, FileType, MediaTypes } from "@/constants";
import { bytes_to_size } from "@/utils";

import { DriveCore } from ".";

/** 解析一段 json 字符串 */
async function parseJSONStr<T extends JSONObject>(json: string) {
  try {
    if (json[0] !== "{") {
      return Result.Err("不是合法的 json");
    }
    const d = JSON.parse(json);
    return Result.Ok(d as T);
  } catch (err) {
    const e = err as Error;
    return Result.Err(e);
  }
}

/**
 * 新增云盘
 * @param {object} body 提交体
 * @param {string} body.payload 从阿里云盘页面通过脚本生成的云盘信息 json 字符串
 */
export async function addDrive(body: { type?: DriveTypes; payload: string }) {
  const { type = DriveTypes.AliyunBackupDrive, payload } = body;
  const r = await parseJSONStr(payload);
  if (r.error) {
    return Result.Err(r.error);
  }
  return client.post<{ id: string }>("/api/v2/admin/drive/add", {
    type,
    payload: r.data,
  });
}

/**
 * 更新阿里云盘信息
 * @param {string} id 云盘 id
 */
export function updateAliyunDriveRemark(id: string, body: { remark?: string }) {
  return client.post<{ id: string }>(`/api/admin/drive/${id}/remark`, body);
}

/**
 * 更新阿里云盘信息
 * @param {string} id 云盘 id
 */
export function updateAliyunDriveVisible(id: string, body: { hide?: number }) {
  return client.post<{ id: string }>(`/api/admin/drive/${id}/hide`, body);
}

/**
 * 更新阿里云盘信息
 * @param {string} id 云盘 id
 * @param {object} body 云盘信息（目前仅支持传入 remark、root_folder_id、root_folder_name
 */
export function updateAliyunDrive(
  id: string,
  body: { remark?: string; hidden?: number; root_folder_id?: string; root_folder_name?: string }
) {
  return client.post<{ id: string }>(`/api/admin/drive/${id}/update`, body);
}

/**
 * 获取阿里云盘列表
 */
export async function fetchDriveList(params: FetchParams) {
  const { page, pageSize, ...restParams } = params;
  const resp = await client.post<
    ListResponseWithCursor<{
      id: string;
      /** 云盘自定义名称 */
      name: string;
      /** 头像 */
      avatar: string;
      /** 云盘已使用大小 */
      used_size: number;
      /** 云盘总大小 */
      total_size: number;
      /** 索引根目录 */
      root_folder_id?: string;
      drive_id: string;
      vip?: {
        name: string;
        expired_at: number;
        started_at: number;
      }[];
    }>
  >("/api/admin/drive/list", {
    page,
    page_size: pageSize,
    hidden: 0,
    ...restParams,
  });
  if (resp.error) {
    return Result.Err(resp.error);
  }
  const { total, page_size, list, next_marker } = resp.data;
  return Result.Ok({
    next_marker,
    total,
    page,
    page_size,
    list: list.map((item) => {
      const { id, name, avatar, drive_id, total_size, used_size, root_folder_id, vip = [] } = item;
      const valid_vip = vip
        .filter((v) => {
          return dayjs(v.expired_at * 1000).isAfter(dayjs());
        })
        .map((v) => {
          return {
            ...v,
            expired_at_text: dayjs(v.expired_at * 1000).format("YYYY/MM/DD HH:mm:ss"),
          };
        });
      return {
        id,
        name,
        avatar,
        drive_id,
        /** 云盘总大小 */
        total_size: bytes_to_size(total_size),
        /** 云盘已使用大小 */
        used_size: bytes_to_size(used_size),
        /** 云盘空间使用百分比 */
        used_percent: (() => {
          const percent = parseFloat(((used_size / total_size) * 100).toFixed(2));
          if (percent > 100) {
            return 100;
          }
          return percent;
        })(),
        /** 是否可以使用（已选择索引根目录） */
        initialized: !!root_folder_id,
        vip: valid_vip,
      };
    }),
  });
}
export type DriveItem = RequestedResource<typeof fetchDriveList>["list"][0];

export async function fetchDriveInstanceList(params: FetchParams) {
  const r = await fetchDriveList(params);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { total, page, page_size, next_marker, list } = r.data;
  return Result.Ok({
    total,
    page,
    page_size,
    next_marker,
    list: list.map((drive) => {
      return new DriveCore(drive);
    }),
  });
}

/**
 * 刷新云盘信息
 * @param {object} body
 * @param {string} body.drive_id
 */
export async function refreshDriveProfile(body: { drive_id: string }) {
  const { drive_id } = body;
  const r = await client.get<{
    id: string;
    name: string;
    user_name: string;
    nick_name: string;
    avatar: string;
    used_size: number;
    total_size: number;
  }>(`/api/admin/drive/refresh/${drive_id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, avatar, nick_name, user_name, total_size, used_size } = r.data;
  return Result.Ok({
    id,
    /** 云盘名称 */
    name: name || user_name || nick_name,
    user_name,
    /** 云盘图标 */
    avatar,
    /** 云盘总大小 */
    total_size: bytes_to_size(total_size),
    /** 云盘已使用大小 */
    used_size: bytes_to_size(used_size),
    /** 云盘空间使用百分比 */
    used_percent: (() => {
      const percent = parseFloat(((used_size / total_size) * 100).toFixed(2));
      if (percent > 100) {
        return 100;
      }
      return percent;
    })(),
  });
}

/**
 * 全量索引指定云盘
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 * @param {string} [body.target_folder] 要索引的云盘内指定文件夹 id
 */
export async function analysisDrive(body: {
  drive_id: string;
  target_folders?: { file_id: string; parent_paths?: string; name: string }[];
}) {
  const { drive_id, target_folders } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/analysis", {
    drive_id,
    target_folders,
  });
}

/**
 * 全量索引指定云盘
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 * @param {string} [body.target_folder] 要索引的云盘内指定文件夹 id
 */
export async function analysisSpecialFilesInDrive(body: {
  drive_id: string;
  files: { file_id: string; type: FileType; name: string }[];
}) {
  const { drive_id, files } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/analysis/files", {
    drive_id,
    files,
  });
}

/**
 * 索引指定云盘新增的文件/文件夹
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 */
export async function analysisNewFilesInDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/analysis/new_files", {
    drive_id,
  });
}

/**
 * 搜索指定云盘内所有解析到、但没有匹配到详情的影视剧
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 */
export async function matchParsedMediasInDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return client.post<{ job_id: string }>("/api/v2/admin/parsed_media/match_profile", {
    drive_id,
  });
}

/**
 * 获取云盘详情
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export async function fetchDriveProfile(body: { drive_id: string }) {
  const { drive_id } = body;
  return client.get<{ id: string; root_folder_id: string }>(`/api/admin/drive/${drive_id}`);
}
export type AliyunDriveProfile = RequestedResource<typeof fetchDriveProfile>;

/**
 * 删除指定云盘
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export function deleteDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return client.get(`/api/admin/drive/delete/${drive_id}`);
}

/**
 * 导出云盘信息
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export async function exportDriveInfo(body: { drive_id: string }) {
  const { drive_id } = body;
  return client.get<{
    app_id: string;
    drive_id: string;
    device_id: string;
    access_token: string;
    refresh_token: string;
    avatar: string;
    nick_name: string;
    aliyun_user_id: string;
    user_name: string;
    root_folder_id?: string;
    total_size?: number;
    used_size?: number;
  }>(`/api/admin/drive/export/${drive_id}`);
}

/**
 * 设置云盘索引根目录
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 * @param {string} body.root_folder_id 云盘根目录id
 */
export async function setDriveRootFolderId(body: {
  drive_id: string;
  root_folder_id: string;
  root_folder_name: string;
}) {
  const { root_folder_id, root_folder_name, drive_id } = body;
  return client.post<void>("/api/v2/drive/update", {
    drive_id,
    payload: {
      root_folder_id,
      root_folder_name,
    },
  });
}

/**
 * 更新阿里云盘 refresh_token
 * @param {object} body
 * @param {string} body.drive 云盘 id
 * @param {string} body.refresh_token 新的 refresh_token 值
 */
export async function setAliyunDriveRefreshToken(values: { refresh_token: string; drive_id: string }) {
  const { refresh_token, drive_id } = values;
  return client.post<void>(`/api/admin/drive/token/${drive_id}`, {
    refresh_token,
  });
}

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
  const r = await client.get<{
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
  }>(`/api/admin/drive/files/${drive_id}`, {
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
 * 给指定云盘的指定文件夹内，新增一个新文件夹
 * @param {object} body
 * @param {string} body.drive_id 云盘id
 * @param {string} body.name 新文件夹名称
 * @param {string} [body.parent_file_id='root'] 父文件夹id
 */
export async function addFolderInDrive(body: { drive_id: string; name: string; parent_file_id?: string }) {
  const { drive_id, name, parent_file_id = "root" } = body;
  return client.post<{
    file_id: string;
    name: string;
    parent_file_id: string;
  }>(`/api/admin/drive/files/add/${drive_id}`, {
    name,
    parent_file_id,
  });
}

/**
 * 指定云盘签到
 * @param {object} body
 * @param {string} body.drive_id 云盘id
 */
export async function checkInDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return client.get(`/api/admin/drive/check_in/${drive_id}`);
}

/**
 * 领取所有签到奖励
 * @param {object} body
 * @param {string} body.drive_id 云盘id
 */
export async function receiveCheckInRewardOfDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return client.get<{ job_id: string }>(`/api/admin/drive/receive_rewards/${drive_id}`);
}

/**
 * 删除指定云盘的文件
 */
export function deleteFile(body: { drive_id: string; file_id: string }) {
  const { drive_id, file_id } = body;
  return client.get<{ job_id: string }>(`/api/admin/file/${file_id}/delete?drive_id=${drive_id}`);
}

/**
 * 重命名指定云盘的文件
 */
export function renameFile(body: { parsed_media_source_id: string; name: string }) {
  const { parsed_media_source_id, name } = body;
  return client.post<{ job_id: string }>(`/api/v2/admin/parsed_media_source/rename`, {
    parsed_media_source_id,
    name,
  });
}

/** 用正则重命名多个文件 */
export function renameChildFilesName(values: { drive_id: string; file_id: string; regexp: string; replace: string }) {
  const { drive_id, file_id, regexp, replace } = values;
  return client.post<{ job_id: string }>(`/api/v2/aliyundrive/rename_files`, {
    drive_id,
    file_id,
    regexp,
    replace,
  });
}

export function transferFileToAnotherDrive(values: { drive_id: string; file_id: string; target_drive_id: string }) {
  const { drive_id, target_drive_id, file_id } = values;
  return client.post<{ job_id: string }>(`/api/admin/file/${file_id}/transfer?drive_id=${drive_id}`, {
    from_drive_id: drive_id,
    target_drive_id,
  });
}

export function transferFileToResourceDrive(values: { drive_id: string; file_id: string }) {
  const { drive_id, file_id } = values;
  return client.post<{ job_id: string }>(`/api/admin/file/${file_id}/to_resource_drive?drive_id=${drive_id}`, {
    from_drive_id: drive_id,
  });
}

/**
 * 获取文件详情
 * 主要是看该文件关联的影视剧信息
 */
export function fetchFileProfile(values: { file_id: string; drive_id: string }) {
  const { drive_id, file_id } = values;
  return client.post<{
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
  }>("/api/v2/aliyundrive/file_profile", {
    drive_id,
    file_id,
  });
}
