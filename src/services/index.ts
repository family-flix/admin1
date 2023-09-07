/**
 *
 */
import { CancelToken } from "axios";
import dayjs from "dayjs";

import { FetchParams } from "@/domains/list/typing";
import { request } from "@/utils/request";
import { JSONObject, ListResponse, RequestedResource, Result, Unpacked, UnpackedResult } from "@/types";
import { EpisodeResolutionTypeTexts, EpisodeResolutionTypes } from "@/domains/tv/constants";
import { ReportTypeTexts, ReportTypes } from "@/constants";
import { query_stringify } from "@/utils";

/**
 * 获取电视剧列表
 */
export async function fetch_tv_list(params: FetchParams & { name: string }) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      first_air_date: string;
      popularity: string;
      episode_count: number;
      season_count: number;
      cur_episode_count: number;
      cur_season_count: number;
      episode_sources: number;
      size_count: number;
      size_count_text: string;
      incomplete: boolean;
      need_bind: boolean;
      sync_task: { id: string } | null;
      tips: string[];
    }>
  >("/api/admin/tv/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((tv) => {
      const { ...rest } = tv;
      return {
        ...rest,
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}
export type TVItem = RequestedResource<typeof fetch_tv_list>["list"][number];

export async function fetch_season_list(
  params: FetchParams &
    Partial<{
      name: string;
      invalid: number;
      duplicated: number;
    }>
) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      tv_id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      first_air_date: string;
      popularity: string;
      season_text: string;
      episode_count: number;
      season_count: number;
      cur_episode_count: number;
      cur_season_count: number;
      episode_sources: number;
      size_count: number;
      size_count_text: string;
      incomplete: boolean;
      need_bind: boolean;
      sync_task: { id: string } | null;
      tips: string[];
    }>
  >("/api/admin/season/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((tv) => {
      const { ...rest } = tv;
      return {
        ...rest,
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}
export type TVSeasonItem = RequestedResource<typeof fetch_season_list>["list"][number];

/*
 * 获取电视剧部分详情
 */
export async function fetch_partial_tv(params: { tv_id: string }) {
  const { tv_id } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      first_air_date: string;
      popularity: string;
      episode_count: number;
      season_count: number;
      cur_episode_count: number;
      cur_season_count: number;
      episode_sources: number;
      size_count: number;
      size_count_text: string;
      incomplete: boolean;
      need_bind: boolean;
      sync_task: { id: string } | null;
      tips: string[];
    }>
  >(`/api/admin/tv/${tv_id}/partial`);
  if (resp.error) {
    return resp;
  }
  return Result.Ok(resp.data);
}

/*
 * 获取电视剧部分详情
 */
export async function fetch_partial_season(params: { season_id: string }) {
  const { season_id } = params;
  const resp = await request.get<{
    id: string;
    tv_id: string;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string;
    season_text: string;
    first_air_date: string;
    popularity: string;
    episode_count: number;
    season_count: number;
    cur_episode_count: number;
    cur_season_count: number;
    episode_sources: number;
    size_count: number;
    size_count_text: string;
    incomplete: boolean;
    need_bind: boolean;
    sync_task: { id: string } | null;
    tips: string[];
  }>(`/api/admin/season/${season_id}/partial`);
  if (resp.error) {
    return resp;
  }
  return Result.Ok(resp.data);
}

/**
 * tv 列表中的元素
 */
export type PartialSearchedTVFromTMDB = UnpackedResult<Unpacked<ReturnType<typeof search_tv_in_tmdb>>>["list"][number];
export type PartialSearchedTV = Omit<
  PartialSearchedTVFromTMDB,
  "id" | "search_tv_in_tmdb_then_save" | "original_country"
> & {
  id: string;
  created: string;
  updated: string;
};

export function delete_tv(body: {
  tv_id: string;
  /** 删除电视剧同时还要删除云盘内文件 */
  include_file?: boolean;
}) {
  const { tv_id, include_file } = body;
  return request.get<void>(`/api/admin/tv/delete/${tv_id}`);
}

/** 刷新电视剧详情 */
export function refresh_tv_profile(body: { tv_id: string; tmdb_id?: number }) {
  const { tv_id, tmdb_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/tv/refresh_profile/${tv_id}`, {
    tmdb_id,
  });
}

export function delete_season(body: { season_id: string }) {
  const { season_id } = body;
  return request.get<void>(`/api/admin/season/${season_id}/delete`);
}

/**
 * 获取电影列表
 */
export async function fetch_movie_list(params: FetchParams & { name: string; duplicated: number }) {
  const { page, pageSize, ...rest } = params;
  const resp = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      air_date: string;
      popularity: string;
      vote_average: number;
      runtime: number;
    }>
  >("/api/admin/movie/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (resp.error) {
    return resp;
  }
  return Result.Ok({
    ...resp.data,
    list: resp.data.list.map((movie) => {
      const { ...rest } = movie;
      return {
        ...rest,
        // updated: dayjs(updated).format("YYYY/MM/DD HH:mm"),
      };
    }),
  });
}
export type MovieItem = RequestedResource<typeof fetch_movie_list>["list"][number];

export function update_movie_profile(body: { movie_id: string }, profile: {}) {
  const { movie_id } = body;
  return request.post(`/api/admin/movie/${movie_id}/refresh_profile`, profile);
}

export function delete_movie(body: { movie_id: string }) {
  const { movie_id } = body;
  return request.post(`/api/admin/movie/${movie_id}/delete`, {});
}

/**
 * 获取无法识别的 tv
 */
export async function fetch_unknown_tv_list(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
    }>
  >(`/api/admin/unknown_tv/list`, {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, original_name } = tv;
      return {
        id,
        name: name || original_name,
      };
    }),
  });
}
export type UnknownTVItem = RequestedResource<typeof fetch_unknown_tv_list>["list"][0];

/** 删除所有未识别电视剧 */
export function delete_unknown_tv_list() {
  return request.get("/api/admin/unknown_tv/delete");
}

/**
 * 获取无法识别的季
 */
export async function fetch_unknown_season_list(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      season_number: string;
    }>
  >(`/api/admin/unknown_season/list`, {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, season_number } = tv;
      return {
        id,
        name,
        season_number,
      };
    }),
  });
}
export type UnknownSeasonItem = RequestedResource<typeof fetch_unknown_tv_list>["list"][0];

/** 删除所有未识别电视剧季 */
export function delete_unknown_season_list() {
  return request.get("/api/admin/unknown_season/delete");
}

/**
 * 获取无法识别的电影
 */
export async function fetch_unknown_movie_list(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }>
  >(`/api/admin/unknown_movie/list`, {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, original_name, file_id, file_name, parent_paths, drive } = tv;
      return {
        id,
        name: name || original_name,
        file_id,
        file_name,
        parent_paths,
        drive,
      };
    }),
  });
}
export type UnknownMovieItem = RequestedResource<typeof fetch_unknown_movie_list>["list"][0];

export async function fetch_unknown_episode_list(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const r = await request.get<
    ListResponse<{
      id: string;
      name: string;
      original_name: string;
      season_number: string;
      episode_number: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }>
  >(`/api/admin/unknown_episode/list`, {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (r.error) {
    return r;
  }
  return Result.Ok({
    ...r.data,
    list: r.data.list.map((tv) => {
      const { id, name, original_name, episode_number, season_number, file_id, file_name, parent_paths, drive } = tv;
      return {
        id,
        name: name || original_name,
        episode_number,
        season_number,
        file_id,
        file_name,
        parent_paths,
        drive,
      };
    }),
  });
}
export type UnknownEpisodeItem = RequestedResource<typeof fetch_unknown_episode_list>["list"][0];

export function delete_unknown_episode(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/admin/unknown_episode/delete/${id}`, undefined);
}
export function delete_unknown_episode_list() {
  return request.get(`/api/admin/unknown_episode/delete`);
}

/** 删除所有未识别电影 */
export function delete_unknown_movie_list() {
  return request.get("/api/admin/unknown_movie/delete");
}
/**
 * 删除指定未知电影
 * @param body
 */
export function delete_unknown_movie(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/admin/unknown_movie/delete/${id}`, undefined);
}

/**
 * 更新季数
 * @param body
 * @returns
 */
export function update_unknown_season_number(body: { id: string; season_number: string }) {
  const { id, season_number } = body;
  return request.post<void>(`/api/admin/unknown_season/update/${id}`, {
    season_number,
  });
}

/**
 * 获取未识别的影视剧详情
 * @param body
 */
export function fetch_unknown_tv_profile(body: { id: string }) {
  const { id } = body;
  return request.get<{
    id: string;
    name: string;
    file_id?: string;
    file_name?: string;
    folders: {
      paths: string;
      episodes: {
        id: string;
        file_id: string;
        file_name: string;
        episode: string;
        season: string;
      }[];
    }[];
  }>(`/api/admin/unknown_tv/${id}`);
}
export type UnknownTVProfile = RequestedResource<typeof fetch_unknown_tv_profile>;

/**
 * 在 TMDB 搜索影视剧
 * @param params
 * @returns
 */
export async function search_tv_in_tmdb(params: FetchParams & { keyword: string }) {
  const { keyword, page, pageSize, ...rest } = params;
  return request.get<
    ListResponse<{
      id: number;
      name: string;
      original_name: string;
      overview: string;
      poster_path: string;
      searched_tv_id: string;
    }>
  >(`/api/admin/tmdb/search`, {
    ...rest,
    keyword,
    page,
    page_size: pageSize,
  });
}

export type MatchedTVOfTMDB = RequestedResource<typeof search_tv_in_tmdb>["list"][0];

/**
 * 给指定未知 tv 绑定一个 tmdb 的搜索结果
 */
export async function bind_profile_for_unknown_movie(id: string, body: MatchedTVOfTMDB) {
  return request.post(`/api/admin/unknown_movie/update/${id}`, body);
}

/**
 * 给指定 tv 绑定一个 tmdb 的搜索结果
 */
export async function bind_profile_for_unknown_tv(id: string, body: MatchedTVOfTMDB) {
  return request.post(`/api/admin/unknown_tv/update/${id}`, body);
}

/**
 * 获取指定电视剧关联的文件列表
 */
export async function fetch_files_of_tv(body: { id: string; page: number; page_size: number }) {
  const { id, page, page_size } = body;
  return request.get<
    ListResponse<{
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
      };
    }>
  >(`/api/admin/tv/${id}/source`, {
    page,
    page_size,
  });
}

/**
 * 获取指定电视剧关联的文件详情
 */
export async function fetch_file_profile_of_tv(body: { tv_id: string; id: string }) {
  const { tv_id, id } = body;
  const r = await request.get<{
    id: string;
    file_id: string;
    file_name: string;
    parsed_tv: {
      id: string;
      name: string;
      original_name: string;
      correct_name: string;
      file_id: string;
      file_name: string;
    };
  }>(`/api/admin/tv/${tv_id}/source/${id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { file_id, file_name, parsed_tv } = r.data;
  const { name, original_name } = parsed_tv;
  return Result.Ok({
    id,
    file_id,
    file_name,
    parsed_tv: {
      id: parsed_tv.id,
      name: name || original_name,
    },
  });
}

/**
 * 删除指定未知电视剧的指定文件
 */
export async function delete_parsed_tv_of_tv(body: { tv_id: string; id: string }) {
  const { tv_id, id } = body;
  const r = await request.get<null>(`/api/admin/tv/${tv_id}/parsed_tv/delete/${id}`);
  if (r.error) {
    return Result.Err(r.error);
  }
  return Result.Ok(null);
}

/**
 * 给指定电影绑定一个 tmdb 的搜索结果
 */
// export async function bind_movie_profile_for_movie(id: string, body: { name: string }) {
//   return request.post(`/api/admin/unknown_movie/update/${id}`, body);
// }

/**
 * 获取成员列表
 * @param params
 * @returns
 */
export async function fetchMemberList(params: FetchParams) {
  const { page, pageSize, ...rest } = params;
  const res = await request.get<
    ListResponse<{
      id: string;
      remark: string;
      inviter: null | {
        id: string;
        remark: string;
      };
      disabled: boolean;
      tokens: {
        id: string;
        token: string;
        used: boolean;
      }[];
    }>
  >("/api/admin/member/list", {
    ...rest,
    page,
    page_size: pageSize,
  });
  if (res.error) {
    return Result.Err(res.error);
  }
  return Result.Ok({
    ...res.data,
    list: res.data.list,
  });
}
export type MemberItem = RequestedResource<typeof fetchMemberList>["list"][0];

/**
 * 添加成员
 * @param body
 * @returns
 */
export function add_member(body: { remark: string }) {
  return request.post<{ id: string }>("/api/admin/member/add", body);
}

/**
 * 生成成员授权链接
 * @param body
 * @returns
 */
export function create_member_auth_link(body: { id: string }) {
  return request.post<{ id: string }>("/api/admin/member/token/add", body);
}

/**
 *
 * @param body
 * @returns
 */
export async function fetch_aliyun_drive_files(body: {
  drive_id: string;
  file_id: string;
  next_marker: string;
  name?: string;
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
  }>(`/api/admin/drive/files/${drive_id}`, {
    name,
    file_id,
    next_marker,
    page_size,
  });
  return r;
}

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
  }>("/api/admin/shared_files", { url, file_id, next_marker });
  return r;
}
export type AliyunFolderItem = RequestedResource<typeof fetch_shared_files>["items"][0];

/**
 * 获取云盘文件临平
 */
export async function fetch_drive_files(body: { drive_id: string; file_id: string; name: string }) {
  const { drive_id, file_id, name } = body;
  return request.get(`/api/admin/aliyun/files/${file_id}`, { name, drive_id });
}

/**
 * 执行一次同步任务（将分享资源新增的视频文件转存到云盘目标文件夹中）
 */
export async function patch_added_files(body: {
  /** 分享链接 */
  url: string;
  /** 检查是否有新增文件的文件夹 id */
  file_id: string;
  /** 检查是否有新增文件的文件夹名称 */
  file_name: string;
}) {
  return request.get("/api/admin/shared_file/diff", body);
}

/**
 * 根据给定的文件夹名称，在云盘中找到有类似名字的文件夹
 * @param body
 * @returns
 */
export function find_folders_has_same_name(body: { name: string }) {
  return request.get<{ name: string; file_id: string }>("/api/admin/shared_file/find_folder_has_same_name", body);
}
export type FolderItem = RequestedResource<typeof find_folders_has_same_name>;

/**
 *
 * @param body
 * @returns
 */
export async function build_link_between_shared_files_with_folder(body: {
  /** 分享链接 */
  url: string;
  /** 分享文件夹 id */
  file_id: string;
  /** 分享文件夹名称 */
  file_name: string;
  /** 要建立关联的文件夹名称 */
  target_file_name?: string;
  target_file_id?: string;
}) {
  return request.post("/api/admin/shared_file/link", body);
}

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
 * 解析文件名
 */
export function parse_video_file_name(body: { name: string; keys?: string[] }) {
  const { name, keys } = body;
  return request.post<{
    name: string;
    original_name: string;
    season: string;
    episode: string;
    episode_name: string;
    resolution: string;
    year: string;
    source: string;
    encode: string;
    voice_encode: string;
    episode_count: string;
    subtitle_lang: string;
  }>("/api/admin/parse", { name, keys });
}
export type ParsedVideoInfo = RequestedResource<typeof parse_video_file_name>;
export type VideoKeys = keyof ParsedVideoInfo;

/**
 * 获取可以建立同步任务的文件夹转存记录
 */
export function fetch_folder_can_add_sync_task(body: { page: number; page_size: number; name?: string[] }) {
  const { page, page_size, name } = body;
  return request.post<
    ListResponse<{
      id: string;
      url: string;
      file_id: string;
      name: string;
    }>
  >("/api/admin/tv/enabled_shared_file/list", {
    page,
    page_size,
    name,
  });
}
export type FolderCanAddingSyncTaskItem = RequestedResource<typeof fetch_folder_can_add_sync_task>["list"][number];

/**
 * 执行一次分享资源的同步任务
 * @param body
 * @returns
 */
export function run_file_sync_task_of_tv(body: { id: string }) {
  const { id } = body;
  return request.get<{ job_id: string }>(`/api/admin/tv/sync/${id}`);
}

/**
 * 添加分享资源的同步任务
 * @param body
 * @returns
 */
export function add_file_sync_task_of_tv(body: {
  tv_id: string;
  url: string;
  target_file_id?: string;
  target_file_name?: string;
}) {
  const { tv_id, url, target_file_id, target_file_name } = body;
  return request.post<{}>(`/api/admin/shared_file_sync/add`, {
    tv_id,
    url,
    target_file_id,
    target_file_name,
  });
}

/**
 * 执行所有电视剧同步任务
 */
export function run_all_file_sync_tasks() {
  return request.get<{ job_id: string }>("/api/admin/shared_file_sync/sync");
}

/**
 * 执行所有电视剧同步任务
 */
export function transferSeasonToAnotherDrive(body: { season_id: string; target_drive_id: string }) {
  const { season_id, target_drive_id } = body;
  return request.post<{ job_id: string }>(`/api/admin/season/${season_id}/transfer`, {
    target_drive_id,
  });
}

/**
 * 删除指定成员
 * @returns
 */
export function delete_member(body: { id: string }) {
  const { id } = body;
  return request.get(`/api/admin/member/delete/${id}`);
}

export function updateMemberPermission(values: { member_id: string; permissions: string[] }) {
  const { member_id, permissions } = values;
  const body = {
    permissions,
  };
  return request.post(`/api/admin/member/${member_id}/permission/update`, body);
}

/**
 * 是否已经有管理员
 */
export function has_admin() {
  return request.get<{ existing: boolean }>(`/api/admin/user/existing`);
}

export function delete_aliyun_file(body: { file_id: string }) {
  const { file_id } = body;
  return request.get(`/api/admin/aliyun/delete/${file_id}`);
}

export async function fetch_tv_profile(body: { tv_id: string; season_id?: string }) {
  const { tv_id, season_id } = body;
  const r = await request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    original_language: string;
    first_air_date: string;
    tmdb_id: number;
    incomplete: boolean;
    seasons: {
      id: string;
      name: string;
      overview: string;
      season_number: number;
      season_text: string;
    }[];
    cur_season: {
      id: string;
      name: string;
      season_text: string;
    };
    cur_season_episodes: {
      id: string;
      name: string;
      overview: string;
      episode_number: string;
      first_air_date: string;
      runtime: number;
      sources: {
        id: string;
        file_id: string;
        file_name: string;
        parent_paths: string;
        size: string;
        drive: {
          id: string;
          name: string;
          avatar: string;
        };
      }[];
    }[];
    // sources: {
    //   id: string;
    //   file_id: string;
    //   parent_paths: string;
    //   file_name: string;
    // }[];
    // parsed_tvs: {
    //   id: string;
    //   file_id: string | null;
    //   file_name: string | null;
    //   name: string | null;
    //   original_name: string | null;
    //   correct_name: string | null;
    // }[];
  }>(`/api/admin/tv/${tv_id}`, { season_id });
  if (r.error) {
    return Result.Err(r.error);
  }
  const {
    id,
    name,
    overview,
    poster_path,
    backdrop_path,
    first_air_date,
    tmdb_id,
    incomplete,
    seasons,
    cur_season,
    cur_season_episodes,
  } = r.data;
  return Result.Ok({
    id,
    name,
    overview,
    poster_path,
    backdrop_path,
    first_air_date,
    tmdb_id,
    incomplete,
    seasons,
    curSeason: cur_season,
    curSeasonEpisodes: cur_season_episodes,
  });
}
export type TVProfile = RequestedResource<typeof fetch_tv_profile>;
export type SeasonInTVProfile = RequestedResource<typeof fetch_tv_profile>["curSeason"];
export async function delete_episode_in_tv(body: { id: string; tv_id: string }) {
  const { id, tv_id } = body;
  const r = await request.get(`/api/admin/tv/episode/${id}`, { tv_id });
  return r;
}

/**
 * 获取指定电视剧、指定季下的剧集，支持分页
 * @param body
 * @returns
 */
export function fetch_episodes_of_season(body: { tv_id: string; season_id: string } & FetchParams) {
  const { tv_id, season_id, ...rest } = body;
  return request.get<
    ListResponse<{
      id: string;
      name: string;
      overview: string;
      episode_number: string;
      first_air_date: string;
      runtime: number;
      sources: {
        id: string;
        file_id: string;
        file_name: string;
        parent_paths: string;
        size: string;
        drive: {
          id: string;
          name: string;
          avatar: string;
        };
      }[];
    }>
  >(`/api/admin/tv/${tv_id}/season/${season_id}/episodes`, rest);
}
export type EpisodeItemInSeason = RequestedResource<typeof fetch_episodes_of_season>["list"][number];

export async function fetch_video_preview_info(body: { file_id: string }) {
  const { file_id } = body;
  const r = await request.get<{
    url: string;
    thumbnail: string;
    type: EpisodeResolutionTypes;
    width: number;
    height: number;
    other: {
      url: string;
      thumbnail: string;
      type: EpisodeResolutionTypes;
      width: number;
      height: number;
    }[];
  }>(`/api/admin/file/${file_id}/preview`);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { url, width, height, type, other, thumbnail } = r.data;
  return Result.Ok({
    file_id,
    url,
    width,
    height,
    type,
    typeText: EpisodeResolutionTypeTexts[type],
    thumbnail,
    resolutions: other.map((r) => {
      const { url, width, height, type, thumbnail } = r;
      return {
        file_id,
        url,
        width,
        height,
        type,
        typeText: EpisodeResolutionTypeTexts[type],
        thumbnail,
      };
    }),
  });
}

/**
 * 删除指定季
 * @param body
 * @returns
 */
export function deleteSeason(body: { season_id: string }) {
  const { season_id } = body;
  return request.get(`/api/admin/season/${season_id}/delete`);
}

export async function fetchReportList(params: FetchParams) {
  const r = await request.get<
    ListResponse<{
      id: string;
      type: ReportTypes;
      member: {
        id: string;
        name: string;
      };
      data: string;
      answer: string;
      movie?: {
        id: string;
        name: string;
        poster_path: string;
      };
      tv?: {
        id: string;
        name: string;
        poster_path: string;
      };
      season?: {
        id: string;
        tv_id: string;
        name: string;
        poster_path: string;
        season_text: string;
      };
      episode?: {
        id: string;
        episode_text: string;
      };
      created: string;
    }>
  >(`/api/admin/report/list`, params);
  if (r.error) {
    return Result.Err(r.error);
  }
  const { list, ...rest } = r.data;
  return Result.Ok({
    ...rest,
    list: list.map((report) => {
      const { id, type, answer, member, data, movie, season, episode, created } = report;
      return {
        id,
        type,
        typeText: ReportTypeTexts[type],
        answer,
        member,
        data,
        movie,
        season,
        episode,
        created: dayjs(created).format("YYYY-MM-DD HH:mm:ss"),
      };
    }),
  });
}
export type ReportItem = RequestedResource<typeof fetchReportList>["list"][number];

export function fetchReportProfile(params: { report_id: string }) {
  const { report_id } = params;
  return request.get(`/api/admin/report/${report_id}`);
}

export async function fetch_movie_profile(body: { movie_id: string }) {
  const { movie_id } = body;
  const r = await request.get<{
    id: string;
    name: string;
    overview: string;
    poster_path: null;
    backdrop_path: null;
    original_language: string;
    air_date: string;
    tmdb_id: number;
    sources: {
      id: string;
      file_id: string;
      file_name: string;
      parent_paths: string;
      drive: {
        id: string;
        name: string;
        avatar: string;
      };
    }[];
  }>(`/api/admin/movie/${movie_id}`);
  return r;
}
export type MovieProfile = RequestedResource<typeof fetch_movie_profile>;

export function upload_file(body: FormData) {
  return request.post("/api/admin/upload", body);
}

export function upload_subtitle_for_episode(params: {
  tv_id: string;
  season_text: string;
  episode_text: string;
  lang: string;
  drive_id: string;
  file: File;
}) {
  const { tv_id, drive_id, lang, season_text, episode_text, file } = params;
  const body = new FormData();
  body.append("file", file);
  body.append("drive", drive_id);
  body.append("lang", lang);
  body.append("season_text", season_text);
  body.append("episode_text", episode_text);
  const search = query_stringify({
    tv_id,
    drive_id,
    lang,
    season_text,
    episode_text,
  });
  return request.post(`/api/admin/episode/subtitle/add?${search}`, body);
}

export function upload_subtitle_for_movie(params: { movie_id: string; drive_id: string; lang: string; file: File }) {
  const { movie_id, drive_id, lang, file } = params;
  const body = new FormData();
  body.append("file", file);
  return request.post(`/api/admin/movie/${movie_id}/subtitle/add?drive_id=${drive_id}&lang=${lang}`, body);
}

export function notify_test(values: { text: string; token: string }) {
  const { text, token } = values;
  return request.post(`/api/admin/notify/test`, { text, token });
}
export function fetch_settings() {
  return request.get<{
    push_deer_token: string;
    extra_filename_rules: string;
  }>("/api/admin/settings");
}
export function update_settings(values: Partial<{ push_deer_token: string; extra_filename_rules: string }>) {
  const { push_deer_token, extra_filename_rules } = values;
  return request.post(`/api/admin/settings/update`, { push_deer_token, extra_filename_rules });
}

export function sync_folder(values: { drive_id: string; file_id: string }) {
  const { drive_id, file_id } = values;
  return request.get<{ job_id: string }>(`/api/admin/file/${file_id}/sync`, { drive_id });
}

type AnswerPayload = Partial<{
  content: string;
  season: {
    id: string;
    tv_id: string;
    name: string;
    first_air_date: string;
    poster_path: string;
  };
  movie: {
    id: string;
    name: string;
    first_air_date: string;
    poster_path: string;
  };
}>;
export function replyReport(
  values: {
    report_id: string;
  } & AnswerPayload
) {
  const { report_id, content, movie, season } = values;
  return request.post(`/api/admin/report/${report_id}/reply`, {
    content,
    movie,
    season,
  });
}

/**
 * 获取权限列表
 */
export async function fetchPermissionList(params: FetchParams) {
  const { pageSize, ...restParams } = params;
  const r = await request.get<
    ListResponse<{
      code: string;
      desc: string;
    }>
  >("/api/admin/permission/list", {
    page_size: pageSize,
    ...restParams,
  });
  if (r.error) {
    return Result.Err(r.error.message);
  }
  const { page, total, no_more, list } = r.data;
  return Result.Ok({
    page,
    page_size: pageSize,
    total,
    no_more,
    list,
  });
}

/**
 * 新增权限
 */
export function addPermission(values: { desc: string }) {
  const { desc } = values;
  const body = {
    desc,
  };
  return request.post("/api/admin/permission/add", body);
}

/**
 * 校验字幕文件名是否合法
 */
export function validateSubtitleFiles(values: { tv_id?: string; filenames: string[] }) {
  const { tv_id, filenames } = values;
  return request.post<{
    files: {
      filename: string;
      season: {
        id: string;
        name: string;
      } | null;
      season_text: string;
      episode: {
        id: string;
        name: string;
      } | null;
      episode_text: string;
      language: string;
    }[];
    tvs: {
      id: string;
      name: string;
      original_name: string;
      poster_path: string;
      seasons: {
        id: string;
        season_text: string;
      }[];
      episodes: {
        id: string;
        episode_text: string;
      }[];
    }[];
    drives: {
      id: string;
    }[];
  }>("/api/admin/subtitle/validate", {
    tv_id,
    filenames,
  });
}

export function batchUploadSubtitles(params: {
  tv_id: string;
  drive_id: string;
  files: {
    filename: string;
    season_id: string;
    episode_id: string;
    language: string;
    file: File;
  }[];
}) {
  const { tv_id, drive_id, files } = params;
  const body = new FormData();
  for (const payload of files) {
    const { file, ...restPayload } = payload;
    const { episode_id } = restPayload;
    if (payload.file) {
      body.append(episode_id, payload.file);
    }
    body.append("payloads", JSON.stringify(restPayload));
  }
  body.append("drive", drive_id);
  body.append("tv", tv_id);
  const search = query_stringify({
    tv_id,
    drive_id,
  });
  return request.post(`/api/admin/subtitle/batch_add?${search}`, body);
}

export function fetchSubtitleList(params: FetchParams) {
  return request.post<
    ListResponse<{
      id: string;
      name: string;
      poster_path: string;
      episodes: {
        id: string;
        episode_text: string;
        subtitles: {
          id: string;
          file_id: string;
          name: string;
          language: string;
        }[];
      }[];
    }>
  >("/api/admin/subtitle/list", params);
}
export type SubtitleItem = RequestedResource<typeof fetchSubtitleList>["list"][number];

export function deleteSubtitle(values: { subtitle_id: string }) {
  const { subtitle_id } = values;
  return request.get(`/api/admin/subtitle/${subtitle_id}/delete`);
}
