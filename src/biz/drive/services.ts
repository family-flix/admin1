/**
 * @file 云盘相关 service
 */
import dayjs from "dayjs";

import { FetchParams } from "@/domains/list/typing";
import { Result } from "@/domains/result/index";
import { media_request } from "@/biz/requests/index";
import { ListResponseWithCursor } from "@/biz/requests/types";
import { RequestPayload, TmpRequestResp, RequestedResource } from "@/domains/request/utils";
import { DriveTypes, FileType } from "@/constants/index";
import { JSONObject } from "@/types/index";
import { bytes_to_size } from "@/utils/index";

/** 解析一段 json 字符串 */
function parseJSONStr<T extends JSONObject>(json: string) {
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
 * @param {DriveTypes} body.type 云盘类型
 * @param {string} body.payload 云盘基本信息、授权凭证等等
 */
export function addDrive(body: { type?: DriveTypes; payload: string }) {
  const { type = DriveTypes.AliyunBackupDrive, payload } = body;
  // @todo 增加 beforeRequest hook？
  const r = parseJSONStr(payload);
  if (r.error) {
    return {} as RequestPayload<{ id: string }>;
  }
  return media_request.post<{ id: string }>("/api/v2/admin/drive/add", {
    type,
    payload: r.data,
  });
}

/**
 * 更新云盘信息
 * @param {string} id 云盘 id
 * @param {object} body 云盘信息（目前仅支持传入 remark、hidden
 */
export function updateDriveProfile(
  body: Partial<{
    id: string;
    remark: string;
    hidden: number;
    root_folder_id: string;
    root_folder_name: string;
  }>
) {
  const { id, remark, hidden, root_folder_id, root_folder_name } = body;
  return media_request.post<{ id: string }>("/api/v2/admin/drive/update", {
    id,
    remark,
    hidden,
    root_folder_id,
    root_folder_name,
  });
}
/**
 * 获取阿里云盘列表
 */
export function fetchDriveList(params: FetchParams) {
  const { page, pageSize, hidden = 0, ...rest } = params;
  return media_request.post<
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
  >("/api/v2/admin/drive/list", {
    ...rest,
    page,
    page_size: pageSize,
    hidden,
  });
}
export type DriveItem = RequestedResource<typeof fetchDriveListProcess>["list"][0];
export function fetchDriveListProcess(r: TmpRequestResp<typeof fetchDriveList>) {
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { total, page_size, list, next_marker } = r.data;
  return Result.Ok({
    next_marker,
    total,
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
      const payload = {
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
      return payload;
    }),
  });
}

/**
 * 刷新云盘信息
 * @param {object} body
 * @param {string} body.drive_id
 */
export function refreshDriveProfile(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post<{
    id: string;
    name: string;
    user_name: string;
    nick_name: string;
    avatar: string;
    used_size: number;
    total_size: number;
  }>("/api/v2/admin/drive/refresh", {
    id: drive_id,
  });
}
export function refreshDriveProfileProcess(r: TmpRequestResp<typeof refreshDriveProfile>) {
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
export function analysisDrive(body: {
  drive_id: string;
  target_folders?: { file_id: string; parent_paths?: string; name: string }[];
}) {
  const { drive_id, target_folders } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/analysis", {
    drive_id,
    target_folders,
  });
}

/**
 * 索引云盘指定文件
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 * @param {string} [body.target_folder] 要索引的云盘内指定文件夹 id
 */
export function analysisSpecialFilesInDrive(body: {
  drive_id: string;
  files: { file_id: string; type: FileType; name: string }[];
}) {
  const { drive_id, files } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/analysis/files", {
    drive_id,
    files,
  });
}
/**
 * 文件洗码
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 * @param {string} [body.target_folder] 要索引的云盘内指定文件夹 id
 */
export function changeDriveFileHash(body: {
  drive_id: string;
  file: { file_id: string; type: FileType; name: string };
}) {
  const { drive_id, file } = body;
  return media_request.post<{ job_id: string }>("/api/v2/drive/file/change_hash", {
    file_id: file.file_id,
    drive_id,
  });
}
/**
 * 索引指定云盘新增的文件/文件夹
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 */
export function analysisNewFilesInDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/analysis/new_files", {
    drive_id,
  });
}
/**
 * 搜索指定云盘内所有解析到、但没有匹配到详情的影视剧
 * @deprecated
 * @param {object} body
 * @param {string} body.drive_id 要索引的云盘 id
 */
export function matchParsedMediasInDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/parsed_media/match_profile", {
    drive_id,
  });
}
/**
 * 获取云盘详情
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export function fetchDriveProfile(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.get<{ id: string; root_folder_id: string }>("/api/v2/admin/drive/profile", { id: drive_id });
}
export type DriveProfile = RequestedResource<typeof fetchDriveProfile>;

/**
 * 删除指定云盘
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export function deleteDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post("/api/v2/admin/drive/delete", {
    id: drive_id,
  });
}
/**
 * 导出云盘信息
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 */
export function exportDriveInfo(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post<{
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
  }>("/api/v2/admin/drive/export", {
    id: drive_id,
  });
}
/**
 * 更新阿里云盘 refresh_token
 * @param {object} body
 * @param {string} body.drive_id 云盘 id
 * @param {string} body.refresh_token 新的 refresh_token 值
 */
export function setDriveToken(values: { drive_id: string; refresh_token: string }) {
  const { drive_id, refresh_token } = values;
  return media_request.post<void>("/api/v2/admin/drive/set_token", {
    id: drive_id,
    refresh_token,
  });
}
/**
 * 给指定云盘的指定文件夹内，新增一个新文件夹
 * @param {object} body
 * @param {string} body.drive_id 云盘id
 * @param {string} body.name 新文件夹名称
 * @param {string} [body.parent_file_id='root'] 父文件夹id
 */
export function addFolderInDrive(body: { drive_id: string; name: string; parent_file_id?: string }) {
  const { drive_id, name, parent_file_id = "root" } = body;
  return media_request.post<{
    file_id: string;
    name: string;
    parent_file_id: string;
  }>("/api/v2/drive/files/add", {
    id: drive_id,
    name,
    parent_file_id,
  });
}
/**
 * 指定云盘签到
 * @param {object} body
 * @param {string} body.drive_id 云盘id
 */
export function checkInDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post("/api/v2/admin/drive/check_in", {
    id: drive_id,
  });
}
/**
 * 领取所有签到奖励
 * @param {object} body
 * @param {string} body.drive_id 云盘id
 */
export function receiveCheckInRewardOfDrive(body: { drive_id: string }) {
  const { drive_id } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/drive/receive_rewards", {
    id: drive_id,
  });
}
/**
 * 重命名指定云盘的文件
 */
export function renameFile(body: { parsed_media_source_id: string; name: string }) {
  const { parsed_media_source_id, name } = body;
  return media_request.post<{ job_id: string }>("/api/v2/admin/parsed_media_source/rename", {
    parsed_media_source_id,
    name,
  });
}
