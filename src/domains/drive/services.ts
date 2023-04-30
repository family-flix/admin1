/**
 * @file 网盘相关 service
 */
import { request } from "@/utils/request";
import { bytes_to_size, sleep } from "@/utils";
import { FetchParams } from "@/domains/list-helper-core";
import { ListResponse, RequestedResource, Result } from "@/types";

async function parseJSONStr<T extends Record<string, unknown>>(json: string) {
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
 */
export async function add_aliyun_drive(body: { payload: string }) {
  const { payload } = body;
  const r = await parseJSONStr(payload);
  if (r.error) {
    return Result.Err(r.error);
  }
  return await request.post<{ id: string }>("/api/drive/add", {
    payload: r.data,
  });
}

/**
 * 更新阿里云盘信息
 * @param id
 * @param body
 * @returns
 */
export function update_aliyun_drive(id: string, body: Record<string, unknown>) {
  return request.post<{ id: string }>(`/api/drive/update/${id}`, body);
}

/**
 * 获取阿里云盘列表
 */
export async function fetch_aliyun_drives(params: FetchParams) {
  const resp = await request.get<
    ListResponse<{
      id: string;
      /** 云盘自定义名称 */
      name: string;
      /** 这个是一定存在的 */
      user_name: string;
      /** 头像 */
      avatar: string;
      /** 云盘已使用大小 */
      used_size: number;
      /** 云盘总大小 */
      total_size: number;
      /** 索引根目录 */
      root_folder_id?: string;
    }>
  >("/api/drive/list", params);
  if (resp.error) {
    return Result.Err(resp.error);
  }
  const { total, page, page_size, list } = resp.data;
  return Result.Ok({
    total,
    page,
    page_size,
    list: list.map((item) => {
      const {
        id,
        name,
        avatar,
        user_name,
        total_size,
        used_size,
        root_folder_id,
      } = item;
      return {
        id,
        name: name || user_name,
        user_name,
        avatar,
        total_size: bytes_to_size(total_size),
        used_size: bytes_to_size(used_size),
        /** 网盘空间使用百分比 */
        used_percent: (used_size / total_size) * 100,
        /** 是否可以使用（已选择索引根目录） */
        initialized: !!root_folder_id,
      };
    }),
  });
}
export type AliyunDriveItem = RequestedResource<
  typeof fetch_aliyun_drives
>["list"][0];

/**
 * 刷新阿里云盘信息
 */
export async function refresh_drive_profile(body: { aliyun_drive_id: string }) {
  const { aliyun_drive_id } = body;
  const r = await request.get<{
    id: string;
    name: string;
    /** 这个是一定存在的 */
    user_name: string;
    nick_name: string;
    avatar: string;
    used_size: number;
    total_size: number;
  }>(`/api/drive/refresh/${aliyun_drive_id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { id, name, avatar, nick_name, user_name, total_size, used_size } =
    r.data;
  return Result.Ok({
    id,
    name: name || user_name || nick_name,
    user_name,
    avatar,
    total_size: bytes_to_size(total_size),
    used_size: bytes_to_size(used_size),
    /** 网盘空间使用百分比 */
    used_percent: (used_size / total_size) * 100,
  });
}

/**
 * 在 TMDB 刮削索引到的影视剧信息
 * @param body
 * @returns
 */
export async function analysis_aliyun_drive(body: {
  aliyun_drive_id: string;
  target_folder?: string;
}) {
  const { aliyun_drive_id, target_folder } = body;
  const [resp] = await Promise.all([
    request.get<{ async_task_id: string }>(
      `/api/drive/analysis/${aliyun_drive_id}`,
      { target_folder }
    ),
    sleep(600),
  ]);
  return resp;
}

/**
 * 在 TMDB 刮削索引到的影视剧信息
 * @param body
 * @returns
 */
export async function scrape_aliyun_drive(body: { aliyun_drive_id: string }) {
  const { aliyun_drive_id } = body;
  return request.get<{ async_task_id: string }>(
    `/api/drive/scrape/${aliyun_drive_id}`
  );
}

export async function fetch_aliyun_drive_profile(body: { id: string }) {
  const { id } = body;
  return request.get<{ id: string; root_folder_id: string }>(
    `/api/drive/${id}`
  );
}
export type AliyunDriveProfile = RequestedResource<
  typeof fetch_aliyun_drive_profile
>;

/**
 * 指定阿里云盘合并同名电视剧
 * @deprecated 直接索引就可以了
 * @param body
 * @returns
 */
export async function merge_same_tv_for_aliyun_drive(body: {
  aliyun_drive_id: string;
}) {
  const { aliyun_drive_id } = body;
  return await request.get<void>(`/api/drive/merge/${aliyun_drive_id}`);
}

/**
 * 删除指定云盘
 * @param body
 * @returns
 */
export function delete_aliyun_drive(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/drive/delete/${id}`);
}

/**
 * 导出云盘信息
 * @param id
 * @returns
 */
export async function export_aliyun_drive(body: { aliyun_drive_id: string }) {
  const { aliyun_drive_id } = body;
  return await request.get<{
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
  }>(`/api/drive/export/${aliyun_drive_id}`);
}

/**
 * 更新阿里云盘 refresh_token
 */
export async function update_drive_refresh_token(body: {
  drive_id: string;
  refresh_token: string;
}) {
  const { drive_id, refresh_token } = body;
  const r = await request.post(`/api/drive/token/${drive_id}`, {
    refresh_token,
  });
  if (r.error) {
    return r;
  }
  return r;
}

export async function set_drive_root_file_id(values: {
  root_folder_id: string;
  drive_id: string;
}) {
  const { root_folder_id: root_folder_id, drive_id } = values;
  const r = await request.post<void>(`/api/drive/root_file/${drive_id}`, {
    root_folder_id,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  return r;
}

export async function set_drive_refresh_token(values: {
  refresh_token: string;
  drive_id: string;
}) {
  const { refresh_token, drive_id } = values;
  const r = await request.post<void>(`/api/drive/token/${drive_id}`, {
    refresh_token,
  });
  if (r.error) {
    return Result.Err(r.error);
  }
  return r;
}

/**
 * 获取指定网盘内文件夹列表
 */
export async function fetch_aliyun_drive_files(body: {
  /** 网盘id */
  drive_id: string;
  /** 文件夹id */
  file_id: string;
  next_marker: string;
  /** 按名称搜索时的关键字 */
  name?: string;
  /** 每页数量 */
  page_size?: number;
}) {
  const { drive_id, file_id, name, next_marker, page_size = 24 } = body;
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
  }>(`/api/drive/files/${drive_id}`, { name, file_id, next_marker, page_size });
  return r;
}

/**
 * 给指定网盘的指定文件夹内，新增一个新文件夹
 */
export async function add_folder_in_drive(values: {
  drive_id: string;
  name: string;
  parent_file_id?: string;
}) {
  const { drive_id, name, parent_file_id = "root" } = values;
  const r = await request.post<void>(`/api/drive/files/add/${drive_id}`, {
    name,
    parent_file_id,
  });
  return r;
}
