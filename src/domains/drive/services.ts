/**
 * @file 云盘相关 service
 */
import { FetchParams } from "@/domains/list/typing";
import { JSONObject, ListResponse, RequestedResource, Result } from "@/types";
import { FileType } from "@/constants";
import { request } from "@/utils/request";
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
 * 新增阿里云盘
 * @param {object} body 提交体
 * @param {string} body.payload 从阿里云盘页面通过脚本生成的云盘信息 json 字符串
 */
export async function addAliyunDrive(body: { type?: number; payload: string }) {
  const { type = 0, payload } = body;
  const r = await parseJSONStr(payload);
  if (r.error) {
    return Result.Err(r.error);
  }
  return request.post<{ id: string }>("/api/admin/drive/add", {
    // 阿里云备份盘
    type,
    payload: r.data,
  });
}

/**
 * 更新阿里云盘信息
 * @param {string} id 云盘 id
 * @param {object} body 云盘信息（目前仅支持传入 name、refresh_token、root_folder_id
 */
export function updateAliyunDrive(id: string, body: JSONObject) {
  return request.post<{ id: string }>(`/api/admin/drive/update/${id}`, body);
}

/**
 * 获取阿里云盘列表
 */
export async function fetchDrives(params: FetchParams) {
  const { page, pageSize, ...restParams } = params;
  const resp = await request.get<
    ListResponse<{
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
    }>
  >("/api/admin/drive/list", {
    page,
    page_size: pageSize,
    ...restParams,
  });
  if (resp.error) {
    return Result.Err(resp.error);
  }
  const { total, page_size, list, no_more } = resp.data;
  return Result.Ok({
    total,
    page,
    page_size,
    no_more,
    list: list.map((item) => {
      const { id, name, avatar, total_size, used_size, root_folder_id } = item;
      return {
        id,
        name,
        avatar,
        /** 云盘总大小 */
        total_size: bytes_to_size(total_size),
        /** 云盘已使用大小 */
        used_size: bytes_to_size(used_size),
        /** 云盘空间使用百分比 */
        used_percent: (() => {
          const percent = (used_size / total_size) * 100;
          if (percent > 100) {
            return 100;
          }
          return percent;
        })(),
        /** 是否可以使用（已选择索引根目录） */
        initialized: !!root_folder_id,
      };
    }),
  });
}
export type DriveItem = RequestedResource<typeof fetchDrives>["list"][0];

export async function fetch_drive_instance_list(params: FetchParams) {
  const r = await fetchDrives(params);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { total, page, page_size, no_more, list } = r.data;
  return Result.Ok({
    total,
    page,
    page_size,
    no_more,
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
  const r = await request.get<{
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
      const percent = (used_size / total_size) * 100;
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
  const { drive_id: aliyun_drive_id, target_folders } = body;
  return request.post<{ job_id: string }>(`/api/admin/drive/analysis/${aliyun_drive_id}`, {
    target_folders,
  });
}

/**
 * 增量索引指定云盘
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 */
export async function analysisDriveQuickly(body: { drive_id: string }) {
  const { drive_id } = body;
  return request.get<{ job_id: string }>(`/api/admin/drive/analysis_quickly/${drive_id}`);
}

/**
 * 搜索指定云盘内所有解析到的影视剧
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 */
export async function matchMediaFilesMedia(body: { drive_id: string }) {
  const { drive_id: aliyun_drive_id } = body;
  return request.get<{ job_id: string }>(`/api/admin/drive/${aliyun_drive_id}/media_match`);
}

/**
 * 获取云盘详情
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export async function fetchDriveProfile(body: { drive_id: string }) {
  const { drive_id } = body;
  return request.get<{ id: string; root_folder_id: string }>(`/api/admin/drive/${drive_id}`);
}
export type AliyunDriveProfile = RequestedResource<typeof fetchDriveProfile>;

/**
 * 删除指定云盘
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export function deleteDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return request.get(`/api/admin/drive/delete/${drive_id}`);
}

/**
 * 导出云盘信息
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export async function exportDriveInfo(body: { drive_id: string }) {
  const { drive_id } = body;
  return request.get<{
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
export async function setDriveRootFolderId(body: { drive_id: string; root_folder_id: string }) {
  const { root_folder_id: root_folder_id, drive_id } = body;
  return request.post<void>(`/api/admin/drive/root_folder/${drive_id}`, {
    root_folder_id,
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
  return request.post<void>(`/api/admin/drive/token/${drive_id}`, {
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
  return request.post<{
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
  return request.get(`/api/admin/drive/check_in/${drive_id}`);
}

/**
 * 领取所有签到奖励
 * @param {object} body
 * @param {string} body.drive_id 云盘id
 */
export async function receiveCheckInRewardOfDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return request.get(`/api/admin/drive/receive_rewards/${drive_id}`);
}

/**
 * 删除指定云盘的文件
 */
export function deleteFileOfDrive(body: { drive_id: string; file_id: string }) {
  const { drive_id, file_id } = body;
  return request.get<{ job_id: string }>(`/api/admin/drive/${drive_id}/file/${file_id}/delete`);
}

/**
 * 重命名指定云盘的文件
 */
export function renameFileOfDrive(body: { drive_id: string; file_id: string; name: string }) {
  const { drive_id, file_id, name } = body;
  return request.post<void>(`/api/admin/drive/${drive_id}/file/${file_id}/rename`, {
    name,
  });
}

export function createWithFolders(
  drive_id: string,
  body: {
    content_hash: string;
    content_hash_name: "sha1";
    name: string;
    parent_file_id: string;
    part_info_list: { part_number: number }[];
    proof_code: string;
    size: number;
    type: "file";
  }
) {
  return request.post<{
    parent_file_id: string;
    part_info_list: {
      part_number: number;
      upload_url: string;
      internal_upload_url: string;
      content_type: string;
    }[];
    upload_id: string;
    rapid_upload: boolean;
    type: string;
    file_id: string;
    revision_id: string;
    domain_id: string;
    drive_id: string;
    file_name: string;
    encrypt_mode: string;
    location: string;
  }>(`/api/admin/drive/${drive_id}/preupload`, body);
}

export async function fetchTokenOfDrive(drive_id: string) {
  const r = await request.get<{
    access_token: string;
    refresh_token: string;
  }>(`/api/admin/drive/${drive_id}/token`);
  console.log("[SERVICE]fetchTokenOfDrive - ", r);
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok(r.data);
}
